/*
  Repeating plans.
  A repeating plan ("series") is stored once, with a rule, and shown on every
  day the rule matches. Each day keeps its own tick, and single days can be skipped.

  series = {
    id, title, emoji, cat, tags, time, notes, remind,
    start: 'YYYY-MM-DD', until: 'YYYY-MM-DD' or '',
    rule: 'daily' | 'weekdays' | 'days' | 'weekly' | 'fortnightly' | 'monthly' | 'yearly',
    days: [0..6]   (only for 'days'; 0 = Monday)
    skip: ['YYYY-MM-DD', ...], done: { 'YYYY-MM-DD': true }
  }
*/
(function (global) {
  'use strict';

  var DOW_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var DOW_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var RULES = [
    { id: '', label: 'Doesn’t repeat' },
    { id: 'daily', label: 'Every day' },
    { id: 'weekdays', label: 'Weekdays (Mon–Fri)' },
    { id: 'days', label: 'On certain days…' },
    { id: 'weekly', label: 'Every week' },
    { id: 'fortnightly', label: 'Every 2 weeks' },
    { id: 'monthly', label: 'Every month' },
    { id: 'yearly', label: 'Every year' }
  ];

  function parts(key) { var a = key.split('-'); return { y: +a[0], m: +a[1], d: +a[2] }; }
  function utc(key) { var p = parts(key); return Date.UTC(p.y, p.m - 1, p.d); }
  function dow(key) { return (new Date(utc(key)).getUTCDay() + 6) % 7; } // 0 = Monday
  function daysIn(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
  function between(a, b) { return Math.round((utc(b) - utc(a)) / 86400000); }

  function occursOn(s, key) {
    if (!s || !s.start || key < s.start) return false;
    if (s.until && key > s.until) return false;
    if (s.skip && s.skip.indexOf(key) >= 0) return false;
    var st = parts(s.start), k = parts(key);
    switch (s.rule) {
      case 'daily': return true;
      case 'weekdays': return dow(key) < 5;
      case 'days': return (s.days || []).indexOf(dow(key)) >= 0;
      case 'weekly': return dow(key) === dow(s.start);
      case 'fortnightly': return between(s.start, key) % 14 === 0;
      case 'monthly': return k.d === Math.min(st.d, daysIn(k.y, k.m));
      case 'yearly':
        if (k.m !== st.m) return false;
        return k.d === Math.min(st.d, daysIn(k.y, k.m));
      default: return key === s.start;
    }
  }

  function ordinal(n) {
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  // Short, friendly description, e.g. "Every Thursday"
  function describe(s) {
    if (!s) return '';
    var st = parts(s.start);
    switch (s.rule) {
      case 'daily': return 'Every day';
      case 'weekdays': return 'Weekdays';
      case 'days':
        var d = (s.days || []).slice().sort();
        if (d.length === 7) return 'Every day';
        return 'Every ' + d.map(function (i) { return DOW_SHORT[i]; }).join(', ');
      case 'weekly': return 'Every ' + DOW_LONG[dow(s.start)];
      case 'fortnightly': return 'Every other ' + DOW_LONG[dow(s.start)];
      case 'monthly': return 'Monthly on the ' + ordinal(st.d);
      case 'yearly':
        return 'Every year on ' + st.d + ' ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July',
          'August', 'September', 'October', 'November', 'December'][st.m - 1];
      default: return '';
    }
  }

  global.Repeat = { RULES: RULES, DOW_SHORT: DOW_SHORT, occursOn: occursOn, describe: describe, dow: dow };
})(window);
