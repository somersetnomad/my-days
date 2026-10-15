/*
  My Days · Somerset — main app
  Everything is saved in this browser (localStorage). No accounts, no server.
*/
(function () {
  'use strict';

  var KEY = 'somerset-day-planner-v1';
  var APP_VERSION = '9';
  var swReg = null;
  var COLOURS = ['#3b7656', '#47769f', '#c97e1f', '#a55a8a', '#7a5fb0', '#c0563f', '#2f8f8a', '#8a7a2c'];
  var AVATARS = ['🦊', '🦉', '🐝', '🐞', '🦔', '🐴', '🐸', '🦋', '🐢', '🐬', '🐱', '🐶', '🦕', '🐉', '🌻', '🚀', '⚽', '🎸'];
  var CARD_EMOJIS = ['⭐', '🌿', '🎨', '🔨', '📚', '🧁', '🚲', '🐴', '🐕', '💻', '🎵', '⚽', '🧩', '🌳',
    '🏊', '🎮', '✏️', '🔬', '🧵', '🍳', '🛝', '🛋️', '🚂', '🌙', '🧘', '🤸', '🎭', '📷'];
  var STARTER_TAGS = ['animals', 'art', 'baking', 'building', 'coding', 'dance', 'drawing', 'football',
    'gaming', 'horses', 'music', 'nature', 'reading', 'science', 'space', 'writing'];

  /* ---------- Little helpers ---------- */
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function catById(id) {
    for (var i = 0; i < Ideas.CATEGORIES.length; i++) if (Ideas.CATEGORIES[i].id === id) return Ideas.CATEGORIES[i];
    return null;
  }

  /* ---------- Saved data ---------- */
  function fresh() {
    return { version: 1, profiles: [], activeId: null, plans: {}, series: {}, order: {}, spotted: {},
      settings: { theme: 'auto', sound: true, remindSound: true, calm: false } };
  }

  function migrate(d) {
    var s = fresh();
    if (!d || typeof d !== 'object') return s;
    if (Array.isArray(d.profiles)) {
      s.profiles = d.profiles.filter(function (p) { return p && p.id && p.name; }).map(function (p) {
        return {
          id: String(p.id), name: String(p.name).slice(0, 30),
          avatar: p.avatar || '🙂', colour: p.colour || COLOURS[0],
          tags: Array.isArray(p.tags) ? p.tags.map(String) : []
        };
      });
    }
    if (d.plans && typeof d.plans === 'object') s.plans = d.plans;
    if (d.spotted && typeof d.spotted === 'object') s.spotted = d.spotted;
    if (d.home && typeof d.home === 'object') s.home = d.home;
    if (d.series && typeof d.series === 'object') s.series = d.series;
    if (d.order && typeof d.order === 'object') s.order = d.order;
    if (d.settings) Object.assign(s.settings, d.settings);
    s.activeId = d.activeId;
    if (!s.profiles.some(function (p) { return p.id === s.activeId; })) {
      s.activeId = s.profiles[0] ? s.profiles[0].id : null;
    }
    return s;
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return migrate(JSON.parse(raw));
    } catch (e) { /* storage blocked or broken */ }
    return fresh();
  }

  var saveWarned = false;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) {
      if (!saveWarned) { toast('This browser isn’t letting us save. Try “Export my plans” to keep a copy.'); saveWarned = true; }
    }
  }

  var state = load();

  function me() {
    for (var i = 0; i < state.profiles.length; i++) if (state.profiles[i].id === state.activeId) return state.profiles[i];
    return state.profiles[0] || null;
  }
  function plansFor(key, person) {
    person = person || me();
    if (!person) return [];
    var byPerson = state.plans[person.id] || {};
    return byPerson[key] || [];
  }
  function setPlans(key, list) {
    var p = me();
    if (!p) return;
    state.plans[p.id] = state.plans[p.id] || {};
    if (list.length) state.plans[p.id][key] = list; else delete state.plans[p.id][key];
    save();
  }
  function findCard(id) {
    var list = plansFor(ui.dayKey);
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  /* ---------- Repeating plans ---------- */
  function seriesFor(person) {
    person = person || me();
    if (!person) return [];
    state.series = state.series || {};
    return state.series[person.id] = state.series[person.id] || [];
  }
  function getSeries(id) {
    var list = seriesFor();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function occurrence(sr, key) {
    return {
      id: sr.id + '@' + key, seriesId: sr.id, date: key,
      title: sr.title, emoji: sr.emoji, cat: sr.cat, tags: sr.tags || [], time: sr.time || '',
      notes: sr.notes || '', remind: sr.remind, done: !!(sr.done && sr.done[key]), repeat: Repeat.describe(sr)
    };
  }

  // Everything on a day: one-off plans plus repeating plans, in the person's chosen order
  function itemsFor(key, person) {
    person = person || me();
    if (!person) return [];
    var once = plansFor(key, person).slice();
    var reps = seriesFor(person).filter(function (sr) { return Repeat.occursOn(sr, key); })
      .map(function (sr) { return occurrence(sr, key); })
      .sort(function (a, b) { return (a.time || '99') < (b.time || '99') ? -1 : 1; });
    var all = once.concat(reps);
    var order = (state.order && state.order[person.id] && state.order[person.id][key]) || [];
    if (order.length) {
      var pos = function (it, i) { var k = order.indexOf(it.id); return k >= 0 ? k : 1000 + i; };
      var ranked = all.map(function (it, i) { return { it: it, r: pos(it, i) }; });
      ranked.sort(function (a, b) { return a.r - b.r; });
      all = ranked.map(function (x) { return x.it; });
    }
    return all;
  }
  function findItem(id) {
    var list = itemsFor(ui.dayKey);
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  /* ---------- UI state ---------- */
  var today = Sky.dayKey();
  var ui = {
    view: 'day',
    dayKey: today,
    calMonth: today.slice(0, 7),
    calSelected: today,
    natureTab: 'birds',
    natureMonth: +today.slice(5, 7),
    monthsCount: 6,
    monthsFilter: 'all',
    prevView: 'day',
    ideasMode: 'season',
    ideasCat: null,
    editingId: null,
    personId: null,
    form: { emoji: '⭐', cat: null, tags: [] },
    pform: { avatar: AVATARS[0], colour: COLOURS[0], tags: [] }
  };

  function dayLabel(key) {
    var diff = Sky.daysBetween(today, key);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    return Sky.fmtKey(key, { weekday: 'long' });
  }
  function shortDate(key) { return Sky.fmtKey(key, { weekday: 'short', day: 'numeric', month: 'short' }); }
  function longDate(key) { return Sky.fmtKey(key, { weekday: 'long', day: 'numeric', month: 'long' }); }

  /* ---------- Look & feel ---------- */
  function applyTheme() {
    var root = document.documentElement;
    if (state.settings.theme === 'light' || state.settings.theme === 'dark') root.setAttribute('data-theme', state.settings.theme);
    else root.removeAttribute('data-theme');
    root.classList.toggle('calm', !!state.settings.calm);
    var p = me();
    var c = p ? p.colour : COLOURS[0];
    root.style.setProperty('--me', c);
    root.style.setProperty('--me-soft', 'color-mix(in srgb, ' + c + ' 20%, var(--card))');
  }

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function toast(msg, actionLabel, actionFn) {
    var el = $('#toast');
    el.innerHTML = esc(msg) + (actionLabel ? ' <button type="button">' + esc(actionLabel) + '</button>' : '');
    if (actionLabel) {
      $('button', el).onclick = function () { el.classList.remove('show'); actionFn(); };
    }
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, actionLabel ? 5000 : 2600);
  }

  /* ---------- Header ---------- */
  function renderHeader() {
    var p = me();
    $('#who-avatar').textContent = p ? p.avatar : '🙂';
    $('#who-name').textContent = p ? p.name : 'Me';
  }

  function renderWhoMenu() {
    var menu = $('#who-menu');
    var html = state.profiles.map(function (p) {
      return '<button role="menuitemradio" aria-checked="' + (p.id === state.activeId) + '" data-person="' + esc(p.id) + '">' +
        '<span class="mini-avatar" style="background:' + esc(p.colour) + '33;box-shadow:inset 0 0 0 3px ' + esc(p.colour) + '">' + esc(p.avatar) + '</span>' +
        '<span>' + esc(p.name) + '</span></button>';
    }).join('');
    html += '<hr><button role="menuitem" data-menu="add">➕ Add a person</button>' +
      '<button role="menuitem" data-menu="settings">⚙️ Settings</button>';
    menu.innerHTML = html;
  }

  function toggleWhoMenu(open) {
    var menu = $('#who-menu'), btn = $('#who-btn');
    if (open === undefined) open = menu.hidden;
    if (open) renderWhoMenu();
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) { var first = $('button', menu); if (first) first.focus(); }
  }

  function switchPerson(id) {
    state.activeId = id;
    save();
    applyTheme();
    renderAll();
    var p = me();
    toast('Hello, ' + p.name + ' ' + p.avatar);
  }

  /* ---------- Clock ---------- */
  function tickClock() {
    var now = new Date();
    var hm = Sky.fmt(now, { hour: '2-digit', minute: '2-digit', hour12: false });
    $('#hero-clock').textContent = hm;
    $('#mini-clock').textContent = hm;
    var k = Sky.dayKey(now);
    if (k !== today) {
      var wasToday = ui.dayKey === today;
      today = k;
      if (wasToday) ui.dayKey = k;
      renderAll();
    }
  }

  /* ---------- My Day ---------- */
  function heroChips() {
    var chips = [];
    var season = Sky.seasonInfo(new Date());
    if (season) chips.push('<span class="chip">' + season.emoji + ' ' + season.name + '</span>');
    var m = Sky.moonNow(new Date());
    chips.push('<span class="chip">' + Sky.moonSVG(m.phase, m.name) + ' ' + m.name + '</span>');
    var sun = Sky.sunTimes(today);
    chips.push('<span class="chip" aria-label="Sunrise ' + Sky.fmtTime(sun.sunrise) + ', sunset ' + Sky.fmtTime(sun.sunset) + '">🌅 ' +
      Sky.fmtTime(sun.sunrise) + ' · 🌇 ' + Sky.fmtTime(sun.sunset) + '</span>');
    return chips.join('');
  }

  function cardHTML(c) {
    var meta = [];
    if (c.time) meta.push('<span class="meta time">🕒 ' + esc(c.time) + '</span>');
    if (c.repeat) meta.push('<span class="meta repeat">🔁 ' + esc(c.repeat) + '</span>');
    if (c.remind !== undefined && c.remind !== null && c.remind !== '' && c.time) {
      meta.push('<span class="meta remind" title="' + esc(Reminders.label(c.remind)) + '">🔔 ' + esc(shortRemind(c.remind)) + '</span>');
    }
    var cat = catById(c.cat);
    if (cat) meta.push('<span class="meta">' + cat.emoji + ' ' + esc(cat.short) + '</span>');
    (c.tags || []).forEach(function (t) { meta.push('<span class="meta tag">' + esc(t) + '</span>'); });
    return '<li class="card' + (c.done ? ' is-done' : '') + '" data-id="' + esc(c.id) + '">' +
      '<button class="done-btn" aria-pressed="' + !!c.done + '" aria-label="Done: ' + esc(c.title) + '">' +
        '<span class="tick"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span></button>' +
      '<div class="card-body" role="button" tabindex="0" aria-label="Change ' + esc(c.title) + '">' +
        '<div class="card-title"><span class="emoji" aria-hidden="true">' + esc(c.emoji || '⭐') + '</span>' +
        '<span class="card-title-text">' + esc(c.title) + '</span></div>' +
        (meta.length ? '<div class="card-meta">' + meta.join('') + '</div>' : '') +
        (c.notes ? '<div class="card-notes">' + esc(c.notes) + '</div>' : '') +
      '</div>' +
      '<button class="drag-handle" aria-label="Move ' + esc(c.title) + ' up or down. Use the arrow keys.">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="6" r="1.8"/><circle cx="15" cy="6" r="1.8"/><circle cx="9" cy="12" r="1.8"/><circle cx="15" cy="12" r="1.8"/><circle cx="9" cy="18" r="1.8"/><circle cx="15" cy="18" r="1.8"/></svg>' +
      '</button></li>';
  }

  function shortRemind(r) {
    r = +r;
    if (r === 0) return 'On time';
    if (r < 60) return r + ' min before';
    if (r < 1440) return (r / 60) + ' hr before';
    return 'Day before';
  }

  function skyNotesHTML(key) {
    return Sky.eventsOn(key).map(function (e) {
      return '<li><span class="ev-icon" aria-hidden="true">' + e.icon + '</span><div><strong>' + esc(e.title) +
        '</strong><span class="note">' + esc(e.note) + '</span></div></li>';
    }).join('');
  }

  function renderDay() {
    $('#hero-date').textContent = longDate(today);
    $('#hero-chips').innerHTML = heroChips();

    var label = dayLabel(ui.dayKey);
    var isRelative = ['Today', 'Tomorrow', 'Yesterday'].indexOf(label) >= 0;
    $('#day-heading').innerHTML = isRelative && label !== 'Today'
      ? esc(label) + ' <small style="display:block;font-size:.95rem;font-weight:600;color:var(--ink-2)">' + esc(shortDate(ui.dayKey)) + '</small>'
      : (label === 'Today' ? 'Today' : esc(longDate(ui.dayKey)));
    $('#back-today').hidden = ui.dayKey === today;

    $('#day-sky-notes').innerHTML = skyNotesHTML(ui.dayKey);
    $('#day-home-notes').innerHTML = Home.dayNotes(ui.dayKey).map(function (n) {
      return '<li><span class="ev-icon" aria-hidden="true">' + n.icon + '</span><div><strong>' + esc(n.title) +
        '</strong>' + (n.note ? '<span class="note">' + esc(n.note) + '</span>' : '') + '</div></li>';
    }).join('');

    var list = itemsFor(ui.dayKey);
    $('#card-list').innerHTML = list.map(cardHTML).join('');
    $('#day-empty').hidden = list.length > 0;
    $('#add-btn').hidden = list.length === 0; // the empty message has its own big Add button
    $('#add-btn').setAttribute('aria-label', 'Add something to ' + (label === 'Today' ? 'today' : longDate(ui.dayKey)));
  }

  function goDay(delta) {
    ui.dayKey = Sky.addDays(ui.dayKey, delta);
    renderDay();
  }

  function toggleDone(id) {
    if (id.indexOf('@') > 0) {
      var sr = getSeries(id.split('@')[0]);
      if (!sr) return;
      sr.done = sr.done || {};
      if (sr.done[ui.dayKey]) delete sr.done[ui.dayKey]; else sr.done[ui.dayKey] = true;
      // only keep ticks from the last few months
      Object.keys(sr.done).forEach(function (k) { if (Sky.daysBetween(k, today) > 120) delete sr.done[k]; });
      save();
    } else {
      var list = plansFor(ui.dayKey);
      list.forEach(function (c) { if (c.id === id) c.done = !c.done; });
      setPlans(ui.dayKey, list);
    }
    var li = $('.card[data-id="' + CSS.escape(id) + '"]');
    var card = findItem(id);
    if (li && card) {
      li.classList.toggle('is-done', !!card.done);
      li.classList.toggle('just-done', !!card.done);
      $('.done-btn', li).setAttribute('aria-pressed', String(!!card.done));
    }
  }

  function saveOrderFromDOM() {
    var ids = $$('#card-list .card').map(function (li) { return li.getAttribute('data-id'); });
    var list = plansFor(ui.dayKey);
    list.sort(function (a, b) { return ids.indexOf(a.id) - ids.indexOf(b.id); });
    setPlans(ui.dayKey, list);
    var p = me();
    if (p && ids.some(function (id) { return id.indexOf('@') > 0; })) {
      state.order = state.order || {};
      state.order[p.id] = state.order[p.id] || {};
      state.order[p.id][ui.dayKey] = ids;
      // tidy old orders
      Object.keys(state.order[p.id]).forEach(function (k) { if (Sky.daysBetween(k, today) > 60) delete state.order[p.id][k]; });
      save();
    }
  }

  /* Drag to reorder (works with mouse, touch and pen) */
  var drag = null;
  function onHandleDown(e) {
    var handle = e.target.closest('.drag-handle');
    if (!handle) return;
    e.preventDefault();
    var card = handle.closest('.card');
    handle.setPointerCapture(e.pointerId);
    drag = { card: card, handle: handle, startY: e.clientY, origTop: card.offsetTop };
    card.classList.add('dragging');
  }
  function onHandleMove(e) {
    if (!drag) return;
    var card = drag.card, list = card.parentNode;
    var desired = drag.origTop + (e.clientY - drag.startY);
    var centre = desired + card.offsetHeight / 2;
    var next = card.nextElementSibling, prev = card.previousElementSibling;
    if (next && centre > next.offsetTop + next.offsetHeight / 2) list.insertBefore(next, card);
    else if (prev && centre < prev.offsetTop + prev.offsetHeight / 2) list.insertBefore(card, prev);
    card.style.transform = 'translateY(' + (desired - card.offsetTop) + 'px)';
  }
  function onHandleUp() {
    if (!drag) return;
    drag.card.style.transform = '';
    drag.card.classList.remove('dragging');
    drag = null;
    saveOrderFromDOM();
  }
  function onHandleKey(e) {
    var handle = e.target.closest('.drag-handle');
    if (!handle || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    var card = handle.closest('.card'), list = card.parentNode;
    if (e.key === 'ArrowUp' && card.previousElementSibling) list.insertBefore(card, card.previousElementSibling);
    else if (e.key === 'ArrowDown' && card.nextElementSibling) list.insertBefore(card.nextElementSibling, card);
    else return;
    handle.focus();
    saveOrderFromDOM();
    var pos = $$('#card-list .card').indexOf(card) + 1;
    toast('Moved to number ' + pos);
  }

  /* ---------- Add / change dialog ---------- */
  function renderFormEmoji() {
    $('#f-emoji').innerHTML = CARD_EMOJIS.map(function (em) {
      return '<button type="button" role="radio" class="emoji-opt" aria-checked="' + (em === ui.form.emoji) + '" data-emoji="' + em + '" aria-label="' + em + '">' + em + '</button>';
    }).join('');
  }
  function renderFormCats() {
    $('#f-cat').innerHTML = Ideas.CATEGORIES.map(function (c) {
      return '<button type="button" class="chip-btn" aria-pressed="' + (ui.form.cat === c.id) + '" data-cat="' + c.id + '">' + c.emoji + ' ' + esc(c.label) + '</button>';
    }).join('');
  }
  function renderFormTags() {
    var p = me();
    var all = (p ? p.tags : []).slice();
    ui.form.tags.forEach(function (t) { if (all.indexOf(t) < 0) all.push(t); });
    $('#f-tags').innerHTML = all.length
      ? all.map(function (t) {
        return '<button type="button" class="chip-btn" aria-pressed="' + (ui.form.tags.indexOf(t) >= 0) + '" data-tag="' + esc(t) + '">' + esc(t) + '</button>';
      }).join('')
      : '<span class="optional">Add things you love, like “horses” or “coding”.</span>';
  }

  function renderRepeatFields() {
    var rule = $('#f-repeat').value;
    $('#f-days-wrap').hidden = rule !== 'days';
    $('#f-until-wrap').hidden = !rule;
    $('#f-days').innerHTML = Repeat.DOW_SHORT.map(function (d, i) {
      return '<button type="button" class="chip-btn" data-dow="' + i + '" aria-pressed="' + (ui.form.days.indexOf(i) >= 0) + '">' + d + '</button>';
    }).join('');
    $('#f-remind-hint').hidden = !($('#f-remind').value !== '' && !$('#f-time').value);
  }

  function openCardDialog(id, preset) {
    var c = id ? findItem(id) : null;
    var sr = c && c.seriesId ? getSeries(c.seriesId) : null;
    ui.editingId = c ? c.id : null;
    ui.editingSeries = sr ? sr.id : null;
    var src = sr || c || preset || {};
    ui.form = { emoji: src.emoji || '⭐', cat: src.cat || null, tags: (src.tags || []).slice(),
      days: (sr && sr.days ? sr.days.slice() : [Repeat.dow(ui.dayKey)]) };
    $('#f-repeat').innerHTML = Repeat.RULES.map(function (r) {
      return '<option value="' + r.id + '">' + esc(r.label) + '</option>';
    }).join('');
    $('#f-repeat').value = sr ? sr.rule : '';
    $('#f-until').value = sr && sr.until ? sr.until : '';
    $('#f-remind').innerHTML = Reminders.OPTIONS.map(function (o) {
      return '<option value="' + o.v + '">' + esc(o.label) + '</option>';
    }).join('');
    $('#f-remind').value = src.remind === undefined || src.remind === null ? '' : String(src.remind);
    $('#card-dialog-title').textContent = c ? 'Change this' : (ui.dayKey === today ? 'Add to today' : 'Add to ' + shortDate(ui.dayKey));
    $('#f-title').value = src.title || '';
    $('#f-time').value = src.time || '';
    $('#f-notes').value = src.notes || '';
    $('#f-more').open = !!(src.time || src.notes || sr || (src.remind !== undefined && src.remind !== null && src.remind !== ''));
    $('#f-series-info').hidden = !sr;
    if (sr) $('#f-series-info').textContent = '🔁 ' + Repeat.describe(sr) + '. Changes here apply to every repeat.';
    $('#f-move-wrap').hidden = !!sr;
    $('#f-skip').hidden = !sr;
    renderRepeatFields();
    $('#f-newtag').value = '';
    $('#f-edit-extras').hidden = !c;
    $('#f-move-date').value = Sky.addDays(ui.dayKey, 1);
    resetConfirm($('#f-delete'), sr ? 'Remove all repeats' : 'Remove this');
    $('#f-title').removeAttribute('aria-invalid');
    renderFormEmoji(); renderFormCats(); renderFormTags();
    $('#card-dialog').showModal();
    if (!c) setTimeout(function () { $('#f-title').focus(); }, 50);
  }

  function addTagToMe(raw) {
    var t = String(raw || '').trim().toLowerCase().slice(0, 24);
    if (!t) return null;
    var p = me();
    if (p && p.tags.indexOf(t) < 0) { p.tags.push(t); save(); }
    return t;
  }

  function saveCardForm(e) {
    e.preventDefault();
    var title = $('#f-title').value.trim();
    if (!title) {
      $('#f-title').setAttribute('aria-invalid', 'true');
      $('#f-title').focus();
      toast('Give it a name first');
      return;
    }
    var remind = $('#f-remind').value;
    var data = {
      title: title, emoji: ui.form.emoji, cat: ui.form.cat, tags: ui.form.tags.slice(),
      time: $('#f-time').value, notes: $('#f-notes').value.trim(), remind: remind === '' ? null : +remind
    };
    if (data.remind !== null && !data.time) {
      $('#f-more').open = true;
      $('#f-time').focus();
      toast('Add a time so the reminder knows when to ring');
      return;
    }
    var rule = $('#f-repeat').value;
    var until = $('#f-until').value;
    var days = ui.form.days.slice().sort();
    if (rule === 'days' && !days.length) { toast('Pick at least one day'); return; }
    if (until && until < ui.dayKey) { toast('The stop date is before this day'); return; }

    var key = ui.dayKey;
    var wasNew = !ui.editingId;
    var list = plansFor(key);
    var p = me();

    function newSeries(start, done) {
      var sr = Object.assign({ id: uid(), start: start, until: until || '', rule: rule,
        days: rule === 'days' ? days : [], skip: [], done: done || {} }, data);
      seriesFor().push(sr);
      return sr;
    }
    function endSeries(sr, beforeKey) {
      // keep its past days, stop it the day before
      if (sr.start >= beforeKey) {
        state.series[p.id] = seriesFor().filter(function (x) { return x.id !== sr.id; });
      } else {
        sr.until = Sky.addDays(beforeKey, -1);
      }
    }

    if (ui.editingSeries) {
      var sr = getSeries(ui.editingSeries);
      var item = findItem(ui.editingId);
      if (!rule) {
        // turn this day into a one-off, stop the repeats from here
        endSeries(sr, key);
        list.push(Object.assign({ id: uid(), done: !!(item && item.done) }, data));
        setPlans(key, list);
      } else if (rule !== sr.rule || (rule === 'days' && days.join() !== (sr.days || []).join())) {
        // new pattern from this day on
        var keepDone = {};
        if (item && item.done) keepDone[key] = true;
        endSeries(sr, key);
        newSeries(key, keepDone);
      } else {
        Object.assign(sr, data, { until: until || '' });
      }
      save();
    } else if (ui.editingId) {
      var card = findCard(ui.editingId);
      if (rule) {
        list = list.filter(function (c) { return c.id !== ui.editingId; });
        setPlans(key, list);
        var d0 = {};
        if (card && card.done) d0[key] = true;
        newSeries(key, d0);
        save();
      } else {
        list = list.map(function (c) { return c.id === ui.editingId ? Object.assign({}, c, data) : c; });
        setPlans(key, list);
      }
    } else if (rule) {
      newSeries(key);
      save();
    } else {
      data.id = uid(); data.done = false;
      list.push(data);
      setPlans(key, list);
    }
    $('#card-dialog').close();
    renderDay();
    toast(wasNew ? (rule ? 'Added · 🔁 ' + Repeat.describe({ rule: rule, start: key, days: days }) + ' ✓' : 'Added ✓') : 'Saved ✓');
    if (data.remind !== null && Reminders.permission() === 'default') {
      Reminders.ask().then(function () { renderSettingsReminders(); });
    }
  }

  function moveCard(toKey) {
    if (!toKey || toKey === ui.dayKey) return;
    var list = plansFor(ui.dayKey);
    var card = null;
    list = list.filter(function (c) { if (c.id === ui.editingId) { card = c; return false; } return true; });
    if (!card) return;
    // Save any edits made in the form before moving
    card.title = $('#f-title').value.trim() || card.title;
    card.emoji = ui.form.emoji; card.cat = ui.form.cat; card.tags = ui.form.tags.slice();
    card.time = $('#f-time').value; card.notes = $('#f-notes').value.trim();
    setPlans(ui.dayKey, list);
    var target = plansFor(toKey).concat([card]);
    setPlans(toKey, target);
    $('#card-dialog').close();
    renderDay();
    toast('Moved to ' + (toKey === today ? 'today' : shortDate(toKey)), 'Go there', function () {
      ui.dayKey = toKey; renderDay();
    });
  }

  function confirmTwice(btn, label, confirmLabel, action) {
    if (btn.dataset.armed === '1') { resetConfirm(btn, label); action(); return; }
    btn.dataset.armed = '1';
    btn.textContent = confirmLabel;
    clearTimeout(btn._t);
    btn._t = setTimeout(function () { resetConfirm(btn, label); }, 4000);
  }
  function resetConfirm(btn, label) {
    btn.dataset.armed = '';
    btn.textContent = label;
    clearTimeout(btn._t);
  }

  function skipDay() {
    var sr = getSeries(ui.editingSeries);
    if (!sr) return;
    var key = ui.dayKey;
    sr.skip = sr.skip || [];
    sr.skip.push(key);
    save();
    $('#card-dialog').close();
    renderDay();
    toast('Skipped for ' + (key === today ? 'today' : shortDate(key)), 'Undo', function () {
      sr.skip = sr.skip.filter(function (k) { return k !== key; });
      save(); renderDay();
    });
  }

  function deleteSeries() {
    var p = me();
    var all = seriesFor();
    var idx = -1, removed = null;
    all.forEach(function (x, i) { if (x.id === ui.editingSeries) { idx = i; removed = x; } });
    if (!removed) return;
    all.splice(idx, 1);
    save();
    $('#card-dialog').close();
    renderDay();
    toast('Removed all repeats', 'Undo', function () {
      seriesFor().splice(idx, 0, removed);
      save(); renderDay();
    });
  }

  function deleteCard() {
    if (ui.editingSeries) { deleteSeries(); return; }
    var key = ui.dayKey;
    var list = plansFor(key);
    var idx = -1, removed = null;
    list.forEach(function (c, i) { if (c.id === ui.editingId) { idx = i; removed = c; } });
    if (!removed) return;
    list.splice(idx, 1);
    setPlans(key, list);
    $('#card-dialog').close();
    renderDay();
    toast('Removed', 'Undo', function () {
      var l = plansFor(key);
      l.splice(Math.min(idx, l.length), 0, removed);
      setPlans(key, l);
      renderDay();
    });
  }

  /* ---------- People ---------- */
  function renderPersonForm() {
    $('#p-avatar').innerHTML = AVATARS.map(function (a) {
      return '<button type="button" role="radio" class="emoji-opt" aria-checked="' + (a === ui.pform.avatar) + '" data-avatar="' + a + '" aria-label="' + a + '">' + a + '</button>';
    }).join('');
    $('#p-colour').innerHTML = COLOURS.map(function (c, i) {
      return '<button type="button" role="radio" class="colour-opt" style="background:' + c + '" aria-checked="' + (c === ui.pform.colour) + '" data-colour="' + c + '" aria-label="Colour ' + (i + 1) + '"></button>';
    }).join('');
    var all = STARTER_TAGS.slice();
    ui.pform.tags.forEach(function (t) { if (all.indexOf(t) < 0) all.push(t); });
    $('#p-tags').innerHTML = all.map(function (t) {
      return '<button type="button" class="chip-btn" aria-pressed="' + (ui.pform.tags.indexOf(t) >= 0) + '" data-ptag="' + esc(t) + '">' + esc(t) + '</button>';
    }).join('');
  }

  function openPersonDialog(id) {
    var p = null;
    state.profiles.forEach(function (x) { if (x.id === id) p = x; });
    var first = state.profiles.length === 0;
    ui.personId = p ? p.id : null;
    var used = state.profiles.map(function (x) { return x.colour; });
    ui.pform = {
      avatar: p ? p.avatar : AVATARS[state.profiles.length % AVATARS.length],
      colour: p ? p.colour : (COLOURS.filter(function (c) { return used.indexOf(c) < 0; })[0] || COLOURS[0]),
      tags: p ? p.tags.slice() : []
    };
    $('#person-dialog-title').textContent = first ? 'Hello! Who’s planning?' : (p ? 'Change ' + p.name : 'Add a person');
    $('#person-intro').hidden = !first;
    $('#person-close').hidden = first;
    $('#p-name').value = p ? p.name : '';
    $('#p-newtag').value = '';
    $('#p-save').textContent = first ? 'Let’s go' : 'Save';
    $('#p-delete').hidden = !p || state.profiles.length < 2;
    resetConfirm($('#p-delete'), 'Remove this person');
    renderPersonForm();
    $('#person-dialog').showModal();
    setTimeout(function () { $('#p-name').focus(); }, 50);
  }

  function savePerson(e) {
    e.preventDefault();
    var name = $('#p-name').value.trim();
    if (!name) { $('#p-name').focus(); toast('What’s your name?'); return; }
    var p = null;
    state.profiles.forEach(function (x) { if (x.id === ui.personId) p = x; });
    if (p) {
      p.name = name; p.avatar = ui.pform.avatar; p.colour = ui.pform.colour; p.tags = ui.pform.tags.slice();
    } else {
      p = { id: uid(), name: name, avatar: ui.pform.avatar, colour: ui.pform.colour, tags: ui.pform.tags.slice() };
      state.profiles.push(p);
      state.activeId = p.id;
    }
    save();
    $('#person-dialog').close();
    applyTheme();
    renderAll();
    if ($('#settings-dialog').open) renderSettings();
  }

  function deletePerson() {
    var id = ui.personId;
    state.profiles = state.profiles.filter(function (p) { return p.id !== id; });
    delete state.plans[id];
    if (state.spotted) delete state.spotted[id];
    Home.forgetPerson(id);
    if (state.activeId === id) state.activeId = state.profiles[0] ? state.profiles[0].id : null;
    save();
    $('#person-dialog').close();
    applyTheme();
    renderAll();
    if ($('#settings-dialog').open) renderSettings();
  }

  /* ---------- Settings ---------- */
  function renderSettingsReminders() {
    var perm = Reminders.permission();
    var status = $('#notify-status'), btn = $('#notify-btn');
    btn.hidden = perm !== 'default';
    if (perm === 'granted') status.textContent = '✅ Pop-up notifications are on. Reminders will also show when you’re in another app or tab.';
    else if (perm === 'denied') status.textContent = 'Pop-up notifications are blocked for this site. Reminders still chime and show inside My Days. To allow pop-ups, change the notification setting for this site in your browser.';
    else if (perm === 'unsupported') status.textContent = 'This browser can’t show pop-up notifications here, but reminders still chime and show inside My Days. On iPhone or iPad, add My Days to your Home Screen (Share → Add to Home Screen) and open it from there to allow pop-ups.';
    else status.textContent = 'Allow pop-ups so reminders can reach you when you’re in another app or tab.';
    $('#remind-sound').checked = state.settings.remindSound !== false;
  }

  function renderBackupStatus() {
    var el = $('#backup-status');
    if (!el) return;
    var last = state.settings.lastExport;
    if (!last) { el.textContent = '💡 You haven’t saved a copy yet. It only takes a moment.'; return; }
    var days = Sky.daysBetween(last, today);
    el.textContent = '✅ Last copy saved ' + (days === 0 ? 'today' : days === 1 ? 'yesterday' : days + ' days ago') + '.' +
      (days > 30 ? ' Time for a fresh one?' : '');
  }

  function renderSettings() {
    renderSettingsReminders();
    renderBackupStatus();
    $('#people-list').innerHTML = state.profiles.map(function (p) {
      return '<li><span class="mini-avatar" style="background:' + esc(p.colour) + '33;box-shadow:inset 0 0 0 3px ' + esc(p.colour) + '">' + esc(p.avatar) + '</span>' +
        '<span class="pname">' + esc(p.name) + (p.id === state.activeId ? ' <span class="optional">(now)</span>' : '') + '</span>' +
        '<button class="btn small" data-edit-person="' + esc(p.id) + '">Change</button></li>';
    }).join('');
    $$('#theme-seg .seg-btn').forEach(function (b) {
      b.setAttribute('aria-checked', String(b.dataset.themeChoice === (state.settings.theme || 'auto')));
    });
    $('#calm-motion').checked = !!state.settings.calm;
    $('#app-version').textContent = 'Version ' + APP_VERSION;
  }

  function exportPlans() {
    state.settings.lastExport = today;
    save();
    renderBackupStatus();
    var payload = { app: 'my-days-somerset', exportedAt: new Date().toISOString(), data: state };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'my-days-backup-' + today + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast('Saved a copy to your downloads ✓');
  }

  function importPlans(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(reader.result);
        var data = parsed && parsed.data ? parsed.data : parsed;
        if (!data || !Array.isArray(data.profiles) || !data.plans) throw new Error('bad');
        if (!window.confirm('Replace everything on this device with the plans in this file?')) return;
        state = migrate(data);
        save();
        ui.dayKey = today;
        applyTheme();
        renderAll();
        renderSettings();
        toast('Plans imported ✓');
      } catch (e) {
        toast('That file doesn’t look like a plans backup.');
      }
    };
    reader.readAsText(file);
  }

  /* ---------- Timer ---------- */
  var RING = 2 * Math.PI * 96;
  function fmtDuration(ms) {
    var total = Math.ceil(ms / 1000);
    var h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
    var ss = (s < 10 ? '0' : '') + s;
    return h ? h + ':' + (m < 10 ? '0' : '') + m + ':' + ss : m + ':' + ss;
  }
  function renderTimer(s) {
    var text = fmtDuration(s.remaining);
    $('#timer-time').textContent = text;
    var frac = s.duration ? s.remaining / s.duration : 0;
    var ring = $('#ring-fill');
    ring.style.strokeDasharray = RING;
    ring.style.strokeDashoffset = RING * (1 - frac);
    var started = s.running || s.remaining < s.duration;
    $('#timer-start').textContent = s.running ? 'Pause' : (started && s.remaining > 0 ? 'Carry on' : 'Start');
    $$('#timer-presets .chip-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', String(+b.dataset.min * 60000 === s.duration));
    });
    var pill = $('#timer-pill');
    var showTime = s.running || (s.remaining > 0 && s.remaining < s.duration);
    $('#timer-pill-text').textContent = showTime ? ' ' + text : '';
    pill.classList.toggle('running', s.running);
    pill.classList.toggle('active', ui.view === 'timer');
    pill.setAttribute('aria-label', s.running ? 'Timer: ' + text + ' left' : 'Timer');
    document.title = s.running ? '⏳ ' + text + ' · My Days' : 'My Days · Somerset';
  }

  function onTimerDone() {
    if (state.settings.sound !== false) Timer.chime();
    if (navigator.vibrate) { try { navigator.vibrate([200, 100, 200]); } catch (e) { /* ignore */ } }
    var d = $('#alarm-dialog');
    if (!d.open) d.showModal();
    $('#alarm-ok').focus();
  }

  /* ---------- Sky ---------- */
  function renderSky() {
    var now = new Date();
    var m = Sky.moonNow(now);
    var ahead = Sky.eventsBetween(today, Sky.addDays(today, 40));
    var nextFull = ahead.filter(function (e) { return e.type === 'full'; })[0];
    var nextNew = ahead.filter(function (e) { return e.type === 'new'; })[0];
    function when(e) {
      if (!e) return '–';
      if (e.date === today) return 'Today';
      if (e.date === Sky.addDays(today, 1)) return 'Tomorrow';
      return shortDate(e.date);
    }
    $('#moon-panel').innerHTML =
      Sky.moonSVG(m.phase, m.name + ', ' + Math.round(m.fraction * 100) + '% lit') +
      '<h2>' + esc(m.name) + '</h2>' +
      '<div class="big-num">' + Math.round(m.fraction * 100) + '% lit up tonight</div>' +
      '<div class="moon-next">' +
        '<div><span>🌕 Next full moon</span><strong>' + when(nextFull) + (nextFull ? '<br><small>' + esc(nextFull.title.replace('Full moon · ', '')) + '</small>' : '') + '</strong></div>' +
        '<div><span>🌑 Next new moon</span><strong>' + when(nextNew) + '</strong></div>' +
      '</div>';

    var t = SunCalc.getTimes(Sky.keyToUTCNoon(today), Sky.LAT, Sky.LNG);
    var y = SunCalc.getTimes(Sky.keyToUTCNoon(Sky.addDays(today, -1)), Sky.LAT, Sky.LNG);
    var len = (t.sunset - t.sunrise) / 60000, ylen = (y.sunset - y.sunrise) / 60000;
    var diff = Math.round(len - ylen);
    var trend = diff > 0 ? 'Days are getting longer: ' + diff + ' min more light than yesterday.'
      : diff < 0 ? 'Days are getting shorter: ' + (-diff) + ' min less light than yesterday.'
      : 'Day length is barely changing right now.';
    var starsAt = t.nauticalDusk && !isNaN(t.nauticalDusk) ? Sky.fmtTime(t.nauticalDusk) : '–';
    $('#sun-panel').innerHTML =
      '<h2 class="panel-title">☀️ Sun today</h2>' +
      '<div class="stat-row"><span class="label">🌅 Sunrise</span><span class="value">' + Sky.fmtTime(t.sunrise) + '</span></div>' +
      '<div class="stat-row"><span class="label">🌇 Sunset</span><span class="value">' + Sky.fmtTime(t.sunset) + '</span></div>' +
      '<div class="stat-row"><span class="label">🌤️ Daylight</span><span class="value">' + Math.floor(len / 60) + ' h ' + Math.round(len % 60) + ' min</span></div>' +
      '<div class="stat-row"><span class="label">✨ Stars come out</span><span class="value">' + starsAt + '</span></div>' +
      '<p class="small-note">' + trend + '</p>';

    var s = Sky.seasonInfo(now);
    if (s) {
      var dayNum = Sky.daysBetween(Sky.dayKey(s.start), today) + 1;
      var totalDays = Sky.daysBetween(Sky.dayKey(s.start), Sky.dayKey(s.end));
      var left = Sky.daysBetween(today, Sky.dayKey(s.end));
      $('#season-panel').innerHTML =
        '<h2 class="panel-title">Season</h2>' +
        '<div class="season-name"><span aria-hidden="true">' + s.emoji + '</span> ' + s.name + '</div>' +
        '<div class="progress" role="progressbar" aria-label="How far through ' + s.name + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(s.progress * 100) + '"><div style="width:' + (s.progress * 100).toFixed(1) + '%"></div></div>' +
        '<div class="progress-labels"><span>Began ' + Sky.fmt(s.start, { day: 'numeric', month: 'short' }) + '</span><span>' + s.next.emoji + ' ' + s.next.name + ' ' + Sky.fmt(s.end, { day: 'numeric', month: 'short' }) + '</span></div>' +
        '<p class="small-note">Day ' + dayNum + ' of ' + totalDays + '. ' + left + ' days until ' + s.next.name.toLowerCase() + '.</p>';
    }

    renderCalendar();

    var upcoming = Sky.eventsBetween(today, Sky.addDays(today, 120)).slice(0, 10);
    $('#upcoming-list').innerHTML = upcoming.map(function (e) {
      return '<li><span class="ev-icon" aria-hidden="true">' + e.icon + '</span><div>' +
        '<div class="ev-date">' + esc(e.date === today ? 'Today' : shortDate(e.date)) + '</div>' +
        '<div class="ev-title">' + esc(e.title) + '</div><div class="ev-note">' + esc(e.note) + '</div></div></li>';
    }).join('');
  }

  function renderCalendar() {
    var parts = ui.calMonth.split('-');
    var y = +parts[0], mo = +parts[1];
    var firstKey = ui.calMonth + '-01';
    var first = Sky.keyToUTCNoon(firstKey);
    var lead = (first.getUTCDay() + 6) % 7; // Monday first
    var daysInMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate();
    var startKey = Sky.addDays(firstKey, -lead);
    var cells = Math.ceil((lead + daysInMonth) / 7) * 7;
    var endKey = Sky.addDays(startKey, cells - 1);
    var events = Sky.eventsBetween(startKey, endKey);
    var byDay = {};
    events.forEach(function (e) { (byDay[e.date] = byDay[e.date] || []).push(e); });

    $('#cal-title').textContent = Sky.fmtKey(firstKey, { month: 'long', year: 'numeric' });
    var html = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (d) {
      return '<div class="cal-dow" role="columnheader" aria-label="' + d + '">' + d.charAt(0) + '</div>';
    }).join('');
    for (var i = 0; i < cells; i++) {
      var k = Sky.addDays(startKey, i);
      var evs = byDay[k] || [];
      var hasPlans = itemsFor(k).length > 0;
      var cls = 'cal-day' + (k.slice(0, 7) !== ui.calMonth ? ' other' : '') + (k === today ? ' today' : '');
      var label = longDate(k) + (evs.length ? ': ' + evs.map(function (e) { return e.title; }).join(', ') : '') + (hasPlans ? '. You have plans.' : '');
      html += '<button class="' + cls + '" role="gridcell" data-day="' + k + '" aria-selected="' + (k === ui.calSelected) + '" aria-label="' + esc(label) + '">' +
        '<span>' + (+k.slice(8)) + '</span>' +
        '<span class="dots" aria-hidden="true">' + evs.slice(0, 2).map(function (e) { return e.icon; }).join('') + '</span>' +
        (hasPlans ? '<span class="plan-dot" aria-hidden="true"></span>' : '') +
        '</button>';
    }
    $('#cal-grid').innerHTML = html;
    renderCalDetail(byDay);
  }

  function renderCalDetail(byDay) {
    var k = ui.calSelected;
    var evs = (byDay && byDay[k]) || Sky.eventsOn(k);
    var n = itemsFor(k).length;
    var html = '<h3>' + esc(longDate(k)) + '</h3>';
    html += evs.length
      ? '<ul class="event-list">' + evs.map(function (e) {
        return '<li><span class="ev-icon" aria-hidden="true">' + e.icon + '</span><div><div class="ev-title">' + esc(e.title) + '</div><div class="ev-note">' + esc(e.note) + '</div></div></li>';
      }).join('') + '</ul>'
      : '<p class="small-note">Nothing special in the sky. A good night to just look up!</p>';
    html += '<div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" data-plan-day="' + k + '">' +
      (n ? 'See plans (' + n + ')' : 'Plan this day') + '</button></div>';
    $('#cal-detail').innerHTML = html;
  }

  /* ---------- Months ahead (bird's-eye view) ---------- */
  function monthKeyAdd(monthKey, n) {
    var p = monthKey.split('-');
    return new Date(Date.UTC(+p[0], +p[1] - 1 + n, 1, 12)).toISOString().slice(0, 7);
  }

  function monthCardHTML(monthKey) {
    var showSky = ui.monthsFilter !== 'plans';
    var showPlans = ui.monthsFilter !== 'sky';
    var p = monthKey.split('-');
    var firstKey = monthKey + '-01';
    var daysInMonth = new Date(Date.UTC(+p[0], +p[1], 0)).getUTCDate();
    var lastKey = monthKey + '-' + (daysInMonth < 10 ? '0' : '') + daysInMonth;
    var lead = (Sky.keyToUTCNoon(firstKey).getUTCDay() + 6) % 7;

    var events = showSky ? Sky.eventsBetween(firstKey, lastKey) : [];
    var personal = showPlans ? Home.personalEvents(firstKey, lastKey, me()) : [];
    var byDay = {};
    personal.concat(events).forEach(function (e) { (byDay[e.date] = byDay[e.date] || []).push(e); });

    // Mini calendar
    var grid = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(function (d) {
      return '<span class="mini-dow" aria-hidden="true">' + d + '</span>';
    }).join('');
    for (var b = 0; b < lead; b++) grid += '<span class="mini-blank" aria-hidden="true"></span>';

    var highlights = [];
    var seenSeries = {}, repeatNames = [];
    for (var d = 1; d <= daysInMonth; d++) {
      var k = monthKey + '-' + (d < 10 ? '0' : '') + d;
      var evs = byDay[k] || [];
      var plans = showPlans ? itemsFor(k) : [];
      var past = k < today;
      var icon = evs.length ? evs[0].icon : '';
      var label = longDate(k) +
        (evs.length ? ': ' + evs.map(function (e) { return e.title; }).join(', ') : '') +
        (plans.length ? '. ' + plans.length + (plans.length === 1 ? ' plan' : ' plans') : '');
      grid += '<button class="mini-day' + (k === today ? ' today' : '') + (past ? ' past' : '') +
        (plans.length ? ' has-plans' : '') + '" data-day="' + k + '" aria-label="' + esc(label) + '">' +
        '<span class="n">' + d + '</span><span class="i" aria-hidden="true">' + icon + '</span></button>';

      if (!past) {
        evs.forEach(function (e) {
          if (e.type === 'new') return; // keep the list short; new moons still show in the Sky tab
          highlights.push({ date: k, icon: e.icon, text: e.title, kind: e.kind ? 'plan' : 'sky' });
        });
        plans.forEach(function (c) {
          if (c.seriesId) {
            // repeating plans are listed once, under the month, not every day
            if (!seenSeries[c.seriesId]) { seenSeries[c.seriesId] = true; repeatNames.push(c.title); }
            return;
          }
          highlights.push({ date: k, icon: c.emoji || '⭐', text: c.title, kind: 'plan', done: c.done });
        });
      }
    }

    var MAX = 7;
    var list = highlights.slice(0, MAX).map(function (h) {
      return '<li class="hl ' + h.kind + (h.done ? ' done' : '') + '" data-day="' + h.date + '" tabindex="0" role="button">' +
        '<span class="hl-date">' + esc(Sky.fmtKey(h.date, { weekday: 'short', day: 'numeric' })) + '</span>' +
        '<span class="hl-icon" aria-hidden="true">' + esc(h.icon) + '</span>' +
        '<span class="hl-text">' + esc(h.text) + '</span></li>';
    }).join('');
    if (highlights.length > MAX) list += '<li class="hl-more">+ ' + (highlights.length - MAX) + ' more – tap a day to see</li>';
    if (repeatNames.length) list += '<li class="hl-repeats"><span aria-hidden="true">🔁</span> Repeats: ' + esc(repeatNames.join(', ')) + '</li>';
    if (!highlights.length && !repeatNames.length) {
      list = '<li class="hl-more">' + (ui.monthsFilter === 'plans' ? 'Nothing planned yet. Plenty of room!' : 'A quiet month.') + '</li>';
    }

    var season = Sky.seasonInfo(Sky.keyToUTCNoon(monthKey + '-15'));
    return '<article class="month-card">' +
      '<div class="month-head"><h2>' + esc(Sky.fmtKey(firstKey, { month: 'long', year: 'numeric' })) + '</h2>' +
      (season ? '<span class="chip-sm">' + season.emoji + ' ' + season.name + '</span>' : '') + '</div>' +
      '<div class="mini-grid">' + grid + '</div>' +
      '<ul class="highlights">' + list + '</ul></article>';
  }

  function renderMonths() {
    $$('#months-filter .seg-btn').forEach(function (b) {
      b.setAttribute('aria-checked', String(b.dataset.mfilter === ui.monthsFilter));
    });
    var start = today.slice(0, 7);
    var html = '';
    for (var i = 0; i < ui.monthsCount; i++) html += monthCardHTML(monthKeyAdd(start, i));
    $('#months-list').innerHTML = html;
    $('#more-months').hidden = ui.monthsCount >= 18;
  }

  /* ---------- Nature: birds & foraging ---------- */
  var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];
  var HOW = {
    special: { label: '⭐ Somerset special', cls: 'special' },
    see: { label: '👀 Easy to spot', cls: 'see' },
    listen: { label: '👂 Listen for', cls: 'listen' }
  };

  function mySpotted() {
    var p = me();
    if (!p) return {};
    state.spotted = state.spotted || {};
    state.spotted[p.id] = state.spotted[p.id] || {};
    return state.spotted[p.id];
  }

  function birdCardHTML(b) {
    var seen = mySpotted()[b.id];
    var how = HOW[b.how] || HOW.see;
    return '<li class="nat-card">' +
      '<div class="nat-head"><span class="nat-emoji" aria-hidden="true">' + b.emoji + '</span>' +
        '<div><h2 class="nat-name">' + esc(b.name) + '</h2><span class="badge ' + how.cls + '">' + how.label + '</span></div></div>' +
      '<p class="nat-line"><span aria-hidden="true">📍</span> ' + esc(b.where) + '</p>' +
      '<p class="nat-line"><span aria-hidden="true">' + (b.how === 'listen' ? '👂' : '👀') + '</span> ' + esc(b.look) + '</p>' +
      '<p class="nat-fact"><span aria-hidden="true">💡</span> ' + esc(b.fact) + '</p>' +
      '<div class="nat-actions">' +
        '<button class="btn small seen-btn" data-seen="' + b.id + '" aria-pressed="' + !!seen + '">' +
          (seen ? '✓ Spotted ' + esc(Sky.fmtKey(seen, { day: 'numeric', month: 'short' })) : (b.how === 'listen' ? 'I heard one!' : 'I saw one!')) + '</button>' +
        '<button class="btn small" data-nat-add="bird:' + b.id + '">+ Plan a trip</button>' +
      '</div></li>';
  }

  function forageCardHTML(f) {
    var badges = '';
    if (f.lookOnly) badges += '<span class="badge listen">👀 Look only</span>';
    if (f.grownup) badges += '<span class="badge grownup">🧑‍🤝‍🧑 Only with a grown-up</span>';
    return '<li class="nat-card">' +
      '<div class="nat-head"><span class="nat-emoji" aria-hidden="true">' + f.emoji + '</span>' +
        '<div><h2 class="nat-name">' + esc(f.name) + '</h2>' + badges + '</div></div>' +
      '<p class="nat-line"><span aria-hidden="true">📍</span> ' + esc(f.where) + '</p>' +
      '<p class="nat-line"><span aria-hidden="true">🔎</span> ' + esc(f.look) + '</p>' +
      '<p class="nat-line"><span aria-hidden="true">' + (f.lookOnly ? '📓' : '🍳') + '</span> ' + esc(f.use) + '</p>' +
      '<p class="nat-warn"><span aria-hidden="true">⚠️</span> ' + esc(f.warn) + '</p>' +
      '<div class="nat-actions"><button class="btn small" data-nat-add="forage:' + f.id + '">+ Add</button></div>' +
      '</li>';
  }

  function renderNature() {
    var m = ui.natureMonth;
    var nowMonth = +today.slice(5, 7);
    $('#nature-month').textContent = MONTH_NAMES[m - 1];
    $('#nature-month-sub').textContent = m === nowMonth ? 'What’s about in Somerset now' : 'Planning ahead';
    $$('.seg-btn[data-nature]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.nature === ui.natureTab)); });

    var top = '', items = '';
    if (ui.natureTab === 'birds') {
      var birds = Nature.BIRDS.filter(function (b) { return b.months.indexOf(m) >= 0; });
      var order = { special: 0, see: 1, listen: 2 };
      birds.sort(function (a, b) { return order[a.how] - order[b.how]; });
      var count = Object.keys(mySpotted()).length;
      var p = me();
      top = '<div class="nat-summary"><span class="nat-summary-num">' + count + '</span><div><strong>' +
        (count === 1 ? 'bird spotted' : 'birds spotted') + (p ? ' by ' + esc(p.name) : '') + '</strong>' +
        '<span>' + (count ? 'Lovely! Keep your eyes and ears open.' : 'Tap “I saw one!” when you spot a bird.') + '</span></div></div>' +
        '<p class="nat-tip">Tip: a pair of binoculars and a quiet, slow walk help a lot. Early morning and dusk are the busiest times.</p>';
      items = birds.map(birdCardHTML).join('');
    } else {
      top = '<details class="rules" open><summary>🧺 Forager’s rules – read these first</summary><ul>' +
        Nature.RULES.map(function (r) { return '<li><span aria-hidden="true">' + r.icon + '</span> ' + esc(r.text) + '</li>'; }).join('') +
        '</ul></details>';
      var finds = Nature.FORAGE.filter(function (f) { return f.months.indexOf(m) >= 0; });
      items = finds.length ? finds.map(forageCardHTML).join('')
        : '<li class="ideas-empty">Not much to pick in ' + MONTH_NAMES[m - 1] + '. A brilliant month for bird watching instead!</li>';
    }
    $('#nature-target').innerHTML = targetDayHTML();
    $('#nature-top').innerHTML = top;
    $('#nature-list').innerHTML = items;
  }

  function toggleSeen(id) {
    var s = mySpotted();
    if (s[id]) delete s[id]; else s[id] = today;
    save();
    renderNature();
    if (s[id]) toast('Brilliant spot! ✓');
  }

  function addNatureToDay(ref) {
    var parts = ref.split(':'), kind = parts[0], id = parts[1];
    var src = kind === 'bird' ? Nature.BIRDS : Nature.FORAGE;
    var item = null;
    src.forEach(function (x) { if (x.id === id) item = x; });
    if (!item || !me()) return;
    var card = kind === 'bird'
      ? { title: 'Look for ' + item.name.toLowerCase().replace(/^common /, ''), emoji: item.emoji === '🪶' ? '🐦' : item.emoji, notes: '📍 ' + item.where }
      : { title: item.lookOnly ? item.name.replace(' (look only)', '') : 'Forage for ' + item.name.toLowerCase(), emoji: item.emoji, notes: '⚠️ ' + item.warn };
    var list = plansFor(ui.dayKey);
    list.push({ id: uid(), title: card.title, emoji: card.emoji, cat: 'outdoors', tags: [], time: '', notes: card.notes, done: false });
    setPlans(ui.dayKey, list);
    toast('Added to ' + (ui.dayKey === today ? 'today' : shortDate(ui.dayKey)) + ' ✓', 'See it', function () { showView('day'); });
  }

  /* ---------- "Adding to" day picker (Ideas & Nature) ---------- */
  function targetDayHTML() {
    var tomorrow = Sky.addDays(today, 1);
    var other = ui.dayKey !== today && ui.dayKey !== tomorrow;
    return '<span class="target-label">Adding to:</span>' +
      '<button class="chip-btn" data-target="' + today + '" aria-pressed="' + (ui.dayKey === today) + '">Today</button>' +
      '<button class="chip-btn" data-target="' + tomorrow + '" aria-pressed="' + (ui.dayKey === tomorrow) + '">Tomorrow</button>' +
      '<label class="chip-btn date-chip" aria-pressed="' + other + '">📅 ' +
        (other ? esc(shortDate(ui.dayKey)) : 'Another day') +
        '<input type="date" class="target-date" value="' + ui.dayKey + '" aria-label="Choose another day"></label>';
  }
  function setTargetDay(key) {
    if (!key) return;
    ui.dayKey = key;
    if (ui.view === 'ideas') renderIdeas();
    if (ui.view === 'nature') renderNature();
    if (ui.view === 'home') Home.render();
  }

  /* ---------- Ideas ---------- */
  function currentIdeas() {
    var season = Sky.seasonInfo(new Date());
    var sid = season ? season.id : null;
    var list;
    if (ui.ideasMode === 'mine') {
      var p = me();
      list = [];
      (p ? p.tags : []).forEach(function (tag) {
        list.push({ interest: tag, emoji: '💛', title: tag, tags: [tag], cat: null });
      });
    } else if (ui.ideasMode === 'season') {
      list = Ideas.IDEAS.filter(function (i) { return i.seasons && i.seasons.indexOf(sid) >= 0; });
    } else {
      list = Ideas.IDEAS.filter(function (i) { return !i.seasons; });
    }
    if (ui.ideasCat && ui.ideasMode !== 'mine') list = list.filter(function (i) { return i.cat === ui.ideasCat; });
    return list;
  }

  var shownIdeas = [];
  function renderIdeas() {
    var season = Sky.seasonInfo(new Date());
    $('#ideas-sub').textContent = ui.ideasMode === 'season' && season
      ? season.emoji + ' Ideas for ' + season.name.toLowerCase() + ' in Somerset'
      : ui.ideasMode === 'mine' ? 'Ideas from the things you love' : 'Good for any day of the year';
    $$('.seg-btn[data-ideas]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.ideas === ui.ideasMode)); });

    var cats = $('#ideas-cats');
    cats.hidden = ui.ideasMode === 'mine';
    cats.innerHTML = '<button class="chip-btn" data-icat="" aria-pressed="' + !ui.ideasCat + '">All</button>' +
      Ideas.CATEGORIES.map(function (c) {
        return '<button class="chip-btn" data-icat="' + c.id + '" aria-pressed="' + (ui.ideasCat === c.id) + '">' + c.emoji + ' ' + esc(c.short) + '</button>';
      }).join('');

    shownIdeas = currentIdeas();
    $('#ideas-target').innerHTML = targetDayHTML();
    if (!shownIdeas.length) {
      $('#ideas-list').innerHTML = ui.ideasMode === 'mine'
        ? '<li class="ideas-empty">Add some things you love and ideas will appear here.<br><br><button class="btn" data-action="edit-me">Add my interests</button></li>'
        : '<li class="ideas-empty">No ideas here yet. Try “All”.</li>';
      $('#surprise-btn').hidden = true;
      return;
    }
    $('#surprise-btn').hidden = false;
    $('#ideas-list').innerHTML = shownIdeas.map(function (i, n) {
      if (i.interest) {
        return '<li class="idea" data-idea="' + n + '"><div class="idea-top"><span class="idea-emoji" aria-hidden="true">💛</span><div>' +
          '<div class="idea-title">' + esc(i.title.charAt(0).toUpperCase() + i.title.slice(1)) + '</div>' +
          '<div class="idea-note">What would you like to do with it?</div></div></div>' +
          '<div class="interest-actions">' + Ideas.INTEREST_PROMPTS.map(function (pr, k) {
            return '<button class="btn small" data-add-interest="' + n + ':' + k + '">' + pr.emoji + ' ' + esc(pr.label) + '</button>';
          }).join('') + '</div></li>';
      }
      var cat = catById(i.cat);
      return '<li class="idea" data-idea="' + n + '"><div class="idea-top"><span class="idea-emoji" aria-hidden="true">' + i.emoji + '</span><div>' +
        '<div class="idea-title">' + esc(i.title) + '</div>' +
        (i.note ? '<div class="idea-note">' + esc(i.note) + '</div>' : '') +
        (cat ? '<div class="card-meta"><span class="meta">' + cat.emoji + ' ' + esc(cat.short) + '</span></div>' : '') +
        '</div></div><button class="btn small" data-add-idea="' + n + '">+ Add</button></li>';
    }).join('');
  }

  function addIdea(n, promptIndex) {
    var i = shownIdeas[n];
    if (!i || !me()) return;
    if (i.interest) {
      var pr = Ideas.INTEREST_PROMPTS[promptIndex || 0];
      i = { title: pr.pattern.replace('{x}', i.interest), emoji: pr.emoji, cat: null, tags: [i.interest] };
    }
    var list = plansFor(ui.dayKey);
    list.push({ id: uid(), title: i.title, emoji: i.emoji, cat: i.cat || null, tags: (i.tags || []).slice(), time: '', notes: '', done: false });
    setPlans(ui.dayKey, list);
    toast('Added to ' + (ui.dayKey === today ? 'today' : shortDate(ui.dayKey)) + ' ✓', 'See it', function () { showView('day'); });
  }

  function surprise() {
    if (!shownIdeas.length) return;
    var n = Math.floor(Math.random() * shownIdeas.length);
    $$('.idea.highlight').forEach(function (el) { el.classList.remove('highlight'); });
    var el = $('.idea[data-idea="' + n + '"]');
    if (el) {
      el.classList.add('highlight');
      el.scrollIntoView({ behavior: state.settings.calm ? 'auto' : 'smooth', block: 'center' });
      var btn = $('[data-add-idea], [data-add-interest]', el);
      if (btn) btn.focus({ preventScroll: true });
    }
  }

  /* ---------- Views ---------- */
  function showView(name) {
    if (name === 'months' && ui.view !== 'months') ui.prevView = ui.view;
    ui.view = name;
    if (name !== 'home') Home.stopBreathing();
    ['day', 'timer', 'home', 'sky', 'nature', 'ideas', 'months'].forEach(function (v) { $('#view-' + v).hidden = v !== name; });
    $$('.nav-btn').forEach(function (b) {
      if (b.dataset.view === name) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    if (name === 'day') renderDay();
    if (name === 'sky') renderSky();
    if (name === 'ideas') renderIdeas();
    if (name === 'months') renderMonths();
    if (name === 'nature') renderNature();
    if (name === 'home') Home.render();
    renderTimer(Timer.state());
    window.scrollTo(0, 0);
  }

  function renderAll() {
    renderHeader();
    if (ui.view === 'day') renderDay();
    if (ui.view === 'sky') renderSky();
    if (ui.view === 'ideas') renderIdeas();
    if (ui.view === 'months') renderMonths();
    if (ui.view === 'nature') renderNature();
  }

  /* ---------- Wiring ---------- */
  function bind() {
    // Navigation
    $$('.nav-btn').forEach(function (b) { b.addEventListener('click', function () { showView(b.dataset.view); }); });
    $('#timer-pill').addEventListener('click', function () { showView('timer'); });

    // Person menu
    $('#who-btn').addEventListener('click', function (e) { e.stopPropagation(); toggleWhoMenu(); });
    $('#who-menu').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      toggleWhoMenu(false);
      if (b.dataset.person) switchPerson(b.dataset.person);
      else if (b.dataset.menu === 'add') openPersonDialog(null);
      else if (b.dataset.menu === 'settings') openSettings();
    });
    document.addEventListener('click', function (e) {
      if (!$('#who-menu').hidden && !e.target.closest('#who-menu')) toggleWhoMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !$('#who-menu').hidden) { toggleWhoMenu(false); $('#who-btn').focus(); }
    });

    // Day
    $('#prev-day').addEventListener('click', function () { goDay(-1); });
    $('#next-day').addEventListener('click', function () { goDay(1); });
    $('#back-today').addEventListener('click', function () { ui.dayKey = today; renderDay(); });
    $('#add-btn').addEventListener('click', function () { openCardDialog(null); });
    $('#day-empty').addEventListener('click', function (e) {
      var a = e.target.closest('[data-action]');
      if (!a) return;
      if (a.dataset.action === 'add') openCardDialog(null);
      if (a.dataset.action === 'goto-ideas') showView('ideas');
    });

    var list = $('#card-list');
    list.addEventListener('click', function (e) {
      var card = e.target.closest('.card');
      if (!card) return;
      if (e.target.closest('.done-btn')) toggleDone(card.dataset.id);
      else if (e.target.closest('.card-body')) openCardDialog(card.dataset.id);
    });
    list.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('card-body')) {
        e.preventDefault();
        openCardDialog(e.target.closest('.card').dataset.id);
      }
      onHandleKey(e);
    });
    list.addEventListener('pointerdown', onHandleDown);
    list.addEventListener('pointermove', onHandleMove);
    list.addEventListener('pointerup', onHandleUp);
    list.addEventListener('pointercancel', onHandleUp);

    // Swipe left/right on the day header to change day
    var sx = null;
    $('.day-nav').addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    $('.day-nav').addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 60) goDay(dx < 0 ? 1 : -1);
      sx = null;
    });

    // Card dialog
    $('#card-form').addEventListener('submit', saveCardForm);
    $('#f-emoji').addEventListener('click', function (e) {
      var b = e.target.closest('[data-emoji]');
      if (!b) return;
      ui.form.emoji = b.dataset.emoji;
      $$('#f-emoji .emoji-opt').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
    });
    $('#f-cat').addEventListener('click', function (e) {
      var b = e.target.closest('[data-cat]');
      if (!b) return;
      ui.form.cat = ui.form.cat === b.dataset.cat ? null : b.dataset.cat;
      renderFormCats();
    });
    $('#f-tags').addEventListener('click', function (e) {
      var b = e.target.closest('[data-tag]');
      if (!b) return;
      var t = b.dataset.tag, i = ui.form.tags.indexOf(t);
      if (i >= 0) ui.form.tags.splice(i, 1); else ui.form.tags.push(t);
      b.setAttribute('aria-pressed', String(i < 0));
    });
    function addFormTag() {
      var t = addTagToMe($('#f-newtag').value);
      if (!t) return;
      if (ui.form.tags.indexOf(t) < 0) ui.form.tags.push(t);
      $('#f-newtag').value = '';
      renderFormTags();
    }
    $('#f-addtag').addEventListener('click', addFormTag);
    $('#f-newtag').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addFormTag(); } });
    $('#f-title').addEventListener('input', function () { this.removeAttribute('aria-invalid'); });
    $('#f-move-tomorrow').addEventListener('click', function () { moveCard(Sky.addDays(ui.dayKey, 1)); });
    $('#f-move-go').addEventListener('click', function () { moveCard($('#f-move-date').value); });
    $('#f-delete').addEventListener('click', function () {
      var label = ui.editingSeries ? 'Remove all repeats' : 'Remove this';
      confirmTwice(this, label, ui.editingSeries ? 'Tap again to remove every repeat' : 'Tap again to remove', deleteCard);
    });
    $('#f-skip').addEventListener('click', skipDay);
    $('#f-repeat').addEventListener('change', function () {
      if (this.value === 'days' && !ui.form.days.length) ui.form.days = [Repeat.dow(ui.dayKey)];
      renderRepeatFields();
    });
    $('#f-days').addEventListener('click', function (e) {
      var b = e.target.closest('[data-dow]');
      if (!b) return;
      var d = +b.dataset.dow, i = ui.form.days.indexOf(d);
      if (i >= 0) ui.form.days.splice(i, 1); else ui.form.days.push(d);
      b.setAttribute('aria-pressed', String(i < 0));
    });
    $('#f-remind').addEventListener('change', renderRepeatFields);
    $('#f-time').addEventListener('input', renderRepeatFields);

    // Close buttons on any sheet
    $$('[data-close]').forEach(function (b) {
      b.addEventListener('click', function () { b.closest('dialog').close(); });
    });
    // Tap outside a sheet to close it
    $$('dialog.sheet').forEach(function (d) {
      d.addEventListener('click', function (e) {
        if (e.target === d && !(d.id === 'person-dialog' && state.profiles.length === 0)) d.close();
      });
    });
    // The first-time welcome can't be skipped with Escape
    $('#person-dialog').addEventListener('cancel', function (e) { if (state.profiles.length === 0) e.preventDefault(); });

    // Person dialog
    $('#person-form').addEventListener('submit', savePerson);
    $('#p-avatar').addEventListener('click', function (e) {
      var b = e.target.closest('[data-avatar]');
      if (!b) return;
      ui.pform.avatar = b.dataset.avatar;
      $$('#p-avatar .emoji-opt').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
    });
    $('#p-colour').addEventListener('click', function (e) {
      var b = e.target.closest('[data-colour]');
      if (!b) return;
      ui.pform.colour = b.dataset.colour;
      $$('#p-colour .colour-opt').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
    });
    $('#p-tags').addEventListener('click', function (e) {
      var b = e.target.closest('[data-ptag]');
      if (!b) return;
      var t = b.dataset.ptag, i = ui.pform.tags.indexOf(t);
      if (i >= 0) ui.pform.tags.splice(i, 1); else ui.pform.tags.push(t);
      b.setAttribute('aria-pressed', String(i < 0));
    });
    function addPersonTag() {
      var t = String($('#p-newtag').value || '').trim().toLowerCase().slice(0, 24);
      if (!t) return;
      if (ui.pform.tags.indexOf(t) < 0) ui.pform.tags.push(t);
      $('#p-newtag').value = '';
      renderPersonForm();
    }
    $('#p-addtag').addEventListener('click', addPersonTag);
    $('#p-newtag').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addPersonTag(); } });
    $('#p-delete').addEventListener('click', function () {
      confirmTwice(this, 'Remove this person', 'Tap again – their plans go too', deletePerson);
    });

    // Settings
    $('#settings-btn').addEventListener('click', openSettings);
    $('#people-list').addEventListener('click', function (e) {
      var b = e.target.closest('[data-edit-person]');
      if (b) openPersonDialog(b.dataset.editPerson);
    });
    $('#add-person-btn').addEventListener('click', function () { openPersonDialog(null); });
    $('#theme-seg').addEventListener('click', function (e) {
      var b = e.target.closest('[data-theme-choice]');
      if (!b) return;
      state.settings.theme = b.dataset.themeChoice;
      save(); applyTheme(); renderSettings();
    });
    $('#calm-motion').addEventListener('change', function () {
      state.settings.calm = this.checked; save(); applyTheme();
    });
    $('#export-btn').addEventListener('click', exportPlans);
    $('#notify-btn').addEventListener('click', function () {
      Timer.unlockAudio();
      Reminders.ask().then(function (r) {
        renderSettingsReminders();
        if (r === 'granted') toast('Pop-up notifications are on ✓');
      });
    });
    $('#notify-test').addEventListener('click', function () { Timer.unlockAudio(); Reminders.test(); });
    $('#remind-sound').addEventListener('change', function () {
      state.settings.remindSound = this.checked; save();
      if (this.checked) Timer.unlockAudio();
    });
    $('#update-btn').addEventListener('click', function () {
      if (!navigator.onLine) { toast('You’re offline – try again when you’re connected'); return; }
      toast('Checking for updates…');
      var done = function () { location.reload(); };
      if (swReg) swReg.update().then(function () { setTimeout(done, 800); }, done); else done();
    });
    $('#import-file').addEventListener('change', function () {
      if (this.files && this.files[0]) importPlans(this.files[0]);
      this.value = '';
    });

    // Timer
    Timer.on('tick', renderTimer);
    Timer.on('done', onTimerDone);
    $('#timer-presets').addEventListener('click', function (e) {
      var b = e.target.closest('[data-min]');
      if (b) Timer.set(+b.dataset.min);
    });
    $('#timer-plus').addEventListener('click', function () { Timer.adjust(1); });
    $('#timer-minus').addEventListener('click', function () { Timer.adjust(-1); });
    $('#timer-start').addEventListener('click', function () {
      if (Timer.state().running) Timer.pause(); else Timer.start();
    });
    $('#timer-reset').addEventListener('click', function () { Timer.reset(); });
    $('#timer-sound').checked = state.settings.sound !== false;
    $('#timer-sound').addEventListener('change', function () {
      state.settings.sound = this.checked; save();
      if (this.checked) { Timer.unlockAudio(); }
    });
    $('#alarm-ok').addEventListener('click', function () { $('#alarm-dialog').close(); Timer.reset(); });
    $('#alarm-more').addEventListener('click', function () { $('#alarm-dialog').close(); Timer.set(5); Timer.start(); });

    // Sky calendar
    function shiftMonth(n) {
      var p = ui.calMonth.split('-');
      var d = new Date(Date.UTC(+p[0], +p[1] - 1 + n, 1, 12));
      ui.calMonth = d.toISOString().slice(0, 7);
      ui.calSelected = ui.calMonth === today.slice(0, 7) ? today : ui.calMonth + '-01';
      renderCalendar();
    }
    $('#cal-prev').addEventListener('click', function () { shiftMonth(-1); });
    $('#cal-next').addEventListener('click', function () { shiftMonth(1); });
    $('#cal-grid').addEventListener('click', function (e) {
      var b = e.target.closest('[data-day]');
      if (!b) return;
      ui.calSelected = b.dataset.day;
      if (ui.calSelected.slice(0, 7) !== ui.calMonth) ui.calMonth = ui.calSelected.slice(0, 7);
      renderCalendar();
      var sel = $('#cal-grid [aria-selected="true"]');
      if (sel) sel.focus();
    });
    $('#cal-detail').addEventListener('click', function (e) {
      var b = e.target.closest('[data-plan-day]');
      if (!b) return;
      ui.dayKey = b.dataset.planDay;
      showView('day');
    });

    // Nature
    $$('.seg-btn[data-nature]').forEach(function (b) {
      b.addEventListener('click', function () { ui.natureTab = b.dataset.nature; renderNature(); });
    });
    $('#nature-prev').addEventListener('click', function () { ui.natureMonth = ui.natureMonth === 1 ? 12 : ui.natureMonth - 1; renderNature(); });
    $('#nature-next').addEventListener('click', function () { ui.natureMonth = ui.natureMonth === 12 ? 1 : ui.natureMonth + 1; renderNature(); });
    $('#nature-list').addEventListener('click', function (e) {
      var s = e.target.closest('[data-seen]');
      if (s) { toggleSeen(s.dataset.seen); return; }
      var a = e.target.closest('[data-nat-add]');
      if (a) addNatureToDay(a.dataset.natAdd);
    });

    // "Adding to" day picker
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-target]');
      if (t) setTargetDay(t.dataset.target);
    });
    document.addEventListener('change', function (e) {
      if (e.target.classList.contains('target-date')) setTargetDay(e.target.value);
    });

    // Months ahead
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-goto-months]')) showView('months');
    });
    $('#months-back').addEventListener('click', function () { showView(ui.prevView || 'day'); });
    $('#months-filter').addEventListener('click', function (e) {
      var b = e.target.closest('[data-mfilter]');
      if (!b) return;
      ui.monthsFilter = b.dataset.mfilter;
      renderMonths();
    });
    $('#more-months').addEventListener('click', function () {
      ui.monthsCount = Math.min(18, ui.monthsCount + 6);
      renderMonths();
    });
    function openDayFromMonths(e) {
      var t = e.target.closest('[data-day]');
      if (!t) return;
      ui.dayKey = t.dataset.day;
      showView('day');
    }
    $('#months-list').addEventListener('click', openDayFromMonths);
    $('#months-list').addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.hl[data-day]')) { e.preventDefault(); openDayFromMonths(e); }
    });

    // Ideas
    $$('.seg-btn[data-ideas]').forEach(function (b) {
      b.addEventListener('click', function () { ui.ideasMode = b.dataset.ideas; renderIdeas(); });
    });
    $('#ideas-cats').addEventListener('click', function (e) {
      var b = e.target.closest('[data-icat]');
      if (!b) return;
      ui.ideasCat = b.dataset.icat || null;
      renderIdeas();
    });
    $('#ideas-list').addEventListener('click', function (e) {
      var b = e.target.closest('[data-add-idea]');
      if (b) addIdea(+b.dataset.addIdea);
      var ib = e.target.closest('[data-add-interest]');
      if (ib) { var parts = ib.dataset.addInterest.split(':'); addIdea(+parts[0], +parts[1]); }
      if (e.target.closest('[data-action="edit-me"]') && me()) openPersonDialog(me().id);
    });
    $('#surprise-btn').addEventListener('click', surprise);
  }

  function openSettings() {
    renderSettings();
    $('#settings-dialog').showModal();
  }

  /* ---------- Reminders: everything with a reminder on a day, for everyone ---------- */
  function collectReminders(key) {
    var out = [];
    state.profiles.forEach(function (p) {
      itemsFor(key, p).forEach(function (it) {
        if (it.done || it.remind === undefined || it.remind === null || it.remind === '' || !it.time) return;
        out.push({ uid: p.id + ':' + it.id, title: it.title, emoji: it.emoji, time: it.time, remind: it.remind, person: p.name });
      });
    });
    return out.concat(Home.reminderItems(key));
  }

  /* ---------- Offline ---------- */
  function showOnline(announce) {
    var off = navigator.onLine === false;
    $('#offline-pill').hidden = !off;
    if (announce) toast(off ? '📴 You’re offline. Everything still works and saves on this device.' : 'Back online ✓');
  }

  function setUpOffline() {
    showOnline(false);
    window.addEventListener('offline', function () { showOnline(true); });
    window.addEventListener('online', function () { showOnline(true); });
    var status = $('#offline-status');
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.ready.then(function () {
        status.textContent = '✅ Saved on this device – works with no internet.';
      });
    } else {
      status.textContent = 'Open My Days from its web address to use it offline.';
    }
    // Ask the browser not to clear our saved plans when space runs low
    // (Firefox would show a question, so it is left to its own settings there).
    try {
      if (navigator.storage && navigator.storage.persist && !/firefox/i.test(navigator.userAgent)) {
        navigator.storage.persisted().then(function (yes) { if (!yes) navigator.storage.persist(); });
      }
    } catch (e) { /* not available */ }
  }

  /* ---------- Start ---------- */
  function start() {
    applyTheme();
    Home.init({
      state: function () { return state; }, save: save, me: me, esc: esc, uid: uid, toast: toast,
      today: function () { return today; }, Sky: Sky
    });
    bind();
    Timer.init();
    setUpOffline();
    Reminders.init({
      collect: collectReminders, today: function () { return today; }, addDays: Sky.addDays,
      settings: function () { return state.settings; }, chime: Timer.chime, esc: esc, toast: toast,
      peopleCount: function () { return state.profiles.length; }
    });
    // Browsers only allow sound after a tap, so get it ready on the first one
    document.addEventListener('pointerdown', function unlock() {
      Timer.unlockAudio();
      document.removeEventListener('pointerdown', unlock);
    });
    renderHeader();
    showView('day');
    tickClock();
    setInterval(tickClock, 1000);
    if (state.profiles.length === 0) openPersonDialog(null);

    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      // When a newer version is published, switch to it straight away (once per update).
      var hadController = !!navigator.serviceWorker.controller;
      var reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (!hadController || reloading) return;
        reloading = true;
        location.reload();
      });
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (reg) {
        swReg = reg;
        reg.update();
        // Check again whenever the app is brought back to the screen
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState === 'visible') reg.update();
        });
      }).catch(function () { /* offline mode unavailable */ });
    }
  }

  start();
})();
