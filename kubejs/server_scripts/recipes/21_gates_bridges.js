// Врата эпох и межмодовые мосты.
// Принцип: машина следующего уровня требует компонент из другой ветки/мода.

ServerEvents.recipes(event => {
  const C = event.recipes.create

  // ================= ВРАТА =================

  // Эпоха 0 → I
  event.shaped('kubejs:primitive_gear', ['SFS', 'FCF', 'SFS'], {
    S: '#c:rods/wooden', F: 'minecraft:flint', C: '#c:ingots/copper'
  }).id('kubejs:gate/primitive_gear')

  // Эпоха I → II (верстак: механический крафтер требует латунь, а она с эпохи II)
  event.shaped('kubejs:kinetic_core', ['APA', 'PGP', 'APA'], {
    A: 'create:andesite_casing', P: 'create:precision_mechanism', G: 'ars_nouveau:source_gem_block'
  }).id('kubejs:gate/kinetic_core')

  // Эпоха II → III: пар + дирижабль
  C.mechanical_crafting('kubejs:steam_heart', ['BPB', 'QSQ', 'BEB'], {
    B: 'create:brass_casing', P: 'aeronautics:propeller_bearing', Q: 'kubejs:electrified_quartz',
    S: 'create:steam_engine', E: 'aeronautics:white_envelope'
  }).id('kubejs:gate/steam_heart')

  // Эпоха III → IV: электросеть + Leviathan
  C.mechanical_crafting('kubejs:storm_coil', ['SCS', 'GTG', 'SLS'], {
    S: '#c:ingots/steel', C: 'createaddition:tesla_coil', G: 'tfmg:generator',
    T: 'kubejs:trophy_leviathan', L: 'immersiveengineering:coil_mv'
  }).id('kubejs:gate/storm_coil')

  // Эпоха IV → V: цифровой завод + Harbinger
  C.mechanical_crafting('kubejs:logic_core', ['LEL', 'CTC', 'LSL'], {
    L: 'ae2:logic_processor', E: 'ae2:engineering_processor', C: 'ae2:calculation_processor',
    T: 'kubejs:trophy_harbinger', S: 'mekanism:steel_casing'
  }).id('kubejs:gate/logic_core')

  // Эпоха V → VI: реактор
  C.mechanical_crafting('kubejs:reactor_core', ['CRC', 'AFA', 'CTC'], {
    C: 'mekanismgenerators:fission_reactor_casing', R: 'kubejs:star_rod', A: 'mekanism:alloy_atomic',
    F: 'mekanismgenerators:fission_fuel_assembly', T: 'mekanismgenerators:turbine_rotor'
  }).id('kubejs:gate/reactor_core')

  // ================= УДОБСТВА =================
  event.shaped('kubejs:navigator', [' R ', 'ACA', ' K '], {
    R: 'minecraft:redstone', A: 'create:andesite_alloy', C: 'minecraft:compass', K: 'minecraft:clock'
  }).id('kubejs:qol/navigator')

  // ================= МАГИЧЕСКИЕ МОСТЫ =================

  // Ars Nouveau → пар (эпоха II)
  C.mixing('2x kubejs:electrified_quartz', ['2x minecraft:quartz', 'ars_nouveau:source_gem', 'minecraft:redstone'])
    .heated().id('kubejs:bridge/electrified_quartz')

  // Occultism → нефтепереработка (эпоха III)
  C.mixing('kubejs:ether_reagent', ['occultism:spirit_attuned_gem', 'minecraft:glowstone_dust', Fluid.of('minecraft:water', 250)])
    .id('kubejs:bridge/ether_reagent')

  // Malum → высоковольтные провода (эпоха III)
  C.pressing('2x kubejs:soul_insulator', 'malum:soul_stained_steel_ingot').id('kubejs:bridge/soul_insulator')

  // Malum + незерит → процессоры/контроллер AE2 (эпоха IV)
  C.mixing('kubejs:void_alloy', ['minecraft:netherite_scrap', 'malum:hallowed_gold_ingot', 'malum:eldritch_spirit'])
    .superheated().id('kubejs:bridge/void_alloy')

  // Звёздный стержень: Astral Sorcery, если стоит; иначе — Ars Nouveau
  C.mechanical_crafting('kubejs:star_rod', [' G ', 'AEA', ' G '], {
    G: 'ars_nouveau:source_gem_block', A: 'mekanism:alloy_atomic', E: 'minecraft:end_rod'
  }).id('kubejs:bridge/star_rod')

  // Метеоритная сталь: AE2 метеорит + сталь TFMG (эпоха VI)
  C.mixing('kubejs:meteor_steel', ['#c:ingots/steel', 'ae2:sky_stone_block', 'kubejs:meteor_fragment'])
    .superheated().id('kubejs:bridge/meteor_steel')

  // ================= ВСТРАИВАНИЕ МОСТОВ В МАШИНЫ =================
  // Рецепты пересобраны по оригиналам из jar (форма та же + мост).

  // Паровой двигатель требует наэлектризованный кварц
  event.remove({ id: 'create:crafting/kinetics/steam_engine' })
  event.shaped('create:steam_engine', [' P ', 'QAQ', ' C '], {
    P: '#c:plates/gold', Q: 'kubejs:electrified_quartz', A: 'create:andesite_alloy', C: '#c:storage_blocks/copper'
  }).id('kubejs:bridge/steam_engine')

  // Дистилляционная колонна TFMG: компас → эфирный реагент
  event.remove({ id: 'tfmg:crafting/materials/steel_distillation_controller' })
  event.shaped('tfmg:steel_distillation_controller', ['SPS', 'ECE', 'MHM'], {
    S: '#c:plates/lead', P: 'tfmg:industrial_pipe', E: 'create:electron_tube', C: 'kubejs:ether_reagent',
    M: 'tfmg:steel_mechanism', H: 'tfmg:heavy_machinery_casing'
  }).id('kubejs:bridge/distillation_controller')

  // Высоковольтный провод IE: деревянный стержень → изолятор душ
  event.remove({ id: 'immersiveengineering:crafting/wirecoil_steel' })
  event.shaped('4x immersiveengineering:wirecoil_steel', [' w ', 'asa', ' w '], {
    w: '#c:wires/steel', a: '#c:wires/aluminum', s: 'kubejs:soul_insulator'
  }).id('kubejs:bridge/wirecoil_steel')

  // Контроллер AE2: + пустотный сплав
  event.remove({ id: 'ae2:network/blocks/controller' })
  event.shaped('ae2:controller', ['aba', 'vcv', 'aba'], {
    a: 'ae2:smooth_sky_stone_block', b: 'ae2:fluix_crystal', c: 'ae2:engineering_processor', v: 'kubejs:void_alloy'
  }).id('kubejs:bridge/ae2_controller')

  // Вход в Mekanism требует электромотор TFMG (печь → мотор)
  event.remove({ id: 'mekanism:metallurgic_infuser' })
  event.shaped('mekanism:metallurgic_infuser', ['IMI', 'ROR', 'IMI'], {
    I: '#c:ingots/iron', M: 'tfmg:electric_motor', R: '#c:dusts/redstone', O: '#c:ingots/osmium'
  }).id('kubejs:bridge/metallurgic_infuser')

  // Топливная сборка реактора: + звёздный стержень
  event.remove({ id: 'mekanismgenerators:fission_reactor/fuel_assembly' })
  event.shaped('mekanismgenerators:fission_fuel_assembly', ['ISI', 'RTR', 'ISI'], {
    I: '#c:ingots/lead', S: '#c:ingots/steel', R: 'kubejs:star_rod', T: 'mekanism:basic_chemical_tank'
  }).id('kubejs:bridge/fuel_assembly')

  // Починка: рецепт Dimensional Drive (Northstar-Aeronautics) ссылается на несуществующий northstar:computer_chip
  event.remove({ id: 'cnbridge:dimensional_drive' })
  event.shaped('cnbridge:dimensional_drive', ['SPS', 'PCP', 'SPS'], {
    S: 'northstar:titanium_ingot', P: 'create:precision_mechanism', C: 'northstar:advanced_circuit'
  }).id('kubejs:fix/dimensional_drive')

  // Ракетный двигатель Northstar: + метеоритная сталь
  event.remove({ id: 'northstar:crafting/rocket_thruster' })
  event.shaped('northstar:rocket_thruster', ['TCT', 'TPT', 'M M'], {
    T: '#c:plates/titanium', C: 'northstar:rocket_combustion_chamber', P: 'create:propeller', M: 'kubejs:meteor_steel'
  }).id('kubejs:bridge/rocket_thruster')
})
