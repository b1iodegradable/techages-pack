// События мира (KubeJS). Штормы/торнадо — Weather2, луны — Enhanced Celestials (свои конфиги).
// Правила: прогноз за игровые сутки, не повторять событие подряд, пауза 2–4 суток,
// интенсивность растёт с эпохой, ничего не происходит без игроков онлайн.

const Heightmap = Java.loadClass('net.minecraft.world.level.levelgen.Heightmap$Types')
const DAY = 24000
const DURATION = 6000 // 5 минут реального времени

const EVENTS = {
  caravan:   { stage: 'age_1', name: 'Караван торговцев', forecast: 'Завтра к вам заглянет караван.' },
  pests:     { stage: 'age_1', name: 'Нашествие вредителей', forecast: 'Завтра ожидается нашествие вредителей — берегите поля.' },
  starfall:  { stage: 'age_2', name: 'Звездопад', forecast: 'Завтра звездопад: метеориты, укрепите крыши.' },
  thunder:   { stage: 'age_3', name: 'Грозовой фронт', forecast: 'Завтра грозовой фронт — молнии бьют по открытым местам.' },
  magstorm:  { stage: 'age_3', name: 'Магнитная буря', forecast: 'Завтра магнитная буря — навигация будет сбоить.' },
  rust_rain: { stage: 'age_4', name: 'Ржавый дождь', forecast: 'Завтра ржавый дождь — без шлема под открытым небом опасно.' },
  void_fog:  { stage: 'age_5', name: 'Туман пустоты', forecast: 'Завтра туман пустоты — монстры выйдут и днём.' }
}

const say = (s, msg) => s.players.forEach(p => p.tell(msg))
const gameTime = s => s.overworld().gameTime
const exposed = p => p.level.canSeeSky(p.blockPosition())
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1))
const ageLevel = () => { let n = 0; for (let i = 1; i <= 7; i++) if (AStages.serverHasStage(`age_${i}`)) n = i; return n }
const surfaceY = (level, x, z) => level.getHeight(Heightmap.MOTION_BLOCKING, Math.floor(x), Math.floor(z))

const ACTIONS = {
  // Разовые действия при старте
  start: {
    caravan: s => {
      const p = s.players.get(rnd(0, s.players.size() - 1))
      const x = p.x + rnd(-12, 12), z = p.z + rnd(-12, 12), y = surfaceY(p.level, x, z)
      s.runCommandSilent(`execute in ${p.level.dimension} run summon minecraft:wandering_trader ${x} ${y} ${z}`)
      s.runCommandSilent(`execute in ${p.level.dimension} run summon minecraft:trader_llama ${x + 1} ${y} ${z}`)
      s.runCommandSilent(`execute in ${p.level.dimension} run summon minecraft:trader_llama ${x - 1} ${y} ${z}`)
    },
    pests: s => s.players.forEach(p => {
      for (let i = 0; i < 3 + ageLevel(); i++)
        s.runCommandSilent(`execute in ${p.level.dimension} run summon minecraft:silverfish ${p.x + rnd(-10, 10)} ${p.y} ${p.z + rnd(-10, 10)}`)
    }),
    thunder: s => s.runCommandSilent(`weather thunder ${DURATION / 20}`),
    rust_rain: s => s.runCommandSilent(`weather rain ${DURATION / 20}`),
    magstorm: s => s.persistentData.putLong('mpMagStormUntil', gameTime(s) + DURATION)
  },
  // Повторяющиеся действия во время события (раз в 10 сек)
  pulse: {
    starfall: s => s.players.forEach(p => {
      if (!exposed(p) || Math.random() > 0.5) return
      const x = p.x + rnd(-24, 24), z = p.z + rnd(-24, 24), y = surfaceY(p.level, x, z)
      s.runCommandSilent(`execute in ${p.level.dimension} run summon minecraft:fireball ${x} ${y + 40} ${z} {Motion:[0.0,-1.5,0.0],ExplosionPower:${Math.min(1 + ageLevel() / 3, 3).toFixed(0)}}`)
      s.runCommandSilent(`execute in ${p.level.dimension} run summon minecraft:item ${x} ${y + 1} ${z} {Item:{id:"kubejs:meteor_fragment",count:1}}`)
    }),
    thunder: s => s.players.forEach(p => {
      if (!exposed(p) || Math.random() > 0.4) return
      s.runCommandSilent(`execute in ${p.level.dimension} run summon minecraft:lightning_bolt ${p.x + rnd(-6, 6)} ${p.y} ${p.z + rnd(-6, 6)}`)
    }),
    rust_rain: s => s.players.forEach(p => {
      if (!exposed(p) || !p.level.isRaining()) return
      if (p.getItemBySlot('head').isEmpty()) s.runCommandSilent(`damage ${p.username} 1 minecraft:magic`)
    }),
    void_fog: s => s.players.forEach(p => {
      p.potionEffects.add('minecraft:darkness', 260, 0, false, false)
      if (Math.random() < 0.3)
        s.runCommandSilent(`execute in ${p.level.dimension} run summon minecraft:zombie ${p.x + rnd(-14, 14)} ${p.y} ${p.z + rnd(-14, 14)}`)
    })
  }
}

ServerEvents.tick(e => {
  const s = e.server
  if (s.tickCount % 200 != 0 || s.players.isEmpty()) return
  const d = s.persistentData
  const now = gameTime(s)

  // 1. Идёт событие → импульс или конец
  const active = d.getString('mpEvActive')
  if (active) {
    if (now >= d.getLong('mpEvEnd')) {
      d.putString('mpEvActive', '')
      say(s, Text.gray(`Событие «${EVENTS[active].name}» закончилось.`))
    } else if (ACTIONS.pulse[active]) ACTIONS.pulse[active](s)
    return
  }

  // 2. Запланированное событие наступило
  const planned = d.getString('mpEvPlanned')
  if (planned && now >= d.getLong('mpEvAt')) {
    d.putString('mpEvPlanned', '')
    d.putString('mpEvActive', planned)
    d.putString('mpEvLast', planned)
    d.putLong('mpEvEnd', now + DURATION)
    d.putLong('mpEvNextPlan', now + DURATION + rnd(2, 4) * DAY / Math.max(1, ageLevel() / 3))
    say(s, Text.gold(`Началось: ${EVENTS[planned].name}`))
    if (ACTIONS.start[planned]) ACTIONS.start[planned](s)
    return
  }

  // 3. Пора планировать следующее (прогноз за сутки)
  if (!planned && now >= d.getLong('mpEvNextPlan')) {
    const last = d.getString('mpEvLast')
    const pool = Object.keys(EVENTS).filter(k => k != last && AStages.serverHasStage(EVENTS[k].stage))
    if (pool.length == 0) { d.putLong('mpEvNextPlan', now + DAY); return }
    const next = pool[rnd(0, pool.length - 1)]
    d.putString('mpEvPlanned', next)
    d.putLong('mpEvAt', now + DAY)
    say(s, Text.aqua(`Прогноз: ${EVENTS[next].forecast}`))
  }
})
