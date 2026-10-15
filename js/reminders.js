/*
  Reminders (alarms for plans and appointments).

  While My Days is open – on screen, in another tab, or in the background –
  it checks every few seconds for anything due. When something is due it
  chimes, shows a "Reminder" message in the app and, if allowed, a pop-up
  notification from the browser.

  Browsers can't run a web page that has been fully closed, so reminders
  can't ring when the browser itself is shut. Nothing here leaves the device.
*/
(function (global) {
  'use strict';

  var FIRED_KEY = 'somerset-day-planner-fired';
  var GRACE = 15 * 60000;   // still ring if we were asleep for up to 15 minutes
  var api = null;
  var store = { fired: {}, snoozed: [] };
  var showing = [];
  var loop = null;

  var OPTIONS = [
    { v: '', label: 'No reminder' },
    { v: '0', label: 'At the start time' },
    { v: '5', label: '5 minutes before' },
    { v: '10', label: '10 minutes before' },
    { v: '15', label: '15 minutes before' },
    { v: '30', label: '30 minutes before' },
    { v: '60', label: '1 hour before' },
    { v: '120', label: '2 hours before' },
    { v: '1440', label: '1 day before' }
  ];

  function load() {
    try {
      var raw = localStorage.getItem(FIRED_KEY);
      if (raw) {
        var s = JSON.parse(raw);
        store.fired = s.fired || {};
        store.snoozed = s.snoozed || [];
      }
    } catch (e) { /* ignore */ }
  }
  function save() {
    // forget anything older than 3 days
    var cutoff = Date.now() - 3 * 86400000;
    Object.keys(store.fired).forEach(function (k) { if (store.fired[k] < cutoff) delete store.fired[k]; });
    try { localStorage.setItem(FIRED_KEY, JSON.stringify(store)); } catch (e) { /* ignore */ }
  }

  function atMs(dateKey, time) {
    var d = dateKey.split('-'), t = time.split(':');
    return new Date(+d[0], +d[1] - 1, +d[2], +t[0], +t[1], 0, 0).getTime();
  }

  function label(remind) {
    for (var i = 0; i < OPTIONS.length; i++) if (OPTIONS[i].v === String(remind)) return OPTIONS[i].label;
    return '';
  }

  function whenText(r) {
    var mins = Math.round((r.startAt - Date.now()) / 60000);
    if (mins <= 0) return 'Starting now' + (r.time ? ' (' + r.time + ')' : '');
    if (mins < 60) return 'Starts in ' + mins + (mins === 1 ? ' minute' : ' minutes') + ' (' + r.time + ')';
    if (mins < 24 * 60) {
      var h = Math.round(mins / 60);
      return 'Starts in about ' + h + (h === 1 ? ' hour' : ' hours') + ' (' + r.time + ')';
    }
    return 'Tomorrow at ' + r.time;
  }

  // Everything that should ring around now
  function due() {
    var now = Date.now();
    var keys = [api.addDays(api.today(), -1), api.today(), api.addDays(api.today(), 1), api.addDays(api.today(), 2)];
    var out = [];
    keys.forEach(function (k) {
      api.collect(k).forEach(function (r) {
        if (r.remind === '' || r.remind == null || !r.time) return;
        var startAt = atMs(k, r.time);
        var fireAt = startAt - (+r.remind) * 60000;
        var id = [r.uid, k, r.time, r.remind].join('|');
        if (store.fired[id]) return;
        if (now >= fireAt && now - fireAt < GRACE) {
          out.push({ id: id, title: r.title, emoji: r.emoji || '🔔', person: r.person, time: r.time, startAt: startAt, where: r.where || '' });
        }
      });
    });
    store.snoozed = store.snoozed.filter(function (s) {
      if (now >= s.at) {
        if (now - s.at < GRACE) out.push(s.item);
        return false;
      }
      return true;
    });
    return out;
  }

  function check() {
    if (!api) return;
    var list = due();
    if (!list.length) return;
    list.forEach(function (r) { store.fired[r.id] = Date.now(); });
    save();
    ring(list);
  }

  function ring(list) {
    showing = showing.concat(list);
    renderDialog();
    if (api.settings().remindSound !== false) api.chime();
    if (navigator.vibrate) { try { navigator.vibrate([300, 150, 300]); } catch (e) { /* ignore */ } }
    var away = document.hidden || !document.hasFocus();
    if (away) list.forEach(systemNotify);
  }

  function titleFor(r) {
    return (r.person && api.peopleCount() > 1 ? r.person + ': ' : '') + r.title;
  }

  function systemNotify(r) {
    if (!('Notification' in global) || Notification.permission !== 'granted') return;
    var opts = {
      body: whenText(r) + (r.where ? '\n📍 ' + r.where : ''),
      icon: 'icons/icon-192.png', badge: 'icons/icon-192.png',
      tag: r.id, renotify: true, requireInteraction: true
    };
    var title = r.emoji + ' ' + titleFor(r);
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(function (reg) { reg.showNotification(title, opts); })
        .catch(function () { try { new Notification(title, opts); } catch (e) { /* ignore */ } });
    } else {
      try { new Notification(title, opts); } catch (e) { /* ignore */ }
    }
  }

  function esc(s) { return api.esc(s); }

  function renderDialog() {
    var d = document.getElementById('remind-dialog');
    if (!showing.length) { if (d.open) d.close(); return; }
    document.getElementById('remind-list').innerHTML = showing.map(function (r) {
      return '<li><span class="remind-emoji" aria-hidden="true">' + esc(r.emoji) + '</span><div>' +
        '<div class="remind-title">' + esc(titleFor(r)) + '</div>' +
        '<div class="remind-when">' + esc(whenText(r)) + '</div>' +
        (r.where ? '<div class="remind-when">📍 ' + esc(r.where) + '</div>' : '') + '</div></li>';
    }).join('');
    if (!d.open) d.showModal();
    document.getElementById('remind-ok').focus();
  }

  function dismiss() {
    showing = [];
    renderDialog();
  }

  function snooze(mins) {
    var at = Date.now() + mins * 60000;
    showing.forEach(function (r) { store.snoozed.push({ at: at, item: r }); });
    save();
    api.toast('I’ll remind you again in ' + mins + ' minutes');
    dismiss();
  }

  function permission() {
    if (!('Notification' in global)) return 'unsupported';
    return Notification.permission; // 'default' | 'granted' | 'denied'
  }

  function ask() {
    if (permission() !== 'default') return Promise.resolve(permission());
    try {
      var p = Notification.requestPermission();
      if (p && p.then) return p;
      return new Promise(function (res) { Notification.requestPermission(res); });
    } catch (e) { return Promise.resolve(permission()); }
  }

  function test() {
    api.toast('A test reminder will ring in 5 seconds…');
    setTimeout(function () {
      ring([{ id: 'test|' + Date.now(), title: 'This is how a reminder looks', emoji: '🔔', time: '', startAt: Date.now(), where: '' }]);
    }, 5000);
  }

  global.Reminders = {
    OPTIONS: OPTIONS,
    label: label,
    permission: permission,
    ask: ask,
    test: test,
    check: check,
    init: function (helpers) {
      api = helpers;
      load();
      document.getElementById('remind-ok').addEventListener('click', dismiss);
      document.getElementById('remind-snooze').addEventListener('click', function () { snooze(5); });
      document.getElementById('remind-dialog').addEventListener('cancel', function () { showing = []; });
      clearInterval(loop);
      loop = setInterval(check, 10000);
      document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
      global.addEventListener('focus', check);
      setTimeout(check, 1500);
    }
  };
})(window);
