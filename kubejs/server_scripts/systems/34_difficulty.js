// Рост сложности обычных монстров по эпохам (вместо Improved Mobs).
// Эпоха I — как в ванилле; каждая следующая: +12% здоровья, +8% урона. Эпоха VII: +72% HP, +48% урона.
// Боссы не трогаются (у них свой скейлинг в 32_bosses.js и конфиг Cataclysm).

const $Attributes = Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes')
const $Modifier = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier')
const $Operation = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier$Operation')
const $RL = Java.loadClass('net.minecraft.resources.ResourceLocation')

const HP_ID = $RL.parse('kubejs:age_health')
const DMG_ID = $RL.parse('kubejs:age_damage')
const SKIP = ['cataclysm:', 'mowziesmobs:ferrous_wroughtnaut', 'minecraft:wither', 'minecraft:ender_dragon', 'minecraft:warden']

let cachedAge = 0, cachedAt = -1
const currentAge = server => {
  const t = server.tickCount
  if (t - cachedAt < 200 && cachedAt >= 0) return cachedAge
  let n = 0
  for (let i = 1; i <= 7; i++) if (AStages.serverHasStage(`age_${i}`)) n = i
  cachedAge = n; cachedAt = t
  return n
}

const buff = (ent, attr, id, amount) => {
  const inst = ent.getAttribute(attr)
  if (!inst || inst.hasModifier(id)) return
  inst.addPermanentModifier(new $Modifier(id, amount, $Operation.ADD_MULTIPLIED_BASE))
}

EntityEvents.spawned(e => {
  const ent = e.entity
  if (e.level.isClientSide() || !ent.isMonster() || ent.persistentData.getBoolean('mpAgeBuff')) return
  const type = String(ent.type)
  if (SKIP.some(s => type.startsWith(s))) return
  const age = currentAge(e.server)
  ent.persistentData.putBoolean('mpAgeBuff', true)
  if (age <= 1) return
  buff(ent, $Attributes.MAX_HEALTH, HP_ID, 0.12 * (age - 1))
  buff(ent, $Attributes.ATTACK_DAMAGE, DMG_ID, 0.08 * (age - 1))
  ent.health = ent.maxHealth
})
