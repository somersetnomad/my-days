/*
  Sky calculations for Somerset.
  Everything here is worked out in the browser, so it keeps working offline
  and never needs updating: sunrise/sunset, moon phases, full moon names,
  equinoxes and solstices, and UK clock changes.
  Events that can't be calculated (meteor showers, eclipses, planets)
  live in data/sky-events.js.
*/
(function (global) {
  'use strict';

  var LAT = 51.1;   // Somerset (roughly the middle of the county)
  var LNG = -2.9;
  var TZ = 'Europe/London';
  var DAY = 86400000;

  /* ---------- Dates as simple "YYYY-MM-DD" keys in UK time ---------- */

  var keyFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'
  });

  function dayKey(date) {
    var p = {};
    keyFmt.formatToParts(date || new Date()).forEach(function (x) { p[x.type] = x.value; });
    return p.year + '-' + p.month + '-' + p.day;
  }

  function keyParts(key) {
    var a = key.split('-');
    return { y: +a[0], m: +a[1], d: +a[2] };
  }

  // A Date at midday UTC on that calendar day (safe for calendar maths)
  function keyToUTCNoon(key) {
    var p = keyParts(key);
    return new Date(Date.UTC(p.y, p.m - 1, p.d, 12));
  }

  function addDays(key, n) {
    var d = keyToUTCNoon(key);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function daysBetween(fromKey, toKey) {
    return Math.round((keyToUTCNoon(toKey) - keyToUTCNoon(fromKey)) / DAY);
  }

  function fmt(date, opts) {
    var o = Object.assign({ timeZone: TZ }, opts);
    return new Intl.DateTimeFormat('en-GB', o).format(date);
  }

  function fmtKey(key, opts) {
    return new Intl.DateTimeFormat('en-GB', Object.assign({ timeZone: 'UTC' }, opts))
      .format(keyToUTCNoon(key));
  }

  function fmtTime(date) {
    if (!date || isNaN(date)) return '–';
    return fmt(date, { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  /* ---------- Sun ---------- */

  function sunTimes(key) {
    var t = SunCalc.getTimes(keyToUTCNoon(key), LAT, LNG);
    var length = (t.sunset - t.sunrise) / 60000; // minutes
    return { sunrise: t.sunrise, sunset: t.sunset, dayMinutes: length };
  }

  /* ---------- Moon ---------- */

  function moonPhaseName(p) {
    if (p < 0.025 || p > 0.975) return 'New moon';
    if (p < 0.225) return 'Waxing crescent';
    if (p < 0.275) return 'First quarter';
    if (p < 0.475) return 'Waxing gibbous';
    if (p < 0.525) return 'Full moon';
    if (p < 0.725) return 'Waning gibbous';
    if (p < 0.775) return 'Last quarter';
    return 'Waning crescent';
  }

  function moonNow(date) {
    var m = SunCalc.getMoonIllumination(date || new Date());
    return { phase: m.phase, fraction: m.fraction, name: moonPhaseName(m.phase) };
  }

  // Signed distance from a target phase, in the range -0.5..0.5
  function phaseOffset(t, target) {
    var p = SunCalc.getMoonIllumination(new Date(t)).phase - target;
    if (p > 0.5) p -= 1;
    if (p < -0.5) p += 1;
    return p;
  }

  function refine(a, b, target) {
    for (var i = 0; i < 40; i++) {
      var mid = (a + b) / 2;
      if (phaseOffset(a, target) * phaseOffset(mid, target) <= 0) b = mid; else a = mid;
    }
    return new Date((a + b) / 2);
  }

  // All new and full moons between two Dates
  function moonPhasesBetween(start, end) {
    var out = [];
    var step = 6 * 3600000;
    var t0 = start.getTime() - step;
    var targets = [{ type: 'new', v: 0 }, { type: 'full', v: 0.5 }];
    targets.forEach(function (tg) {
      var prev = phaseOffset(t0, tg.v);
      for (var t = t0 + step; t <= end.getTime() + step; t += step) {
        var cur = phaseOffset(t, tg.v);
        if (prev < 0 && cur >= 0) {
          var when = refine(t - step, t, tg.v);
          if (when >= start && when <= end) out.push({ type: tg.type, date: when });
        }
        prev = cur;
      }
    });
    out.sort(function (a, b) { return a.date - b.date; });
    return out;
  }

  function nextMoon(type, from) {
    from = from || new Date();
    var list = moonPhasesBetween(from, new Date(from.getTime() + 32 * DAY));
    for (var i = 0; i < list.length; i++) if (list[i].type === type) return list[i].date;
    return null;
  }

  /* ---------- Equinoxes & solstices (Meeus, Astronomical Algorithms ch. 27) ---------- */

  var PER = [
    [485, 324.96, 1934.136], [203, 337.23, 32964.467], [199, 342.08, 20.186],
    [182, 27.85, 445267.112], [156, 73.14, 45036.886], [136, 171.52, 22518.443],
    [77, 222.54, 65928.934], [74, 296.72, 3034.906], [70, 243.58, 9037.513],
    [58, 119.81, 33718.147], [52, 297.17, 150.678], [50, 21.02, 2281.226],
    [45, 247.54, 29929.562], [44, 325.15, 31555.956], [29, 60.93, 4443.417],
    [18, 155.12, 67555.328], [17, 288.79, 4562.452], [16, 198.04, 62894.029],
    [14, 199.76, 31436.921], [12, 95.39, 14577.848], [12, 287.11, 31931.756],
    [12, 320.81, 34777.259], [9, 227.73, 1222.114], [8, 15.45, 16859.074]
  ];
  var RAD = Math.PI / 180;

  // which: 0 = March equinox, 1 = June solstice, 2 = September equinox, 3 = December solstice
  function seasonStart(year, which) {
    var Y = (year - 2000) / 1000;
    var c = [
      [2451623.80984, 365242.37404, 0.05169, -0.00411, -0.00057],
      [2451716.56767, 365241.62603, 0.00325, 0.00888, -0.00030],
      [2451810.21715, 365242.01767, -0.11575, 0.00337, 0.00078],
      [2451900.05952, 365242.74049, -0.06223, -0.00823, 0.00032]
    ][which];
    var jde0 = c[0] + c[1] * Y + c[2] * Y * Y + c[3] * Y * Y * Y + c[4] * Y * Y * Y * Y;
    var T = (jde0 - 2451545.0) / 36525;
    var W = (35999.373 * T - 2.47) * RAD;
    var dl = 1 + 0.0334 * Math.cos(W) + 0.0007 * Math.cos(2 * W);
    var S = 0;
    PER.forEach(function (r) { S += r[0] * Math.cos((r[1] + r[2] * T) * RAD); });
    var jde = jde0 + (0.00001 * S) / dl;
    // Terrestrial Time -> UTC (about 70 seconds; close enough for a calendar)
    return new Date((jde - 2440587.5) * DAY - 70000);
  }

  var SEASONS = [
    { id: 'spring', name: 'Spring', emoji: '🌱' },
    { id: 'summer', name: 'Summer', emoji: '☀️' },
    { id: 'autumn', name: 'Autumn', emoji: '🍂' },
    { id: 'winter', name: 'Winter', emoji: '❄️' }
  ];

  function seasonInfo(date) {
    date = date || new Date();
    var y = +fmt(date, { year: 'numeric' });
    var marks = [];
    [y - 1, y, y + 1].forEach(function (yr) {
      for (var i = 0; i < 4; i++) marks.push({ i: i, date: seasonStart(yr, i) });
    });
    for (var k = 0; k < marks.length - 1; k++) {
      if (date >= marks[k].date && date < marks[k + 1].date) {
        var s = SEASONS[marks[k].i];
        var total = marks[k + 1].date - marks[k].date;
        return {
          id: s.id, name: s.name, emoji: s.emoji,
          start: marks[k].date, end: marks[k + 1].date,
          progress: (date - marks[k].date) / total,
          next: SEASONS[marks[k + 1].i]
        };
      }
    }
    return null;
  }

  /* ---------- UK clock changes (last Sunday of March / October, 01:00 UTC) ---------- */

  function lastSunday(year, monthIndex) {
    var d = new Date(Date.UTC(year, monthIndex + 1, 0, 1));
    d.setUTCDate(d.getUTCDate() - d.getUTCDay());
    return d;
  }

  /* ---------- Full moon names ---------- */

  var MOON_NAMES = ['Wolf Moon', 'Snow Moon', 'Worm Moon', 'Pink Moon', 'Flower Moon',
    'Strawberry Moon', 'Buck Moon', 'Sturgeon Moon', 'Corn Moon', 'Hunter’s Moon',
    'Beaver Moon', 'Cold Moon'];

  function nameFullMoons(fulls) {
    // Default: the month's traditional name
    fulls.forEach(function (f) {
      f.name = MOON_NAMES[+fmt(f.date, { month: 'numeric' }) - 1];
    });
    // Second full moon in the same calendar month is a Blue Moon
    for (var i = 1; i < fulls.length; i++) {
      if (fmt(fulls[i].date, { year: 'numeric', month: 'numeric' }) ===
          fmt(fulls[i - 1].date, { year: 'numeric', month: 'numeric' })) {
        fulls[i].name = 'Blue Moon';
      }
    }
    // Harvest Moon = full moon nearest the September equinox; Hunter's Moon follows it
    var years = {};
    fulls.forEach(function (f) { years[fmt(f.date, { year: 'numeric' })] = true; });
    Object.keys(years).forEach(function (yr) {
      var eq = seasonStart(+yr, 2);
      var best = -1, bestGap = Infinity;
      fulls.forEach(function (f, idx) {
        var gap = Math.abs(f.date - eq);
        if (gap < bestGap) { bestGap = gap; best = idx; }
      });
      if (best >= 0 && bestGap < 20 * DAY) {
        var harvest = fulls[best];
        // (If the Harvest Moon falls in October, September's keeps the name Corn Moon.)
        harvest.name = 'Harvest Moon';
        if (fulls[best + 1]) fulls[best + 1].name = 'Hunter’s Moon';
      }
    });
    return fulls;
  }

  /* ---------- Events list ---------- */

  var TYPE_ICON = {
    full: '🌕', new: '🌑', season: '🌍', clocks: '🕰️',
    meteor: '🌠', eclipse: '🌘', planet: '🪐', other: '✨'
  };

  var cache = {};

  // All events for a calendar year (calculated + from data file)
  function eventsForYear(year) {
    if (cache[year]) return cache[year];
    var list = [];
    var start = new Date(Date.UTC(year, 0, 1) - 40 * DAY);
    var end = new Date(Date.UTC(year + 1, 0, 1) + 40 * DAY);

    var phases = moonPhasesBetween(start, end);
    var fulls = nameFullMoons(phases.filter(function (p) { return p.type === 'full'; }));
    phases.forEach(function (p) {
      if (p.type === 'full') {
        list.push({
          date: dayKey(p.date), type: 'full', icon: TYPE_ICON.full,
          title: 'Full moon · ' + p.name,
          note: 'Look east around sunset to watch it rise, big and golden.'
        });
      } else {
        list.push({
          date: dayKey(p.date), type: 'new', icon: TYPE_ICON.new,
          title: 'New moon',
          note: 'Darkest skies of the month: great for spotting stars and the Milky Way.'
        });
      }
    });

    var seasonText = [
      ['Spring equinox', 'Day and night are about the same length. Spring begins!'],
      ['Summer solstice', 'The longest day of the year: the earliest sunrise and latest sunset.'],
      ['Autumn equinox', 'Day and night are about the same length. Autumn begins.'],
      ['Winter solstice', 'The shortest day. From tomorrow the days start getting longer.']
    ];
    for (var i = 0; i < 4; i++) {
      var d = seasonStart(year, i);
      list.push({ date: dayKey(d), type: 'season', icon: TYPE_ICON.season,
        title: seasonText[i][0], note: seasonText[i][1] + ' (' + fmtTime(d) + ')' });
    }

    var spring = lastSunday(year, 2), autumn = lastSunday(year, 9);
    list.push({ date: dayKey(spring), type: 'clocks', icon: TYPE_ICON.clocks,
      title: 'Clocks go forward', note: 'At 1am the clocks jump to 2am. Lighter evenings!' });
    list.push({ date: dayKey(autumn), type: 'clocks', icon: TYPE_ICON.clocks,
      title: 'Clocks go back', note: 'At 2am the clocks go back to 1am. An extra hour in bed!' });

    (global.SKY_EVENTS || []).forEach(function (e) {
      if (e.date && e.date.slice(0, 4) === String(year)) {
        list.push({ date: e.date, type: e.type || 'other', icon: TYPE_ICON[e.type] || TYPE_ICON.other,
          title: e.title, note: e.note || '' });
      }
    });

    list = list.filter(function (e) { return e.date.slice(0, 4) === String(year); });
    list.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    cache[year] = list;
    return list;
  }

  function eventsOn(key) {
    return eventsForYear(+key.slice(0, 4)).filter(function (e) { return e.date === key; });
  }

  function eventsBetween(fromKey, toKey) {
    var out = [];
    for (var y = +fromKey.slice(0, 4); y <= +toKey.slice(0, 4); y++) {
      out = out.concat(eventsForYear(y).filter(function (e) {
        return e.date >= fromKey && e.date <= toKey;
      }));
    }
    return out;
  }

  /* ---------- Moon picture ---------- */

  function moonSVG(phase, label) {
    var r = 50;
    var k = Math.cos(2 * Math.PI * phase);
    var waxing = phase < 0.5;
    var rx = (Math.abs(k) * r).toFixed(2);
    var outerSweep = waxing ? 1 : 0;
    var termSweep = waxing ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0);
    var lit = 'M50,0 A50,50 0 0 ' + outerSweep + ' 50,100 A' + rx + ',50 0 0 ' + termSweep + ' 50,0 Z';
    return '<svg class="moon-svg" viewBox="-4 -4 108 108" role="img" aria-label="' + (label || 'Moon') + '">' +
      '<circle cx="50" cy="50" r="50" class="moon-dark"/>' +
      '<path d="' + lit + '" class="moon-lit"/>' +
      '<circle cx="50" cy="50" r="50" class="moon-edge"/>' +
      '</svg>';
  }

  /* ---------- Time of day, from the real sun ---------- */

  var PHASES = {
    night:  { name: 'Night', emoji: '🌙' },
    dawn:   { name: 'Dawn', emoji: '🌅' },
    day:    { name: 'Daytime', emoji: '☀️' },
    golden: { name: 'Golden hour', emoji: '🌇' },
    dusk:   { name: 'Dusk', emoji: '🌆' }
  };

  // Which part of the day it is in Somerset right now, and when it changes next
  function skyPhase(now) {
    now = now || new Date();
    var t = SunCalc.getTimes(keyToUTCNoon(dayKey(now)), LAT, LNG);
    var marks = [
      { id: 'dawn', at: t.dawn },
      { id: 'day', at: new Date(t.sunrise.getTime() + 40 * 60000) },
      { id: 'golden', at: t.goldenHour },
      { id: 'dusk', at: t.sunset },
      { id: 'night', at: new Date(t.dusk.getTime() + 20 * 60000) }
    ].filter(function (m) { return m.at && !isNaN(m.at); });
    var id = 'night', next = marks[0];
    for (var i = 0; i < marks.length; i++) {
      if (now >= marks[i].at) { id = marks[i].id; next = marks[i + 1] || null; }
    }
    var ph = PHASES[id];
    return { id: id, name: ph.name, emoji: ph.emoji,
      next: next ? { id: next.id, name: PHASES[next.id].name, at: next.at } : null,
      sunrise: t.sunrise, sunset: t.sunset };
  }

  global.Sky = {
    skyPhase: skyPhase,
    LAT: LAT, LNG: LNG, TZ: TZ,
    dayKey: dayKey, addDays: addDays, daysBetween: daysBetween, keyToUTCNoon: keyToUTCNoon,
    fmt: fmt, fmtKey: fmtKey, fmtTime: fmtTime,
    sunTimes: sunTimes, moonNow: moonNow, nextMoon: nextMoon, moonPhasesBetween: moonPhasesBetween,
    nameFullMoons: nameFullMoons, seasonStart: seasonStart, seasonInfo: seasonInfo,
    eventsOn: eventsOn, eventsBetween: eventsBetween, eventsForYear: eventsForYear,
    moonSVG: moonSVG
  };
})(window);
