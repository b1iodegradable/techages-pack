// Ивенты между игроками — кооператив: все против мира. Смерти здесь обычные (PvE), вещи — в могиле.

// Призвать мобов вокруг точки на поверхности: summon + spreadplayers по тегу
const peSpawnAround = (s, dim, x, z, types, n, tag, rMin, rMax) => {
  for (let i = 0; i < n; i++) {
    var t = pePick(types)
    peCmd(s, `execute in ${dim} run summon ${t} ${x} 200 ${z} {Tags:["${tag}","pe_new"],PersistenceRequired:1b}`)
  }
  peCmd(s, `execute in ${dim} run spreadplayers ${x} ${z} ${Math.max(1, Math.floor(rMin / 3))} ${rMax} false @e[tag=pe_new]`)
  peCmd(s, `execute in ${dim} run tag @e[tag=pe_new] remove pe_new`)
}
const peCountTag = (s, dim, tag) => { let n = 0; s.overworld().getEntities().forEach(en => { if (en.tags.contains(tag) && en.isAlive()) n++ }); return n }
const PE_SIEGE_MOBS = [
  ['minecraft:zombie', 'minecraft:skeleton', 'minecraft:spider'],
  ['minecraft:zombie', 'minecraft:skeleton', 'minecraft:husk', 'minecraft:creeper'],
  ['minecraft:husk', 'minecraft:stray', 'minecraft:pillager', 'minecraft:creeper'],
  ['minecraft:vindicator', 'minecraft:pillager', 'minecraft:witch', 'minecraft:skeleton'],
  ['minecraft:vindicator', 'minecraft:evoker', 'minecraft:ravager', 'minecraft:wither_skeleton']
]

// ---------- 15. Осада базы
peDef('siege', {
  name: 'Осада базы', min: 1, minutes: 8, auto: true,
  desc: 'Через минуту на базу пойдут волны монстров — сильнее с каждой эпохой. Продержитесь все волны — редкий лут каждому.',
  start: (s, ev) => {
    const base = pePick(peOnline(s).filter(p => peDim(p) == PE.OW))
    if (!base) return false
    const age = peAge()
    ev.data = { x: Math.floor(base.x), z: Math.floor(base.z), waves: Math.min(6, 3 + Math.floor(age / 2)), wave: 0, next: s.tickCount + 1200, done: false }
    peSay(s, Text.red(`⚔ Осада у X ${ev.data.x} Z ${ev.data.z}: ${ev.data.waves} волн, первая — через минуту. Готовьтесь!`))
  },
  tick: (s, ev) => {
    const d = ev.data, age = peAge()
    if (d.wave < d.waves && s.tickCount >= d.next) {
      d.wave++
      var n = 4 + 2 * ev.players.length + age + d.wave
      peSpawnAround(s, PE.OW, d.x, d.z, PE_SIEGE_MOBS[Math.min(4, Math.floor(age / 1.5))], n, 'pe_siege', 14, 28)
      peSay(s, Text.red(`⚔ Волна ${d.wave}/${d.waves}: ${n} монстров!`))
      d.next = s.tickCount + 1200
    }
    const left = peCountTag(s, PE.OW, 'pe_siege')
    if (d.wave >= d.waves && left == 0) { d.done = true; peEnd(s, 'win'); return }
    peBar(s, `Осада: волна ${d.wave}/${d.waves}, монстров ${left} · ${peFmt(ev.end - s.tickCount)}`, ev.end - s.tickCount, ev.end - ev.t0)
  },
  finish: (s, ev) => {
    peCmd(s, 'kill @e[tag=pe_siege]')
    if (!ev.data.done) { peSay(s, Text.gray('Осада не отбита до конца — награды нет.')); return }
    const age = peAge(), loot = age < 2 ? ['minecraft:iron_ingot', 16] : age < 4 ? ['minecraft:diamond', 4] : ['minecraft:netherite_scrap', 2]
    peSay(s, Text.gold('🛡 Осада отбита!'))
    ev.players.forEach(n => { var p = peP(s, n); if (p) { p.give(Item.of(loot[0], loot[1])); peReward(s, p, 40, 3, 'отбили осаду') } })
  }
})

// ---------- 16. Мировой босс
peDef('world_boss', {
  name: 'Мировой босс', min: 1, minutes: 15, auto: true,
  desc: 'Рядом с игроками появляется Пожиратель — гигантский зомби с общей шкалой здоровья. Награда делится по нанесённому урону.',
  start: (s, ev) => {
    const base = pePick(peOnline(s).filter(p => peDim(p) == PE.OW))
    if (!base) return false
    const n = ev.players.length, age = peAge()
    const hp = Math.round(300 * (1 + 0.5 * (n - 1)) * (1 + 0.4 * age))
    const x = Math.floor(base.x + peRnd(-12, 12)), z = Math.floor(base.z + peRnd(-12, 12)), y = surfaceY(base.level, x, z)
    peCmd(s, `execute in ${PE.OW} run summon minecraft:zombie ${x} ${y} ${z} {Tags:["pe_wboss"],PersistenceRequired:1b,CanBreakDoors:1b,` +
      `CustomName:'${JSON.stringify({ text: 'Пожиратель', color: 'dark_red' })}',CustomNameVisible:1b,Health:${hp}f,` +
      `attributes:[{id:"minecraft:generic.max_health",base:${hp}},{id:"minecraft:generic.scale",base:3},{id:"minecraft:generic.attack_damage",base:${10 + 2 * age}},` +
      `{id:"minecraft:generic.movement_speed",base:0.28},{id:"minecraft:generic.knockback_resistance",base:1},{id:"minecraft:generic.follow_range",base:64}]}`)
    ev.data = { hp: hp, dmg: {}, dead: false }
    peSay(s, Text.darkRed(`☠ Пожиратель появился у X ${x} Z ${z}! (${hp} здоровья)`))
  },
  tick: (s, ev) => {
    let boss = null
    s.overworld().getEntities().forEach(en => { if (!boss && en.tags.contains('pe_wboss')) boss = en })
    if (!boss) { if (!ev.data.dead) ev.data.dead = true; peEnd(s, 'win'); return }
    peBar(s, `Пожиратель — ${Math.ceil(boss.health)}/${ev.data.hp}`, boss.health, ev.data.hp)
  },
  finish: (s, ev) => {
    const d = ev.data
    peCmd(s, 'kill @e[tag=pe_wboss]')
    const total = Object.keys(d.dmg).reduce((a, n) => a + d.dmg[n], 0)
    if (!d.dead || total <= 0) { peSay(s, Text.gray('Пожиратель ушёл.')); return }
    const top = peWinnersBy(ev, d.dmg)[0]
    peSay(s, Text.gold(`☠ Пожиратель повержен! Больше всех урона: ${top}`))
    Object.keys(d.dmg).forEach(n => {
      var p = peP(s, n); if (!p) return
      peReward(s, p, Math.max(10, Math.round(150 * d.dmg[n] / total)), 3, 'мировой босс')
      if (n == top) { p.give(Item.of(peAge() < 4 ? 'minecraft:diamond' : 'minecraft:netherite_ingot', 2)); peTitle(s, p, 'Убийца Пожирателя') }
    })
  }
})
EntityEvents.afterHurt(e => {
  const ev = PE.cur
  if (!ev || ev.id != 'world_boss' || !e.entity.tags.contains('pe_wboss')) return
  const att = e.source.player
  if (att && att.isPlayer()) ev.data.dmg[att.username] = (ev.data.dmg[att.username] || 0) + e.damage
})

// ---------- 17. Общий мега-проект (долгий: неделя)
const PE_MEGA = [['minecraft:cobblestone', 20000], ['create:andesite_alloy', 3000], ['create:brass_ingot', 1500],
                 ['tfmg:steel_ingot', 1500], ['mekanism:steel_casing', 64], ['mekanismgenerators:fission_reactor_casing', 256],
                 ['tfmg:steel_ingot', 5000], ['tfmg:steel_ingot', 8000]]
peDef('mega', {
  name: 'Общий мега-проект', min: 1, long: true, minutes: 7 * 24 * 60, auto: true,
  desc: 'Неделя на то, чтобы всем вместе сдать огромную партию. Сдавать: /ev do вклад (забирает всё нужное из инвентаря). Выполнили — монеты всем вкладчикам и бафф всему серверу.',
  canStart: () => null,
  start: (s, L) => {
    const m = PE_MEGA[Math.min(peAge(), PE_MEGA.length - 1)]
    L.data = { item: m[0], need: m[1], have: 0, donors: {} }
    peSave(s)
    peSay(s, Text.gold(`🏛 Мега-проект: ${m[1]} × ${m[0]} за неделю. /ev do вклад`))
  },
  cmd: (s, p, a, L) => {
    if (a[0] != 'вклад' && a[0] != 'donate') return false
    const d = L.data, n = Math.min(peCount(p, d.item), d.need - d.have)
    if (n <= 0) { p.tell(Text.red(`Нужен ${d.item}. Прогресс: ${d.have}/${d.need}`)); return true }
    peTake(p, d.item, n)
    const before = Math.floor(d.have * 4 / d.need)
    d.have += n; d.donors[peUid(p)] = (d.donors[peUid(p)] || 0) + n
    peSave(s)
    p.tell(Text.green(`Вклад ${n}. Прогресс: ${d.have}/${d.need}`))
    if (Math.floor(d.have * 4 / d.need) > before) peSay(s, Text.gold(`🏛 Мега-проект: ${Math.floor(d.have * 100 / d.need)} %`))
    if (d.have >= d.need) { delete peLoad(s).long.mega; peSave(s); PE.defs.mega.finish(s, L, 'done') }
    return true
  },
  finish: (s, L, reason) => {
    const d = L.data
    if (d.have < d.need) { peSay(s, Text.gray(`🏛 Мега-проект не успели: ${d.have}/${d.need}.`)); return }
    peSay(s, Text.gold('🏛 Мега-проект выполнен! Час Спешки II всем на сервере.'))
    peCmd(s, 'effect give @a minecraft:haste 3600 1 true')
    const top = Object.keys(d.donors).sort((a, b) => d.donors[b] - d.donors[a])[0]
    Object.keys(d.donors).forEach(u => { peCoinsUid(s, u, 50 + Math.round(200 * d.donors[u] / d.need)); s.players.forEach(pl => { if (peUid(pl) == u) { peSeason(s, pl, 4); if (u == top) peTitle(s, pl, 'Меценат') } }) })
  }
})

// ---------- 18. Метеорит-гигант
peDef('meteor', {
  name: 'Метеорит-гигант', min: 2, minutes: 10, auto: true,
  desc: 'Рядом падает огромный метеорит. Ядро охраняют монстры, а вскрыть его можно только вдвоём: два игрока одновременно встают на две плиты у ядра.',
  start: (s, ev) => {
    const base = pePick(peOnline(s).filter(p => peDim(p) == PE.OW))
    if (!base) return false
    const ang = Math.random() * Math.PI * 2, r = peRnd(40, 80)
    const x = Math.floor(base.x + Math.cos(ang) * r), z = Math.floor(base.z + Math.sin(ang) * r), y = surfaceY(base.level, x, z)
    const W = (a) => peCmd(s, `execute in ${PE.OW} run ${a}`)
    W(`summon minecraft:lightning_bolt ${x} ${y} ${z}`)
    W(`fill ${x - 5} ${y - 3} ${z - 5} ${x + 5} ${y + 4} ${z + 5} minecraft:air`)
    W(`fill ${x - 5} ${y - 4} ${z - 5} ${x + 5} ${y - 4} ${z + 5} minecraft:magma_block`)
    W(`fill ${x - 1} ${y - 3} ${z - 1} ${x + 1} ${y - 1} ${z + 1} minecraft:obsidian`)
    W(`setblock ${x} ${y - 2} ${z} minecraft:crying_obsidian`)
    W(`setblock ${x - 3} ${y - 3} ${z} minecraft:stone_pressure_plate`)
    W(`setblock ${x + 3} ${y - 3} ${z} minecraft:stone_pressure_plate`)
    peSpawnAround(s, PE.OW, x, z, PE_SIEGE_MOBS[Math.min(4, Math.floor(peAge() / 1.5))], 4 + peAge() * 2, 'pe_meteor', 6, 14)
    ev.data = { x: x, y: y - 3, z: z, open: false }
    peSay(s, Text.gold(`☄ Метеорит упал у X ${x} Z ${z}! Двое — на плиты у ядра.`))
  },
  fast: (s, ev) => {
    const d = ev.data
    if (d.open) return
    const on = (px) => ev.players.map(n => peP(s, n)).filter(p => p && peDim(p) == PE.OW && Math.floor(p.x) == px && Math.floor(p.y) == d.y && Math.floor(p.z) == d.z)
    const a = on(d.x - 3), b = on(d.x + 3)
    if (a.length && b.length && a[0].username != b[0].username) {
      d.open = true; d.openers = [a[0].username, b[0].username]
      var W = (c) => peCmd(s, `execute in ${PE.OW} run ${c}`)
      W(`setblock ${d.x} ${d.y + 1} ${d.z} minecraft:chest`)
      W(`item replace block ${d.x} ${d.y + 1} ${d.z} container.0 with kubejs:meteor_fragment ${4 + peAge()}`)
      W(`item replace block ${d.x} ${d.y + 1} ${d.z} container.1 with minecraft:diamond ${1 + Math.floor(peAge() / 2)}`)
      W(`item replace block ${d.x} ${d.y + 1} ${d.z} container.2 with minecraft:iron_block 4`)
      peSay(s, Text.gold(`☄ ${d.openers.join(' и ')} вскрыли ядро!`))
      peEnd(s, 'win')
    }
  },
  tick: (s, ev) => peBar(s, `Метеорит у X ${ev.data.x} Z ${ev.data.z} — ${peFmt(ev.end - s.tickCount)}`, ev.end - s.tickCount, ev.end - ev.t0),
  finish: (s, ev) => {
    peCmd(s, 'kill @e[tag=pe_meteor]')
    if (ev.data.open) ev.data.openers.forEach(n => { var p = peP(s, n); if (p) peReward(s, p, 40, 3, 'вскрыли метеорит') })
    else peSay(s, Text.gray('Ядро метеорита так и не вскрыли.'))
  }
})

// ---------- 19. Сигнал SOS
peDef('sos', {
  name: 'Сигнал SOS', min: 1, minutes: 6, auto: true,
  desc: 'Торговец застрял в 300–600 блоках, на него идут монстры. Доберитесь и защищайте его 5 минут — в конце рядом должен быть кто-то из вас.',
  start: (s, ev) => peFarPoint(s, ev, 300, 600, (x, y, z) => {
    peCmd(s, `execute in ${PE.OW} run summon minecraft:wandering_trader ${x} ${y} ${z} {Tags:["pe_sos"],PersistenceRequired:1b,DespawnDelay:0}`)
    ev.data.t = { x: x, y: y, z: z }
    ev.data.next = s.tickCount + 800
    peSay(s, Text.aqua(`🆘 SOS! Торговец у X ${x} Z ${z}. Спасите его!`))
  }),
  fast: (s, ev) => pePollPoint(s, ev),
  tick: (s, ev) => {
    const d = ev.data
    if (!d.t) return
    if (peCountTag(s, PE.OW, 'pe_sos') == 0) { d.failed = true; peEnd(s, 'fail'); return }
    if (s.tickCount >= d.next) { peSpawnAround(s, PE.OW, d.t.x, d.t.z, PE_SIEGE_MOBS[Math.min(4, Math.floor(peAge() / 1.5))], 3 + peAge(), 'pe_sosmob', 10, 20); d.next = s.tickCount + 800 }
    peBar(s, `SOS: торговец у X ${d.t.x} Z ${d.t.z} — ${peFmt(ev.end - s.tickCount)}`, ev.end - s.tickCount, ev.end - ev.t0)
  },
  finish: (s, ev, reason) => {
    const d = ev.data
    peCmd(s, 'kill @e[tag=pe_sosmob]')
    const near = d.t ? ev.players.map(n => peP(s, n)).filter(p => p && peDim(p) == PE.OW && Math.abs(p.x - d.t.x) < 48 && Math.abs(p.z - d.t.z) < 48) : []
    if (d.failed || reason != 'time' || !near.length) { peSay(s, Text.gray('Торговца спасти не удалось.')); peCmd(s, 'kill @e[tag=pe_sos]'); return }
    peSay(s, Text.gold(`🆘 Торговец спасён! Спасибо: ${near.map(p => p.username).join(', ')}`))
    near.forEach(p => { p.give(Item.of('minecraft:emerald', 8)); peReward(s, p, 40, 3, 'спасли торговца'); if (peStat(s, p, 'sos') >= 3) peTitle(s, p, 'Спаситель') })
  }
})
