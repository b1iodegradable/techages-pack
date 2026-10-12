// Стадии: заголовки при открытии и цепочки авто-выдачи.
// Все стадии выдаются СЕРВЕРУ (одна команда): квест → награда AStages «server add».

const AGE_TITLES = {
  age_1: ['Эпоха I', 'Кинетическая — вращение'],
  age_2: ['Эпоха II', 'Паровая — пар и небо'],
  age_3: ['Эпоха III', 'Электрическая — ток'],
  age_4: ['Эпоха IV', 'Индустриальная — завод'],
  age_5: ['Эпоха V', 'Высокие технологии — атом'],
  age_6: ['Эпоха VI', 'Космическая — звёзды'],
  age_7: ['Эпоха VII', 'Эндгейм открыт'],
  tier_creative: ['Творение', 'Рецепты творческих предметов открыты'],
  tier_infinity: ['Бесконечность', 'Катализатор бесконечности доступен']
}

Object.keys(AGE_TITLES).filter(s => s != 'age_3').forEach(stage => {
  const [title, sub] = AGE_TITLES[stage]
  AStages.customizeStage(stage)
    .serverOnly()
    .titleOnAdd(s => Component.literal(title).gold())
    .subTitleOnAdd(s => Component.literal(sub).yellow())
    .stay(80)
})

// Мини-карта открывается сама при входе в эпоху III (если не взяли жетоном раньше).
AStages.customizeStage('age_3')
  .serverOnly()
  .titleOnAdd(s => Component.literal('Эпоха III').gold())
  .subTitleOnAdd(s => Component.literal('Электрическая — ток').yellow())
  .stay(80)
  .whenGranted(e => {
    if (e.isClientSide()) return
    if (!AStages.serverHasStage('qol_minimap')) AStages.addStageToServer('qol_minimap', false, true, false)
  })

// Стадии удобств (qol_*) настраиваются в systems/30_qol.js
