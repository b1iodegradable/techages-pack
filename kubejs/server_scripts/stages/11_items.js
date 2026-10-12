// Закрытие предметов по эпохам (AStages).
// Профиль: предмет можно подобрать и хранить (лут не пропадает), но нельзя
// использовать, ставить, экипировать и крафтить до нужной стадии.
// Если на предмет действуют два ограничения (мод + конкретный предмет) — нужны обе стадии.

const LOCK = AStages.createPresetFor(ABaseItemRestriction)
  .apply(r => r.allowPickup().allowInventoryStorage().allowContainerStorage())

const lockMod = (stage, modid, ignore) => {
  let r = AStages.addRestrictionForMod(`mp/${stage}/mod/${modid}`, stage, modid).withPreset(LOCK)
  if (ignore && ignore.length) r.ignoreItems(ignore) // JS-массив → varargs String...
  return r
}
const lockItems = (stage, key, items) =>
  AStages.addRestrictionForItem(`mp/${stage}/items/${key}`, stage, items).withPreset(LOCK)

// ---------- Эпоха 0: рюкзак — награда за убежище (свой стейдж квеста не нужен: выдаётся предметом) ----------

// ---------- Эпоха 1 ----------
lockMod('age_1', 'create')
lockMod('age_1', 'copycats')
lockMod('age_1', 'create_connected')
lockMod('age_1', 'createdeco')
lockMod('age_1', 'ars_nouveau')
lockMod('age_1', 'ars_creo')
lockItems('age_1', 'navigator', ['kubejs:navigator'])

// ---------- Эпоха 2 ----------
lockItems('age_2', 'create_brass', [
  'create:brass_ingot', 'create:brass_nugget', 'create:brass_sheet', 'create:brass_block',
  'create:brass_casing', 'create:brass_hand', 'create:steam_engine', 'create:steam_whistle',
  'create:blaze_burner', 'create:track', 'create:track_station', 'create:track_signal',
  'create:schedule', 'create:packager', 'create:propeller'
])
lockMod('age_2', 'aeronautics')
lockMod('age_2', 'simulated')
lockMod('age_2', 'offroad')
lockMod('age_2', 'railways')
lockMod('age_2', 'createbigcannons')
lockItems('age_2', 'backpack_upgrades', [
  'sophisticatedbackpacks:magnet_upgrade', 'sophisticatedbackpacks:advanced_magnet_upgrade',
  'sophisticatedbackpacks:iron_backpack', 'sophisticatedbackpacks:gold_backpack'
])

// ---------- Эпоха 3 ----------
lockMod('age_3', 'tfmg')
lockMod('age_3', 'createaddition')
lockMod('age_3', 'immersiveengineering')
lockMod('age_3', 'pipez')
lockMod('age_3', 'occultism')
lockMod('age_3', 'malum')
lockMod('age_3', 'irons_spellbooks', ['irons_spellbooks:scroll']) // свитки из лута — с эпохи II
lockMod('age_3', 'create_enchantment_industry')
lockMod('age_3', 'create_jetpack')
lockItems('age_3', 'backpacks', ['sophisticatedbackpacks:diamond_backpack'])

// ---------- Эпоха 4 ----------
lockMod('age_4', 'mekanism')
lockMod('age_4', 'mekanismgenerators')
lockMod('age_4', 'ae2')
lockMod('age_4', 'ae2wtlib')
lockMod('age_4', 'modularrouters')
lockMod('age_4', 'extendedcrafting')
// Сталь до эпохи IV — только TFMG: блоки доменной печи IE закрыты (типов IE в RMS нет)
lockItems('age_4', 'ie_blast_furnace', ['immersiveengineering:blastbrick', 'immersiveengineering:blastbrick_reinforced'])
lockItems('age_4', 'netherite', ['minecraft:netherite_ingot', 'minecraft:netherite_scrap', 'minecraft:ancient_debris'])
lockItems('age_4', 'backpacks', ['sophisticatedbackpacks:netherite_backpack'])

// ---------- Эпоха 5 ----------
lockItems('age_5', 'fission', [
  'mekanismgenerators:fission_reactor_casing', 'mekanismgenerators:fission_reactor_port',
  'mekanismgenerators:fission_reactor_logic_adapter', 'mekanismgenerators:fission_fuel_assembly',
  'mekanismgenerators:turbine_casing', 'mekanismgenerators:turbine_rotor', 'mekanismgenerators:turbine_blade',
  'mekanismgenerators:turbine_valve', 'mekanismgenerators:turbine_vent',
  'mekanismgenerators:solar_generator', 'mekanismgenerators:advanced_solar_generator', 'mekanismgenerators:wind_generator'
])
lockItems('age_5', 'occultism_miners', [
  'occultism:dimensional_mineshaft', 'occultism:miner_foliot_unspecialized', 'occultism:miner_djinni_ores',
  'occultism:miner_afrit_deeps', 'occultism:miner_marid_master', 'occultism:miner_ancient_eldritch'
])
// Astral Sorcery (альфа) — подключается, только если мод стоит в паке
if (Platform.isLoaded('astralsorcery')) lockMod('age_5', 'astralsorcery')

// ---------- Эпоха 6 ----------
lockMod('age_6', 'northstar')
lockMod('age_6', 'cnbridge')

// ---------- Эпоха 7 (эндгейм) ----------
lockItems('age_7', 'endgame_mek', [
  'mekanismgenerators:fusion_reactor_controller', 'mekanismgenerators:fusion_reactor_frame',
  'mekanismgenerators:fusion_reactor_port', 'mekanismgenerators:fusion_reactor_logic_adapter',
  'mekanism:sps_casing', 'mekanism:sps_port', 'mekanism:pellet_antimatter', 'mekanism:antiprotonic_nucleosynthesizer'
])
lockItems('age_7', 'endgame_ec', ['extendedcrafting:ultimate_table', 'extendedcrafting:ultimate_auto_table', 'extendedcrafting:compressor'])
lockItems('age_7', 'awakening', ['kubejs:awakening_seal'])

// ---------- Тиры эндгейма ----------
lockMod('tier_infinity', 'avaritia')
