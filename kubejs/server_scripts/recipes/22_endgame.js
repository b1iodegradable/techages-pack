// Эндгейм: Звезда Инженера → творческие предметы (как в FTB Infinity Evolved) → Бесконечность.
// Столы Extended Crafting: tier 2 = 5×5, tier 3 = 7×7, tier 4 = 9×9.

ServerEvents.recipes(event => {
  const C = event.recipes.create

  // Ингредиент для JSON: '#tag' → {tag}, иначе {item}
  const ing = s => s.startsWith('#') ? { tag: s.substring(1) } : { item: s }
  const table = (id, tier, result, pattern, key) => {
    const k = {}
    Object.keys(key).forEach(c => k[c] = ing(key[c]))
    event.custom({
      type: 'extendedcrafting:shaped_table',
      tier: tier,
      pattern: pattern,
      key: k,
      result: { id: result, count: 1 }
    }).id(`kubejs:endgame/${id}`)
  }

  // ================= КОМПОНЕНТЫ ЗВЕЗДЫ (Тир I) =================

  table('kinetic_core_2', 2, 'kubejs:kinetic_core_2', ['PMPMP', 'MBCBM', 'PCKCP', 'MBCBM', 'PMPMP'], {
    P: 'create:precision_mechanism', M: 'create:mechanical_crafter', B: 'create:brass_casing',
    C: 'kubejs:chrono_brass', K: 'kubejs:kinetic_core'
  })
  // Трофей Wroughtnaut — через смеситель, чтобы не перегружать стол
  C.mixing('kubejs:chrono_brass', ['4x create:brass_ingot', '4x irons_spellbooks:arcane_essence', 'minecraft:clock', 'kubejs:trophy_wroughtnaut'])
    .heated().id('kubejs:endgame/chrono_brass')

  table('steam_heart_2', 2, 'kubejs:steam_heart_2', ['ESBSE', 'S T S', 'BTHTB', 'S T S', 'ESBSE'], {
    E: 'create:steam_engine', S: 'create:steam_whistle', B: 'create:blaze_cake',
    T: 'kubejs:trophy_remnant', H: 'kubejs:steam_heart'
  })

  table('storm_coil_2', 2, 'kubejs:storm_coil_2', ['CXCXC', 'XAVAX', 'TVSVT', 'XAVAX', 'CXCXC'], {
    C: 'immersiveengineering:coil_hv', X: 'immersiveengineering:transformer_hv', A: 'immersiveengineering:capacitor_hv',
    V: 'tfmg:accumulator', S: 'kubejs:storm_coil', T: 'kubejs:trophy_scylla'
  })

  C.mixing('kubejs:petro_catalyst', [
    '4x kubejs:ether_reagent', 'occultism:afrit_essence', '4x tfmg:plastic_sheet',
    Fluid.of('tfmg:diesel', 1000), Fluid.of('tfmg:gasoline', 1000)
  ]).superheated().id('kubejs:endgame/petro_catalyst')

  table('logic_core_2', 2, 'kubejs:logic_core_2', ['WEPEW', 'ETMTE', 'PMLMP', 'ETMTE', 'WEPEW'], {
    W: 'ae2:wireless_access_point', E: 'ae2:engineering_processor', P: 'ae2:calculation_processor',
    T: 'kubejs:trophy_harbinger', M: 'kubejs:trophy_monstrosity', L: 'kubejs:logic_core'
  })

  table('fusion_core', 3, 'kubejs:fusion_core', [
    'FFFAFFF', 'F     F', 'F  I  F', 'A IRI A', 'F  I  F', 'F     F', 'FFFAFFF'
  ], {
    F: 'mekanismgenerators:fusion_reactor_frame', A: 'mekanism:alloy_atomic',
    I: 'kubejs:trophy_ignis', R: 'kubejs:reactor_core'
  })

  table('antimatter_sphere', 2, 'kubejs:antimatter_sphere', ['PPPPP', 'PHSHP', 'PSNSP', 'PHSHP', 'PPPPP'], {
    P: 'mekanism:pellet_antimatter', H: 'mekanism:hdpe_sheet', S: 'mekanism:sps_casing', N: 'minecraft:nether_star'
  })

  table('alien_crystal', 2, 'kubejs:alien_crystal', ['TWTWT', 'WGQGW', 'TQXQT', 'WGQGW', 'TWTWT'], {
    T: 'northstar:titanium_ingot', W: 'northstar:tungsten_ingot',
    G: 'northstar:venus_glowstone_ore', Q: 'northstar:mars_quartz_ore', X: 'kubejs:trophy_guardian'
  })

  C.mixing('kubejs:soul_alloy', ['2x malum:soul_stained_steel_ingot', '2x occultism:iesnium_ingot', 'malum:hallowed_gold_ingot', 'kubejs:trophy_maledictus'])
    .superheated().id('kubejs:endgame/soul_alloy')

  C.mixing('kubejs:star_steel', ['4x #c:ingots/steel', '2x ae2:sky_stone_block', 'kubejs:star_rod', 'kubejs:meteor_fragment'])
    .superheated().id('kubejs:endgame/star_steel')

  // ================= ЗВЕЗДА ИНЖЕНЕРА (9×9) =================
  table('engineer_star', 4, 'kubejs:engineer_star', [
    'N   1   N',
    '  S   S  ',
    '    2    ',
    ' 8  B  3 ',
    '7 A * C 4',
    ' 6     5 ',
    '  S   S  ',
    '         ',
    'N       N'
  ], {
    N: 'minecraft:nether_star', S: 'extendedcrafting:crystaltine_catalyst', '*': 'extendedcrafting:ender_star',
    1: 'kubejs:kinetic_core_2', 2: 'kubejs:steam_heart_2', 3: 'kubejs:storm_coil_2', 4: 'kubejs:petro_catalyst',
    5: 'kubejs:logic_core_2', 6: 'kubejs:fusion_core', 7: 'kubejs:antimatter_sphere', 8: 'kubejs:alien_crystal',
    A: 'kubejs:soul_alloy', B: 'kubejs:star_steel', C: 'kubejs:chrono_brass'
  })

  // Печать пробуждения (эндгейм-боссы ×2/×3)
  event.shaped('kubejs:awakening_seal', ['EIE', 'ITI', 'EIE'], {
    E: 'minecraft:echo_shard', I: 'minecraft:netherite_ingot', T: 'minecraft:ender_eye'
  }).id('kubejs:endgame/awakening_seal')

  // ================= ТВОРЧЕСКИЕ ПРЕДМЕТЫ (Тир II, стадия tier_creative) =================
  // Каждый — 9×9: абсолютная сингулярность (все сингулярности сразу) + сердце финала + свои компоненты.
  const U = 'extendedcrafting:ultimate_singularity'
  const creative = (id, out, a, b, c) => table(`creative/${id}`, 4, out, [
    'AAA   AAA',
    'A  BBB  A',
    'A B   B A',
    ' B CUC B ',
    ' B  H  B ',
    ' B CUC B ',
    'A B   B A',
    'A  BBB  A',
    'AAA   AAA'
  ], { A: a, B: b, C: c, U: U, H: 'kubejs:final_heart' })

  creative('motor', 'create:creative_motor', 'create:precision_mechanism', 'kubejs:kinetic_core_2', 'kubejs:chrono_brass')
  creative('fluid_tank', 'create:creative_fluid_tank', 'create:fluid_tank', 'kubejs:petro_catalyst', 'kubejs:steam_heart_2')
  creative('crate', 'create:creative_crate', 'create:item_vault', 'kubejs:logic_core_2', 'kubejs:chrono_brass')
  creative('blaze_cake', 'create:creative_blaze_cake', 'create:blaze_cake', 'kubejs:steam_heart_2', 'kubejs:petro_catalyst')
  creative('energy_cube', 'mekanism:creative_energy_cube', 'mekanism:ultimate_induction_cell', 'kubejs:fusion_core', 'kubejs:antimatter_sphere')
  creative('chemical_tank', 'mekanism:creative_chemical_tank', 'mekanism:ultimate_chemical_tank', 'kubejs:antimatter_sphere', 'kubejs:petro_catalyst')
  creative('mek_fluid_tank', 'mekanism:creative_fluid_tank', 'mekanism:ultimate_fluid_tank', 'kubejs:petro_catalyst', 'kubejs:fusion_core')
  creative('bin', 'mekanism:creative_bin', 'mekanism:ultimate_bin', 'kubejs:logic_core_2', 'kubejs:star_steel')
  creative('ae2_energy', 'ae2:creative_energy_cell', 'ae2:dense_energy_cell', 'kubejs:logic_core_2', 'kubejs:fusion_core')
  creative('ae2_cell', 'ae2:creative_storage_cell', 'ae2:cell_component_256k', 'kubejs:logic_core_2', 'kubejs:alien_crystal')
  creative('source_jar', 'ars_nouveau:creative_source_jar', 'ars_nouveau:source_gem_block', 'kubejs:soul_alloy', 'kubejs:star_steel')
  creative('ca_energy', 'createaddition:creative_energy', 'createaddition:modular_accumulator', 'kubejs:storm_coil_2', 'kubejs:fusion_core')
  creative('tfmg_generator', 'tfmg:creative_generator', 'tfmg:generator', 'kubejs:storm_coil_2', 'kubejs:petro_catalyst')
  creative('ie_capacitor', 'immersiveengineering:capacitor_creative', 'immersiveengineering:capacitor_hv', 'kubejs:storm_coil_2', 'kubejs:antimatter_sphere')
  creative('backpack_infinity', 'sophisticatedbackpacks:infinity_upgrade', 'kubejs:awakened_essence', 'kubejs:soul_alloy', 'kubejs:star_steel')

  // ================= БЕСКОНЕЧНОСТЬ (Тир III, стадия tier_infinity) =================
  table('infinity_catalyst', 4, 'avaritia:infinity_catalyst', [
    'EUE   EUE',
    'U 1 2 3 U',
    'E       E',
    ' 4  H  5 ',
    '   UAU   ',
    ' 6     7 ',
    'E       E',
    'U   8   U',
    'EUE   EUE'
  ], {
    E: 'kubejs:awakened_essence', U: U, H: 'kubejs:final_heart', A: 'kubejs:engineer_star',
    1: 'create:creative_motor', 2: 'mekanism:creative_energy_cube', 3: 'ae2:creative_energy_cell',
    4: 'create:creative_crate', 5: 'mekanism:creative_chemical_tank', 6: 'ars_nouveau:creative_source_jar',
    7: 'createaddition:creative_energy', 8: 'sophisticatedbackpacks:infinity_upgrade'
  })
})
