/*
  Home: meals, self-care, clothes, health and birthdays.
  Everything is saved with the rest of the plans, in this browser only.

  Meals, the shopping list and birthdays are shared by the whole household.
  Self-care, clothes and health belong to each person.
*/
(function (global) {
  'use strict';

  var api = null;           // helpers handed over by app.js
  var tab = 'meals';
  var weekStart = null;     // Monday of the week shown in Meals
  var dialogSave = null;    // what the Save button does in the Home dialog
  var dialogDelete = null;

  /* ---------- Fixed lists ---------- */

  var SLOTS = [
    { id: 'breakfast', label: 'Breakfast', emoji: '🥣' },
    { id: 'lunch', label: 'Lunch', emoji: '🥪' },
    { id: 'tea', label: 'Tea', emoji: '🍲' }
  ];

  // What's in season in the UK, month by month (1 = January)
  var IN_SEASON = {
    1: 'leeks, parsnips, kale, swede, cabbage, stored apples',
    2: 'leeks, parsnips, kale, purple sprouting broccoli, forced rhubarb',
    3: 'purple sprouting broccoli, spring greens, leeks, rhubarb, wild garlic',
    4: 'spring greens, radishes, spinach, rhubarb, the first asparagus',
    5: 'asparagus, new potatoes, radishes, spinach, lettuce, rhubarb',
    6: 'strawberries, broad beans, peas, new potatoes, lettuce',
    7: 'strawberries, raspberries, courgettes, peas, beans, tomatoes, cherries',
    8: 'tomatoes, sweetcorn, courgettes, plums, blackberries, runner beans',
    9: 'apples, pears, plums, blackberries, sweetcorn, squash, tomatoes',
    10: 'apples, pears, squash, pumpkins, leeks, beetroot',
    11: 'apples, pears, squash, parsnips, leeks, kale, sprouts',
    12: 'sprouts, parsnips, kale, leeks, red cabbage, swede, chestnuts'
  };

  var SELFCARE = [
    { id: 'water', emoji: '💧', label: 'Drink some water' },
    { id: 'teeth', emoji: '🦷', label: 'Brush teeth' },
    { id: 'wash', emoji: '🛁', label: 'Wash or shower' },
    { id: 'outside', emoji: '🌳', label: 'Time outside' },
    { id: 'move', emoji: '🤸', label: 'Move my body' },
    { id: 'food', emoji: '🍎', label: 'Eat something good' },
    { id: 'quiet', emoji: '🧘', label: 'A quiet moment' },
    { id: 'connect', emoji: '🤗', label: 'Time with someone I love' },
    { id: 'screen', emoji: '📵', label: 'A screen break' },
    { id: 'fun', emoji: '🎨', label: 'Something just for fun' },
    { id: 'tidy', emoji: '🧺', label: 'Tidy one small thing' },
    { id: 'sleep', emoji: '😴', label: 'Wind down for bed' }
  ];
  var SELFCARE_DEFAULT = ['water', 'teeth', 'outside', 'move', 'food', 'sleep'];

  var MOODS = [
    { id: 'happy', emoji: '😊', label: 'Happy', reply: 'Lovely! What made today feel good?' },
    { id: 'calm', emoji: '😌', label: 'Calm', reply: 'Calm feels nice. Enjoy it.' },
    { id: 'okay', emoji: '🙂', label: 'Okay', reply: 'Okay is perfectly fine.' },
    { id: 'tired', emoji: '😴', label: 'Tired', reply: 'Maybe a rest, a snack or an early night would help.' },
    { id: 'worried', emoji: '😟', label: 'Worried', reply: 'Worries often feel lighter when shared. Maybe tell someone you trust.' },
    { id: 'sad', emoji: '😢', label: 'Sad', reply: 'It’s okay to feel sad. A hug, a cosy blanket or a chat might help.' },
    { id: 'cross', emoji: '😠', label: 'Cross', reply: 'Big feelings are okay. A walk or some slow breaths might help.' }
  ];

  var CHECKUPS = [
    { id: 'dentist', emoji: '🦷', label: 'Dentist' },
    { id: 'optician', emoji: '👓', label: 'Eye test' },
    { id: 'gp', emoji: '🩺', label: 'Doctor / GP' },
    { id: 'haircut', emoji: '✂️', label: 'Haircut' }
  ];

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

  /* ---------- Helpers ---------- */

  function $(s, el) { return (el || document).querySelector(s); }
  function esc(s) { return api.esc(s); }
  function today() { return api.today(); }

  function home() {
    var s = api.state();
    s.home = s.home || {};
    var h = s.home;
    h.meals = h.meals || {};
    h.mealFavs = h.mealFavs || [];
    h.shopping = h.shopping || [];
    h.birthdays = h.birthdays || [];
    h.people = h.people || {};
    return h;
  }

  function personData(p) {
    p = p || api.me();
    if (!p) return null;
    var h = home();
    var d = h.people[p.id] = h.people[p.id] || {};
    d.selfcare = d.selfcare || { chosen: SELFCARE_DEFAULT.slice(), custom: [], days: {}, mood: {} };
    d.selfcare.custom = d.selfcare.custom || [];
    d.selfcare.days = d.selfcare.days || {};
    d.selfcare.mood = d.selfcare.mood || {};
    d.clothes = d.clothes || { sizes: {}, need: [], passOn: [] };
    d.health = d.health || { appts: [], meds: [], notes: '', checkups: {} };
    d.health.checkups = d.health.checkups || {};
    return d;
  }

  function save() { api.save(); }

  function mondayOf(key) {
    var dow = (api.Sky.keyToUTCNoon(key).getUTCDay() + 6) % 7;
    return api.Sky.addDays(key, -dow);
  }

  function fmtKey(key, opts) { return api.Sky.fmtKey(key, opts); }

  function monthsAgo(key) {
    var days = api.Sky.daysBetween(key, today());
    if (days < 0) return 'booked for ' + fmtKey(key, { day: 'numeric', month: 'short' });
    if (days < 14) return days === 0 ? 'today' : days + (days === 1 ? ' day ago' : ' days ago');
    if (days < 60) return Math.round(days / 7) + ' weeks ago';
    var m = Math.round(days / 30.4);
    if (m < 24) return m + ' months ago';
    return Math.floor(m / 12) + ' years ago';
  }

  /* ---------- Birthdays & appointments as calendar events ---------- */

  function birthdayKey(b, year) {
    var day = b.day;
    if (b.month === 2 && b.day === 29) {
      var leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      if (!leap) day = 28;
    }
    return year + '-' + (b.month < 10 ? '0' : '') + b.month + '-' + (day < 10 ? '0' : '') + day;
  }

  function nextBirthday(b) {
    var t = today();
    var y = +t.slice(0, 4);
    var k = birthdayKey(b, y);
    if (k < t) { y += 1; k = birthdayKey(b, y); }
    return { key: k, year: y, inDays: api.Sky.daysBetween(t, k), turns: b.year ? y - b.year : null };
  }

  // Birthdays (everyone) and the current person's appointments between two dates
  function personalEvents(fromKey, toKey, person) {
    var out = [];
    var y1 = +fromKey.slice(0, 4), y2 = +toKey.slice(0, 4);
    home().birthdays.forEach(function (b) {
      for (var y = y1; y <= y2; y++) {
        var k = birthdayKey(b, y);
        if (k >= fromKey && k <= toKey) {
          var age = b.year ? y - b.year : null;
          out.push({ date: k, icon: '🎂', kind: 'birthday',
            title: b.name + '’s birthday' + (age && age > 0 ? ' (' + age + ')' : '') });
        }
      }
    });
    var d = personData(person);
    if (d) {
      d.health.appts.forEach(function (a) {
        if (a.date >= fromKey && a.date <= toKey) {
          out.push({ date: a.date, icon: '🩺', kind: 'health',
            title: a.what + (a.time ? ' · ' + a.time : '') });
        }
      });
    }
    out.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    return out;
  }

  // Short notes for the top of My Day
  function dayNotes(key) {
    var notes = [];
    var p = api.me();
    home().birthdays.forEach(function (b) {
      var k = birthdayKey(b, +key.slice(0, 4));
      var days = api.Sky.daysBetween(key, k);
      var age = b.year ? +key.slice(0, 4) - b.year : null;
      if (days === 0) {
        notes.unshift({ icon: '🎉', title: 'It’s ' + b.name + '’s birthday!' + (age && age > 0 ? ' Turning ' + age + '.' : ''), note: '' });
      } else if (days === 7 || days === 3) {
        notes.push({ icon: '🎂', title: b.name + '’s birthday in ' + days + ' days', note: 'Time to make a card or plan a surprise?' });
      }
    });
    var d = personData(p);
    if (d) {
      d.health.appts.forEach(function (a) {
        if (a.date === key) {
          notes.push({ icon: '🩺', title: a.what + (a.time ? ' at ' + a.time : ''), note: a.where || '' });
        }
      });
      if (key === today()) {
        d.health.meds.forEach(function (m) {
          if (m.daily) notes.push({ icon: '💊', title: m.name, note: m.when || '' });
        });
      }
    }
    var meals = home().meals[key];
    if (meals) {
      var bits = SLOTS.filter(function (s) { return meals[s.id]; }).map(function (s) { return s.emoji + ' ' + meals[s.id]; });
      if (bits.length) notes.push({ icon: '🍽️', title: 'On the menu', note: bits.join(' · ') });
    }
    return notes;
  }

  /* ---------- Home dialog (small form in a sheet) ---------- */

  function openDialog(title, bodyHTML, onSave, onDelete) {
    $('#home-dialog-title').textContent = title;
    $('#home-dialog-body').innerHTML = bodyHTML;
    dialogSave = onSave;
    dialogDelete = onDelete || null;
    var del = $('#home-dialog-delete');
    del.hidden = !onDelete;
    del.dataset.armed = '';
    del.textContent = 'Remove';
    $('#home-dialog').showModal();
    var first = $('#home-dialog-body input, #home-dialog-body textarea, #home-dialog-body select');
    if (first) setTimeout(function () { first.focus(); }, 50);
  }

  function closeDialog() { $('#home-dialog').close(); }

  /* ================= MEALS ================= */

  function renderMeals() {
    var h = home();
    var t = today();
    if (!weekStart) weekStart = mondayOf(t);
    var month = +t.slice(5, 7);
    var html = '<div class="month-switch">' +
      '<button class="round-btn small" data-week="-1" aria-label="Previous week"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>' +
      '<div class="month-switch-label"><strong>Week of ' + esc(fmtKey(weekStart, { day: 'numeric', month: 'short' })) + '</strong>' +
      (weekStart === mondayOf(t) ? '<span>This week</span>' : '<button class="link-btn" data-week="0">Back to this week</button>') + '</div>' +
      '<button class="round-btn small" data-week="1" aria-label="Next week"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button></div>';

    html += '<p class="season-food"><span aria-hidden="true">🧺</span> <strong>In season now:</strong> ' + esc(IN_SEASON[month]) + '.</p>';

    html += '<div class="meal-week">';
    for (var i = 0; i < 7; i++) {
      var k = api.Sky.addDays(weekStart, i);
      var m = h.meals[k] || {};
      html += '<div class="meal-day' + (k === t ? ' is-today' : '') + '">' +
        '<div class="meal-day-name">' + esc(fmtKey(k, { weekday: 'short' })) + '<span>' + (+k.slice(8)) + '</span></div>' +
        '<div class="meal-slots">' + SLOTS.map(function (s) {
          return '<button class="meal-slot' + (m[s.id] ? ' filled' : '') + '" data-meal="' + k + '|' + s.id + '" aria-label="' +
            esc(s.label + ' on ' + fmtKey(k, { weekday: 'long' }) + ': ' + (m[s.id] || 'nothing yet')) + '">' +
            '<span class="slot-emoji" aria-hidden="true">' + s.emoji + '</span>' +
            '<span class="slot-text">' + (m[s.id] ? esc(m[s.id]) : '<span class="slot-empty">' + s.label + '</span>') + '</span></button>';
        }).join('') + '</div></div>';
    }
    html += '</div>';

    // Shopping list
    var left = h.shopping.filter(function (x) { return !x.done; }).length;
    html += '<article class="panel"><h2 class="panel-title">🛒 Shopping list' + (h.shopping.length ? ' <span class="optional">(' + left + ' to get)</span>' : '') + '</h2>' +
      '<form class="add-tag" data-form="shop"><input type="text" id="shop-input" maxlength="60" placeholder="Add something to buy" aria-label="Add to shopping list">' +
      '<button class="btn small" type="submit">Add</button></form>' +
      '<ul class="tick-list">' + h.shopping.map(function (x) {
        return '<li class="' + (x.done ? 'done' : '') + '"><button class="tick-btn" data-shop-tick="' + x.id + '" aria-pressed="' + !!x.done + '" aria-label="Got ' + esc(x.text) + '"><span class="tick small"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span></button>' +
          '<span class="tick-text">' + esc(x.text) + '</span>' +
          '<button class="icon-btn small" data-shop-del="' + x.id + '" aria-label="Remove ' + esc(x.text) + '">✕</button></li>';
      }).join('') + '</ul>' +
      (h.shopping.length ? '<div class="btn-row" style="margin-top:10px">' +
        '<button class="btn small" data-shop="copy">📋 Copy list</button>' +
        (h.shopping.some(function (x) { return x.done; }) ? '<button class="btn small" data-shop="clear">Clear ticked</button>' : '') +
        '</div>' : '') +
      '</article>';

    // Favourite meals
    html += '<article class="panel"><h2 class="panel-title">⭐ Favourite meals</h2>' +
      (h.mealFavs.length
        ? '<div class="chips wrap">' + h.mealFavs.map(function (f, i) {
          return '<span class="fav-chip">' + esc(f) + '<button data-fav-del="' + i + '" aria-label="Remove ' + esc(f) + ' from favourites">✕</button></span>';
        }).join('') + '</div>'
        : '<p class="small-note">When you add a meal, tick “Save as a favourite” and it will appear here to pick quickly next time.</p>') +
      '</article>';
    return html;
  }

  function editMeal(ref) {
    var parts = ref.split('|'), key = parts[0], slot = parts[1];
    var h = home();
    var cur = (h.meals[key] || {})[slot] || '';
    var s = SLOTS.filter(function (x) { return x.id === slot; })[0];
    var favs = h.mealFavs;
    var body = '<label class="field"><span class="field-label">' + s.emoji + ' ' + s.label + ' on ' + esc(fmtKey(key, { weekday: 'long', day: 'numeric', month: 'long' })) + '</span>' +
      '<input type="text" id="hd-meal" maxlength="60" value="' + esc(cur) + '" placeholder="e.g. Jacket potatoes and beans"></label>' +
      (favs.length ? '<div class="field"><span class="field-label">Favourites</span><div class="chips wrap">' +
        favs.map(function (f) { return '<button type="button" class="chip-btn" data-pick-fav="' + esc(f) + '">' + esc(f) + '</button>'; }).join('') + '</div></div>' : '') +
      '<label class="switch-row"><input type="checkbox" id="hd-fav"><span class="switch" aria-hidden="true"></span><span>Save as a favourite</span></label>';
    openDialog(cur ? 'Change meal' : 'Add a meal', body, function () {
      var v = $('#hd-meal').value.trim();
      h.meals[key] = h.meals[key] || {};
      if (v) h.meals[key][slot] = v; else delete h.meals[key][slot];
      if (!Object.keys(h.meals[key]).length) delete h.meals[key];
      if (v && $('#hd-fav').checked && h.mealFavs.indexOf(v) < 0) h.mealFavs.push(v);
      return true;
    }, cur ? function () { delete h.meals[key][slot]; if (!Object.keys(h.meals[key]).length) delete h.meals[key]; } : null);
  }

  /* ================= SELF-CARE ================= */

  function allSelfcare(d) {
    return SELFCARE.concat(d.selfcare.custom);
  }

  function renderSelfcare() {
    var p = api.me(), d = personData(p), t = today();
    var done = d.selfcare.days[t] || [];
    var items = allSelfcare(d).filter(function (x) { return d.selfcare.chosen.indexOf(x.id) >= 0; });
    var mood = d.selfcare.mood[t];
    var moodObj = MOODS.filter(function (m) { return m.id === mood; })[0];

    var html = '<article class="panel"><h2 class="panel-title">How are you feeling today, ' + esc(p.name) + '?</h2>' +
      '<div class="mood-row" role="radiogroup" aria-label="How I feel">' + MOODS.map(function (m) {
        return '<button class="mood-btn" role="radio" data-mood="' + m.id + '" aria-checked="' + (mood === m.id) + '">' +
          '<span aria-hidden="true">' + m.emoji + '</span><small>' + m.label + '</small></button>';
      }).join('') + '</div>' +
      (moodObj ? '<p class="mood-reply">' + esc(moodObj.reply) + '</p>' : '') + '</article>';

    html += '<article class="panel"><div class="panel-head"><h2 class="panel-title">Looking after me today</h2>' +
      '<button class="link-btn" data-sc="choose">Choose</button></div>' +
      (done.length ? '<p class="small-note sc-count">💚 ' + done.length + (done.length === 1 ? ' kind thing' : ' kind things') + ' done today</p>' : '') +
      '<div class="sc-grid">' + items.map(function (x) {
        var on = done.indexOf(x.id) >= 0;
        return '<button class="sc-btn' + (on ? ' on' : '') + '" data-sc-tick="' + x.id + '" aria-pressed="' + on + '">' +
          '<span class="sc-emoji" aria-hidden="true">' + x.emoji + '</span><span>' + esc(x.label) + '</span></button>';
      }).join('') + '</div>' +
      '<p class="small-note">Starts fresh every morning. Nothing to catch up on.</p></article>';

    html += '<article class="panel breathe-panel"><h2 class="panel-title">🫧 Breathe with me</h2>' +
      '<div class="breathe" id="breathe" aria-live="polite"><div class="breathe-circle"></div><span class="breathe-text">Ready when you are</span></div>' +
      '<button class="btn" data-sc="breathe">Start one minute</button></article>';
    return html;
  }

  function chooseSelfcare() {
    var d = personData();
    var all = allSelfcare(d);
    var body = '<p class="sheet-intro">Pick the things that help you. You can change them any time.</p>' +
      '<div class="chips wrap" id="hd-sc">' + all.map(function (x) {
        return '<button type="button" class="chip-btn" data-sc-choose="' + x.id + '" aria-pressed="' + (d.selfcare.chosen.indexOf(x.id) >= 0) + '">' + x.emoji + ' ' + esc(x.label) + '</button>';
      }).join('') + '</div>' +
      '<div class="add-tag"><input type="text" id="hd-sc-new" maxlength="40" placeholder="Add your own" aria-label="Add your own self-care idea"><button type="button" class="btn small" id="hd-sc-add">Add</button></div>';
    openDialog('My self-care', body, function () {
      d.selfcare.chosen = Array.prototype.map.call(document.querySelectorAll('#hd-sc [aria-pressed="true"]'), function (b) { return b.dataset.scChoose; });
      return true;
    });
  }

  var breatheTimer = null;
  function breathe() {
    var box = $('#breathe');
    if (!box) return;
    clearInterval(breatheTimer);
    var text = $('.breathe-text', box), circle = $('.breathe-circle', box);
    var phase = 0, elapsed = 0;
    var steps = [['Breathe in…', 'in'], ['Hold…', 'hold'], ['Breathe out…', 'out'], ['Rest…', 'rest']];
    function step() {
      if (elapsed >= 64) {
        clearInterval(breatheTimer);
        text.textContent = 'Well done 💚';
        circle.className = 'breathe-circle';
        return;
      }
      text.textContent = steps[phase][0];
      circle.className = 'breathe-circle ' + steps[phase][1];
      phase = (phase + 1) % 4;
      elapsed += 4;
    }
    step();
    breatheTimer = setInterval(step, 4000);
  }

  /* ================= CLOTHES ================= */

  function seasonClothesTip() {
    var s = api.Sky.seasonInfo(new Date());
    var id = s ? s.id : 'autumn';
    return {
      autumn: 'Getting colder: do wellies, a waterproof coat, a warm jumper, gloves and a hat still fit?',
      winter: 'Deep winter: warm socks, thermal layers, gloves, and a coat that still zips up?',
      spring: 'Warming up: a light waterproof, shoes that fit growing feet, and something for muddy walks?',
      summer: 'Summer: a sun hat, sandals or water shoes, and something cool for hot days?'
    }[id];
  }

  function listHTML(items, kind, emptyText) {
    if (!items.length) return '<p class="small-note">' + emptyText + '</p>';
    return '<ul class="tick-list">' + items.map(function (x) {
      return '<li class="' + (x.done ? 'done' : '') + '"><button class="tick-btn" data-list-tick="' + kind + ':' + x.id + '" aria-pressed="' + !!x.done + '" aria-label="Done: ' + esc(x.text) + '"><span class="tick small"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span></button>' +
        '<span class="tick-text">' + esc(x.text) + '</span>' +
        '<button class="icon-btn small" data-list-del="' + kind + ':' + x.id + '" aria-label="Remove ' + esc(x.text) + '">✕</button></li>';
    }).join('') + '</ul>';
  }

  function renderClothes() {
    var p = api.me(), d = personData(p), c = d.clothes, sz = c.sizes || {};
    function field(id, label, ph) {
      return '<label class="size-field"><span>' + label + '</span><input type="text" data-size="' + id + '" maxlength="20" value="' + esc(sz[id] || '') + '" placeholder="' + ph + '"></label>';
    }
    var html = '<p class="season-food"><span aria-hidden="true">🧥</span> ' + esc(seasonClothesTip()) + '</p>';
    html += '<article class="panel"><h2 class="panel-title">📏 ' + esc(p.name) + '’s sizes</h2>' +
      '<div class="size-grid">' + field('top', 'Tops', 'e.g. 9–10 yrs') + field('bottom', 'Bottoms', 'e.g. 10 yrs') +
      field('shoes', 'Shoes', 'e.g. UK 2') + field('coat', 'Coat', 'e.g. 11–12 yrs') + '</div>' +
      (sz.checked ? '<p class="small-note">Last updated ' + esc(monthsAgo(sz.checked)) + '.</p>' : '<p class="small-note">Growing fast? Check these every few months.</p>') +
      '</article>';
    html += '<article class="panel"><h2 class="panel-title">🛍️ Things I need</h2>' +
      '<form class="add-tag" data-form="need"><input type="text" id="need-input" maxlength="60" placeholder="e.g. New wellies" aria-label="Add something needed"><button class="btn small" type="submit">Add</button></form>' +
      listHTML(c.need, 'need', 'Nothing needed right now.') + '</article>';
    html += '<article class="panel"><h2 class="panel-title">🎁 Outgrown – to pass on</h2>' +
      '<form class="add-tag" data-form="passOn"><input type="text" id="passOn-input" maxlength="60" placeholder="e.g. Blue raincoat (age 8)" aria-label="Add something to pass on"><button class="btn small" type="submit">Add</button></form>' +
      listHTML(c.passOn, 'passOn', 'Tick things off once they’ve gone to a new home.') + '</article>';
    return html;
  }

  /* ================= HEALTH ================= */

  function renderHealth() {
    var p = api.me(), d = personData(p), hl = d.health, t = today();
    var upcoming = hl.appts.filter(function (a) { return a.date >= t; }).sort(function (a, b) { return (a.date + (a.time || '')) < (b.date + (b.time || '')) ? -1 : 1; });
    var past = hl.appts.filter(function (a) { return a.date < t; });

    var html = '<p class="privacy-note">🔒 Health notes stay on this device only. Nothing is sent anywhere.</p>';

    html += '<article class="panel"><div class="panel-head"><h2 class="panel-title">📅 Appointments</h2>' +
      '<button class="btn small" data-health="appt">+ Add</button></div>' +
      (upcoming.length ? '<ul class="event-list">' + upcoming.map(function (a) {
        return '<li class="click-row" data-appt="' + a.id + '" tabindex="0" role="button"><span class="ev-icon" aria-hidden="true">🩺</span><div>' +
          '<div class="ev-date">' + esc(fmtKey(a.date, { weekday: 'short', day: 'numeric', month: 'short' })) + (a.time ? ' · ' + esc(a.time) : '') + '</div>' +
          '<div class="ev-title">' + esc(a.what) + '</div>' + (a.where ? '<div class="ev-note">' + esc(a.where) + '</div>' : '') + '</div></li>';
      }).join('') + '</ul>' : '<p class="small-note">No appointments coming up. They’ll show on My Day and in Months ahead.</p>') +
      (past.length ? '<p class="small-note">' + past.length + ' past appointment' + (past.length === 1 ? '' : 's') + '. <button class="link-btn" data-health="clear-past">Clear them</button></p>' : '') +
      '</article>';

    html += '<article class="panel"><div class="panel-head"><h2 class="panel-title">💊 Medicines & routines</h2>' +
      '<button class="btn small" data-health="med">+ Add</button></div>' +
      (hl.meds.length ? '<ul class="event-list">' + hl.meds.map(function (m) {
        return '<li class="click-row" data-med="' + m.id + '" tabindex="0" role="button"><span class="ev-icon" aria-hidden="true">💊</span><div>' +
          '<div class="ev-title">' + esc(m.name) + '</div>' + (m.when ? '<div class="ev-note">' + esc(m.when) + '</div>' : '') +
          (m.daily ? '<div class="ev-date">Shown on My Day</div>' : '') + '</div></li>';
      }).join('') + '</ul>' : '<p class="small-note">Inhalers, creams, vitamins or anything taken regularly.</p>') +
      '</article>';

    html += '<article class="panel"><h2 class="panel-title">🗓️ Check-ups</h2><div class="checkup-list">' + CHECKUPS.map(function (c) {
      var v = hl.checkups[c.id] || '';
      return '<label class="checkup"><span class="checkup-name">' + c.emoji + ' ' + c.label + '</span>' +
        '<input type="date" data-checkup="' + c.id + '" value="' + esc(v) + '" aria-label="Last ' + c.label + '">' +
        '<span class="checkup-ago">' + (v ? esc(monthsAgo(v)) : 'not set') + '</span></label>';
    }).join('') + '</div><p class="small-note">Put in the date of the last visit to see how long ago it was.</p></article>';

    html += '<article class="panel"><h2 class="panel-title">📝 Allergies & important notes</h2>' +
      '<textarea id="health-notes" rows="4" maxlength="1000" placeholder="e.g. Allergic to penicillin. Hay fever in summer.">' + esc(hl.notes || '') + '</textarea>' +
      '<p class="small-note">Saves as you type.</p></article>';
    return html;
  }

  function editAppt(id) {
    var hl = personData().health;
    var a = hl.appts.filter(function (x) { return x.id === id; })[0] || { date: today(), time: '', what: '', where: '' };
    var body = '<label class="field"><span class="field-label">What is it?</span><input type="text" id="hd-what" maxlength="60" value="' + esc(a.what) + '" placeholder="e.g. Dentist check-up"></label>' +
      '<div class="two-col"><label class="field"><span class="field-label">Day</span><input type="date" id="hd-date" value="' + esc(a.date) + '"></label>' +
      '<label class="field"><span class="field-label">Time <span class="optional">(optional)</span></span><input type="time" id="hd-time" value="' + esc(a.time || '') + '"></label></div>' +
      '<label class="field"><span class="field-label">Where <span class="optional">(optional)</span></span><input type="text" id="hd-where" maxlength="80" value="' + esc(a.where || '') + '" placeholder="e.g. Taunton dental surgery"></label>';
    openDialog(a.id ? 'Change appointment' : 'Add an appointment', body, function () {
      var what = $('#hd-what').value.trim(), date = $('#hd-date').value;
      if (!what || !date) { api.toast('Add what it is and the day'); return false; }
      var rec = { id: a.id || api.uid(), what: what, date: date, time: $('#hd-time').value, where: $('#hd-where').value.trim() };
      hl.appts = hl.appts.filter(function (x) { return x.id !== rec.id; }).concat([rec]);
      return true;
    }, a.id ? function () { hl.appts = hl.appts.filter(function (x) { return x.id !== a.id; }); } : null);
  }

  function editMed(id) {
    var hl = personData().health;
    var m = hl.meds.filter(function (x) { return x.id === id; })[0] || { name: '', when: '', daily: false };
    var body = '<label class="field"><span class="field-label">Name</span><input type="text" id="hd-med" maxlength="60" value="' + esc(m.name) + '" placeholder="e.g. Blue inhaler"></label>' +
      '<label class="field"><span class="field-label">When <span class="optional">(optional)</span></span><input type="text" id="hd-when" maxlength="80" value="' + esc(m.when || '') + '" placeholder="e.g. Morning and bedtime"></label>' +
      '<label class="switch-row"><input type="checkbox" id="hd-daily"' + (m.daily ? ' checked' : '') + '><span class="switch" aria-hidden="true"></span><span>Show on My Day as a gentle reminder</span></label>';
    openDialog(m.id ? 'Change' : 'Add a medicine or routine', body, function () {
      var name = $('#hd-med').value.trim();
      if (!name) { api.toast('Add a name first'); return false; }
      var rec = { id: m.id || api.uid(), name: name, when: $('#hd-when').value.trim(), daily: $('#hd-daily').checked };
      hl.meds = hl.meds.filter(function (x) { return x.id !== rec.id; }).concat([rec]);
      return true;
    }, m.id ? function () { hl.meds = hl.meds.filter(function (x) { return x.id !== m.id; }); } : null);
  }

  /* ================= BIRTHDAYS ================= */

  function renderBirthdays() {
    var list = home().birthdays.map(function (b) { return { b: b, n: nextBirthday(b) }; })
      .sort(function (x, y) { return x.n.inDays - y.n.inDays; });
    var html = '<div class="panel-head" style="margin-bottom:12px"><p class="view-sub" style="margin:0">Family and friends, in order of what’s coming next.</p>' +
      '<button class="btn small" data-bday="add">+ Add</button></div>';
    if (!list.length) {
      return html + '<div class="empty"><div class="empty-emoji" aria-hidden="true">🎂</div><p class="empty-title">No birthdays yet</p>' +
        '<p class="empty-sub">Add family and friends. You’ll see them coming up on My Day.</p>' +
        '<button class="btn btn-primary" data-bday="add">Add a birthday</button></div>';
    }
    html += '<ul class="bday-list">' + list.map(function (x) {
      var n = x.n;
      var when = n.inDays === 0 ? '🎉 Today!' : n.inDays === 1 ? 'Tomorrow' : 'In ' + n.inDays + ' days';
      return '<li class="bday' + (n.inDays === 0 ? ' today' : '') + '" data-bday-edit="' + x.b.id + '" tabindex="0" role="button">' +
        '<span class="bday-emoji" aria-hidden="true">' + esc(x.b.emoji || '🎂') + '</span>' +
        '<div class="bday-main"><div class="bday-name">' + esc(x.b.name) + '</div>' +
        '<div class="bday-date">' + esc(fmtKey(n.key, { weekday: 'short', day: 'numeric', month: 'long' })) +
        (n.turns && n.turns > 0 ? ' · turns ' + n.turns : '') + '</div></div>' +
        '<span class="bday-when">' + when + '</span></li>';
    }).join('') + '</ul>';
    return html;
  }

  function editBirthday(id) {
    var h = home();
    var b = h.birthdays.filter(function (x) { return x.id === id; })[0] || { name: '', day: 1, month: +today().slice(5, 7), year: null, emoji: '🎂' };
    var days = '', months = '';
    for (var i = 1; i <= 31; i++) days += '<option value="' + i + '"' + (i === b.day ? ' selected' : '') + '>' + i + '</option>';
    MONTHS.forEach(function (m, i) { months += '<option value="' + (i + 1) + '"' + (i + 1 === b.month ? ' selected' : '') + '>' + m + '</option>'; });
    var emojis = ['🎂', '🎈', '🎁', '👵', '👴', '👩', '👨', '👧', '👦', '👶', '🐶', '🐱', '⭐', '💛'];
    var body = '<label class="field"><span class="field-label">Name</span><input type="text" id="hd-bname" maxlength="40" value="' + esc(b.name) + '" placeholder="e.g. Grandma"></label>' +
      '<div class="two-col"><label class="field"><span class="field-label">Day</span><select id="hd-bday">' + days + '</select></label>' +
      '<label class="field"><span class="field-label">Month</span><select id="hd-bmonth">' + months + '</select></label></div>' +
      '<label class="field"><span class="field-label">Year born <span class="optional">(optional – shows their age)</span></span>' +
      '<input type="text" inputmode="numeric" id="hd-byear" maxlength="4" value="' + (b.year || '') + '" placeholder="e.g. 2015"></label>' +
      '<fieldset class="field"><legend class="field-label">Picture</legend><div class="emoji-row wrap" id="hd-bemoji">' +
      emojis.map(function (e) { return '<button type="button" class="emoji-opt" role="radio" data-bemoji="' + e + '" aria-checked="' + (e === (b.emoji || '🎂')) + '">' + e + '</button>'; }).join('') +
      '</div></fieldset>';
    openDialog(b.id ? 'Change birthday' : 'Add a birthday', body, function () {
      var name = $('#hd-bname').value.trim();
      if (!name) { api.toast('Add a name first'); return false; }
      var yr = parseInt($('#hd-byear').value, 10);
      var picked = document.querySelector('#hd-bemoji [aria-checked="true"]');
      var rec = { id: b.id || api.uid(), name: name, day: +$('#hd-bday').value, month: +$('#hd-bmonth').value,
        year: yr > 1900 && yr <= +today().slice(0, 4) ? yr : null, emoji: picked ? picked.dataset.bemoji : '🎂' };
      h.birthdays = h.birthdays.filter(function (x) { return x.id !== rec.id; }).concat([rec]);
      return true;
    }, b.id ? function () { h.birthdays = h.birthdays.filter(function (x) { return x.id !== b.id; }); } : null);
  }

  /* ================= Rendering & events ================= */

  var TABS = [
    { id: 'meals', label: '🍲 Meals' },
    { id: 'selfcare', label: '💚 Self-care' },
    { id: 'clothes', label: '👕 Clothes' },
    { id: 'health', label: '🩺 Health' },
    { id: 'birthdays', label: '🎂 Birthdays' }
  ];

  function render() {
    if (!api.me()) return;
    $('#home-tabs').innerHTML = TABS.map(function (t) {
      return '<button role="tab" class="chip-btn tab-chip" data-home-tab="' + t.id + '" aria-selected="' + (t.id === tab) + '">' + t.label + '</button>';
    }).join('');
    var body = { meals: renderMeals, selfcare: renderSelfcare, clothes: renderClothes, health: renderHealth, birthdays: renderBirthdays }[tab]();
    $('#home-body').innerHTML = body;
  }

  function changed(msg) {
    save();
    render();
    if (msg) api.toast(msg);
  }

  function addToList(kind, inputId) {
    var input = $('#' + inputId);
    var v = input.value.trim();
    if (!v) return;
    if (kind === 'shop') home().shopping.push({ id: api.uid(), text: v, done: false });
    else personData().clothes[kind].push({ id: api.uid(), text: v, done: false });
    save(); render();
    var again = $('#' + inputId);
    if (again) again.focus();
  }

  function bind() {
    var body = $('#home-body');

    $('#home-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-home-tab]');
      if (!b) return;
      tab = b.dataset.homeTab;
      clearInterval(breatheTimer);
      render();
    });

    body.addEventListener('submit', function (e) {
      var f = e.target.closest('[data-form]');
      if (!f) return;
      e.preventDefault();
      var kind = f.dataset.form;
      addToList(kind, kind === 'shop' ? 'shop-input' : kind + '-input');
    });

    body.addEventListener('click', function (e) {
      var t;
      // Meals
      if ((t = e.target.closest('[data-week]'))) {
        var n = +t.dataset.week;
        weekStart = n === 0 ? mondayOf(today()) : api.Sky.addDays(weekStart, n * 7);
        render(); return;
      }
      if ((t = e.target.closest('[data-meal]'))) { editMeal(t.dataset.meal); return; }
      if ((t = e.target.closest('[data-shop-tick]'))) {
        home().shopping.forEach(function (x) { if (x.id === t.dataset.shopTick) x.done = !x.done; });
        changed(); return;
      }
      if ((t = e.target.closest('[data-shop-del]'))) {
        home().shopping = home().shopping.filter(function (x) { return x.id !== t.dataset.shopDel; });
        changed(); return;
      }
      if ((t = e.target.closest('[data-shop]'))) {
        if (t.dataset.shop === 'clear') { home().shopping = home().shopping.filter(function (x) { return !x.done; }); changed('Cleared ✓'); }
        if (t.dataset.shop === 'copy') {
          var text = home().shopping.filter(function (x) { return !x.done; }).map(function (x) { return '• ' + x.text; }).join('\n');
          if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { api.toast('Copied – paste it into a message ✓'); }, function () { api.toast('Couldn’t copy on this device'); });
          else api.toast('Couldn’t copy on this device');
        }
        return;
      }
      if ((t = e.target.closest('[data-fav-del]'))) {
        home().mealFavs.splice(+t.dataset.favDel, 1); changed(); return;
      }
      // Self-care
      if ((t = e.target.closest('[data-mood]'))) {
        var sc = personData().selfcare, k = today();
        sc.mood[k] = sc.mood[k] === t.dataset.mood ? undefined : t.dataset.mood;
        if (!sc.mood[k]) delete sc.mood[k];
        changed(); return;
      }
      if ((t = e.target.closest('[data-sc-tick]'))) {
        var days = personData().selfcare.days, key = today();
        var list = days[key] = days[key] || [];
        var i = list.indexOf(t.dataset.scTick);
        if (i >= 0) list.splice(i, 1); else list.push(t.dataset.scTick);
        // keep only the last fortnight so the saved file stays small
        Object.keys(days).forEach(function (d) { if (api.Sky.daysBetween(d, key) > 14) delete days[d]; });
        changed(i < 0 ? '💚' : null); return;
      }
      if ((t = e.target.closest('[data-sc]'))) {
        if (t.dataset.sc === 'choose') chooseSelfcare();
        if (t.dataset.sc === 'breathe') breathe();
        return;
      }
      // Clothes
      if ((t = e.target.closest('[data-list-tick]'))) {
        var pr = t.dataset.listTick.split(':');
        personData().clothes[pr[0]].forEach(function (x) { if (x.id === pr[1]) x.done = !x.done; });
        changed(); return;
      }
      if ((t = e.target.closest('[data-list-del]'))) {
        var pd = t.dataset.listDel.split(':');
        var c = personData().clothes;
        c[pd[0]] = c[pd[0]].filter(function (x) { return x.id !== pd[1]; });
        changed(); return;
      }
      // Health
      if ((t = e.target.closest('[data-health]'))) {
        if (t.dataset.health === 'appt') editAppt(null);
        if (t.dataset.health === 'med') editMed(null);
        if (t.dataset.health === 'clear-past') {
          var hl = personData().health;
          hl.appts = hl.appts.filter(function (a) { return a.date >= today(); });
          changed('Cleared ✓');
        }
        return;
      }
      if ((t = e.target.closest('[data-appt]'))) { editAppt(t.dataset.appt); return; }
      if ((t = e.target.closest('[data-med]'))) { editMed(t.dataset.med); return; }
      // Birthdays
      if ((t = e.target.closest('[data-bday]'))) { editBirthday(null); return; }
      if ((t = e.target.closest('[data-bday-edit]'))) { editBirthday(t.dataset.bdayEdit); return; }
    });

    body.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-appt], [role="button"][data-med], [role="button"][data-bday-edit]')) {
        e.preventDefault();
        e.target.click();
      }
    });

    body.addEventListener('change', function (e) {
      var t = e.target;
      if (t.dataset.size) {
        var sz = personData().clothes.sizes;
        sz[t.dataset.size] = t.value.trim();
        sz.checked = today();
        changed('Saved ✓');
      }
      if (t.dataset.checkup) {
        personData().health.checkups[t.dataset.checkup] = t.value;
        changed();
      }
    });

    var notesTimer = null;
    body.addEventListener('input', function (e) {
      if (e.target.id === 'health-notes') {
        clearTimeout(notesTimer);
        var v = e.target.value;
        notesTimer = setTimeout(function () { personData().health.notes = v; save(); }, 400);
      }
    });

    // Dialog
    $('#home-form').addEventListener('submit', function (e) {
      e.preventDefault();
      if (dialogSave && dialogSave() !== false) { closeDialog(); changed('Saved ✓'); }
    });
    $('#home-dialog-delete').addEventListener('click', function () {
      var btn = this;
      if (btn.dataset.armed !== '1') { btn.dataset.armed = '1'; btn.textContent = 'Tap again to remove'; return; }
      if (dialogDelete) dialogDelete();
      closeDialog();
      changed('Removed');
    });
    $('#home-dialog-body').addEventListener('click', function (e) {
      var t;
      if ((t = e.target.closest('[data-pick-fav]'))) { $('#hd-meal').value = t.dataset.pickFav; return; }
      if ((t = e.target.closest('[data-sc-choose]'))) { t.setAttribute('aria-pressed', String(t.getAttribute('aria-pressed') !== 'true')); return; }
      if ((t = e.target.closest('[data-bemoji]'))) {
        Array.prototype.forEach.call(document.querySelectorAll('#hd-bemoji .emoji-opt'), function (x) { x.setAttribute('aria-checked', String(x === t)); });
        return;
      }
      if (e.target.id === 'hd-sc-add') {
        var inp = $('#hd-sc-new'), v = inp.value.trim();
        if (!v) return;
        var d = personData();
        var item = { id: 'c' + api.uid(), emoji: '⭐', label: v.slice(0, 40) };
        d.selfcare.custom.push(item);
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'chip-btn'; b.dataset.scChoose = item.id;
        b.setAttribute('aria-pressed', 'true'); b.textContent = '⭐ ' + item.label;
        $('#hd-sc').appendChild(b);
        inp.value = '';
      }
    });
    $('#home-dialog-body').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.id === 'hd-sc-new') { e.preventDefault(); $('#hd-sc-add').click(); }
    });
  }

  global.Home = {
    init: function (helpers) { api = helpers; bind(); },
    render: render,
    personalEvents: personalEvents,
    dayNotes: dayNotes,
    stopBreathing: function () { clearInterval(breatheTimer); },
    forgetPerson: function (id) { if (api.state().home && api.state().home.people) delete api.state().home.people[id]; }
  };
})(window);
