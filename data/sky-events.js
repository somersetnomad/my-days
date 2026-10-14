/*
  Sky events that can't be worked out by the app itself.
  (Moon phases, full moon names, equinoxes, solstices and clock changes
  are calculated automatically – you don't need to add those here.)

  To add an event, copy one line and change it:
    { date: 'YYYY-MM-DD', type: 'meteor', title: 'Short name', note: 'What to look for' },

  type can be: meteor, eclipse, planet, other
  For meteor showers, use the date of the EVENING the best night starts.
  See UPDATING-SKY-EVENTS.md for where to find next year's dates.
*/
window.SKY_EVENTS = [

  /* ---------- 2026 ---------- */
  { date: '2026-10-21', type: 'meteor', title: 'Orionid meteor shower', note: 'Tiny bits of Halley’s Comet burning up. Best after midnight, looking south-east. Up to about 20 an hour.' },
  { date: '2026-11-17', type: 'meteor', title: 'Leonid meteor shower', note: 'Fast meteors, best in the early hours before dawn.' },
  { date: '2026-12-13', type: 'meteor', title: 'Geminid meteor shower', note: 'The best shower of the year: up to 100+ an hour from a dark spot. Start looking from mid-evening.' },
  { date: '2026-12-21', type: 'meteor', title: 'Ursid meteor shower', note: 'A small shower around the solstice: a few meteors an hour, near the Little Bear.' },

  /* ---------- 2027 ---------- */
  { date: '2027-01-03', type: 'meteor', title: 'Quadrantid meteor shower', note: 'A short, strong peak in the early hours of the 4th. The moon is nearly new, so skies are dark.' },
  { date: '2027-01-03', type: 'planet', title: 'Venus at its highest in the morning', note: 'Venus is at its furthest from the Sun: a brilliant “morning star” in the south-east before sunrise.' },
  { date: '2027-02-11', type: 'planet', title: 'Jupiter at its closest and brightest', note: 'Jupiter is opposite the Sun, up all night. Binoculars can show its four biggest moons.' },
  { date: '2027-02-19', type: 'planet', title: 'Mars at its closest and brightest', note: 'Mars shines orange-red in Leo all night long.' },
  { date: '2027-04-22', type: 'meteor', title: 'Lyrid meteor shower', note: 'Medium shower, about 15–20 an hour. Best before dawn.' },
  { date: '2027-05-05', type: 'meteor', title: 'Eta Aquariid meteor shower', note: 'More bits of Halley’s Comet. New moon this year, so dark skies before dawn.' },
  { date: '2027-08-02', type: 'eclipse', title: 'Partial solar eclipse', note: 'The Moon covers about 40% of the Sun from Somerset, biggest around 10am. NEVER look at the Sun directly – use eclipse glasses or a pinhole viewer.' },
  { date: '2027-08-12', type: 'meteor', title: 'Perseid meteor shower', note: 'The famous summer shower. Warm nights, up to 100 an hour from a dark spot like Exmoor.' },
  { date: '2027-08-17', type: 'eclipse', title: 'Penumbral lunar eclipse', note: 'A very faint shading on the full moon – see if you can spot it!' },
  { date: '2027-10-18', type: 'planet', title: 'Saturn at its closest and brightest', note: 'Saturn is up all night. Even a small telescope shows its rings.' },
  { date: '2027-10-21', type: 'meteor', title: 'Orionid meteor shower', note: 'Bits of Halley’s Comet. Best after midnight.' },
  { date: '2027-11-17', type: 'meteor', title: 'Leonid meteor shower', note: 'Fast meteors in the early hours.' },
  { date: '2027-12-13', type: 'meteor', title: 'Geminid meteor shower', note: 'The best shower of the year, though the full moon will hide the fainter ones this time.' },
  { date: '2027-12-22', type: 'meteor', title: 'Ursid meteor shower', note: 'A small shower just after the solstice.' },

  /* ---------- 2028 ---------- */
  { date: '2028-01-03', type: 'meteor', title: 'Quadrantid meteor shower', note: 'A short, strong peak in the early hours of the 4th.' },
  { date: '2028-01-12', type: 'eclipse', title: 'Tiny partial lunar eclipse', note: 'Around 4am the Earth’s shadow just nibbles the bottom edge of the moon.' },
  { date: '2028-01-26', type: 'eclipse', title: 'Partial solar eclipse at sunset', note: 'The Sun sets partly eclipsed. Needs a clear south-western horizon. Never look directly at the Sun.' },
  { date: '2028-03-12', type: 'planet', title: 'Jupiter at its closest and brightest', note: 'Jupiter in Leo, up all night. Look for its moons with binoculars.' },
  { date: '2028-04-21', type: 'meteor', title: 'Lyrid meteor shower', note: 'Medium shower, best before dawn.' },
  { date: '2028-05-05', type: 'meteor', title: 'Eta Aquariid meteor shower', note: 'Bits of Halley’s Comet, best just before dawn.' },
  { date: '2028-08-12', type: 'meteor', title: 'Perseid meteor shower', note: 'The famous summer shower. Lie back on a blanket and look up.' },
  { date: '2028-10-21', type: 'meteor', title: 'Orionid meteor shower', note: 'Bits of Halley’s Comet. Best after midnight.' },
  { date: '2028-10-30', type: 'planet', title: 'Saturn at its closest and brightest', note: 'Saturn is up all night, low in the south around midnight.' },
  { date: '2028-11-17', type: 'meteor', title: 'Leonid meteor shower', note: 'Fast meteors in the early hours.' },
  { date: '2028-12-13', type: 'meteor', title: 'Geminid meteor shower', note: 'The best shower of the year.' },
  { date: '2028-12-21', type: 'meteor', title: 'Ursid meteor shower', note: 'A small shower around the solstice.' }

];
