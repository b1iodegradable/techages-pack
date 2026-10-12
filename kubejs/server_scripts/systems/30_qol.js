// Удобства: координаты («Навигатор»), карта/мини-карта Xaero's по стадиям, жетон картографа.

// ---------- Координаты в action bar ----------
ServerEvents.tick(e => {
  const s = e.server
  if (s.tickCount % 20 != 0) return
  if (!AStages.serverHasStage('qol_coords')) return
  const storm = s.persistentData.getLong('mpMagStormUntil') > s.overworld().gameTime
  s.players.forEach(p => {
    if (p.inventory.countItem(Item.of('kubejs:navigator').item) <= 0) return
    if (storm) {
      p.setStatusMessage(Text.red('Навигатор: помехи магнитной бури'))
      return
    }
    const pos = p.blockPosition()
    const biome = p.level.getBiome(pos).unwrapKey().get().location().path
    p.setStatusMessage(Text.gold(`X ${pos.x}  Y ${pos.y}  Z ${pos.z}`).append(Text.gray(`  · ${biome}`)))
  })
})

// ---------- Карта и мини-карта: встроенные эффекты Xaero «нет карты» до нужной стадии ----------
// (xaero/minimap/common.cfg: register_minimap_status_effects = true — по умолчанию включено)
const MAP_BLOCKS = [
  ['qol_worldmap', 'xaeroworldmap:no_world_map'],
  ['qol_minimap', 'xaerominimap:no_minimap']
]
ServerEvents.tick(e => {
  const s = e.server
  if (s.tickCount % 100 != 0) return
  MAP_BLOCKS.forEach(([stage, effect]) => {
    if (AStages.serverHasStage(stage)) return
    s.players.forEach(p => p.potionEffects.add(effect, 260, 0, true, false))
  })
})
;['qol_coords', 'qol_worldmap', 'qol_minimap'].forEach(st => AStages.customizeStage(st).serverOnly())

// F3 без координат — на всю игру (координаты даёт «Навигатор»)
ServerEvents.loaded(e => e.server.runCommandSilent('gamerule reducedDebugInfo true'))

// ---------- Жетон картографа: ПКМ → мини-карта для всей команды ----------
ItemEvents.rightClicked('kubejs:cartographer_token', e => {
  if (e.level.isClientSide()) return
  if (AStages.serverHasStage('qol_minimap')) {
    e.player.tell(Text.gray('Мини-карта уже открыта.'))
    return
  }
  AStages.addStageToServer('qol_minimap')
  e.item.count--
})
