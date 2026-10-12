// Ивенты между игроками — эндгейм: пробуждённый рейд, сезонный турнир, космическая гонка.

// ---------- 30. Пробуждённый рейд (эпоха VII): двое боссов Cataclysm разом на арене, ×2 здоровья
peDef('raid', {
  name: 'Пробуждённый рейд', min: 1, age: 7, pvp: false, nonLethal: true, arena: true, minutes: 15, auto: true,
  desc: 'Все вместе на арене против двух боссов Cataclysm разом (Игнис и Незеритовое Чудовище, ×2 здоровья). Нокаут — выбываешь (вещи не теряются). Победа — эссенция пробуждённых каждому.',
  start: (s, ev) => {
    peArena(s, false)
    const A = PE.ARENA
    ev.players.forEach((n, i) => peToArena(s, peP(s, n), -16, (i % 5) * 2 - 4))
    peCmd(s, `execute in ${PE.OW} run summon cataclysm:ignis ${A.x + 12} ${A.y} ${A.z - 6} {Tags:["pe_raid"],PersistenceRequired:1b}`)
    peCmd(s, `execute in ${PE.OW} run summon cataclysm:netherite_monstrosity ${A.x + 12} ${A.y} ${A.z + 6} {Tags:["pe_raid"],PersistenceRequired:1b}`)
    ev.data = { alive: ev.players.slice(), scaled: false }
  },
  tick: (s, ev) => {
    const d = ev.data, bosses = []
    s.overworld().getEntities().forEach(en => { if (en.tags.contains('pe_raid') && en.isAlive()) bosses.push(en) })
    if (!d.scaled && bosses.length) {
      d.scaled = true
      bosses.forEach(b => { peCmd(s, `attribute ${b.uuid} minecraft:generic.max_health base set ${Math.round(b.maxHealth * 2)}`); b.setHealth(b.maxHealth * 2) })
    }
    if (d.scaled && !bosses.length) { d.win = true; peEnd(s, 'win'); return }
    let hp = 0, max = 0; bosses.forEach(b => { hp += b.health; max += b.maxHealth })
    peBar(s, `Пробуждённый рейд — боссов ${bosses.length}, бойцов ${d.alive.length} · ${peFmt(ev.end - s.tickCount)}`, hp, Math.max(1, max))
  },
  onKO: (s, ev, victim) => {
    const i = ev.data.alive.indexOf(victim.username); if (i < 0) return
    ev.data.alive.splice(i, 1)
    peSay(s, Text.red(`☠ ${victim.username} выбывает из рейда.`))
    peReturn(s, victim)
    if (!ev.data.alive.length) peEnd(s, 'lose')
  },
  finish: (s, ev) => {
    peCmd(s, 'kill @e[tag=pe_raid]')
    if (!ev.data.win) { peSay(s, Text.gray('Рейд провален.')); return }
    peSay(s, Text.gold('👑 Пробуждённый рейд пройден!'))
    ev.players.forEach(n => { var p = peP(s, n); if (p) { p.give(Item.of('kubejs:awakened_essence', 2)); peReward(s, p, 150, 8, 'пробуждённый рейд') } })
  }
})

// ---------- 31. Сезонный турнир: очки за все ивенты копятся месяц, в начале нового месяца — чемпион
const peMonth = () => { const d = new Date(); return `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}` }
const peSeasonCheck = s => {
  const d = peLoad(s), m = peMonth()
  if (!d.season.month) { d.season.month = m; peSave(s); return }
  if (d.season.month == m) return
  const pts = d.season.pts, ids = Object.keys(pts).sort((a, b) => pts[b] - pts[a])
  if (ids.length) {
    const champ = ids[0]
    peSay(s, Text.gold(`🏆 Сезон ${d.season.month} окончен! Чемпион — ${peName(s, champ)} (${pts[champ]} очков)`))
    peCoinsUid(s, champ, 300)
    const prize = Item.of('minecraft:netherite_chestplate', 1)
    peGive(s, champ, prize, '🏆 Награда чемпиона сезона')
    if (!d.titles[champ]) d.titles[champ] = []
    if (d.titles[champ].indexOf('Чемпион сезона') < 0) d.titles[champ].push('Чемпион сезона')
    ids.slice(1, 3).forEach(u => peCoinsUid(s, u, 100))
  }
  d.season = { month: m, pts: {} }
  peSave(s)
}

// ---------- 32. Космическая гонка: первый на новой планете получает бонус и даёт ей имя
const PE_PLANETS = { 'northstar:moon': 'Луна', 'northstar:mars': 'Марс', 'northstar:venus': 'Венера', 'northstar:mercury': 'Меркурий', 'deeperdarker:otherside': 'Otherside' }
ServerEvents.tick(e => {
  const s = e.server
  if (s.tickCount % 1200 == 0) peSeasonCheck(s)
  if (s.tickCount % 40 != 0) return
  const d = peLoad(s)
  s.players.forEach(p => {
    const dim = peDim(p)
    if (!PE_PLANETS[dim] || d.planets[dim]) return
    d.planets[dim] = { uid: peUid(p), who: p.username, name: '' }
    peSave(s)
    peSay(s, Text.gold(`🚀 ${p.username} первым достиг: ${PE_PLANETS[dim]}!`))
    peReward(s, p, 100, 6, `первым на ${PE_PLANETS[dim]}`)
    peTitle(s, p, 'Пионер космоса')
    p.tell(Text.aqua('Дайте планете имя для таблицы сервера: /planets name <имя>'))
  })
})
ServerEvents.commandRegistry(e => {
  const C = e.commands, A = e.arguments
  e.register(C.literal('planets').executes(c => {
    var p = c.source.player; if (!p) return 0
    const d = peLoad(c.source.server)
    p.tell(Text.gold('Покорённые планеты:'))
    Object.keys(PE_PLANETS).forEach(dim => { const x = d.planets[dim]; p.tell(x ? Text.white(` • ${PE_PLANETS[dim]}${x.name ? ' «' + x.name + '»' : ''} — первым был ${x.who}`) : Text.darkGray(` • ${PE_PLANETS[dim]} — ещё никто`)) })
    return 1
  }).then(C.literal('name').then(C.argument('name', A.GREEDY_STRING.create(e)).executes(c => {
    var p = c.source.player; if (!p) return 0
    const s = c.source.server, d = peLoad(s), dim = peDim(p), x = d.planets[dim]
    if (!x || x.uid != peUid(p)) { p.tell(Text.red('Имя даёт тот, кто первым ступил на эту планету (стоя на ней).')); return 0 }
    x.name = String(A.GREEDY_STRING.getResult(c, 'name')).substring(0, 32); peSave(s)
    peSay(s, Text.gold(`🚀 ${p.username} назвал ${PE_PLANETS[dim]}: «${x.name}»`))
    return 1
  }))))
})
