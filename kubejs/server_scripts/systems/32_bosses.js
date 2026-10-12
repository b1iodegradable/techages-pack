// Боссы: трофеи, скейлинг под число игроков, «Пробуждённые» боссы, финальный босс.

const BOX = Java.loadClass('net.minecraft.world.phys.AABB') // имя AABB занято KubeJS

const BOSSES = {
  'mowziesmobs:ferrous_wroughtnaut': 'wroughtnaut',
  'cataclysm:ancient_remnant': 'remnant',
  'cataclysm:the_leviathan': 'leviathan',
  'cataclysm:scylla': 'scylla',
  'cataclysm:the_harbinger': 'harbinger',
  'cataclysm:netherite_monstrosity': 'monstrosity',
  'cataclysm:ignis': 'ignis',
  'cataclysm:maledictus': 'maledictus',
  'cataclysm:ender_guardian': 'guardian'
}
const FINAL_TAG = 'mp_final'
const FINAL_MULT = 4

const playersWithin = (server, ent, r) => {
  const out = []
  server.players.forEach(p => { if (p.level == ent.level && p.distanceTo(ent) <= r) out.push(p) })
  return out
}
const playersNear = (server, ent, r) => playersWithin(server, ent, r).length

const setMaxHp = (server, ent, hp) => {
  hp = Math.max(1, Math.round(hp))
  server.runCommandSilent(`attribute ${ent.uuid} minecraft:generic.max_health base set ${hp}`)
  ent.health = hp
}

// Первичный скейлинг: HP × (1 + 0.5 × (игроков в радиусе 64 − 1)); финальный ещё × 4.
const scaleBoss = (server, ent) => {
  const data = ent.persistentData
  if (data.getBoolean('mpScaled')) return
  const base = ent.maxHealth
  const team = 1 + 0.5 * (Math.max(1, playersNear(server, ent, 64)) - 1)
  const isFinal = ent.tags.contains(FINAL_TAG)
  data.putDouble('mpBaseHp', base)
  data.putDouble('mpTeam', team)
  data.putBoolean('mpScaled', true)
  setMaxHp(server, ent, base * team * (isFinal ? FINAL_MULT : 1))
}

// ---------- Поиск боссов рядом с игроками (раз в 5 сек) ----------
ServerEvents.tick(e => {
  const s = e.server
  if (s.tickCount % 100 != 0) return
  const seen = {}
  s.players.forEach(p => {
    const box = new BOX(p.x - 48, p.y - 32, p.z - 48, p.x + 48, p.y + 32, p.z + 48)
    p.level.getEntities(p, box).forEach(ent => {
      if (!BOSSES[ent.type] || seen[ent.uuid]) return
      seen[ent.uuid] = true
      scaleBoss(s, ent)
      if (ent.tags.contains(FINAL_TAG)) finalPhases(s, ent)
    })
  })
})

// ---------- Финальный босс: фазы ----------
const finalPhases = (s, ent) => {
  const data = ent.persistentData
  const phase = data.getInt('mpPhase')
  const ratio = ent.health / ent.maxHealth
  const near = playersWithin(s, ent, 64)

  if (ratio < 0.66 && phase < 1) {
    data.putInt('mpPhase', 1)
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2
      s.runCommandSilent(`execute in ${ent.level.dimension} run summon cataclysm:the_prowler ${ent.x + Math.cos(a) * 8} ${ent.y} ${ent.z + Math.sin(a) * 8}`)
    }
    near.forEach(p => p.tell(Text.red('Харбинджер призывает механических прислужников!')))
  }
  if (ratio < 0.33 && phase < 2) {
    data.putInt('mpPhase', 2)
    s.persistentData.putLong('mpMagStormUntil', s.overworld().gameTime + 2400)
    near.forEach(p => {
      p.potionEffects.add('minecraft:slowness', 400, 1, false, true)
      p.potionEffects.add('minecraft:mining_fatigue', 400, 1, false, true)
      s.runCommandSilent(`execute in ${p.level.dimension} run summon minecraft:lightning_bolt ${p.x + 3} ${p.y} ${p.z + 3}`)
      p.tell(Text.red('Магнитная буря! Приборы сбоят.'))
    })
  }
}

// ---------- Трофеи ----------
EntityEvents.death(e => {
  const ent = e.entity
  const key = BOSSES[ent.type]
  if (!key || !e.source.player) return
  const server = ent.server
  ent.block.popItem(Item.of(`kubejs:trophy_${key}`))

  const aw = ent.persistentData.getInt('mpAwakened')
  if (aw > 0) ent.block.popItem(Item.of('kubejs:awakened_essence', aw * 2))

  if (key == 'remnant' && !AStages.serverHasStage('qol_minimap')) ent.block.popItem(Item.of('kubejs:cartographer_token'))

  if (ent.tags.contains(FINAL_TAG)) {
    ent.block.popItem(Item.of('kubejs:final_heart'))
    server.players.forEach(p => p.tell(Text.gold('Пробуждённый Харбинджер повержен! Сердце финала получено.')))
  }
})

// ---------- Печать пробуждения: ПКМ по боссу → ×2, повторно → ×3 (эндгейм) ----------
ItemEvents.entityInteracted('kubejs:awakening_seal', e => {
  if (e.level.isClientSide()) return
  const t = e.target
  if (!BOSSES[t.type] || t.tags.contains(FINAL_TAG)) return
  const server = e.server
  scaleBoss(server, t)
  const data = t.persistentData
  const lvl = data.getInt('mpAwakened')
  if (lvl >= 2) {
    e.player.tell(Text.gray('Босс уже пробуждён полностью.'))
    return
  }
  data.putInt('mpAwakened', lvl + 1)
  setMaxHp(server, t, data.getDouble('mpBaseHp') * data.getDouble('mpTeam') * (lvl + 2))
  server.runCommandSilent(`effect give ${t.uuid} minecraft:strength infinite ${lvl} true`)
  server.runCommandSilent(`effect give ${t.uuid} minecraft:resistance infinite 0 true`)
  e.item.count--
  e.player.tell(Text.darkPurple(`Босс пробуждён: ×${lvl + 2}`))
})

// ---------- Призыв финального босса: Звезда Инженера на Луне ----------
ItemEvents.rightClicked('kubejs:engineer_star', e => {
  if (e.level.isClientSide()) return
  const p = e.player
  if (String(p.level.dimension) != 'northstar:moon') {
    p.tell(Text.yellow('Звезду можно пробудить только на Луне.'))
    return
  }
  e.server.runCommandSilent(
    `execute in northstar:moon run summon cataclysm:the_harbinger ${p.x} ${p.y + 4} ${p.z} ` +
    `{Tags:["${FINAL_TAG}"],PersistenceRequired:1b,CustomName:'"Пробуждённый Харбинджер"'}`)
  e.item.count--
  e.server.players.forEach(pl => pl.tell(Text.darkRed('Звезда пробудилась... Харбинджер вернулся.')))
})
