// Рецепты внутри машин модов по стадиям (SDM Recipe Machine Stages).
// Поддерживаемые типы (проверено по jar 1.2.2): Create (кроме emptying / item_application),
// TFMG, Malum, Iron's Spells, ваниль. Типов IE и Mekanism в моде НЕТ — их машины закрываются
// предметами в 11_items.js (доменная печь IE, нуклеосинтезатор Mekanism).
// Порядок важен: сначала точечные рецепты, потом массовые. Каждый вызов защищён — один сбой не рвёт остальные.

RMSEvents.register(event => {
  const safe = (what, fn) => { try { fn() } catch (e) { console.warn(`RMS: пропущено ${what}: ${e}`) } }

  // --- Точечные ---
  safe('brass', () => event.addRecipe('create:mixing', 'create:mixing/brass_ingot', 'age_2'))

  // --- Рецепты аддонов внутри машин Create ---
  const CREATE_TYPES = ['create:mixing', 'create:compacting', 'create:crushing', 'create:milling', 'create:pressing',
    'create:deploying', 'create:filling', 'create:splashing', 'create:haunting', 'create:cutting',
    'create:sequenced_assembly', 'create:mechanical_crafting', 'create:sandpaper_polishing']
  const ADDON_STAGE = {
    aeronautics: 'age_2', simulated: 'age_2', railways: 'age_2', createbigcannons: 'age_2',
    tfmg: 'age_3', createaddition: 'age_3', create_enchantment_industry: 'age_3', create_jetpack: 'age_3',
    northstar: 'age_6'
  }
  Object.keys(ADDON_STAGE).forEach(mod => CREATE_TYPES.forEach(t =>
    safe(`${t}/${mod}`, () => event.addRecipeByMod(t, mod, ADDON_STAGE[mod]))))

  // --- Машины TFMG целиком (на случай, если блоки появятся раньше стадии) ---
  ;['tfmg:casting', 'tfmg:coking', 'tfmg:distillation', 'tfmg:hot_blast', 'tfmg:industrial_blasting',
    'tfmg:polarizing', 'tfmg:vat_machine_recipe', 'tfmg:winding']
    .forEach(t => safe(t, () => event.addRecipeByMachine(t, 'age_3')))
})
