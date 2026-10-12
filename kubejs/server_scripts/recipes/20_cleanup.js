// Удаление обходов и урезание раннего старта.

ServerEvents.recipes(event => {
  // --- Эпоха 0: без деревянных инструментов, сразу кремень ---
  ;['wooden_pickaxe', 'wooden_axe', 'wooden_shovel', 'wooden_hoe', 'wooden_sword']
    .forEach(t => event.remove({ output: `minecraft:${t}` }))

  event.shaped('minecraft:stone_pickaxe', ['FFF', ' S ', ' S '], { F: 'minecraft:flint', S: '#c:rods/wooden' }).id('kubejs:flint_pickaxe')
  event.shaped('minecraft:stone_axe', ['FF', 'FS', ' S'], { F: 'minecraft:flint', S: '#c:rods/wooden' }).id('kubejs:flint_axe')
  event.shaped('minecraft:stone_shovel', ['F', 'S', 'S'], { F: 'minecraft:flint', S: '#c:rods/wooden' }).id('kubejs:flint_shovel')
  event.shaped('minecraft:stone_sword', ['F', 'F', 'S'], { F: 'minecraft:flint', S: '#c:rods/wooden' }).id('kubejs:flint_sword')

  // Печь — из обожжённого кирпича (сначала костёр/обжиг глины)
  event.remove({ output: 'minecraft:furnace' })
  event.shaped('minecraft:furnace', ['BBB', 'B B', 'BBB'], { B: 'minecraft:brick' }).id('kubejs:brick_furnace')

  // Медь с поверхности: самородки из гравия (просеивание руками — Create появится позже)
  event.shapeless('2x minecraft:raw_copper', ['4x minecraft:gravel', 'minecraft:flint']).id('kubejs:gravel_copper')

  // --- Дешёвая энергия ---
  // Солнечные/ветряки Mekanism закрыты стадией age_5 (11_items.js); Mekanism-ветряк остаётся тяжёлым по рецепту.

  // --- Унификация стали: основной путь — TFMG; Almost Unified сводит слитки в один предмет ---
  // Доменная/дуговая печь IE закрыты до age_4 (13_machines.js).

  // --- Бесконечное улучшение рюкзака: только как творческий предмет (22_endgame.js) ---
  event.remove({ output: 'sophisticatedbackpacks:survival_infinity_upgrade' })
  event.remove({ output: 'sophisticatedbackpacks:infinity_upgrade' })

  // --- Катализатор бесконечности: свой рецепт (22_endgame.js) ---
  event.remove({ output: 'avaritia:infinity_catalyst' })
})
