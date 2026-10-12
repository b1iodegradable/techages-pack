// Руды, измерения, структуры, мобы и лут по эпохам (AStages).

const bs = id => Block.getBlock(id).defaultBlockState()
const STONE = 'minecraft:stone'
const DEEP = 'minecraft:deepslate'

// ---------- Руды: до стадии выглядят и добываются как порода ----------
const ore = (stage, id, rock) =>
  AStages.addRestrictionForOre(`mp/ore/${id.replace(':', '/')}`, stage, bs(id), bs(rock))
    .matchAllBlockStates()
    .affectPlayerActions()

const ORES = {
  age_1: [
    ['create:zinc_ore', STONE], ['create:deepslate_zinc_ore', DEEP],
    ['minecraft:gold_ore', STONE], ['minecraft:deepslate_gold_ore', DEEP],
    ['minecraft:redstone_ore', STONE], ['minecraft:deepslate_redstone_ore', DEEP]
  ],
  age_2: [
    ['minecraft:lapis_ore', STONE], ['minecraft:deepslate_lapis_ore', DEEP],
    ['minecraft:diamond_ore', STONE], ['minecraft:deepslate_diamond_ore', DEEP],
    ['minecraft:emerald_ore', STONE], ['minecraft:deepslate_emerald_ore', DEEP]
  ],
  age_3: [
    ['tfmg:lead_ore', STONE], ['tfmg:deepslate_lead_ore', DEEP],
    ['tfmg:nickel_ore', STONE], ['tfmg:deepslate_nickel_ore', DEEP],
    ['tfmg:lithium_ore', STONE], ['tfmg:deepslate_lithium_ore', DEEP],
    ['immersiveengineering:ore_aluminum', STONE], ['immersiveengineering:deepslate_ore_aluminum', DEEP],
    ['immersiveengineering:ore_silver', STONE], ['immersiveengineering:deepslate_ore_silver', DEEP],
    ['occultism:silver_ore', STONE], ['occultism:silver_ore_deepslate', DEEP],
    ['malum:soulstone_ore', STONE], ['malum:deepslate_soulstone_ore', DEEP],
    ['irons_spellbooks:mithril_ore', STONE], ['irons_spellbooks:deepslate_mithril_ore', DEEP]
  ],
  age_4: [
    ['mekanism:osmium_ore', STONE], ['mekanism:deepslate_osmium_ore', DEEP],
    ['mekanism:tin_ore', STONE], ['mekanism:deepslate_tin_ore', DEEP],
    ['mekanism:fluorite_ore', STONE], ['mekanism:deepslate_fluorite_ore', DEEP],
    ['minecraft:ancient_debris', 'minecraft:netherrack']
  ],
  age_5: [
    ['mekanism:uranium_ore', STONE], ['mekanism:deepslate_uranium_ore', DEEP],
    ['immersiveengineering:ore_uranium', STONE], ['immersiveengineering:deepslate_ore_uranium', DEEP]
  ]
}
Object.keys(ORES).forEach(stage => ORES[stage].forEach(([id, rock]) => ore(stage, id, rock)))
// Дубли руд (свинец/никель IE и Mekanism) отключаются в генерации мира конфигами (этап 7),
// поэтому здесь не закрываются.

// ---------- Измерения ----------
const dim = (stage, id) => AStages.addRestrictionForDimension(`mp/dim/${id.replace(':', '/')}`, stage, id)
dim('age_2', 'minecraft:the_nether')
dim('age_5', 'minecraft:the_end')
dim('age_6', 'northstar:earth_orbit')
dim('age_6', 'northstar:moon')
;['northstar:mars', 'northstar:mars_orbit', 'northstar:venus', 'northstar:venus_orbit',
  'northstar:mercury', 'northstar:mercury_orbit', 'deeperdarker:otherside'].forEach(d => dim('age_7', d))

// ---------- Структуры боссов: невидимый барьер до стадии ----------
const struct = (stage, id) => AStages.addRestrictionForStructure(`mp/struct/${id.replace(':', '/')}`, stage, id).denyEnter()
struct('age_2', 'cataclysm:cursed_pyramid')   // Ancient Remnant
struct('age_3', 'cataclysm:sunken_city')      // Leviathan (врата)
struct('age_3', 'cataclysm:acropolis')        // Scylla
struct('age_4', 'cataclysm:ancient_factory')  // Harbinger (врата)
struct('age_4', 'cataclysm:soul_black_smith') // Netherite Monstrosity
struct('age_4', 'minecraft:bastion_remnant')
struct('age_5', 'cataclysm:burning_arena')    // Ignis
struct('age_5', 'cataclysm:frosted_prison')   // Maledictus
struct('age_5', 'cataclysm:ruined_citadel')   // Ender Guardian
struct('age_7', 'deeperdarker:ancient_temple')

// ---------- Мобы (основная часть — In Control, этап 7) ----------
AStages.addRestrictionForMob('mp/mob/witch', 'age_2', 'minecraft:witch')
AStages.addRestrictionForMob('mp/mob/phantom', 'age_3', 'minecraft:phantom')

// ---------- Лут ----------
AStages.addRestrictionForLoot('mp/loot/artifacts', 'age_2').applyEverywhere().restrictMods(['artifacts'])
AStages.addRestrictionForLoot('mp/loot/scrolls', 'age_2').applyEverywhere().restrictItems(['irons_spellbooks:scroll'])
// Сильные артефакты — только с эпохи V
AStages.addRestrictionForLoot('mp/loot/artifacts_strong', 'age_5').applyEverywhere().restrictItems([
  'artifacts:cloud_in_a_bottle', 'artifacts:helium_flamingo', 'artifacts:warp_drive',
  'artifacts:chorus_totem', 'artifacts:crystal_heart', 'artifacts:vampiric_glove', 'artifacts:eternal_steak'
])
