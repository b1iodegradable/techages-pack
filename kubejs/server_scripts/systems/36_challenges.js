// Вкладка «Испытания» (клавиша L): то, что проверяется скриптом. Сами достижения — tools/gen_advancements.py (CHALLENGES).
// Ванильные условия (высота, глубина, падение, планеты) игра проверяет сама.

const $ChStats = Java.loadClass('net.minecraft.stats.Stats')
const CH_BOSSES = ['cataclysm:ancient_remnant', 'cataclysm:the_leviathan', 'cataclysm:scylla', 'cataclysm:the_harbinger',
                   'cataclysm:netherite_monstrosity', 'cataclysm:ignis', 'cataclysm:maledictus', 'cataclysm:ender_guardian']

const chGrant = (server, pl, id) => {
  const key = 'mpCh_' + id
  if (pl.persistentData.getBoolean(key)) return
  pl.persistentData.putBoolean(key, true)
  server.runCommandSilent(`advancement grant ${pl.username} only kubejs:challenges/${id}`)
}

EntityEvents.death(e => {
  const ent = e.entity, server = ent.server
  const type = String(e.source.getType())
  // смерти игрока
  if (ent.isPlayer()) {
    ent.persistentData.putBoolean('mpDied', true)
    chGrant(server, ent, 'oops')
    if (type.indexOf('explosion') == 0) chGrant(server, ent, 'boom')
    if (type == 'lava') chGrant(server, ent, 'lava')
    return
  }
  // победы над боссами
  const att = e.source.player
  if (!att || !att.isPlayer()) return
  const id = String(ent.type)
  if (id == 'mowziesmobs:ferrous_wroughtnaut' && String(att.mainHandItem.id) == 'minecraft:wooden_sword') chGrant(server, att, 'wooden')
  if (CH_BOSSES.indexOf(id) < 0) return
  let others = 0
  server.players.forEach(o => { if (o.username != att.username && o.level == att.level && o.distanceToSqr(att.x, att.y, att.z) < 64 * 64) others++ })
  if (others == 0) chGrant(server, att, 'solo')
  if (att.headArmorItem.isEmpty() && att.chestArmorItem.isEmpty() && att.legsArmorItem.isEmpty() && att.feetArmorItem.isEmpty()) chGrant(server, att, 'naked')
})

EntityEvents.afterHurt(e => {
  if (e.entity.isPlayer() && String(e.source.getType()) == 'lightningBolt') chGrant(e.entity.server, e.entity, 'zap')
})

// раз в 30 секунд: марафон, «Неубиваемый», ивенты и монеты
ServerEvents.tick(e => {
  const server = e.server
  if (server.tickCount % 600 != 0) return
  const age3 = AStages.serverHasStage('age_3')
  const pd = (typeof PE !== 'undefined' && PE.data) ? PE.data : null
  server.players.forEach(pl => {
    try {
      if (pl.stats.getValue($ChStats.CUSTOM.get($ChStats.WALK_ONE_CM)) >= 10000000) chGrant(server, pl, 'marathon')
    } catch (err) { /* статистика недоступна — пропускаем */ }
    if (age3 && !pl.persistentData.getBoolean('mpDied')) chGrant(server, pl, 'deathless')
    if (pd) {
      var uid = String(pl.uuid), st = pd.stats[uid] || {}
      if ((st.events || 0) >= 25) chGrant(server, pl, 'regular')
      if ((st.duelWins || 0) >= 10) chGrant(server, pl, 'duelist')
      if ((pd.coins[uid] || 0) >= 1000) chGrant(server, pl, 'rich')
    }
  })
})
