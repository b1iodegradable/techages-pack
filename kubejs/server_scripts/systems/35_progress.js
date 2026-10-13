// Экран достижений (клавиша L): выдача по стадиям сервера и вместе со служебными достижениями.
// Сгенерировано tools/gen_advancements.py — правьте генератор, а не этот файл.
const PROGRESS = {
  "age_1": [
    "kubejs:progress/age_1",
    "kubejs:age1/root"
  ],
  "qol_coords": [
    "kubejs:progress/qol_coords"
  ],
  "age_2": [
    "kubejs:progress/age_2",
    "kubejs:age2/root"
  ],
  "qol_worldmap": [
    "kubejs:progress/qol_worldmap"
  ],
  "qol_minimap": [
    "kubejs:progress/qol_minimap"
  ],
  "age_3": [
    "kubejs:progress/age_3",
    "kubejs:age3/root"
  ],
  "age_4": [
    "kubejs:progress/age_4",
    "kubejs:age4/root"
  ],
  "age_5": [
    "kubejs:progress/age_5",
    "kubejs:age5/root"
  ],
  "age_6": [
    "kubejs:progress/age_6",
    "kubejs:age6/root"
  ],
  "age_7": [
    "kubejs:progress/age_7",
    "kubejs:age7/root"
  ],
  "tier_creative": [
    "kubejs:progress/tier_creative",
    "kubejs:creative/root"
  ],
  "tier_infinity": [
    "kubejs:progress/tier_infinity"
  ]
}
const GRANT_WITH = {}

const grant = (server, player, id) => server.runCommandSilent(`advancement grant ${player.username} only ${id}`)

const syncProgress = (server, player) => {
  Object.keys(PROGRESS).forEach(stage => {
    if (!AStages.serverHasStage(stage)) return
    PROGRESS[stage].forEach(id => {
      const key = 'mpAdv_' + id  // флаг на каждое достижение: новые узлы выдадутся и старым игрокам
      if (player.persistentData.getBoolean(key)) return
      player.persistentData.putBoolean(key, true)
      grant(server, player, id)
    })
  })
}

// Вызывается из 31_player.js после выдачи служебного достижения (серверные скрипты делят одну область видимости)
const grantWith = (server, player, id) => (GRANT_WITH[id] || []).forEach(a => grant(server, player, a))

// Узлы квестов — зеркало книги FTB Quests: квест выполнен командой → узел выдаётся (и при входе — догоняющая сверка)
const QUEST_ADV = {
  "63218B9C209774D5": "kubejs:age0/a0_flint",
  "683C8603707F7198": "kubejs:age0/a0_pick",
  "3EF866930101D06B": "kubejs:age0/a0_brick",
  "1250C0885E2A257C": "kubejs:age0/a0_furnace",
  "6316864EC8EB7FFC": "kubejs:age0/a0_copper",
  "42CE24D6E9D824B8": "kubejs:age0/a0_shelter",
  "056542D142A48930": "kubejs:age0/a0_gate",
  "28DDB582213C855C": "kubejs:age0/a0_map",
  "3FBAF5215555E2F8": "kubejs:age0/a0_torch",
  "77A8541FF4AB46CB": "kubejs:age0/a0_bed",
  "0D6AFB2ECCE68B22": "kubejs:age0/a0_shield",
  "746DDC0461D24231": "kubejs:age0/a0_food",
  "338E03F0BBCA8A64": "kubejs:age0/a0_bear",
  "53C5550D2A090DC4": "kubejs:age1/a1_alloy",
  "604BB5E28DCB9917": "kubejs:age1/a1_shaft",
  "75D3B6887BBA35AA": "kubejs:age1/a1_wheel",
  "3588727C7705FE28": "kubejs:age1/a1_mill",
  "67366363048EDA7F": "kubejs:age1/a1_press",
  "591FA0CB7CA99152": "kubejs:age1/a1_mixer",
  "5D87352D958C477D": "kubejs:age1/a1_source",
  "394EBF0E72F1A4D3": "kubejs:age1/a1_nav",
  "3E36B417FE8AD30F": "kubejs:age1/a1_gate",
  "2C8B98A1E6709C97": "kubejs:age1/a1_wrench",
  "4237869795C32BB8": "kubejs:age1/a1_goggles",
  "5713B65EBE846724": "kubejs:age1/a1_bigwheel",
  "5497594180D84894": "kubejs:age1/a1_windmill",
  "46777F81E3A752A5": "kubejs:age1/a1_zinc",
  "76D0771F13A36589": "kubejs:age1/a1_vault",
  "4E0D56A2F9D28A18": "kubejs:age1/a1_tank",
  "65B003A206CB4B67": "kubejs:age1/a1_tube",
  "0269B36B49C4CDEC": "kubejs:age1/a1_pickup",
  "095E43EC4DA4B190": "kubejs:age1/a1_wrought_find",
  "15F45A021A0E416E": "kubejs:age1/a1_wrought",
  "0B9FDA4CFD3E7448": "kubejs:age2/a2_nether",
  "7CCD1D47B7E0A585": "kubejs:age2/a2_blaze",
  "12B87730F57F7587": "kubejs:age2/a2_burner",
  "47FE75B6CF9F39CE": "kubejs:age2/a2_brass",
  "1C740651DCA06687": "kubejs:age2/a2_casing",
  "4F76084FF68AC48E": "kubejs:age2/a2_quartz",
  "7F0FFC71B3CF1931": "kubejs:age2/a2_engine",
  "6F083F457527FCC6": "kubejs:age2/a2_crush",
  "279077F5221E2ACB": "kubejs:age2/a2_deployer",
  "7A0516CBFCFE8C9D": "kubejs:age2/a2_precision",
  "225474F448E5211C": "kubejs:age2/a2_track",
  "0A9F4516AA2A44CC": "kubejs:age2/a2_schedule",
  "3F04B655DE8D533F": "kubejs:age2/a2_bearing",
  "5363FC4877DC2513": "kubejs:age2/a2_envelope",
  "29E8E0E2B20525A4": "kubejs:age2/a2_flight",
  "0867B6510DE491A5": "kubejs:age2/a2_gate",
  "6B36131FA3DEE6CF": "kubejs:age2/a2_whistle",
  "0A2CD00D18E526B8": "kubejs:age2/a2_crafter",
  "77834E77A9CD569E": "kubejs:age2/a2_packager",
  "4215F3A5C738A34E": "kubejs:age2/a2_propeller",
  "5695CD4D26F36E05": "kubejs:age2/a2_levitite",
  "149CC5315EFBEAE0": "kubejs:age2/a2_magnet",
  "5F2B4B9441E2BC21": "kubejs:age2/a2_iron_pack",
  "31003B4603337E1D": "kubejs:age2/a2_scroll",
  "1771E0A32DD60951": "kubejs:age2/a2_pyramid",
  "43A802642C5F47C3": "kubejs:age2/a2_remnant",
  "4852F8A61E1B7E4C": "kubejs:age3/a3_coke",
  "4767B72407F94CA5": "kubejs:age3/a3_castiron",
  "7C1A2F5C2C286F96": "kubejs:age3/a3_stove",
  "4567FD50DA89B654": "kubejs:age3/a3_steel",
  "5B1A7E4B5D28AE47": "kubejs:age3/a3_mech",
  "2A1CC8A305A2E1D5": "kubejs:age3/a3_alt",
  "709C03C734B7A1B0": "kubejs:age3/a3_gen",
  "7C0C7039A0EA56FB": "kubejs:age3/a3_acc",
  "3B9C16179B1ED68A": "kubejs:age3/a3_wire",
  "1CFAF632987E17F8": "kubejs:age3/a3_pump",
  "08625B72A874FD08": "kubejs:age3/a3_oil",
  "42B63A494AC8C815": "kubejs:age3/a3_ether",
  "2A249D668324931A": "kubejs:age3/a3_distill",
  "43A8E8E15D9EBB3C": "kubejs:age3/a3_diesel",
  "141815A882E7662D": "kubejs:age3/a3_sunken",
  "3D62A882C04F037A": "kubejs:age3/a3_leviathan",
  "1FD68E86980F3BFE": "kubejs:age3/a3_gate",
  "4B6C2D37B84BA9A9": "kubejs:age3/a3_lead",
  "2485E970843DB750": "kubejs:age3/a3_alu",
  "42B6B8C37B4A68EC": "kubejs:age3/a3_plastic",
  "5A4ECD8828DA2A04": "kubejs:age3/a3_motor",
  "3F320BAF77CE303C": "kubejs:age3/a3_tesla",
  "5B0BA5650BFE13A6": "kubejs:age3/a3_spirit",
  "69713AE143D8FB96": "kubejs:age3/a3_altar",
  "598DF4CB6F1098A6": "kubejs:age3/a3_soulsteel",
  "32461CE15AD79934": "kubejs:age3/a3_insul",
  "0A0DED83469642A1": "kubejs:age3/a3_hv",
  "5EFB6184F4C753B5": "kubejs:age3/a3_inscription",
  "5D63EEBAB87A0FA3": "kubejs:age3/a3_acropolis",
  "739ECE10EC822615": "kubejs:age3/a3_scylla",
  "1EE38E0E89C1481C": "kubejs:age4/a4_infuser",
  "66369229657C4590": "kubejs:age4/a4_alloy",
  "0B4134BA93E67D71": "kubejs:age4/a4_casing",
  "3E4FA200B48968AC": "kubejs:age4/a4_gas",
  "2C52C2A03F4E4BEE": "kubejs:age4/a4_cube",
  "563E8999A7B7EBBA": "kubejs:age4/a4_ore",
  "53EA1CBB237F4961": "kubejs:age4/a4_meteor",
  "66FEF45A935B2286": "kubejs:age4/a4_certus",
  "286B623AAD67BE1A": "kubejs:age4/a4_inscriber",
  "2B428711844D652B": "kubejs:age4/a4_proc",
  "28D3F5A790A76AEE": "kubejs:age4/a4_void",
  "59B00852734CEEC9": "kubejs:age4/a4_controller",
  "5E86E7D4C9290119": "kubejs:age4/a4_factory",
  "2AF5B3702333E815": "kubejs:age4/a4_harbinger",
  "04DD37D30551F247": "kubejs:age4/a4_gate",
  "1A44CBBE398F16E9": "kubejs:age4/a4_netherite",
  "09A2B39524717C03": "kubejs:age4/a4_wireless",
  "2392E37618050D7D": "kubejs:age4/a4_teleport",
  "4818375B5630C344": "kubejs:age4/a4_table",
  "2ACB7732F1BA0826": "kubejs:age4/a4_diamond_pack",
  "428A440B84D5ED13": "kubejs:age4/a4_smith",
  "0823F723F8B4C2A0": "kubejs:age4/a4_monstrosity",
  "4FD012CA3291B46A": "kubejs:age4/a4_wither",
  "6AFD844B7528D3E5": "kubejs:age5/a5_atomic",
  "18A06E28F6643C3C": "kubejs:age5/a5_rod",
  "44115FF4B33ABA48": "kubejs:age5/a5_casing",
  "3E38F36E0B3C649C": "kubejs:age5/a5_fuel",
  "04F3BD55CDBCFC00": "kubejs:age5/a5_turbine",
  "2932F52F3B800DA4": "kubejs:age5/a5_end",
  "610F135E925CF690": "kubejs:age5/a5_dragon",
  "729EC6A284E2EA46": "kubejs:age5/a5_gate",
  "46F3E5C74AB4B8FB": "kubejs:age5/a5_solar",
  "29357C679F735022": "kubejs:age5/a5_induction",
  "72BDF3E36D8D0031": "kubejs:age5/a5_arena",
  "7D667C474F0EF467": "kubejs:age5/a5_ignis",
  "6BD57171D98248C6": "kubejs:age5/a5_prison",
  "6D09DCBB0587E98D": "kubejs:age5/a5_maledictus",
  "17D9A0AEF88479DC": "kubejs:age5/a5_citadel",
  "3F6FAE1529C6B676": "kubejs:age5/a5_guardian",
  "44113D3A02B5152B": "kubejs:age6/a6_ti",
  "45D39C7B7CB85BE1": "kubejs:age6/a6_astro",
  "2F0A4F4EC76359D6": "kubejs:age6/a6_comp",
  "206C47BB306261B2": "kubejs:age6/a6_frag",
  "7EC72A629C3D3659": "kubejs:age6/a6_msteel",
  "7D6842FE5D70DB31": "kubejs:age6/a6_thruster",
  "5C6AEA2C99294642": "kubejs:age6/a6_station",
  "768E4759FECE6608": "kubejs:age6/a6_oxygen",
  "153BEF9E400472A9": "kubejs:age6/a6_moon",
  "478614A8C014DF2C": "kubejs:age6/a6_sealer",
  "5AB57833E9854CBF": "kubejs:age6/a6_base",
  "6CCFCC619E7CE6C4": "kubejs:age7/s_start",
  "4E10D0DBC119C2E7": "kubejs:age7/s_table",
  "1B49287462220378": "kubejs:age7/s_chrono",
  "42C20F6554B93BA7": "kubejs:age7/s_k2",
  "1A7B4109BF9FF3DA": "kubejs:age7/s_s2",
  "1015EFEF8D5036FB": "kubejs:age7/s_c2",
  "1DAB982FA7CB8336": "kubejs:age7/s_petro",
  "6B5D35D4136E556F": "kubejs:age7/s_l2",
  "14E56B2569AC7A0B": "kubejs:age7/s_fusion_ctrl",
  "1ABD077A5110648E": "kubejs:age7/s_fusion",
  "7E208F521CCD8F6D": "kubejs:age7/s_sps",
  "678A31294E440074": "kubejs:age7/s_anti",
  "6B8A8B0EE4DF992D": "kubejs:age7/s_mars",
  "202989790D0B6201": "kubejs:age7/s_venus",
  "4CD7140C71299F67": "kubejs:age7/s_mercury",
  "6515083EDC5A034D": "kubejs:age7/s_alien",
  "0140E2A09AE446B2": "kubejs:age7/s_soul",
  "7EC277641C30E674": "kubejs:age7/s_steel",
  "5CCCD6F7261632D0": "kubejs:age7/s_star",
  "72CFDB8F94AF6B77": "kubejs:age7/s_final",
  "2C56BACA0C2A4A79": "kubejs:age7/w_seal",
  "42F03C857C0E4F50": "kubejs:age7/w_ess",
  "1A8D3B8C7017A922": "kubejs:age7/w_hunt_ignis",
  "3576DCA2C5ED48E3": "kubejs:age7/w_hunt_harb",
  "6465E733336A772F": "kubejs:age7/w_hunt_lev",
  "54C2FB6213106E8B": "kubejs:age7/w_hunt_guard",
  "7505C5E51928C9DA": "kubejs:age7/o_city",
  "7E45865DE035B36A": "kubejs:age7/o_dim",
  "06C60F6C23DBEA13": "kubejs:age7/o_temple",
  "34C59E741DB2F66A": "kubejs:age7/o_warden",
  "2E21EECBAAF3E693": "kubejs:creative/c_start",
  "45BF5B98D39C402B": "kubejs:creative/c_comp",
  "1B214E66F30A70E5": "kubejs:creative/c_ultimate",
  "28BF3B817CA2D08C": "kubejs:creative/c_0",
  "29E22FF9149E88D3": "kubejs:creative/c_1",
  "7D2D8894F7A549F5": "kubejs:creative/c_2",
  "501EE27DFEF28408": "kubejs:creative/c_3",
  "3E64408A7DCDAAA3": "kubejs:creative/c_4",
  "4A3E82A1707A7A72": "kubejs:creative/c_5",
  "3BF849AFA7CCD682": "kubejs:creative/c_6",
  "079AD942791BDAA8": "kubejs:creative/c_7",
  "05F2E2245694EC0C": "kubejs:creative/c_8",
  "6BCE489ACC16411B": "kubejs:creative/c_9",
  "19570F5088CD1F3C": "kubejs:creative/c_10",
  "7D53095AFAFCF4B7": "kubejs:creative/c_11",
  "129ABD23BC45C0FB": "kubejs:creative/c_12",
  "512389C1D4360629": "kubejs:creative/c_13",
  "1263388F57C88851": "kubejs:creative/c_14",
  "1518C0F4BD1F2F86": "kubejs:creative/c_all",
  "754F38468BB3D0D9": "kubejs:creative/i_cat",
  "0CEFC822C8AB3DAC": "kubejs:creative/i_ingot",
  "5BEFD2CDB57C29E3": "kubejs:creative/i_sword",
  "348AB759CB6B11B6": "kubejs:creative/i_pick",
  "0F4466F769E8240E": "kubejs:creative/i_armor"
}

const syncQuests = (server, player) => {
  let data
  try { data = FTBQuests.getServerDataFromPlayer(player) } catch (err) { return }
  if (!data) return
  Object.keys(QUEST_ADV).forEach(qid => {
    if (data.isCompleted(qid)) grant(server, player, QUEST_ADV[qid])
  })
}

FTBQuestsEvents.completed(e => {
  const adv = QUEST_ADV[String(e.object).toUpperCase()]
  if (!adv) return
  e.onlineMembers.forEach(p => grant(e.server, p, adv))
})

// Одноразово: отозвать узлы «найти структуру», засчитанные в 0.9.3 из-за ошибки в условии
const STRUCT_FIX = ["kubejs:age1/a1_wrought_find", "kubejs:age2/a2_pyramid", "kubejs:age3/a3_sunken", "kubejs:age3/a3_acropolis", "kubejs:age4/a4_meteor", "kubejs:age4/a4_factory", "kubejs:age4/a4_smith", "kubejs:age5/a5_arena", "kubejs:age5/a5_prison", "kubejs:age5/a5_citadel", "kubejs:age6/a6_base", "kubejs:age7/o_city", "kubejs:age7/o_temple"]

PlayerEvents.loggedIn(e => {
  const pl = e.player
  if (!pl.persistentData.getBoolean('mpFixStruct')) {
    pl.persistentData.putBoolean('mpFixStruct', true)
    STRUCT_FIX.forEach(id => e.server.runCommandSilent(`advancement revoke ${pl.username} only ${id}`))
  }
  if (!pl.persistentData.getBoolean('mpQuestMirror')) {  // 0.9.5: узлы квестов были со своими условиями — сбросить и выдать по книге
    pl.persistentData.putBoolean('mpQuestMirror', true)
    Object.keys(QUEST_ADV).forEach(q => e.server.runCommandSilent(`advancement revoke ${pl.username} only ${QUEST_ADV[q]}`))
  }
  syncProgress(e.server, pl)
  syncQuests(e.server, pl)
})

ServerEvents.tick(e => {
  if (e.server.tickCount % 100 != 0) return
  e.server.players.forEach(p => syncProgress(e.server, p))
})
