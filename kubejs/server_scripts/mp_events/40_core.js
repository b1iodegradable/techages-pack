// Ивенты между игроками — ядро.
// Правило: ивент объявляется в чате и запускается, ТОЛЬКО если согласны ВСЕ игроки онлайн
// (кнопки [Согласен]/[Отказ] или /ev yes, /ev no). Нет ответа за 60 с — отмена.
// В PvP-ивентах смертельный удар = нокаут: никто не умирает и не теряет вещи.
// Здесь: реестр ивентов, голосование, таймеры, монеты и очки сезона, почта, арена, возврат игроков.
// Все имена — с префиксом pe (серверные скрипты делят одну область видимости).

const PE_ItemStack = Java.loadClass('net.minecraft.world.item.ItemStack')
const PE_ListTag = Java.loadClass('net.minecraft.nbt.ListTag')
const PE_CompoundTag = Java.loadClass('net.minecraft.nbt.CompoundTag')

const PE = {
  defs: {},         // id → описание ивента
  order: [],        // порядок для /ev list
  cur: null,        // идущий ивент: { id, def, t0, end, players:[имена], data:{} }
  vote: null,       // голосование: { id, args, voters:{имя:null|true}, deadline, by }
  data: null,       // постоянные данные (JSON в server.persistentData): монеты, сезон, рекорды…
  nextAuto: 20 * 60 * 20,
  AUTO_EVERY: 20 * 60 * 20,   // авто-предложение раз в 20 минут
  VOTE_TIME: 60 * 20,         // на голосование — 60 секунд
  ARENA: { x: 20000, y: 220, z: 20000, r: 20 },
  OW: 'minecraft:overworld'
}

// ---------------------------------------------------------------- утилиты
const peRnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1))
const pePick = arr => arr[Math.floor(Math.random() * arr.length)]
const peUid = p => String(p.uuid)
const peOnline = s => { const a = []; s.players.forEach(p => a.push(p)); return a }
const peP = (s, name) => { let r = null; s.players.forEach(p => { if (p.username == name) r = p }); return r }
const peSay = (s, text) => s.players.forEach(p => p.tell(text))
const peCmd = (s, c) => s.runCommandSilent(c)
const peDim = p => String(p.level.dimension)
const peAge = () => { let n = 0; for (let i = 1; i <= 7; i++) if (AStages.serverHasStage(`age_${i}`)) n = i; return n }
const peFmt = t => { const sec = Math.max(0, Math.ceil(t / 20)); return `${Math.floor(sec / 60)}:${('0' + (sec % 60)).slice(-2)}` }
const peShuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t } return arr }
const peTp = (s, name, dim, x, y, z) => peCmd(s, `execute in ${dim} run tp ${name} ${x} ${y} ${z}`)
const peJson = t => JSON.stringify({ text: t })

// ---------------------------------------------------------------- постоянные данные
const peLoad = s => {
  if (PE.data) return PE.data
  let d = {}
  try { var raw = s.persistentData.getString('peData'); if (raw) d = JSON.parse(raw) } catch (err) { d = {} }
  const def = { coins: {}, names: {}, season: { month: '', pts: {} }, titles: {}, title: {}, stats: {}, records: {},
                long: {}, planets: {}, contracts: [], nextContract: 1 }
  Object.keys(def).forEach(k => { if (d[k] === undefined) d[k] = def[k] })
  PE.data = d
  return d
}
const peSave = s => s.persistentData.putString('peData', JSON.stringify(PE.data))

const peName = (s, uid) => peLoad(s).names[uid] || '???'
const peCoinsOf = (s, uid) => peLoad(s).coins[uid] || 0
const peCoins = (s, p, delta, why) => {
  const d = peLoad(s), u = peUid(p)
  d.names[u] = p.username
  d.coins[u] = (d.coins[u] || 0) + delta
  peSave(s)
  if (why) p.tell(Text.yellow(`${delta >= 0 ? '+' : ''}${delta} ⚙ — ${why}. Всего: ${d.coins[u]} ⚙`))
}
const peCoinsUid = (s, uid, delta) => { const d = peLoad(s); d.coins[uid] = (d.coins[uid] || 0) + delta; peSave(s) }
const peSeason = (s, p, pts) => {
  const d = peLoad(s), u = peUid(p)
  d.names[u] = p.username
  d.season.pts[u] = (d.season.pts[u] || 0) + pts
  peSave(s)
}
const peStat = (s, p, key, n) => {
  const d = peLoad(s), u = peUid(p)
  if (!d.stats[u]) d.stats[u] = {}
  d.stats[u][key] = (d.stats[u][key] || 0) + (n || 1)
  peSave(s)
  return d.stats[u][key]
}
// награда: монеты + очки сезона
const peReward = (s, p, coins, pts, why) => { if (coins) peCoins(s, p, coins, why); if (pts) peSeason(s, p, pts) }

// ---------------------------------------------------------------- титулы (префикс в чате через команды scoreboard team)
const peTitle = (s, p, title) => {
  const d = peLoad(s), u = peUid(p)
  if (!d.titles[u]) d.titles[u] = []
  if (d.titles[u].indexOf(title) >= 0) return
  d.titles[u].push(title)
  peSave(s)
  peSay(s, Text.lightPurple(`★ ${p.username} получает титул «${title}»`))
  p.tell(Text.gray('Надеть: /titles set ' + title))
}
const peApplyTitle = (s, p) => {
  const d = peLoad(s), u = peUid(p), team = 'pet_' + u.substring(0, 8)
  const t = d.title[u]
  peCmd(s, `team add ${team}`)
  peCmd(s, `team modify ${team} prefix ${t ? JSON.stringify({ text: `[${t}] `, color: 'light_purple' }) : '""'}`)
  peCmd(s, `team modify ${team} friendlyFire true`)
  peCmd(s, `team join ${team} ${p.username}`)
}

// ---------------------------------------------------------------- почта (предметы для офлайн-игроков, выигрыши, подарки)
const peMailRoot = s => { if (!s.persistentData.contains('peMail')) s.persistentData.put('peMail', new PE_CompoundTag()); return s.persistentData.getCompound('peMail') }
const peMailAdd = (s, uid, stack, note) => {
  if (!stack || stack.isEmpty()) return
  const root = peMailRoot(s)
  const list = root.contains(uid) ? root.getList(uid, 10) : new PE_ListTag()
  const tag = new PE_CompoundTag()
  tag.put('item', stack.save(s.registryAccess()))
  tag.putString('note', note || '')
  list.add(tag)
  root.put(uid, list)
  s.players.forEach(pl => { if (peUid(pl) == uid) pl.tell(Text.aqua('✉ Вам почта: ' + (note || 'посылка') + ' — /mail')) })
}
const peMailClaim = (s, p) => {
  const root = peMailRoot(s), uid = peUid(p)
  if (!root.contains(uid)) { p.tell(Text.gray('Почта пуста.')); return 0 }
  const list = root.getList(uid, 10)
  let n = 0
  for (let i = 0; i < list.size(); i++) {
    var tag = list.getCompound(i)
    var st = PE_ItemStack.parseOptional(s.registryAccess(), tag.getCompound('item'))
    if (!st.isEmpty()) { p.give(st); n++ }
    if (tag.getString('note')) p.tell(Text.aqua('✉ ' + tag.getString('note')))
  }
  root.remove(uid)
  p.tell(Text.aqua(`✉ Получено посылок: ${n}`))
  return n
}
const peGive = (s, uid, stack, note) => {  // онлайн — в инвентарь, офлайн — в почту
  let done = false
  s.players.forEach(pl => { if (!done && peUid(pl) == uid) { pl.give(stack); if (note) pl.tell(Text.aqua(note)); done = true } })
  if (!done) peMailAdd(s, uid, stack, note)
}

// ---------------------------------------------------------------- инвентарь
const peCount = (p, id) => { let n = 0; p.inventory.items.forEach(st => { if (!st.isEmpty() && String(st.id) == id) n += st.count }); return n }
const peTake = (p, id, n) => {
  let left = n
  p.inventory.items.forEach(st => {
    if (left <= 0 || st.isEmpty() || String(st.id) != id) return
    const k = Math.min(left, st.count); st.shrink(k); left -= k
  })
  return n - left
}
const peStashInv = p => {  // сохранить и очистить инвентарь (арена со своим набором)
  const tag = new PE_ListTag()
  p.inventory.save(tag)
  p.persistentData.put('peInv', tag)
  p.inventory.clearContent()
}
const peRestoreInv = p => {
  if (!p.persistentData.contains('peInv')) return
  p.inventory.clearContent()
  p.inventory.load(p.persistentData.getList('peInv', 10))
  p.persistentData.remove('peInv')
}
const peKit = (s, p, kit) => kit.forEach(k => p.give(Item.of(k[0], k[1] || 1)))
const PE_KIT = [['minecraft:iron_sword'], ['minecraft:bow'], ['minecraft:arrow', 24], ['minecraft:shield'], ['minecraft:cooked_beef', 16],
                ['minecraft:iron_helmet'], ['minecraft:iron_chestplate'], ['minecraft:iron_leggings'], ['minecraft:iron_boots']]

// ---------------------------------------------------------------- возврат на место после арены
const peStashPos = p => p.persistentData.putString('peRet', `${peDim(p)} ${p.x} ${p.y} ${p.z}`)
const peReturn = (s, p) => {
  const r = p.persistentData.getString('peRet')
  peRestoreInv(p)
  if (!r) return
  const a = r.split(' ')
  peTp(s, p.username, a[0], a[1], a[2], a[3])
  p.persistentData.remove('peRet')
}

// ---------------------------------------------------------------- арена (стеклянный купол в небе, далеко от баз)
const peArena = (s, ctf) => {
  const A = PE.ARENA, x1 = A.x - A.r - 1, x2 = A.x + A.r + 1, z1 = A.z - A.r - 1, z2 = A.z + A.r + 1
  peCmd(s, `execute in ${PE.OW} run forceload add ${x1} ${z1} ${x2} ${z2}`)
  peCmd(s, `execute in ${PE.OW} run fill ${x1} ${A.y - 1} ${z1} ${x2} ${A.y + 9} ${z2} minecraft:glass hollow`)
  peCmd(s, `execute in ${PE.OW} run fill ${A.x - A.r} ${A.y - 1} ${A.z - A.r} ${A.x + A.r} ${A.y - 1} ${A.z + A.r} minecraft:smooth_stone`)
  peCmd(s, `execute in ${PE.OW} run fill ${x1} ${A.y + 9} ${z1} ${x2} ${A.y + 9} ${z2} minecraft:barrier`)
  if (ctf) {
    peCmd(s, `execute in ${PE.OW} run setblock ${A.x - 15} ${A.y - 1} ${A.z} minecraft:red_wool`)
    peCmd(s, `execute in ${PE.OW} run setblock ${A.x + 15} ${A.y - 1} ${A.z} minecraft:blue_wool`)
  }
}
const peArenaOff = s => {
  const A = PE.ARENA
  peCmd(s, `execute in ${PE.OW} run kill @e[type=!player,x=${A.x - A.r},y=${A.y - 2},z=${A.z - A.r},dx=${A.r * 2},dy=12,dz=${A.r * 2}]`)
  peCmd(s, `execute in ${PE.OW} run forceload remove ${A.x - A.r - 1} ${A.z - A.r - 1} ${A.x + A.r + 1} ${A.z + A.r + 1}`)
}
const peToArena = (s, p, dx, dz) => {
  const A = PE.ARENA
  peStashPos(p)
  peTp(s, p.username, PE.OW, A.x + (dx || 0) + 0.5, A.y, A.z + (dz || 0) + 0.5)
  p.setHealth(p.maxHealth)
  peCmd(s, `effect give ${p.username} minecraft:saturation 5 4 true`)
}
const peInArena = p => {
  const A = PE.ARENA
  return peDim(p) == PE.OW && Math.abs(p.x - A.x) <= A.r + 1 && Math.abs(p.z - A.z) <= A.r + 1 && p.y > A.y - 5
}

// ---------------------------------------------------------------- шкала (bossbar)
const peBar = (s, name, value, max) => {
  peCmd(s, `bossbar add pe:main ${peJson(name)}`)
  peCmd(s, `bossbar set pe:main name ${peJson(name)}`)
  peCmd(s, `bossbar set pe:main max ${Math.max(1, Math.round(max))}`)
  peCmd(s, `bossbar set pe:main value ${Math.max(0, Math.round(value))}`)
  peCmd(s, 'bossbar set pe:main color yellow')
  peCmd(s, 'bossbar set pe:main players @a')
}
const peBarOff = s => peCmd(s, 'bossbar remove pe:main')

// ---------------------------------------------------------------- реестр
// def: { name, desc, min (игроков), age (эпоха), pvp, nonLethal, minutes, auto, long, voters(s, args) → [имена] | undefined,
//        canStart(s, args) → строка-ошибка | null, start(s, ev), tick(s, ev) /1 с, fast(s, ev) /5 тиков, finish(s, ev, reason),
//        onKO(s, ev, victim, attacker), onHurt(e, ev), cmd(s, p, args) — /ev do …, info(args) — доп. строка в объявлении }
const peDef = (id, def) => { PE.defs[id] = def; PE.order.push(id) }

const peCanPropose = (s, id, args) => {
  const def = PE.defs[id]
  if (!def) return 'Нет такого ивента. Список: /ev list'
  if (PE.vote) return 'Уже идёт голосование.'
  if (!def.long && PE.cur) return `Уже идёт ивент «${PE.cur.def.name}».`
  if (def.long && peLoad(s).long[id]) return 'Этот ивент уже идёт.'
  if (peAge() < (def.age || 0)) return `Ивент откроется в эпохе ${def.age}.`
  const voters = def.voters ? def.voters(s, args) : peOnline(s).map(p => p.username)
  if (voters.length < (def.min || 1)) return `Нужно игроков онлайн: ${def.min}.`
  if (def.canStart) { var err = def.canStart(s, args); if (err) return err }
  return null
}

const pePropose = (s, id, args, by) => {
  const err = peCanPropose(s, id, args)
  if (err) return err
  const def = PE.defs[id]
  const names = def.voters ? def.voters(s, args) : peOnline(s).map(p => p.username)
  const voters = {}
  names.forEach(n => { voters[n] = null })
  if (by && voters[by] !== undefined) voters[by] = true
  PE.vote = { id: id, args: args || {}, voters: voters, deadline: s.tickCount + PE.VOTE_TIME, by: by || 'Сервер' }
  const tags = []
  if (def.pvp) tags.push(def.nonLethal ? 'PvP, без смертей' : 'PvP')
  if (def.minutes) tags.push(def.minutes >= 60 * 24 ? `${Math.round(def.minutes / 1440)} дн.` : `${def.minutes} мин`)
  peSay(s, Text.gold('━━━━━━━━━━━━━━━━━━━━━━━━'))
  peSay(s, Text.gold(`▶ Ивент: ${def.name}`).append(Text.gray(tags.length ? `  (${tags.join(', ')})` : '')))
  peSay(s, Text.white(def.desc))
  if (def.info) { var extra = def.info(PE.vote.args); if (extra) peSay(s, Text.aqua(extra)) }
  peSay(s, Text.gray(`Предложил: ${PE.vote.by}. Запустится, только если согласны все: ${names.join(', ')}.`))
  s.players.forEach(p => {
    if (voters[p.username] === undefined) return
    p.tell(Text.green('   [Согласен]').clickRunCommand('/ev yes').hover(Text.gray('Нажмите, чтобы согласиться'))
      .append(Text.white('    '))
      .append(Text.red('[Отказ]').clickRunCommand('/ev no').hover(Text.gray('Нажмите, чтобы отказаться'))))
  })
  peSay(s, Text.gold('━━━━━━━━━━━━━━━━━━━━━━━━'))
  peCheckVote(s)
  return null
}

const peCast = (s, p, yes) => {
  const v = PE.vote
  if (!v || v.voters[p.username] === undefined) { p.tell(Text.gray('Сейчас нет голосования для вас.')); return }
  if (!yes) {
    peSay(s, Text.red(`✖ ${p.username} отказался — ивент «${PE.defs[v.id].name}» отменён.`))
    PE.vote = null
    return
  }
  v.voters[p.username] = true
  peSay(s, Text.green(`✔ ${p.username} согласен`))
  peCheckVote(s)
}

const peCheckVote = s => {
  const v = PE.vote
  if (!v) return
  // ушедшие игроки не голосуют
  Object.keys(v.voters).forEach(n => { if (!peP(s, n)) delete v.voters[n] })
  const names = Object.keys(v.voters)
  const def = PE.defs[v.id]
  if (names.length < (def.min || 1)) { peSay(s, Text.red(`✖ Ивент «${def.name}» отменён: мало игроков.`)); PE.vote = null; return }
  if (names.every(n => v.voters[n] === true)) { PE.vote = null; peStart(s, v.id, v.args, names) }
}

const peStart = (s, id, args, names) => {
  const def = PE.defs[id]
  const ev = { id: id, def: def, args: args, t0: s.tickCount, end: s.tickCount + (def.minutes || 5) * 60 * 20, players: names, data: {} }
  if (def.long) {
    var d = peLoad(s)
    d.long[id] = { endMs: Date.now() + (def.minutes || 60) * 60000, args: args, players: names, data: {} }
    peSave(s)
    peSay(s, Text.gold(`★ Начался долгий ивент «${def.name}»`))
    if (def.start) def.start(s, d.long[id])
    return
  }
  PE.cur = ev
  peSay(s, Text.gold(`★ Ивент «${def.name}» начался!`))
  peCmd(s, `title @a title ${JSON.stringify({ text: def.name, color: 'gold' })}`)
  try {
    if (def.start && def.start(s, ev) === false) { PE.cur = null; peBarOff(s); return }
  } catch (err) {
    console.error(`Ивент ${id}: ошибка старта: ${err}`)
    peSay(s, Text.red('Ивент не смог стартовать — ошибка записана в лог.'))
    peEnd(s, 'error')
  }
}

const peEnd = (s, reason) => {
  const ev = PE.cur
  if (!ev) return
  PE.cur = null
  try { if (ev.def.finish) ev.def.finish(s, ev, reason) } catch (err) { console.error(`Ивент ${ev.id}: ошибка завершения: ${err}`) }
  peBarOff(s)
  ev.players.forEach(n => { var p = peP(s, n); if (p && p.persistentData.contains('peRet')) peReturn(s, p) })
  if (ev.def.arena) peArenaOff(s)
  peSay(s, Text.gray(`Ивент «${ev.def.name}» завершён.`))
}

const peIn = (ev, p) => ev && ev.players.indexOf(p.username) >= 0
const peWinnersBy = (ev, scores) => {  // имена с максимальным счётом
  let best = 0; Object.keys(scores).forEach(n => { if (scores[n] > best) best = scores[n] })
  return best > 0 ? Object.keys(scores).filter(n => scores[n] == best) : []
}

// ---------------------------------------------------------------- тики
ServerEvents.tick(e => {
  const s = e.server, t = s.tickCount
  if (t % 5 == 0 && PE.cur && PE.cur.def.fast) { try { PE.cur.def.fast(s, PE.cur) } catch (err) { console.error(`Ивент ${PE.cur.id}: ${err}`) } }
  if (t % 20 != 0) return
  peLoad(s)
  // голосование: тайм-аут
  if (PE.vote && t >= PE.vote.deadline) {
    var silent = Object.keys(PE.vote.voters).filter(n => PE.vote.voters[n] !== true)
    peSay(s, Text.red(`✖ Ивент «${PE.defs[PE.vote.id].name}» отменён: не ответили ${silent.join(', ')}.`))
    PE.vote = null
  }
  // идущий ивент
  const ev = PE.cur
  if (ev) {
    try { if (ev.def.tick) ev.def.tick(s, ev) } catch (err) { console.error(`Ивент ${ev.id}: ${err}`) }
    if (PE.cur === ev && t >= ev.end) peEnd(s, 'time')
  }
  // долгие ивенты (недели и т.п.)
  if (t % 200 == 0) {
    var d = PE.data
    Object.keys(d.long).forEach(id => {
      const L = d.long[id], def = PE.defs[id]
      if (!def) { delete d.long[id]; return }
      if (Date.now() >= L.endMs) {
        delete d.long[id]; peSave(s)
        try { def.finish(s, L, 'time') } catch (err) { console.error(`Ивент ${id}: ${err}`) }
      }
    })
  }
  // авто-предложение
  if (!PE.vote && !PE.cur && t >= PE.nextAuto && s.players.size() > 0) {
    PE.nextAuto = t + PE.AUTO_EVERY
    var ok = PE.order.filter(id => PE.defs[id].auto && !peCanPropose(s, id, {}))
    if (ok.length) pePropose(s, pePick(ok), {}, null)
  }
})

// ---------------------------------------------------------------- нокаут вместо смерти
EntityEvents.beforeHurt(e => {
  const ev = PE.cur
  if (!ev || !e.entity.isPlayer()) return
  var p = e.entity
  if (!peIn(ev, p)) return
  if (ev.def.onHurt) ev.def.onHurt(e, ev)
  if (!ev.def.nonLethal || e.damage < p.health) return
  e.setDamage(0)
  p.setHealth(p.maxHealth)
  p.setRemainingFireTicks(0)
  const att = e.source.player
  peCmd(p.server, `title ${p.username} actionbar ${JSON.stringify({ text: 'Нокаут!', color: 'red' })}`)
  if (ev.def.onKO) ev.def.onKO(p.server, ev, p, att && att.isPlayer() ? att : null)
})

// ---------------------------------------------------------------- вход / выход
PlayerEvents.loggedIn(e => {
  var s = e.server, p = e.player
  const d = peLoad(s); d.names[peUid(p)] = p.username; peSave(s)
  if (!peIn(PE.cur, p) && (p.persistentData.contains('peRet') || p.persistentData.contains('peInv'))) peReturn(s, p)
  peApplyTitle(s, p)
  if (peMailRoot(s).contains(peUid(p))) p.tell(Text.aqua('✉ Для вас есть почта — /mail'))
})

// ---------------------------------------------------------------- команды
ServerEvents.commandRegistry(e => {
  const C = e.commands, A = e.arguments
  const runP = (fn, s, pl, c) => { if (!pl) { c.source.sendSystemMessage(Text.red('Только для игроков')); return 0 } try { fn(s, pl, c) } catch (err) { console.error('pe cmd: ' + err) } return 1 }
  const run = fn => c => runP(fn, c.source.server, c.source.player, c)
  e.register(C.literal('ev')
    .executes(run((s, p) => {
      p.tell(Text.gold('Ивенты: /ev list — список, /ev propose <id> — предложить, /ev yes | no — голос,'))
      p.tell(Text.gold('/ev info — что идёт сейчас, /ev top — сезон, /coins, /shop, /mail, /titles, /duel, /auction, /contract'))
    }))
    .then(C.literal('yes').executes(run((s, p) => peCast(s, p, true))))
    .then(C.literal('no').executes(run((s, p) => peCast(s, p, false))))
    .then(C.literal('list').executes(run((s, p) => {
      p.tell(Text.gold('Ивенты (нажмите, чтобы предложить):'))
      PE.order.forEach(id => {
        const def = PE.defs[id]
        if (def.hidden) return
        const err = peCanPropose(s, id, {})
        const line = (err ? Text.darkGray(` • ${def.name}`) : Text.green(` • ${def.name}`).clickRunCommand(`/ev propose ${id}`))
        p.tell(line.hover(Text.gray(def.desc + (err ? '\n' + err : ''))))
      })
    })))
    .then(C.literal('propose').then(C.argument('id', A.WORD.create(e)).executes(run((s, p, c) => {
      const err = pePropose(s, A.WORD.getResult(c, 'id'), {}, p.username)
      if (err) p.tell(Text.red(err))
    }))))
    .then(C.literal('info').executes(run((s, p) => {
      if (PE.cur) p.tell(Text.gold(`Идёт: ${PE.cur.def.name}, осталось ${peFmt(PE.cur.end - s.tickCount)}`))
      else p.tell(Text.gray('Сейчас ивентов нет.'))
      const d = peLoad(s)
      Object.keys(d.long).forEach(id => p.tell(Text.gold(`Долгий: ${PE.defs[id].name}, до конца ${Math.ceil((d.long[id].endMs - Date.now()) / 3600000)} ч`)))
      if (PE.cur && PE.cur.def.status) PE.cur.def.status(s, PE.cur, p)
    })))
    .then(C.literal('top').executes(run((s, p) => {
      const d = peLoad(s), pts = d.season.pts
      const ids = Object.keys(pts).sort((a, b) => pts[b] - pts[a]).slice(0, 10)
      p.tell(Text.gold(`Сезон ${d.season.month}: очки за ивенты`))
      ids.forEach((u, i) => p.tell(Text.white(` ${i + 1}. ${peName(s, u)} — ${pts[u]}`)))
      if (!ids.length) p.tell(Text.gray(' Пока пусто.'))
    })))
    .then(C.literal('do').then(C.argument('args', A.GREEDY_STRING.create(e)).executes(run((s, p, c) => {
      const ev = PE.cur
      const parts = String(A.GREEDY_STRING.getResult(c, 'args')).split(' ')
      // команды долгих ивентов (сдать в мега-проект и т.п.)
      const d = peLoad(s)
      const ids = Object.keys(d.long)
      for (let i = 0; i < ids.length; i++) { var def = PE.defs[ids[i]]; if (def && def.cmd && def.cmd(s, p, parts, d.long[ids[i]])) return }
      if (!ev || !ev.def.cmd || !ev.def.cmd(s, p, parts, ev)) p.tell(Text.gray('Сейчас эта команда не нужна.'))
    }))))
    .then(C.literal('stop').requires(src => src.hasPermission(2)).executes(c => { if (PE.cur) peEnd(c.source.server, 'stop'); PE.vote = null; return 1 }))
  )
  e.register(C.literal('mail').executes(run((s, p) => peMailClaim(s, p))))
})
