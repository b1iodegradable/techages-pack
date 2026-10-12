// Ивенты между игроками — PvP. Везде нокаут вместо смерти (вещи не теряются).

// ---------- 1 + 7. Дуэль (со ставкой — пари). Соглашаются двое участников.
peDef('duel', {
  name: 'Дуэль', hidden: true, min: 2, pvp: true, nonLethal: true, arena: true, minutes: 3,
  desc: 'Бой один на один на арене в небе. Нокаут = поражение. Свои вещи, ничего не теряется.',
  voters: (s, a) => [a.from, a.to],
  info: a => `${a.from} вызывает ${a.to}` + (a.stake ? `. Ставка: ${a.stake} ⚙ с каждого, победитель забирает всё.` : '.'),
  canStart: (s, a) => {
    if (!a.from || !a.to) return 'Вызов: /duel <игрок> [ставка]'
    const pair = [a.from, a.to]
    if (a.stake) for (let i = 0; i < 2; i++) { var p = peP(s, pair[i]); if (!p || peCoinsOf(s, peUid(p)) < a.stake) return `У ${pair[i]} не хватает монет на ставку.` }
    return null
  },
  start: (s, ev) => {
    peArena(s, false)
    const a = ev.args
    ev.players = [a.from, a.to]
    if (a.stake) ev.players.forEach(n => peCoins(s, peP(s, n), -a.stake, 'ставка на дуэль'))
    peToArena(s, peP(s, a.from), -8, 0)
    peToArena(s, peP(s, a.to), 8, 0)
    ev.data.go = s.tickCount + 60
    peCmd(s, `title ${a.from} title ${peJson('3… 2… 1…')}`); peCmd(s, `title ${a.to} title ${peJson('3… 2… 1…')}`)
  },
  onHurt: (e, ev) => { if (e.entity.server.tickCount < ev.data.go) e.setDamage(0) },
  onKO: (s, ev, victim, att) => {
    const win = ev.players.filter(n => n != victim.username)[0]
    ev.data.winner = win
    peEnd(s, 'ko')
  },
  tick: (s, ev) => peBar(s, `Дуэль: ${ev.players.join(' vs ')} — ${peFmt(ev.end - s.tickCount)}`, ev.end - s.tickCount, ev.end - ev.t0),
  finish: (s, ev, reason) => {
    const a = ev.args, w = ev.data.winner ? peP(s, ev.data.winner) : null
    if (w) {
      peSay(s, Text.gold(`⚔ ${w.username} побеждает в дуэли!`))
      peReward(s, w, 20 + (a.stake ? a.stake * 2 : 0), 2, 'победа в дуэли')
      if (peStat(s, w, 'duelWins') >= 5) peTitle(s, w, 'Король дуэлей')
    } else {
      peSay(s, Text.gray('Дуэль закончилась вничью.'))
      if (a.stake) ev.players.forEach(n => { var p = peP(s, n); if (p) peCoins(s, p, a.stake, 'возврат ставки') })
    }
  }
})

// ---------- 2. Царь горы
peDef('koth', {
  name: 'Царь горы', min: 2, pvp: true, nonLethal: true, minutes: 10, auto: true,
  desc: 'На карте отмечается холм. Кто один стоит в зоне — получает очко в секунду. Двое и больше — зона спорная. Нокаут вместо смерти.',
  start: (s, ev) => {
    const base = pePick(peOnline(s).filter(p => peDim(p) == PE.OW))
    if (!base) { peSay(s, Text.red('Никого нет в обычном мире.')); return false }
    const ang = Math.random() * Math.PI * 2, r = peRnd(40, 80)
    const x = Math.floor(base.x + Math.cos(ang) * r), z = Math.floor(base.z + Math.sin(ang) * r)
    const y = surfaceY(base.level, x, z)
    ev.data = { x: x, y: y, z: z, pts: {} }
    peSay(s, Text.gold(`Холм: X ${x}  Y ${y}  Z ${z} (зона 5 блоков). Бегите!`))
  },
  tick: (s, ev) => {
    const d = ev.data
    peCmd(s, `execute in ${PE.OW} run particle minecraft:end_rod ${d.x} ${d.y + 1} ${d.z} 3 0.3 3 0 40 force`)
    const inside = ev.players.map(n => peP(s, n)).filter(p => p && peDim(p) == PE.OW && Math.abs(p.x - d.x) <= 5 && Math.abs(p.z - d.z) <= 5 && Math.abs(p.y - d.y) <= 6)
    if (inside.length == 1) { var n = inside[0].username; d.pts[n] = (d.pts[n] || 0) + 1 }
    const lead = peWinnersBy(ev, d.pts)
    peBar(s, `Царь горы — ${inside.length == 1 ? inside[0].username + ' держит холм' : inside.length > 1 ? 'спорная зона!' : 'холм свободен'} · лидер: ${lead.join(', ') || '—'} · ${peFmt(ev.end - s.tickCount)}`, ev.end - s.tickCount, ev.end - ev.t0)
  },
  finish: (s, ev) => {
    const w = peWinnersBy(ev, ev.data.pts)
    w.forEach(n => { var p = peP(s, n); if (p) { peReward(s, p, 60, 4, 'Царь горы'); peTitle(s, p, 'Царь горы') } })
    Object.keys(ev.data.pts).forEach(n => { var p = peP(s, n); if (p && w.indexOf(n) < 0) peReward(s, p, 10, 1, 'участие') })
    peSay(s, Text.gold(w.length ? `👑 Царь горы: ${w.join(', ')}` : 'Холм так никто и не удержал.'))
  }
})

// ---------- 3. Охота за головой
peDef('manhunt', {
  name: 'Охота за головой', min: 2, pvp: true, nonLethal: true, minutes: 15, auto: true,
  desc: 'Один игрок — цель: его координаты раз в минуту видят все, он светится. Цель выжила 15 минут — побеждает она, вырубили — побеждает охотник.',
  start: (s, ev) => {
    ev.data.target = pePick(ev.players)
    peSay(s, Text.red(`🎯 Цель: ${ev.data.target}!`))
  },
  tick: (s, ev) => {
    const t = peP(s, ev.data.target)
    if (!t) { peEnd(s, 'left'); return }
    peCmd(s, `effect give ${t.username} minecraft:glowing 3 0 true`)
    if ((s.tickCount - ev.t0) % 1200 < 20) peSay(s, Text.red(`🎯 ${t.username}: X ${Math.floor(t.x)} Y ${Math.floor(t.y)} Z ${Math.floor(t.z)} (${peDim(t)})`))
    peBar(s, `Охота: цель ${t.username} — ${peFmt(ev.end - s.tickCount)}`, ev.end - s.tickCount, ev.end - ev.t0)
  },
  onKO: (s, ev, victim, att) => { if (victim.username == ev.data.target && att) { ev.data.hunter = att.username; peEnd(s, 'ko') } },
  finish: (s, ev, reason) => {
    if (ev.data.hunter) { var h = peP(s, ev.data.hunter); peSay(s, Text.gold(`🏹 ${ev.data.hunter} поймал цель!`)); if (h) peReward(s, h, 60, 4, 'охота за головой') }
    else if (reason == 'time') { var t = peP(s, ev.data.target); peSay(s, Text.gold(`🛡 ${ev.data.target} ушёл от погони!`)); if (t) peReward(s, t, 80, 5, 'выжил на охоте') }
  }
})

// ---------- 4. Награда за голову (/bounty <игрок> <монеты>) — тоже через общее согласие
peDef('bounty', {
  name: 'Награда за голову', hidden: true, min: 2, pvp: true, nonLethal: true, minutes: 20,
  desc: 'За голову игрока назначена награда. Кто его вырубит за 20 минут — забирает монеты. Не вышло — монеты вернутся заказчику.',
  info: a => `Заказчик: ${a.from}. Цель: ${a.to}. Награда: ${a.coins} ⚙`,
  canStart: (s, a) => {
    if (!a.to || !a.coins || a.coins < 10) return 'Формат: /bounty <игрок> <монеты, от 10>'
    var p = peP(s, a.from); if (!p || peCoinsOf(s, peUid(p)) < a.coins) return 'Не хватает монет.'
    if (!peP(s, a.to)) return 'Цель не в сети.'
    return null
  },
  start: (s, ev) => { peCoins(s, peP(s, ev.args.from), -ev.args.coins, 'награда в депозите') },
  tick: (s, ev) => {
    const t = peP(s, ev.args.to); if (!t) { peEnd(s, 'left'); return }
    peCmd(s, `effect give ${t.username} minecraft:glowing 3 0 true`)
    peBar(s, `Награда ${ev.args.coins} ⚙ за ${t.username} — ${peFmt(ev.end - s.tickCount)}`, ev.end - s.tickCount, ev.end - ev.t0)
  },
  onKO: (s, ev, victim, att) => { if (victim.username == ev.args.to && att && att.username != ev.args.to) { ev.data.hunter = att.username; peEnd(s, 'ko') } },
  finish: (s, ev) => {
    const h = ev.data.hunter ? peP(s, ev.data.hunter) : null
    if (h) { peSay(s, Text.gold(`💰 ${h.username} получает награду за ${ev.args.to}!`)); peReward(s, h, ev.args.coins, 3, 'награда за голову') }
    else { var f = peP(s, ev.args.from); if (f) peCoins(s, f, ev.args.coins, 'награда вернулась'); else peCoinsUid(s, ev.data.fromUid || '', ev.args.coins) }
  }
})

// ---------- 5. Последний выживший
peDef('survivor', {
  name: 'Последний выживший', min: 2, pvp: true, nonLethal: true, arena: true, minutes: 8, auto: true,
  desc: 'Арена в небе, у всех одинаковый набор (свои вещи сохранятся и вернутся). Зона сужается. Нокаут — выбываешь. Последний оставшийся побеждает.',
  start: (s, ev) => {
    peArena(s, false)
    const n = ev.players.length
    ev.players.forEach((name, i) => {
      var p = peP(s, name), ang = 2 * Math.PI * i / n
      peToArena(s, p, Math.round(Math.cos(ang) * 14), Math.round(Math.sin(ang) * 14))
      peStashInv(p); peKit(s, p, PE_KIT)
    })
    ev.data = { alive: ev.players.slice(), go: s.tickCount + 100 }
  },
  onHurt: (e, ev) => { if (e.entity.server.tickCount < ev.data.go) e.setDamage(0) },
  tick: (s, ev) => {
    const A = PE.ARENA, total = ev.end - ev.t0, left = ev.end - s.tickCount
    const r = Math.max(3, Math.round(4 + 16 * left / total))
    peCmd(s, `execute in ${PE.OW} run particle minecraft:flame ${A.x} ${A.y + 1} ${A.z} ${r} 0.2 ${r} 0 60 force`)
    ev.data.alive.forEach(n => {
      var p = peP(s, n)
      if (!p) return
      if (Math.abs(p.x - A.x) > r || Math.abs(p.z - A.z) > r) peCmd(s, `damage ${n} 2 minecraft:out_of_world`)
    })
    peBar(s, `Последний выживший — осталось ${ev.data.alive.length} · зона ${r * 2 + 1} · ${peFmt(left)}`, left, total)
  },
  onKO: (s, ev, victim) => {
    const i = ev.data.alive.indexOf(victim.username); if (i < 0) return
    ev.data.alive.splice(i, 1)
    peSay(s, Text.red(`☠ ${victim.username} выбывает. Осталось: ${ev.data.alive.length}`))
    peReturn(s, victim)
    if (ev.data.alive.length <= 1) peEnd(s, 'ko')
  },
  finish: (s, ev) => {
    const w = ev.data.alive.length == 1 ? peP(s, ev.data.alive[0]) : null
    if (w) { peSay(s, Text.gold(`🏆 Последний выживший: ${w.username}!`)); peReward(s, w, 80, 5, 'последний выживший') }
    else peSay(s, Text.gray('Победителя нет.'))
  }
})

// ---------- 6. Захват флага
peDef('ctf', {
  name: 'Захват флага', min: 2, pvp: true, nonLethal: true, arena: true, minutes: 10, auto: true,
  desc: 'Две команды на арене. Встаньте на флаг врага (шерсть его цвета) — понесёте его; донесите до своей шерсти — очко. Нокаут носителя — флаг возвращается. До 3 очков.',
  start: (s, ev) => {
    peArena(s, true)
    const A = PE.ARENA
    const names = peShuffle(ev.players.slice())
    ev.data = { team: {}, score: { red: 0, blue: 0 }, carrier: { red: null, blue: null }, base: { red: [A.x - 15, A.z], blue: [A.x + 15, A.z] }, go: s.tickCount + 100 }
    names.forEach((n, i) => {
      var t = i % 2 == 0 ? 'red' : 'blue', p = peP(s, n)
      ev.data.team[n] = t
      peToArena(s, p, t == 'red' ? -13 : 13, (i >> 1) * 2 - 2)
      peStashInv(p); peKit(s, p, PE_KIT)
      p.tell(t == 'red' ? Text.red('Вы — красные. Ваш флаг — красная шерсть слева.') : Text.blue('Вы — синие. Ваш флаг — синяя шерсть справа.'))
    })
  },
  onHurt: (e, ev) => {
    const s = e.entity.server
    if (s.tickCount < ev.data.go) { e.setDamage(0); return }
    const att = e.source.player
    if (att && ev.data.team[att.username] == ev.data.team[e.entity.username]) e.setDamage(0)  // свои не бьют своих
  },
  fast: (s, ev) => {
    const d = ev.data, A = PE.ARENA
    ev.players.forEach(n => {
      var p = peP(s, n); if (!p) return
      const my = d.team[n], enemy = my == 'red' ? 'blue' : 'red'
      const near = b => Math.abs(p.x - (d.base[b][0] + 0.5)) < 1.5 && Math.abs(p.z - (d.base[b][1] + 0.5)) < 1.5
      if (!d.carrier[enemy] && near(enemy)) {
        d.carrier[enemy] = n
        peCmd(s, `effect give ${n} minecraft:glowing 600 0 true`); peCmd(s, `effect give ${n} minecraft:slowness 600 0 true`)
        peSay(s, Text.yellow(`⚑ ${n} несёт флаг ${enemy == 'red' ? 'красных' : 'синих'}!`))
      }
      if (d.carrier[enemy] == n && near(my)) {
        d.score[my]++; d.carrier[enemy] = null
        peCmd(s, `effect clear ${n}`)
        peSay(s, Text.gold(`⚑ Очко ${my == 'red' ? 'красным' : 'синим'}! ${d.score.red}:${d.score.blue}`))
        if (d.score[my] >= 3) peEnd(s, 'win')
      }
    })
  },
  tick: (s, ev) => peBar(s, `Захват флага — красные ${ev.data.score.red} : ${ev.data.score.blue} синие · ${peFmt(ev.end - s.tickCount)}`, ev.end - s.tickCount, ev.end - ev.t0),
  onKO: (s, ev, victim) => {
    const d = ev.data, my = d.team[victim.username], A = PE.ARENA
    ;['red', 'blue'].forEach(f => { if (d.carrier[f] == victim.username) { d.carrier[f] = null; peSay(s, Text.yellow('⚑ Флаг вернулся на базу')) } })
    peCmd(s, `effect clear ${victim.username}`)
    peTp(s, victim.username, PE.OW, A.x + (my == 'red' ? -13 : 13) + 0.5, A.y, A.z + 0.5)
  },
  finish: (s, ev) => {
    const d = ev.data, win = d.score.red > d.score.blue ? 'red' : d.score.blue > d.score.red ? 'blue' : null
    peSay(s, Text.gold(win ? `🏆 Побеждают ${win == 'red' ? 'красные' : 'синие'} (${d.score.red}:${d.score.blue})` : `Ничья ${d.score.red}:${d.score.blue}`))
    ev.players.forEach(n => { var p = peP(s, n); if (!p) return; peCmd(s, `effect clear ${n}`); if (d.team[n] == win) peReward(s, p, 50, 4, 'захват флага'); else peReward(s, p, 10, 1, 'участие') })
  }
})

// ---------- 8. Кровная месть
peDef('vendetta', {
  name: 'Кровная месть', min: 2, pvp: true, nonLethal: true, minutes: 30, auto: true,
  desc: '30 минут свободного PvP по всему миру без смертей. Кто вас вырубил — тот ваш кровник: 10 минут вы бьёте его на 25 % сильнее, а он светится. Месть кровнику — двойные очки.',
  start: (s, ev) => { ev.data = { kos: {}, vend: {} } },   // vend[жертва] = { who, until }
  onHurt: (e, ev) => {
    const att = e.source.player; if (!att) return
    const v = ev.data.vend[att.username]
    if (v && v.who == e.entity.username && e.entity.server.tickCount < v.until) e.setDamage(e.damage * 1.25)
  },
  onKO: (s, ev, victim, att) => {
    if (!att) return
    const d = ev.data, v = d.vend[att.username]
    const revenge = v && v.who == victim.username && s.tickCount < v.until
    d.kos[att.username] = (d.kos[att.username] || 0) + (revenge ? 2 : 1)
    if (revenge) { delete d.vend[att.username]; peSay(s, Text.darkRed(`🗡 ${att.username} отомстил ${victim.username}!`)) }
    d.vend[victim.username] = { who: att.username, until: s.tickCount + 12000 }
    peCmd(s, `effect give ${att.username} minecraft:glowing 600 0 true`)
    victim.tell(Text.darkRed(`Ваш кровник — ${att.username}. 10 минут вы бьёте его на 25 % сильнее.`))
  },
  tick: (s, ev) => { const lead = peWinnersBy(ev, ev.data.kos); peBar(s, `Кровная месть — лидер: ${lead.join(', ') || '—'} · ${peFmt(ev.end - s.tickCount)}`, ev.end - s.tickCount, ev.end - ev.t0) },
  finish: (s, ev) => {
    const w = peWinnersBy(ev, ev.data.kos)
    w.forEach(n => { var p = peP(s, n); if (p) peReward(s, p, 60, 4, 'кровная месть') })
    ev.players.forEach(n => peCmd(s, `effect clear ${n} minecraft:glowing`))
    peSay(s, Text.gold(w.length ? `Больше всех нокаутов: ${w.join(', ')}` : 'Обошлось без драк.'))
  }
})

// ---------- команды /duel, /bounty
ServerEvents.commandRegistry(e => {
  const C = e.commands, A = e.arguments
  const duel = (c, stake) => {
    var s = c.source.server, p = c.source.player, t = A.PLAYER.getResult(c, 'player')
    if (!p) return 0
    if (t.username == p.username) { p.tell(Text.red('С собой не подерёшься.')); return 0 }
    const err = pePropose(s, 'duel', { from: p.username, to: t.username, stake: stake }, p.username)
    if (err) p.tell(Text.red(err))
    return 1
  }
  e.register(C.literal('duel').then(C.argument('player', A.PLAYER.create(e))
    .executes(c => duel(c, 0))
    .then(C.argument('stake', A.INTEGER.create(e)).executes(c => duel(c, Math.max(0, A.INTEGER.getResult(c, 'stake')))))))
  e.register(C.literal('bounty').then(C.argument('player', A.PLAYER.create(e)).then(C.argument('coins', A.INTEGER.create(e)).executes(c => {
    var s = c.source.server, p = c.source.player, t = A.PLAYER.getResult(c, 'player')
    if (!p) return 0
    const err = pePropose(s, 'bounty', { from: p.username, to: t.username, coins: A.INTEGER.getResult(c, 'coins') }, p.username)
    if (err) p.tell(Text.red(err))
    return 1
  }))))
})
