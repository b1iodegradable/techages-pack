// Экран достижений (клавиша L): выдача по стадиям сервера и вместе со служебными достижениями.
// Сгенерировано tools/gen_advancements.py — правьте генератор, а не этот файл.
const PROGRESS = {
  "age_1": [
    "kubejs:progress/age_1",
    "kubejs:age1/root"
  ],
  "qol_coords": [
    "kubejs:progress/qol_coords"
  ],
  "age_2": [
    "kubejs:progress/age_2",
    "kubejs:age2/root"
  ],
  "qol_worldmap": [
    "kubejs:progress/qol_worldmap",
    "kubejs:age2/a2_flight"
  ],
  "qol_minimap": [
    "kubejs:progress/qol_minimap"
  ],
  "age_3": [
    "kubejs:progress/age_3",
    "kubejs:age3/root"
  ],
  "age_4": [
    "kubejs:progress/age_4",
    "kubejs:age4/root"
  ],
  "age_5": [
    "kubejs:progress/age_5",
    "kubejs:age5/root"
  ],
  "age_6": [
    "kubejs:progress/age_6",
    "kubejs:age6/root"
  ],
  "age_7": [
    "kubejs:progress/age_7",
    "kubejs:age7/root",
    "kubejs:age7/s_start"
  ],
  "tier_creative": [
    "kubejs:progress/tier_creative",
    "kubejs:creative/root",
    "kubejs:creative/c_start"
  ],
  "tier_infinity": [
    "kubejs:progress/tier_infinity",
    "kubejs:creative/c_all"
  ]
}
const GRANT_WITH = {
  "kubejs:shelter": [
    "kubejs:age0/a0_shelter"
  ]
}

const grant = (server, player, id) => server.runCommandSilent(`advancement grant ${player.username} only ${id}`)

const syncProgress = (server, player) => {
  Object.keys(PROGRESS).forEach(stage => {
    if (!AStages.serverHasStage(stage)) return
    PROGRESS[stage].forEach(id => {
      const key = 'mpAdv_' + id  // флаг на каждое достижение: новые узлы выдадутся и старым игрокам
      if (player.persistentData.getBoolean(key)) return
      player.persistentData.putBoolean(key, true)
      grant(server, player, id)
    })
  })
}

// Вызывается из 31_player.js после выдачи служебного достижения (серверные скрипты делят одну область видимости)
const grantWith = (server, player, id) => (GRANT_WITH[id] || []).forEach(a => grant(server, player, a))

// Одноразово: отозвать узлы «найти структуру», засчитанные в 0.9.3 из-за ошибки в условии
const STRUCT_FIX = ["kubejs:age1/a1_wrought_find", "kubejs:age2/a2_pyramid", "kubejs:age3/a3_sunken", "kubejs:age3/a3_acropolis", "kubejs:age4/a4_meteor", "kubejs:age4/a4_factory", "kubejs:age4/a4_smith", "kubejs:age5/a5_arena", "kubejs:age5/a5_prison", "kubejs:age5/a5_citadel", "kubejs:age6/a6_base", "kubejs:age7/o_city", "kubejs:age7/o_temple"]

PlayerEvents.loggedIn(e => {
  const pl = e.player
  if (!pl.persistentData.getBoolean('mpFixStruct')) {
    pl.persistentData.putBoolean('mpFixStruct', true)
    STRUCT_FIX.forEach(id => e.server.runCommandSilent(`advancement revoke ${pl.username} only ${id}`))
  }
  syncProgress(e.server, pl)
})

ServerEvents.tick(e => {
  if (e.server.tickCount % 100 != 0) return
  e.server.players.forEach(p => syncProgress(e.server, p))
})
