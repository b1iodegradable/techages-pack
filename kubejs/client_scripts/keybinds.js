// Раскладка клавиш TechAges для модов (ванильные клавиши Minecraft не трогаем).
// Меняем только привязки, которые у игрока стоят «по умолчанию мода» (isDefault): после правки привязка
// перестаёт быть дефолтной, поэтому повторно ничего не применяется, а ручные настройки игрока не затираются.
// Логика раскладки:
//   левая рука (на ходу): R/V — магия Iron's; C/X — действие предмета в руке; Z/G/Y — способность шлема/нагрудника
//     (джетпаки)/ботинок; H — зависание джетпака; B — рюкзак;
//   правая рука (в покое): K — квесты, M — карта, U — метки, N — новая метка, J — Curios, I — терминал AE2,
//     O — голосовой чат, . — крупная мини-карта, Ё — микрофон;
//   редкое — Alt+клавиша; ненужное и дубли — без клавиши ('').
// Клавиши «предмет в руке» и «слот брони» общие для разных модов: в руке/слоте одновременно только один предмет.
const $InputConstants = Java.loadClass('com.mojang.blaze3d.platform.InputConstants')
const $KeyMapping = Java.loadClass('net.minecraft.client.KeyMapping')
const $KeyModifier = Java.loadClass('net.neoforged.neoforge.client.settings.KeyModifier')

const KEY_LAYOUT = {
  // --- меню
  'key.ftbquests.quests': 'k',                       // у FTB Quests по умолчанию пусто
  'key.kubejs.kubedex': '',                          // отладка KubeJS, игрокам не нужна (была на K)
  'gui.xaero_new_waypoint': 'n',                     // было B (рюкзак)
  'gui.xaero_minimap_settings': 'alt+m',             // было Y
  'gui.xaero_enlarge_map': 'period',                 // было Z
  'key.curios.open.desc': 'j',                       // было G
  'key.ae2.wireless_terminal': 'i',                  // было пусто
  'key.occultism.storage_remote': 'alt+i',           // было N
  'key.occultism.backpack': 'alt+b',                 // было B
  'key.occultism.ender_bag': 'alt+v',                // было V
  'key.voice_chat': 'o',                             // было V
  'key.voice_chat_group': 'alt+o',                   // было G
  'key.mute_microphone': 'grave.accent',             // было M (карта)
  'key.disable_voice_chat': 'alt+grave.accent',      // было N
  'key.hide_icons': '',                              // было H
  'key.avaritia.config': '',                         // экран настроек, было O
  'key.avaritia.neutron_ring': 'alt+u',              // было N
  'key.avaritia.filter': 'alt+period',               // было H
  'key.sophisticatedbackpacks.inventory_interaction': 'alt+c', // было C
  'key.mekanism.mode': 'alt+n',                      // было N; режим инструмента ещё и Shift+колесо
  'key.mekanism.key_hud': 'alt+h',                   // было H
  'key.immersiveengineering.magnetEquip': 'alt+s',   // было S — конфликт с «назад»
  'simulated.keyinfo.rotate_mode': 'alt+r',          // было Tab — конфликт со списком игроков
  // --- предмет в руке: C — основное, X — дополнительное
  'key.ars_nouveau.selection_hud': 'x',              // было V (каст Iron's)
  'key.ars_nouveau.next_slot': '',                   // слоты выбираются радиальным меню (X)
  'key.ars_nouveau.previous_slot': '',
  'key.cataclysm.ability': 'x',                      // было V
  'key.deeperdarker.transmit': 'c',                  // было V
  // --- слоты брони: Z — шлем, G — нагрудник/джетпак/элитры, Y — ботинки
  'key.ars_nouveau.head_curio_hotkey': 'z',          // было G
  'key.cataclysm.helmet_ability': 'z',               // было C
  'key.mekanism.head_mode': 'z',                     // было V
  'key.cataclysm.chestplate_ability': 'g',           // было Y
  'key.deeperdarker.boost': 'g',                     // было B
  'key.cataclysm.boots_ability': 'y',                // было V
  'key.mekanism.feet_mode': 'y',                     // было B
  'key.mekanism.legs_mode': ''                       // было J; модули поножей — в «Модульном настройщике» (\)
}

const keyOf = t => {
  if (t === '') return [$KeyModifier.NONE, $InputConstants.UNKNOWN]
  var alt = t.indexOf('alt+') === 0
  return [alt ? $KeyModifier.ALT : $KeyModifier.NONE, $InputConstants.getKey('key.keyboard.' + (alt ? t.substring(4) : t))]
}

var keyLayoutChecked = false
const applyKeyLayout = () => {
  const opts = Client.options
  const all = opts.keyMappings
  var changed = 0
  for (var i = 0; i < all.length; i++) {
    var km = all[i]
    var target = KEY_LAYOUT[String(km.getName())]
    if (target === undefined || !km.isDefault()) continue
    var mk = keyOf(target)
    if (km.getKeyModifier() == mk[0] && String(km.saveString()) == String(mk[1].getName())) continue
    km.setKeyModifierAndCode(mk[0], mk[1])
    changed++
  }
  console.info(`keybinds: изменено ${changed} привязок`)
  if (!changed) return
  $KeyMapping.resetMapping()
  opts.save()
  Client.player.displayClientMessage(Text.gold(`Раскладка TechAges: настроено клавиш — ${changed}. Квесты — K, Curios — J, терминал AE2 — I. Поменять: «Настройки» → «Управление» (есть поиск).`), false)
}

ClientEvents.tick(e => {
  if (keyLayoutChecked || !Client.player) return
  keyLayoutChecked = true
  try { applyKeyLayout() } catch (err) { console.error(`keybinds: ${err}`) }
})
