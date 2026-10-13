// Админские команды на случай багов (только операторы, уровень 2):
//   /ta adv <игрок> <id>                   — выдать достижение (+ связанные узлы экрана L, как при обычном получении)
//   /ta stage <игрок> add|remove <стадия>   — открыть/закрыть эпоху или удобство (стадии AStages общие на сервер)
//   /ta stages <игрок>                      — какие стадии открыты
//   /ta quest <игрок> <ключ>                — засчитать квест по ключу из tools/gen_quests.py (a0_shelter, a2_gate…)
//   /ta quests <игрок> <часть ключа>        — найти ключи квестов
//   /ta sync <игрок>                        — заново выдать достижения всех открытых эпох (экран L)
// Игрок в каждой команде — чтобы чинить прогресс и друзьям. Всё пишется в лог сервера.
const ADMIN_STAGES = Object.keys(AGE_TITLES).concat(['qol_coords', 'qol_worldmap', 'qol_minimap'])

const adminSay = (c, msg) => {
  c.source.sendSystemMessage(Text.gold(`[TA] ${msg}`))
  console.info(`[TA] ${c.source.textName}: ${msg}`)
  return 1
}

ServerEvents.commandRegistry(e => {
  const C = e.commands, A = e.arguments
  const who = (c) => A.PLAYER.getResult(c, 'who')
  const withPlayer = (name, branch) => C.literal(name).then(branch(C.argument('who', A.PLAYER.create(e))))

  e.register(C.literal('ta').requires(s => s.hasPermission(2))
    .then(withPlayer('adv', p => p.then(C.argument('id', A.RESOURCE_LOCATION.create(e)).executes(c => {
      var pl = who(c), rl = A.RESOURCE_LOCATION.getResult(c, 'id'), id = String(rl)
      if (!c.source.server.getAdvancements().get(rl)) return adminSay(c, `нет достижения ${id}`)
      c.source.server.runCommandSilent(`advancement grant ${pl.username} only ${id}`)
      if (typeof grantWith === 'function') grantWith(c.source.server, pl, id)
      return adminSay(c, `${pl.username}: выдано ${id}`)
    }))))
    .then(withPlayer('stage', p => ['add', 'remove'].reduce((node, act) => node.then(C.literal(act)
      .then(C.argument('stage', A.WORD.create(e)).executes(c => {
        var st = A.WORD.getResult(c, 'stage')
        if (ADMIN_STAGES.indexOf(st) < 0) return adminSay(c, `нет стадии ${st}. Есть: ${ADMIN_STAGES.join(', ')}`)
        if (act == 'add') AStages.addStageToServer(st)
        else AStages.removeStageFromServer(st)
        return adminSay(c, `стадия ${st}: ${act == 'add' ? 'открыта' : 'закрыта'} (для всех)`)
      }))), p)))
    .then(withPlayer('stages', p => p.executes(c => adminSay(c, `открыты: ${ADMIN_STAGES.filter(s => AStages.serverHasStage(s)).join(', ') || 'ничего'}`))))
    .then(withPlayer('quest', p => p.then(C.argument('key', A.WORD.create(e)).executes(c => {
      var pl = who(c), key = A.WORD.getResult(c, 'key'), q = ADMIN_QUESTS[key]
      if (!q) return adminSay(c, `нет квеста ${key}. Поиск: /ta quests ${pl.username} <часть ключа>`)
      c.source.server.runCommandSilent(`ftbquests change_progress ${pl.username} complete ${q[0]}`)
      return adminSay(c, `${pl.username}: засчитан квест «${q[1]}» (${key})`)
    }))))
    .then(withPlayer('quests', p => p.then(C.argument('part', A.WORD.create(e)).executes(c => {
      var part = A.WORD.getResult(c, 'part')
      var found = Object.keys(ADMIN_QUESTS).filter(k => k.indexOf(part) >= 0 || ADMIN_QUESTS[k][1].toLowerCase().indexOf(part.toLowerCase()) >= 0)
      return adminSay(c, found.length ? found.slice(0, 30).map(k => `${k} — ${ADMIN_QUESTS[k][1]}`).join('; ') : 'ничего не найдено')
    }))))
    .then(withPlayer('sync', p => p.executes(c => {
      var pl = who(c)
      Object.keys(PROGRESS).forEach(st => PROGRESS[st].forEach(id => pl.persistentData.remove('mpAdv_' + id)))
      syncProgress(c.source.server, pl)
      return adminSay(c, `${pl.username}: достижения открытых эпох выданы заново`)
    })))
  )
})
