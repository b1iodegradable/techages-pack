// Игрок: мягкий дебафф после смерти и проверка «убежища» (эпоха 0).

// ---------- После смерти: Слабость I на 2 минуты (вещи — в могиле GraveStone) ----------
PlayerEvents.respawned(e => {
  if (e.isEndConquered()) return // выход из Энда — не смерть
  e.player.potionEffects.add('minecraft:weakness', 2400, 0, false, true)
  e.player.tell(Text.gray('Вы ослаблены после смерти (2 мин). Вещи ждут в могиле.'))
})

// ---------- Книга «Справочник инженера» (Modonomicon, генератор tools/gen_book.py) ----------
const giveHandbook = (server, p) =>
  server.runCommandSilent(`give ${p.username} modonomicon:modonomicon[modonomicon:book_id="techages:handbook"]`)

PlayerEvents.loggedIn(e => {
  var p = e.player
  if (p.persistentData.getBoolean('mpBook')) return
  p.persistentData.putBoolean('mpBook', true)
  giveHandbook(e.server, p)
  if (p.persistentData.getBoolean('mpGuide')) { p.tell(Text.gold('Справочник инженера обновлён — новая книга у вас в инвентаре.')); return }
  p.persistentData.putBoolean('mpGuide', true)
  p.tell(Text.gold('Добро пожаловать в TechAges!'))
  p.tell(Text.yellow('Мир идёт по эпохам: каждая открывает новые моды. Чтобы перейти дальше — скрафтите предмет-ворота и сдайте квест с золотой шестернёй.'))
  p.tell(Text.gray('L — Прогресс мира (что нужно для следующей эпохи) · квесты и Справочник инженера — кнопки слева сверху в инвентаре.'))
})

// /handbook — кнопка-книжка в инвентаре: выдать книгу, если её нет
ServerEvents.commandRegistry(e => {
  e.register(e.commands.literal('handbook').executes(c => {
    var p = c.source.player
    if (!p) return 0
    let has = false
    p.inventory.items.forEach(st => { if (String(st.id) == 'modonomicon:modonomicon') has = true })
    if (has) p.tell(Text.gray('Справочник уже у вас в инвентаре — ПКМ, чтобы открыть.'))
    else { giveHandbook(c.source.server, p); p.tell(Text.gold('Справочник инженера — в инвентаре. ПКМ, чтобы открыть.')) }
    return 1
  }))
})

// ---------- Убежище: игрок спит, а над кроватью есть крыша ----------
// Выдаёт достижение kubejs:shelter → его проверяет квест FTB Quests.
ServerEvents.tick(e => {
  const s = e.server
  if (s.tickCount % 40 != 0) return
  s.players.forEach(p => {
    if (!p.isSleeping() || p.persistentData.getBoolean('mpShelter')) return
    if (p.level.canSeeSky(p.blockPosition().above())) return
    p.persistentData.putBoolean('mpShelter', true)
    s.runCommandSilent(`advancement grant ${p.username} only kubejs:shelter`)
    if (typeof grantWith === 'function') grantWith(s, p, 'kubejs:shelter') // узел во вкладке эпохи 0 (35_progress.js)
  })
})
