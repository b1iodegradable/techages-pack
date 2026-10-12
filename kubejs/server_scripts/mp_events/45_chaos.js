// Ивенты между игроками — хаос и безумие.

// ---------- 25. Перевёрнутый день (случайный модификатор на 10 минут; какой — видно в объявлении)
const PE_MODS = {
  lowgrav: { name: 'Низкая гравитация', on: (s, n) => { peCmd(s, `effect give ${n} minecraft:jump_boost 600 3 true`); peCmd(s, `effect give ${n} minecraft:slow_falling 600 0 true`) }, off: (s, n) => { peCmd(s, `effect clear ${n} minecraft:jump_boost`); peCmd(s, `effect clear ${n} minecraft:slow_falling`) } },
  giants: { name: 'Великаны', on: (s, n) => peCmd(s, `attribute ${n} minecraft:generic.scale base set 2`), off: (s, n) => peCmd(s, `attribute ${n} minecraft:generic.scale base set 1`) },
  tiny: { name: 'Лилипуты', on: (s, n) => peCmd(s, `attribute ${n} minecraft:generic.scale base set 0.5`), off: (s, n) => peCmd(s, `attribute ${n} minecraft:generic.scale base set 1`) },
  rush: { name: 'Спешка', on: (s, n) => { peCmd(s, `effect give ${n} minecraft:speed 600 1 true`); peCmd(s, `effect give ${n} minecraft:haste 600 1 true`) }, off: (s, n) => { peCmd(s, `effect clear ${n} minecraft:speed`); peCmd(s, `effect clear ${n} minecraft:haste`) } },
  double: { name: 'Двойной лут с монстров', on: () => {}, off: () => {} }
}
peDef('flip', {
  name: 'Перевёрнутый день', min: 1, minutes: 10, auto: true,
  desc: '10 минут странного мира со случайным правилом: низкая гравитация, великаны, лилипуты, спешка или двойной лут с монстров.',
  canStart: (s, a) => { if (!a.mod) a.mod = pePick(Object.keys(PE_MODS)); return null },
  info: a => a.mod ? `Правило: ${PE_MODS[a.mod].name}` : '',
  start: (s, ev) => { ev.players.forEach(n => PE_MODS[ev.args.mod].on(s, n)); peSay(s, Text.lightPurple(`🌀 ${PE_MODS[ev.args.mod].name}!`)) },
  tick: (s, ev) => peBar(s, `Перевёрнутый день: ${PE_MODS[ev.args.mod].name} — ${peFmt(ev.end - s.tickCount)}`, ev.end - s.tickCount, ev.end - ev.t0),
  finish: (s, ev) => ev.players.forEach(n => PE_MODS[ev.args.mod].off(s, n))
})
EntityEvents.drops(e => {
  const ev = PE.cur
  const dbl = ev && ((ev.id == 'flip' && ev.args.mod == 'double') || ev.id == 'eclipse')
  if (!dbl || !e.entity.isMonster()) return
  const extra = []
  e.drops.forEach(d => extra.push(d.item.copy()))
  extra.forEach(st => e.addDrop(st))
})

// ---------- 26. Предатель
peDef('traitor', {
  name: 'Предатель', min: 3, pvp: true, nonLethal: true, minutes: 30, auto: true,
  desc: 'Одному игроку тайно приходит задание — вырубить определённого игрока за 30 минут. Остальные могут вычислить его: /ev do обвинить <ник> (одна попытка; ошибка стоит 20 ⚙).',
  start: (s, ev) => {
    const names = peShuffle(ev.players.slice())
    ev.data = { traitor: names[0], target: names[1], accused: {} }
    const t = peP(s, names[0])
    if (t) t.tell(Text.darkRed(`🗡 Вы — предатель. Тайно вырубите ${names[1]} за 30 минут. Не попадитесь!`))
    peSay(s, Text.darkRed('🗡 Среди вас предатель… Вычислить: /ev do обвинить <ник>'))
  },
  onKO: (s, ev, victim, att) => { if (att && att.username == ev.data.traitor && victim.username == ev.data.target) { ev.data.result = 'traitor'; peEnd(s, 'win') } },
  cmd: (s, p, a, ev) => {
    if (a[0] != 'обвинить' && a[0] != 'accuse') return false
    const d = ev.data
    if (!a[1] || ev.players.indexOf(a[1]) < 0) { p.tell(Text.red('Укажите ник участника.')); return true }
    if (p.username == d.traitor) { p.tell(Text.gray('Предателю обвинять бессмысленно.')); return true }
    if (d.accused[p.username]) { p.tell(Text.gray('Вы уже обвиняли.')); return true }
    d.accused[p.username] = a[1]
    if (a[1] == d.traitor) { d.result = 'caught'; d.by = p.username; peEnd(s, 'win') }
    else { peCoins(s, p, -20, 'ложное обвинение'); peSay(s, Text.gray(`${p.username} обвинил ${a[1]} — мимо.`)) }
    return true
  },
  tick: (s, ev) => peBar(s, `Предатель среди вас — ${peFmt(ev.end - s.tickCount)}`, ev.end - s.tickCount, ev.end - ev.t0),
  finish: (s, ev) => {
    const d = ev.data, t = peP(s, d.traitor)
    if (d.result == 'traitor') { peSay(s, Text.darkRed(`🗡 Предатель ${d.traitor} выполнил задание!`)); if (t) peReward(s, t, 100, 5, 'предатель победил') }
    else if (d.result == 'caught') {
      peSay(s, Text.gold(`🗡 ${d.by} разоблачил предателя ${d.traitor}!`))
      ev.players.forEach(n => { if (n != d.traitor) { var p = peP(s, n); if (p) peReward(s, p, 30, 2, 'разоблачили предателя') } })
    } else { peSay(s, Text.gray(`🗡 Время вышло. Предателем был ${d.traitor}.`)); if (t) peReward(s, t, 40, 2, 'предатель не попался') }
  }
})

// ---------- 27. Обмен местами (только обычный мир; через 5 минут все возвращаются)
peDef('swap', {
  name: 'Обмен местами', min: 2, minutes: 5, auto: true,
  desc: 'Все игроки в обычном мире меняются местами по кругу. Через 5 минут всех вернёт обратно.',
  start: (s, ev) => {
    const ps = peShuffle(ev.players.map(n => peP(s, n)).filter(p => p && peDim(p) == PE.OW))
    if (ps.length < 2) { peSay(s, Text.red('Нужно хотя бы двое в обычном мире.')); return false }
    const pos = ps.map(p => [p.x, p.y, p.z])
    ps.forEach(p => peStashPos(p))
    ps.forEach((p, i) => { const q = pos[(i + 1) % ps.length]; peTp(s, p.username, PE.OW, q[0], q[1], q[2]) })
    peSay(s, Text.lightPurple('🔄 Все поменялись местами! Через 5 минут вернём.'))
  },
  tick: (s, ev) => peBar(s, `Обмен местами — возврат через ${peFmt(ev.end - s.tickCount)}`, ev.end - s.tickCount, ev.end - ev.t0)
  // возврат — общий: peEnd возвращает всех с сохранённой позицией
})

// ---------- 28. Проклятый идол
const PE_IDOL_NAME = 'Проклятый идол'
const peHasIdol = p => { let has = false; p.inventory.items.forEach(st => { if (!st.isEmpty() && String(st.id) == 'minecraft:totem_of_undying' && st.hoverName.string == PE_IDOL_NAME) has = true }); return has }
const peTakeIdol = p => p.inventory.items.forEach(st => { if (!st.isEmpty() && String(st.id) == 'minecraft:totem_of_undying' && st.hoverName.string == PE_IDOL_NAME) st.setCount(0) })
const peGiveIdol = (s, n) => peCmd(s, `give ${n} minecraft:totem_of_undying[minecraft:custom_name='${JSON.stringify({ text: PE_IDOL_NAME, color: 'dark_purple', italic: false })}']`)
peDef('idol', {
  name: 'Проклятый идол', min: 2, pvp: true, nonLethal: true, minutes: 10, auto: true,
  desc: 'Одному игроку достаётся проклятый идол: пока он в инвентаре — капают очки, но держатель светится. Вырубите его — идол перейдёт к вам.',
  start: (s, ev) => { const n = pePick(ev.players); peGiveIdol(s, n); ev.data = { pts: {} }; peSay(s, Text.darkPurple(`🗿 Идол у ${n}!`)) },
  tick: (s, ev) => {
    let holder = null
    ev.players.forEach(n => { var p = peP(s, n); if (p && peHasIdol(p)) holder = p })
    if (holder) { ev.data.pts[holder.username] = (ev.data.pts[holder.username] || 0) + 1; peCmd(s, `effect give ${holder.username} minecraft:glowing 2 0 true`) }
    const w = peWinnersBy(ev, ev.data.pts)
    peBar(s, `Проклятый идол — у ${holder ? holder.username : 'никого'} · лидер: ${w.join(', ') || '—'} · ${peFmt(ev.end - s.tickCount)}`, ev.end - s.tickCount, ev.end - ev.t0)
  },
  onKO: (s, ev, victim, att) => { if (att && peHasIdol(victim)) { peTakeIdol(victim); peGiveIdol(s, att.username); peSay(s, Text.darkPurple(`🗿 ${att.username} отобрал идол у ${victim.username}!`)) } },
  finish: (s, ev) => {
    ev.players.forEach(n => { var p = peP(s, n); if (p) peTakeIdol(p) })
    const w = peWinnersBy(ev, ev.data.pts)
    w.forEach(n => { var p = peP(s, n); if (p) peReward(s, p, 60, 4, 'проклятый идол') })
    peSay(s, Text.darkPurple(w.length ? `🗿 Дольше всех идол держал ${w.join(', ')}` : 'Идол никого не прельстил.'))
  }
})

// ---------- 29. Затмение
peDef('eclipse', {
  name: 'Затмение', min: 1, minutes: 5, auto: true,
  desc: 'На 5 минут наступает тьма: ночь посреди дня, монстры сильнее, зато с них падает двойной лут.',
  start: (s, ev) => {
    ev.data = { time: s.overworld().dayTime }
    peCmd(s, 'gamerule doDaylightCycle false')
    peCmd(s, 'time set 18000')
    peSay(s, Text.darkGray('🌑 Затмение! Монстры сильнее, лут с них двойной.'))
  },
  tick: (s, ev) => {
    peCmd(s, 'execute as @e[type=#minecraft:undead,tag=!pe_ecl] run effect give @s minecraft:strength 300 0 true')
    peCmd(s, 'tag @e[type=#minecraft:undead,tag=!pe_ecl] add pe_ecl')
    peBar(s, `Затмение — ${peFmt(ev.end - s.tickCount)}`, ev.end - s.tickCount, ev.end - ev.t0)
  },
  finish: (s, ev) => {
    peCmd(s, `time set ${ev.data.time % 24000}`)
    peCmd(s, 'gamerule doDaylightCycle true')
    peSay(s, Text.yellow('☀ Затмение закончилось.'))
  }
})
