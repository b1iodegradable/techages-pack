// Свои предметы пака. Названия — в assets/kubejs/lang/*.json.
// Текстуры пока ванильные-заглушки; заменить своими PNG в assets/kubejs/textures/item/<id>.png
// (тогда строку .texture(...) у предмета можно удалить).

StartupEvents.registry('item', event => {
  const item = (id, texture, opts) => {
    let b = event.create(id).texture(texture)
    if (opts && opts.rarity) b.rarity(opts.rarity)
    if (opts && opts.glow) b.glow(true)
    if (opts && opts.stack) b.maxStackSize(opts.stack)
    return b
  }

  // --- Врата эпох ---
  item('primitive_gear', 'minecraft:item/flint')
  item('kinetic_core', 'minecraft:item/heart_of_the_sea', { rarity: 'uncommon', stack: 16 })
  item('steam_heart', 'minecraft:item/fire_charge', { rarity: 'uncommon', stack: 16 })
  item('storm_coil', 'minecraft:item/prismarine_shard', { rarity: 'rare', stack: 16 })
  item('logic_core', 'minecraft:item/ender_eye', { rarity: 'rare', stack: 16 })
  item('reactor_core', 'minecraft:item/magma_cream', { rarity: 'epic', stack: 16 })

  // --- Удобства ---
  item('navigator', 'minecraft:item/recovery_compass_16', { stack: 1 })
  item('cartographer_token', 'minecraft:item/filled_map', { rarity: 'rare', stack: 1 })

  // --- Магические мосты ---
  item('electrified_quartz', 'minecraft:item/quartz', { glow: true })
  item('ether_reagent', 'minecraft:item/glowstone_dust', { glow: true })
  item('soul_insulator', 'minecraft:item/phantom_membrane')
  item('void_alloy', 'minecraft:item/netherite_scrap', { rarity: 'uncommon' })
  item('star_rod', 'minecraft:item/end_rod', { rarity: 'rare', glow: true })
  item('meteor_steel', 'minecraft:item/iron_ingot', { rarity: 'uncommon' })
  item('meteor_fragment', 'minecraft:item/firework_star')

  // --- Трофеи боссов (гарантированный дроп, см. server_scripts/systems/boss.js) ---
  ;['wroughtnaut', 'remnant', 'leviathan', 'scylla', 'harbinger', 'monstrosity', 'ignis', 'maledictus', 'guardian']
    .forEach(b => item(`trophy_${b}`, 'minecraft:item/nether_star', { rarity: 'epic', stack: 16 }))

  // --- Эндгейм ---
  item('awakening_seal', 'minecraft:item/echo_shard', { rarity: 'epic', stack: 16 })
  item('awakened_essence', 'minecraft:item/dragon_breath', { rarity: 'epic', glow: true })
  item('final_heart', 'minecraft:item/nether_star', { rarity: 'epic', glow: true, stack: 1 })

  // Компоненты Звезды
  ;['kinetic_core_2', 'steam_heart_2', 'storm_coil_2', 'petro_catalyst', 'logic_core_2',
    'fusion_core', 'antimatter_sphere', 'alien_crystal', 'soul_alloy', 'star_steel', 'chrono_brass']
    .forEach(id => item(id, 'minecraft:item/amethyst_shard', { rarity: 'epic', glow: true, stack: 16 }))

  item('engineer_star', 'minecraft:item/nether_star', { rarity: 'epic', glow: true, stack: 1 })
})
