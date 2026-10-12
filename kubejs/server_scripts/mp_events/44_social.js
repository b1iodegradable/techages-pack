// Ивенты между игроками — экономика и социальное.
// Монеты, магазин, почта, аукцион, контракты, титулы — это функции (без голосования).
// «Тайный Санта» — ивент (через общее согласие).

// ---------- 20. Магазин
const PE_SHOP = [
  ['golden_apple', 'minecraft:golden_apple', 2, 30, 'Золотые яблоки'],
  ['xp', 'minecraft:experience_bottle', 16, 25, 'Пузырьки опыта'],
  ['rockets', 'minecraft:firework_rocket', 32, 20, 'Фейерверки (элитры, ранцы)'],
  ['pearls', 'minecraft:ender_pearl', 8, 20, 'Жемчуг Края'],
  ['food', 'minecraft:cooked_beef', 32, 10, 'Стейки'],
  ['nametag', 'minecraft:name_tag', 1, 15, 'Бирка'],
  ['torches', 'minecraft:torch', 64, 5, 'Факелы'],
  ['token', 'kubejs:cartographer_token', 1, 250, 'Жетон картографа (мини-карта раньше)'],
  ['haste', null, 0, 40, 'Ускоритель: Спешка II на 30 минут'],
  ['speed', null, 0, 30, 'Ускоритель: Скорость II на 30 минут']
]
const peShopBuy = (s, p, id) => {
  const it = PE_SHOP.filter(x => x[0] == id)[0]
  if (!it) { p.tell(Text.red('Нет такого товара. /shop')); return }
  if (peCoinsOf(s, peUid(p)) < it[3]) { p.tell(Text.red(`Нужно ${it[3]} ⚙, у вас ${peCoinsOf(s, peUid(p))}.`)); return }
  peCoins(s, p, -it[3], `покупка: ${it[4]}`)
  if (it[1]) p.give(Item.of(it[1], it[2]))
  else peCmd(s, `effect give ${p.username} minecraft:${id} 1800 1 true`)
}

// ---------- 21. Аукцион (предмет в руке → торги 3 минуты, ставки монетами; предмет на время — в «депозите» почты)
const PE_AUC = { cur: null }   // { seller, sellerUid, item(ItemStack), min, bid, bidder, bidderUid, end }
const peAucEnd = s => {
  const a = PE_AUC.cur; PE_AUC.cur = null
  if (!a) return
  if (a.bidderUid) {
    peGive(s, a.bidderUid, a.item, `Аукцион: вы выиграли лот за ${a.bid} ⚙`)
    peCoinsUid(s, a.sellerUid, a.bid)
    peSay(s, Text.gold(`🔨 Продано ${a.bidder} за ${a.bid} ⚙`))
    s.players.forEach(pl => { if (peUid(pl) == a.sellerUid) pl.tell(Text.yellow(`+${a.bid} ⚙ за лот`)) })
  } else {
    peGive(s, a.sellerUid, a.item, 'Аукцион: ставок не было, лот вернулся')
    peSay(s, Text.gray('🔨 Ставок не было — лот вернулся продавцу.'))
  }
}

// ---------- 23. Контракты: «нужно N штук такого-то предмета за X монет» (монеты заказчика — в депозите)
const peContractPost = (s, p, count, coins) => {
  const st = p.mainHandItem
  if (st.isEmpty()) { p.tell(Text.red('Возьмите в руку образец нужного предмета.')); return }
  if (count < 1 || coins < 1) { p.tell(Text.red('Формат: /contract post <сколько> <монет>')); return }
  if (peCoinsOf(s, peUid(p)) < coins) { p.tell(Text.red('Не хватает монет.')); return }
  const d = peLoad(s)
  const c = { id: d.nextContract++, uid: peUid(p), name: p.username, item: String(st.id), count: count, coins: coins }
  d.contracts.push(c)
  peCoins(s, p, -coins, `контракт №${c.id} в депозите`)
  peSay(s, Text.aqua(`📃 Контракт №${c.id}: ${p.username} покупает ${count} × ${c.item} за ${coins} ⚙ — /contract fill ${c.id}`))
}
const peContractFill = (s, p, id) => {
  const d = peLoad(s), c = d.contracts.filter(x => x.id == id)[0]
  if (!c) { p.tell(Text.red('Нет такого контракта. /contract list')); return }
  if (c.uid == peUid(p)) { p.tell(Text.red('Свой контракт выполнить нельзя.')); return }
  if (peCount(p, c.item) < c.count) { p.tell(Text.red(`Нужно ${c.count} × ${c.item}, у вас ${peCount(p, c.item)}.`)); return }
  peTake(p, c.item, c.count)
  d.contracts = d.contracts.filter(x => x.id != id)
  peSave(s)
  peCoins(s, p, c.coins, `контракт №${c.id}`)
  peGive(s, c.uid, Item.of(c.item, c.count), `Контракт №${c.id} выполнил ${p.username}`)
  peSay(s, Text.aqua(`📃 Контракт №${c.id} выполнен игроком ${p.username}.`))
}

// ---------- 22. Тайный Санта (ивент)
peDef('santa', {
  name: 'Тайный Санта', min: 3, minutes: 30, auto: true,
  desc: 'Каждому тайно достаётся получатель. За 30 минут возьмите подарок в руку и отправьте: /ev do подарок. Получатель узнает только, что подарок пришёл. Дарителям — монеты.',
  start: (s, ev) => {
    const names = peShuffle(ev.players.slice())
    ev.data = { to: {}, toUid: {}, sent: {} }
    names.forEach((n, i) => { const r = names[(i + 1) % names.length]; ev.data.to[n] = r; const rp = peP(s, r); if (rp) ev.data.toUid[n] = peUid(rp) })
    names.forEach(n => { var p = peP(s, n); if (p) p.tell(Text.lightPurple(`🎁 Вы — тайный Санта для ${ev.data.to[n]}. Подарок: в руку и /ev do подарок`)) })
  },
  cmd: (s, p, a, ev) => {
    if (a[0] != 'подарок' && a[0] != 'gift') return false
    const d = ev.data, to = d.to[p.username]
    if (!to) return false
    if (d.sent[p.username]) { p.tell(Text.gray('Вы уже отправили подарок.')); return true }
    const st = p.mainHandItem
    if (st.isEmpty()) { p.tell(Text.red('Возьмите подарок в руку.')); return true }
    const gift = st.copy(); st.setCount(0)
    peMailAdd(s, d.toUid[p.username], gift, '🎁 Подарок от тайного Санты!')
    d.sent[p.username] = true
    peReward(s, p, 20, 2, 'подарок тайного Санты')
    return true
  },
  tick: (s, ev) => peBar(s, `Тайный Санта — подарков ${Object.keys(ev.data.sent).length}/${ev.players.length} · ${peFmt(ev.end - s.tickCount)}`, ev.end - s.tickCount, ev.end - ev.t0),
  finish: (s, ev) => peSay(s, Text.lightPurple(`🎁 Тайный Санта окончен: отправлено ${Object.keys(ev.data.sent).length} подарков. Заберите: /mail`))
})

// ---------- остановка сервера: лот аукциона — обратно продавцу на почту (ставка — обратно покупателю)
ServerEvents.unloaded(e => {
  const a = PE_AUC.cur
  if (!a) return
  PE_AUC.cur = null
  if (a.bidderUid) peCoinsUid(e.server, a.bidderUid, a.bid)
  peMailAdd(e.server, a.sellerUid, a.item, 'Аукцион прерван перезапуском сервера — лот вернулся')
})

// ---------- тики аукциона
ServerEvents.tick(e => {
  if (e.server.tickCount % 20 != 0 || !PE_AUC.cur) return
  if (e.server.tickCount >= PE_AUC.cur.end) peAucEnd(e.server)
})

// ---------- команды
ServerEvents.commandRegistry(e => {
  const C = e.commands, A = e.arguments
  const runP = (fn, s, pl, c) => { if (!pl) return 0; try { fn(s, pl, c) } catch (err) { console.error('pe social: ' + err) } return 1 }
  const run = fn => c => runP(fn, c.source.server, c.source.player, c)

  e.register(C.literal('coins').executes(run((s, p) => p.tell(Text.gold(`У вас ${peCoinsOf(s, peUid(p))} ⚙`)))))
  e.register(C.literal('pay').then(C.argument('player', A.PLAYER.create(e)).then(C.argument('coins', A.INTEGER.create(e)).executes(run((s, p, c) => {
    const t = A.PLAYER.getResult(c, 'player'), n = A.INTEGER.getResult(c, 'coins')
    if (n < 1 || t.username == p.username) { p.tell(Text.red('Нельзя.')); return }
    if (peCoinsOf(s, peUid(p)) < n) { p.tell(Text.red('Не хватает монет.')); return }
    peCoins(s, p, -n, `перевод ${t.username}`); peCoins(s, t, n, `перевод от ${p.username}`)
  })))))

  e.register(C.literal('shop')
    .executes(run((s, p) => {
      p.tell(Text.gold(`Магазин (у вас ${peCoinsOf(s, peUid(p))} ⚙). Нажмите на товар, чтобы купить:`))
      PE_SHOP.forEach(it => p.tell(Text.green(` • ${it[4]}${it[2] > 1 ? ' ×' + it[2] : ''} — ${it[3]} ⚙`).clickRunCommand(`/shop buy ${it[0]}`).hover(Text.gray('Купить'))))
    }))
    .then(C.literal('buy').then(C.argument('id', A.WORD.create(e)).executes(run((s, p, c) => peShopBuy(s, p, A.WORD.getResult(c, 'id')))))))

  e.register(C.literal('auction').then(C.argument('min', A.INTEGER.create(e)).executes(run((s, p, c) => {
    if (PE_AUC.cur) { p.tell(Text.red('Уже идёт аукцион.')); return }
    const st = p.mainHandItem
    if (st.isEmpty()) { p.tell(Text.red('Возьмите лот в руку.')); return }
    const min = Math.max(1, A.INTEGER.getResult(c, 'min'))
    const item = st.copy(); st.setCount(0)
    PE_AUC.cur = { seller: p.username, sellerUid: peUid(p), item: item, min: min, bid: 0, bidder: null, bidderUid: null, end: s.tickCount + 3 * 60 * 20 }
    peSay(s, Text.gold(`🔨 Аукцион: ${p.username} продаёт `).append(item.hoverName).append(Text.gold(` ×${item.count}, от ${min} ⚙. 3 минуты. `))
      .append(Text.green('[Ставка]').clickSuggestCommand(`/bid ${min}`)))
  }))))
  e.register(C.literal('bid').then(C.argument('coins', A.INTEGER.create(e)).executes(run((s, p, c) => {
    const a = PE_AUC.cur, n = A.INTEGER.getResult(c, 'coins')
    if (!a) { p.tell(Text.red('Аукциона нет.')); return }
    if (a.sellerUid == peUid(p)) { p.tell(Text.red('На свой лот ставить нельзя.')); return }
    if (n < Math.max(a.min, a.bid + 1)) { p.tell(Text.red(`Ставка должна быть не меньше ${Math.max(a.min, a.bid + 1)} ⚙.`)); return }
    if (peCoinsOf(s, peUid(p)) < n) { p.tell(Text.red('Не хватает монет.')); return }
    if (a.bidderUid) peCoinsUid(s, a.bidderUid, a.bid)   // вернуть перебитую ставку
    peCoins(s, p, -n, 'ставка на аукционе')
    a.bid = n; a.bidder = p.username; a.bidderUid = peUid(p)
    if (a.end - s.tickCount < 400) a.end = s.tickCount + 400   // ставка в последние секунды продлевает торги
    peSay(s, Text.gold(`🔨 ${p.username}: ${n} ⚙`))
  }))))

  e.register(C.literal('contract')
    .then(C.literal('list').executes(run((s, p) => {
      const list = peLoad(s).contracts
      if (!list.length) { p.tell(Text.gray('Контрактов нет.')); return }
      list.forEach(c2 => p.tell(Text.aqua(`№${c2.id}: ${c2.name} — ${c2.count} × ${c2.item} за ${c2.coins} ⚙`).clickRunCommand(`/contract fill ${c2.id}`).hover(Text.gray('Выполнить'))))
    })))
    .then(C.literal('post').then(C.argument('count', A.INTEGER.create(e)).then(C.argument('coins', A.INTEGER.create(e))
      .executes(run((s, p, c) => peContractPost(s, p, A.INTEGER.getResult(c, 'count'), A.INTEGER.getResult(c, 'coins')))))))
    .then(C.literal('fill').then(C.argument('id', A.INTEGER.create(e)).executes(run((s, p, c) => peContractFill(s, p, A.INTEGER.getResult(c, 'id'))))))
    .then(C.literal('cancel').then(C.argument('id', A.INTEGER.create(e)).executes(run((s, p, c) => {
      const d = peLoad(s), id = A.INTEGER.getResult(c, 'id'), k = d.contracts.filter(x => x.id == id && x.uid == peUid(p))[0]
      if (!k) { p.tell(Text.red('Это не ваш контракт.')); return }
      d.contracts = d.contracts.filter(x => x.id != id); peSave(s)
      peCoins(s, p, k.coins, `контракт №${id} отменён`)
    })))))

  e.register(C.literal('titles')
    .executes(run((s, p) => {
      const d = peLoad(s), mine = d.titles[peUid(p)] || []
      p.tell(Text.gold('Ваши титулы (нажмите, чтобы надеть):'))
      if (!mine.length) p.tell(Text.gray(' Пока нет — побеждайте в ивентах.'))
      mine.forEach(t => p.tell(Text.lightPurple(` • ${t}`).clickRunCommand(`/titles set ${t}`)))
      p.tell(Text.gray(' Снять: /titles clear'))
    }))
    .then(C.literal('set').then(C.argument('name', A.GREEDY_STRING.create(e)).executes(run((s, p, c) => {
      const d = peLoad(s), t = String(A.GREEDY_STRING.getResult(c, 'name'))
      if ((d.titles[peUid(p)] || []).indexOf(t) < 0) { p.tell(Text.red('У вас нет такого титула.')); return }
      d.title[peUid(p)] = t; peSave(s); peApplyTitle(s, p); p.tell(Text.green(`Титул «${t}» надет.`))
    }))))
    .then(C.literal('clear').executes(run((s, p) => { const d = peLoad(s); delete d.title[peUid(p)]; peSave(s); peApplyTitle(s, p) }))))
})
