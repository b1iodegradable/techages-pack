// Ивенты между игроками — соревнования без драк.

// Точка на поверхности далеко от игроков: маркер + spreadplayers (сам грузит чанки), позицию читаем через пару тиков
const peFarPoint = (s, ev, minR, maxR, then) => {
  const base = pePick(peOnline(s).filter(p => peDim(p) == PE.OW))
  if (!base) return false
  const ang = Math.random() * Math.PI * 2, r = peRnd(minR, maxR)
  const x = Math.floor(base.x + Math.cos(ang) * r), z = Math.floor(base.z + Math.sin(ang) * r)
  peCmd(s, `execute in ${PE.OW} run summon minecraft:armor_stand ${x} 200 ${z} {Tags:["pe_pt"],Invisible:1b,Marker:1b,NoGravity:1b}`)
  peCmd(s, `execute in ${PE.OW} run spreadplayers ${x} ${z} 0 1 false @e[type=minecraft:armor_stand,tag=pe_pt,limit=1]`)
  ev.data.pendingPoint = { then: then, tries: 0 }
  return true
}
const pePollPoint = (s, ev) => {
  const pp = ev.data.pendingPoint
  if (!pp) return
  let found = null
  s.overworld().getEntities().forEach(en => { if (!found && en.tags.contains('pe_pt')) found = en })
  if (!found) { if (++pp.tries > 10) { ev.data.pendingPoint = null; peSay(s, Text.red('Не удалось найти место — ивент отменён.')); peEnd(s, 'error') } return }
  const x = Math.floor(found.x), y = Math.floor(found.y), z = Math.floor(found.z)
  found.kill()
  ev.data.pendingPoint = null
  pp.then(x, y, z)
}

// ---------- 9. Гонка за сундуком
peDef('chest_race', {
  name: 'Гонка за сундуком', min: 1, minutes: 15, auto: true,
  desc: 'Сервер прячет сундук с хорошим лутом в 500–1500 блоках и называет координаты. Кто первый откроет — забирает всё.',
  start: (s, ev) => peFarPoint(s, ev, 500, 1500, (x, y, z) => {
    const age = peAge()
    const loot = age < 2 ? 'minecraft:chests/simple_dungeon' : age < 4 ? 'minecraft:chests/buried_treasure' : 'minecraft:chests/end_city_treasure'
    peCmd(s, `execute in ${PE.OW} run setblock ${x} ${y} ${z} minecraft:chest{LootTable:"${loot}"}`)
    peCmd(s, `execute in ${PE.OW} run setblock ${x} ${y + 1} ${z} minecraft:air`)
    ev.data.chest = { x: x, y: y, z: z }
    peSay(s, Text.gold(`📦 Сундук: X ${x}  Y ${y}  Z ${z}. На старт!`))
  }),
  fast: (s, ev) => pePollPoint(s, ev),
  tick: (s, ev) => { if (ev.data.chest) { var c = ev.data.chest; peCmd(s, `execute in ${PE.OW} run particle minecraft:end_rod ${c.x + 0.5} ${c.y + 2} ${c.z + 0.5} 0.2 4 0.2 0 15 force`); peBar(s, `Гонка за сундуком: X ${c.x} Z ${c.z} — ${peFmt(ev.end - s.tickCount)}`, ev.end - s.tickCount, ev.end - ev.t0) } },
  finish: (s, ev) => {
    if (ev.data.winner) { var p = peP(s, ev.data.winner); peSay(s, Text.gold(`📦 Сундук достался ${ev.data.winner}!`)); if (p) peReward(s, p, 30, 3, 'гонка за сундуком') }
    else peSay(s, Text.gray('Сундук никто не нашёл — он остался на месте.'))
  }
})
BlockEvents.rightClicked(e => {
  const ev = PE.cur
  if (!ev || ev.id != 'chest_race' || !ev.data.chest || ev.data.winner) return
  const c = ev.data.chest, b = e.block
  if (b.x == c.x && b.y == c.y && b.z == c.z && String(e.level.dimension) == PE.OW) { ev.data.winner = e.player.username; peEnd(e.server, 'win') }
})

// ---------- 10. Ярмарка заказов
const PE_ORDERS = [
  [['minecraft:bread', 32], ['minecraft:copper_ingot', 32], ['minecraft:brick', 64], ['minecraft:charcoal', 32]],
  [['create:andesite_alloy', 64], ['create:shaft', 64], ['create:cogwheel', 32], ['create:zinc_ingot', 32]],
  [['create:brass_ingot', 32], ['create:precision_mechanism', 4], ['create:track', 64], ['create:fluid_tank', 8]],
  [['tfmg:steel_ingot', 32], ['tfmg:plastic_sheet', 16], ['immersiveengineering:wirecoil_copper', 8], ['createaddition:alternator', 2]],
  [['mekanism:steel_casing', 4], ['ae2:fluix_crystal', 32], ['ae2:fluix_covered_cable', 32], ['mekanism:basic_energy_cube', 2]],
  [['mekanismgenerators:fission_reactor_casing', 16], ['mekanism:hdpe_sheet', 16], ['ae2:molecular_assembler', 2], ['tfmg:steel_ingot', 128]]
]
peDef('orders', {
  name: 'Ярмарка заказов', min: 1, minutes: 15, auto: true,
  desc: 'Сервер заказывает партию товара. Первый, кто сдаст (/ev do сдать), получает большую награду, остальные — поменьше.',
  start: (s, ev) => {
    const o = pePick(PE_ORDERS[Math.min(peAge(), PE_ORDERS.length - 1)])
    ev.data = { item: o[0], count: o[1], done: [] }
    peSay(s, Text.gold(`📜 Заказ: ${o[1]} × `).append(Text.of(Item.of(o[0]).hoverName)).append(Text.gold('. Сдать: /ev do сдать')))
  },
  cmd: (s, p, args, ev) => {
    if (args[0] != 'сдать' && args[0] != 'deliver') return false
    const d = ev.data
    if (d.done.indexOf(p.username) >= 0) { p.tell(Text.gray('Вы уже сдали заказ.')); return true }
    if (peCount(p, d.item) < d.count) { p.tell(Text.red(`Нужно ${d.count} шт., у вас ${peCount(p, d.item)}.`)); return true }
    peTake(p, d.item, d.count)
    d.done.push(p.username)
    if (d.done.length == 1) { peSay(s, Text.gold(`📜 ${p.username} первым выполнил заказ!`)); peReward(s, p, 60, 4, 'первым выполнил заказ') }
    else peReward(s, p, 15, 1, 'выполнил заказ')
    return true
  },
  tick: (s, ev) => peBar(s, `Заказ: ${ev.data.count} × ${ev.data.item} — выполнили ${ev.data.done.length} · ${peFmt(ev.end - s.tickCount)}`, ev.end - s.tickCount, ev.end - ev.t0),
  finish: (s, ev) => peSay(s, Text.gray(`Заказ закрыт. Выполнили: ${ev.data.done.join(', ') || 'никто'}.`))
})

// ---------- 11. Охотник недели (долгий ивент: неделя)
peDef('hunter_week', {
  name: 'Охотник недели', min: 1, long: true, minutes: 7 * 24 * 60, auto: true,
  desc: 'Неделю сервер считает: убитых мобов, добытую руду и убитых боссов. Лидеры каждой категории получают монеты и титул.',
  start: (s, L) => { L.data = { mobs: {}, ores: {}, bosses: {} } },
  finish: (s, L) => {
    const cats = [['mobs', 'Больше всех мобов', 'Охотник недели'], ['ores', 'Больше всех руды', 'Шахтёр недели'], ['bosses', 'Больше всех боссов', 'Гроза боссов']]
    cats.forEach(cat => {
      const t = L.data[cat[0]], best = Object.keys(t).sort((a, b) => t[b] - t[a])[0]
      if (!best || !t[best]) return
      peSay(s, Text.gold(`🏅 ${cat[1]}: ${peName(s, best)} (${t[best]})`))
      peCoinsUid(s, best, 100)
      s.players.forEach(pl => { if (peUid(pl) == best) { peSeason(s, pl, 6); peTitle(s, pl, cat[2]) } })
    })
  }
})
const peHunt = (s, p, cat) => {
  const L = peLoad(s).long.hunter_week
  if (!L) return
  const u = peUid(p)
  L.data[cat][u] = (L.data[cat][u] || 0) + 1
  if (L.data[cat][u] % 25 == 0) peSave(s)
}
EntityEvents.death(e => {
  const att = e.source.player
  if (!att || !att.isPlayer()) return
  const s = att.server, ent = e.entity
  if (ent.isPlayer()) return
  const type = String(ent.type)
  if (type.indexOf('cataclysm:') == 0 || type == 'minecraft:ender_dragon' || type == 'minecraft:wither' || type == 'mowziesmobs:ferrous_wroughtnaut') peHunt(s, att, 'bosses')
  else if (ent.isMonster()) peHunt(s, att, 'mobs')
  // мобы в ивенте «Затмение»/«Осада» и т.п. считаются здесь же
  if (PE.cur && PE.cur.def.onMobKill) PE.cur.def.onMobKill(s, PE.cur, att, ent)
})
BlockEvents.broken(e => {
  if (!e.player || !e.block.hasTag('c:ores')) return
  peHunt(e.server, e.player, 'ores')
  if (PE.cur && PE.cur.id == 'mining_race' && peIn(PE.cur, e.player)) { var d = PE.cur.data.pts; d[e.player.username] = (d[e.player.username] || 0) + 1 }
})

// ---------- 12. Гонка до точки (рекорды)
peDef('race', {
  name: 'Гонка до точки', min: 1, minutes: 12, auto: true,
  desc: 'Сервер называет точку в 400–800 блоках. Любой транспорт: ноги, поезд, дирижабль. Первый в радиусе 10 блоков побеждает. Рекорд времени сохраняется.',
  start: (s, ev) => {
    const ow = peOnline(s).filter(p => peDim(p) == PE.OW)
    if (!ow.length) return false
    let cx = 0, cz = 0; ow.forEach(p => { cx += p.x; cz += p.z }); cx /= ow.length; cz /= ow.length
    const ang = Math.random() * Math.PI * 2, r = peRnd(400, 800)
    ev.data = { x: Math.floor(cx + Math.cos(ang) * r), z: Math.floor(cz + Math.sin(ang) * r), dist: r }
    peSay(s, Text.gold(`🏁 Финиш: X ${ev.data.x}  Z ${ev.data.z} (≈${r} блоков). Марш!`))
  },
  tick: (s, ev) => {
    const d = ev.data
    ev.players.forEach(n => {
      var p = peP(s, n)
      if (!p || d.winner || peDim(p) != PE.OW) return
      if (Math.abs(p.x - d.x) <= 10 && Math.abs(p.z - d.z) <= 10) { d.winner = n; d.time = s.tickCount - ev.t0; peEnd(s, 'win') }
    })
    if (!d.winner) peBar(s, `Гонка: X ${d.x} Z ${d.z} — ${peFmt(ev.end - s.tickCount)}`, ev.end - s.tickCount, ev.end - ev.t0)
  },
  finish: (s, ev) => {
    const d = ev.data
    if (!d.winner) { peSay(s, Text.gray('До финиша никто не добрался.')); return }
    var p = peP(s, d.winner), pace = Math.round(d.time / 20 / d.dist * 100)  // секунд на 100 блоков
    const rec = peLoad(s).records
    peSay(s, Text.gold(`🏁 ${d.winner} финишировал за ${peFmt(d.time)} (${pace} с на 100 блоков)`))
    if (!rec.race || pace < rec.race.pace) { rec.race = { pace: pace, name: d.winner }; peSave(s); peSay(s, Text.lightPurple('★ Новый рекорд сервера!')); if (p) peTitle(s, p, 'Гонщик') }
    if (p) peReward(s, p, 40, 3, 'победа в гонке')
  }
})

// ---------- 13. Шахтёрский забег
peDef('mining_race', {
  name: 'Шахтёрский забег', min: 1, minutes: 10, auto: true,
  desc: '10 минут: кто добудет больше руды любого вида.',
  start: (s, ev) => { ev.data = { pts: {} } },
  tick: (s, ev) => { const w = peWinnersBy(ev, ev.data.pts); peBar(s, `Шахтёрский забег — лидер: ${w.join(', ') || '—'} (${w.length ? ev.data.pts[w[0]] : 0}) · ${peFmt(ev.end - s.tickCount)}`, ev.end - s.tickCount, ev.end - ev.t0) },
  finish: (s, ev) => {
    const w = peWinnersBy(ev, ev.data.pts)
    w.forEach(n => { var p = peP(s, n); if (p) peReward(s, p, 40, 3, 'шахтёрский забег') })
    peSay(s, Text.gold(w.length ? `⛏ Больше всех руды: ${w.join(', ')} (${ev.data.pts[w[0]]})` : 'Руду никто не копал.'))
  }
})

// ---------- 14. Конкурс построек
const PE_THEMES = ['Маяк', 'Мельница', 'Вокзал', 'Ангар для дирижабля', 'Таверна', 'Мост через реку', 'Обсерватория', 'Вход в шахту',
                   'Статуя босса', 'Сад', 'Кузница', 'Башня мага', 'Пристань', 'Космодром', 'Штаб команды']
peDef('build', {
  name: 'Конкурс построек', min: 2, minutes: 40, auto: true,
  desc: 'Тема на 35 минут стройки, потом 5 минут голосования. Встаньте у своей постройки и напишите /ev do заявка. Голос: /ev do голос <ник>, посмотреть: /ev do смотреть <ник>. За себя голосовать нельзя.',
  start: (s, ev) => { ev.data = { theme: pePick(PE_THEMES), entries: {}, votes: {}, voteAt: ev.end - 5 * 60 * 20 }; peSay(s, Text.gold(`🏗 Тема: «${ev.data.theme}». 35 минут!`)) },
  cmd: (s, p, a, ev) => {
    const d = ev.data, voting = s.tickCount >= d.voteAt
    if (a[0] == 'заявка') { if (voting) { p.tell(Text.red('Стройка закончилась.')); return true } d.entries[p.username] = { dim: peDim(p), x: Math.floor(p.x), y: Math.floor(p.y), z: Math.floor(p.z) }; p.tell(Text.green('Заявка принята — здесь будут смотреть.')); return true }
    if (a[0] == 'смотреть' && a[1]) { var e2 = d.entries[a[1]]; if (!voting || !e2) { p.tell(Text.red('Смотреть можно во время голосования, по нику с заявкой.')); return true } peStashPos(p); peTp(s, p.username, e2.dim, e2.x, e2.y, e2.z); return true }
    if (a[0] == 'голос' && a[1]) {
      if (!voting) { p.tell(Text.red('Голосование ещё не началось.')); return true }
      if (a[1] == p.username || !d.entries[a[1]]) { p.tell(Text.red('Нельзя за себя и за того, у кого нет заявки.')); return true }
      d.votes[p.username] = a[1]; p.tell(Text.green(`Голос за ${a[1]} принят.`)); return true
    }
    return false
  },
  tick: (s, ev) => {
    const d = ev.data, voting = s.tickCount >= d.voteAt
    if (voting && !d.announced) { d.announced = true; peSay(s, Text.gold(`🗳 Голосование! Заявки: ${Object.keys(d.entries).join(', ') || 'нет'}. /ev do смотреть <ник>, /ev do голос <ник>`)) }
    peBar(s, voting ? `Конкурс «${d.theme}»: голосование — ${peFmt(ev.end - s.tickCount)}` : `Конкурс «${d.theme}»: стройка — ${peFmt(d.voteAt - s.tickCount)}`, ev.end - s.tickCount, ev.end - ev.t0)
  },
  finish: (s, ev) => {
    const tally = {}
    Object.keys(ev.data.votes).forEach(v => { const t = ev.data.votes[v]; tally[t] = (tally[t] || 0) + 1 })
    const w = peWinnersBy(ev, tally)
    w.forEach(n => { var p = peP(s, n); if (p) { peReward(s, p, 100, 5, 'конкурс построек'); peTitle(s, p, 'Архитектор') } })
    peSay(s, Text.gold(w.length ? `🏆 Лучшая постройка «${ev.data.theme}»: ${w.join(', ')}` : 'Голосов нет — победителя нет.'))
  }
})
