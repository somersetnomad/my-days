# Updating the sky events

Most of the sky calendar looks after itself. The app **calculates** these for any year, forever:

- Moon phases and the next full and new moon
- Full moon names (Wolf, Snow, … Harvest, Hunter's, Blue Moon)
- Equinoxes and solstices (the start of each season)
- When the UK clocks go forward and back
- Sunrise, sunset and daylight for Somerset

The only things you need to add by hand are **meteor showers, eclipses and planet highlights**.
They live in `data/sky-events.js`. The file currently covers **October 2026 to the end of 2028**.

## Once a year (a good time is each autumn)

1. Open `data/sky-events.js` (on GitHub: click it, then the pencil icon).
2. Copy one of the existing lines and change the date, title and note. For example:

   ```js
   { date: '2029-08-12', type: 'meteor', title: 'Perseid meteor shower', note: 'The famous summer shower.' },
   ```

   - `date` is `YEAR-MONTH-DAY`. For meteor showers, use the **evening** the best night begins.
   - `type` is one of `meteor`, `eclipse`, `planet` or `other` (this picks the little picture).
   - Keep a comma at the end of every line except the last one before `];`.
3. Save (**Commit changes**), then bump the version in `sw.js` (e.g. `my-days-v2` → `my-days-v3`).

## The main yearly meteor showers (roughly the same dates every year)

| Shower | Usual peak night |
|---|---|
| Quadrantids | 3–4 January |
| Lyrids | 21–22 April |
| Eta Aquariids | 5–6 May |
| Perseids | 12–13 August |
| Orionids | 21–22 October |
| Leonids | 17–18 November |
| Geminids | 13–14 December |
| Ursids | 21–22 December |

Check the exact night each year, because it can shift by a day.

## Where to check dates

- **International Meteor Organization** calendar – meteor shower peaks: imo.net
- **Royal Observatory Greenwich** – UK sky guides and planet dates: rmg.co.uk
- **In-The-Sky.org** – full yearly astronomy calendars: in-the-sky.org
- **Society for Popular Astronomy** – UK-focused eclipse and sky news: popastro.com
- **BBC Sky at Night** – monthly UK sky guides: skyatnightmagazine.com

For eclipses, only add the ones that can actually be seen from the UK, and always remind people
never to look straight at the Sun.
