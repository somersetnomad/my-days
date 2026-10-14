/*
  Countdown timer with a soft chime.
  Uses the real end time, so it stays accurate even if the screen sleeps
  or you switch to another part of the app. Survives a page refresh.
*/
(function (global) {
  'use strict';

  var KEY = 'somerset-day-planner-timer';
  var t = { duration: 10 * 60000, remaining: 10 * 60000, endAt: null };
  var tickHandle = null;
  var audioCtx = null;
  var listeners = { tick: [], done: [] };

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var s = JSON.parse(raw);
        if (typeof s.duration === 'number') t = s;
      }
    } catch (e) { /* storage not available */ }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(t)); } catch (e) { /* ignore */ }
  }

  function emit(name) {
    listeners[name].forEach(function (fn) { fn(state()); });
  }

  function state() {
    var remaining = t.endAt ? Math.max(0, t.endAt - Date.now()) : t.remaining;
    return { running: !!t.endAt, remaining: remaining, duration: t.duration };
  }

  function loop() {
    clearInterval(tickHandle);
    tickHandle = setInterval(function () {
      var s = state();
      emit('tick');
      if (s.running && s.remaining <= 0) finish();
    }, 250);
  }

  function finish() {
    t.endAt = null;
    t.remaining = 0;
    save();
    clearInterval(tickHandle);
    emit('tick');
    emit('done');
  }

  function unlockAudio() {
    try {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) { /* no sound available */ }
  }

  // A gentle two-note chime, played three times
  function chime() {
    if (!audioCtx) return;
    var now = audioCtx.currentTime;
    var notes = [659.25, 987.77]; // E5, B5
    for (var r = 0; r < 3; r++) {
      notes.forEach(function (freq, i) {
        var start = now + r * 1.6 + i * 0.35;
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.18, start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.4);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + 1.5);
      });
    }
  }

  var Timer = {
    on: function (name, fn) { listeners[name].push(fn); },
    state: state,
    set: function (minutes) {
      var ms = Math.max(1, Math.min(180, minutes)) * 60000;
      t = { duration: ms, remaining: ms, endAt: null };
      save(); clearInterval(tickHandle); emit('tick');
    },
    adjust: function (minutes) {
      var s = state();
      var next = Math.max(60000, Math.min(180 * 60000, s.remaining + minutes * 60000));
      if (s.running) {
        t.endAt = Date.now() + next;
        t.duration = Math.max(t.duration, next);
      } else {
        // Not started yet: change the whole time. Paused part-way: keep the ring in proportion.
        t.duration = (s.remaining === s.duration) ? next : Math.max(t.duration, next);
        t.remaining = next;
      }
      save(); emit('tick');
    },
    start: function () {
      unlockAudio();
      var s = state();
      if (s.running) return;
      if (s.remaining <= 0) { t.remaining = t.duration; }
      t.endAt = Date.now() + t.remaining;
      save(); loop(); emit('tick');
    },
    pause: function () {
      var s = state();
      if (!s.running) return;
      t.remaining = s.remaining;
      t.endAt = null;
      save(); clearInterval(tickHandle); emit('tick');
    },
    reset: function () {
      t.endAt = null;
      t.remaining = t.duration;
      save(); clearInterval(tickHandle); emit('tick');
    },
    chime: chime,
    unlockAudio: unlockAudio,
    init: function () {
      load();
      var s = state();
      if (s.running) {
        if (s.remaining <= 0) { finish(); } else { loop(); }
      }
      emit('tick');
    }
  };

  global.Timer = Timer;
})(window);
