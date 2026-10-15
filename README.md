# My Days · Somerset

A calm, simple day planner for curious young people (8–18) and their families in Somerset.
Plan days around the things you love, get seasonal ideas from around the county, run a timer,
and keep an eye on the sun, moon and sky.

- No accounts, no sign-up, no tracking. Everything stays in your own browser.
- Works on phones, tablets and computers, and keeps working offline once opened.
- Can be added to your home screen like an app.

---

## What's inside

| Screen | What it does |
|---|---|
| **My Day** | Big clock, today's date, season, moon and sunrise/sunset. Add activity cards, tick them off, drag to reorder, move them to another day. Sky events show on the days they happen. |
| **Repeats & reminders** | Any plan can repeat: every day, weekdays, chosen days (e.g. Mon & Wed), weekly, every 2 weeks, monthly or yearly, with an optional end date. Each day keeps its own tick, and you can skip a single day. Add a 🔔 reminder (at the time, or 5 min to 1 day before) to plans and health appointments: it chimes, shows a Reminder message with Snooze, and can pop up a browser notification. Reminders work while My Days is open (on screen, in another tab or in the background), not when the browser is fully closed. On iPhone/iPad, add My Days to the Home Screen to allow pop-ups. Turn notifications on in Settings → Reminders. |
| **Months ahead** | A bird's-eye view of the next 6 months (up to 18): a small calendar for each month with sky events and your plans marked, plus a short list of highlights. Filter to just your plans or just the sky, and tap any day to plan it. Open it from My Day or Sky. |
| **Home** | **Meals:** plan breakfast, lunch and tea for the week, save favourite meals, keep a shopping list (copy it into a message), and see what's in season. **Self-care:** a feelings check-in, a gentle daily checklist that starts fresh every morning, and a one-minute breathing exercise. **Clothes:** sizes, things needed, and outgrown things to pass on. **Health:** appointments, medicines and routines (with optional reminders on My Day), check-up dates and important notes. **Birthdays:** family and friends in order of what's next, with reminders a week and three days before. Meals, the shopping list and birthdays are shared by the household; the rest belongs to each person. |
| **Timer** (⏳ at the top) | Countdown with quick times (5, 10, 15, 25, 45 min), a big ring, a soft chime and a "Time's up!" message. Keeps running while you use the rest of the app. |
| **Sky** | Moon phase, next full and new moon (with their names), sunrise, sunset and daylight for Somerset, how far through the season we are, a month calendar of sky events, and what's coming up. |
| **Nature** | Month by month for Somerset. **Birds:** what to see and hear, where to go (Avalon Marshes, Steart, Exmoor, the Quantocks, Cheddar…), how to recognise them, a fun fact, and an "I saw one!" list for each person. **Foraging:** safe beginner finds with where to look, how to recognise them, what to make, clear warnings, and forager's rules. Use ‹ › to look at other months, and add a trip to any day. |
| **Ideas** | Seasonal Somerset ideas, ideas from your own interests, and ideas for any day. One tap adds an idea to your day. |
| **Settings** (gear icon) | Add or change people, light/dark look, less movement, and export/import a backup. |

---

## Put it online with GitHub Pages (free)

You don't need to know any coding. This takes about 10 minutes.

### 1. Make a GitHub account
Go to **github.com** and choose **Sign up**. (This account is only for publishing the app –
nobody using the app ever needs to log in.)

### 2. Make a new repository
A "repository" is just a folder on GitHub.

1. Once signed in, click the **+** in the top-right corner, then **New repository**.
2. **Repository name:** type something short like `my-days` (this becomes part of the web address).
3. Choose **Public**.
4. Click **Create repository**.

### 3. Upload the files
1. Unzip the download on your computer, then open the `somerset-planner` folder.
2. On your new repository's page, click the link that says **uploading an existing file**.
3. Select **everything inside** the `somerset-planner` folder (`index.html`, `sw.js`, the `css`, `js`,
   `data` and `icons` folders, and so on) and drag it all into the box on the page.
   Drag the things *inside* the folder, not the folder itself.
4. Wait for the files to finish uploading, then click the green **Commit changes** button.

> If your computer hides the small file called `.nojekyll`, don't worry – the app works without it.

### 4. Switch on GitHub Pages
1. In your repository, click **Settings** (the tab along the top).
2. In the menu on the left, click **Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Under **Branch**, choose **main** and **/ (root)**, then click **Save**.
5. Wait a minute or two, then refresh the page. You'll see your web address, something like:
   `https://your-username.github.io/my-days/`

That's it – open the link on any device.

### 5. Add it to your home screen
- **iPhone / iPad (Safari):** tap the Share button, then **Add to Home Screen**.
- **Android (Chrome):** tap the ⋮ menu, then **Add to Home screen** or **Install app**.
- **Computer (Chrome / Edge):** click the install icon at the right of the address bar.

---

## Things to know

### Works offline
Open My Days once with a connection and it saves itself on the device. After that **everything
works with no internet**: planning, repeats, reminders, the timer, the sky (sun, moon and seasons
are worked out on the device), nature, home, ideas, and saving a backup copy. Nothing in the app
ever needs to reach another website.

- A small **📴 Offline** label appears at the top when there's no connection.
- Updates arrive by themselves the next time the app is opened with a connection.
- **Settings** shows "Saved on this device – works with no internet" once it's ready.
- On iPhone/iPad, add it to the Home Screen: Safari can clear website data that hasn't been used
  for a few weeks, but not for apps on the Home Screen.

### Your plans live on each device
Because there are no accounts, plans are saved in the browser you use. That means:
- Different devices have their own plans.
- Clearing your browser's data will clear the plans.

So use **Settings → Export my plans** now and then to save a backup file.
Use **Import plans** to load that file on another device (this replaces what's on that device).

### Several people on one device
Tap the name in the top-left to switch between people, or add a new person. Each person has their
own plans, colour, picture and interests.

### Sound
Browsers only allow sound after you've tapped something, so the chime works once you've pressed
**Start** on the timer. You can switch the chime off on the Timer screen.

---

## Making changes

You can edit any file directly on GitHub: open the file, click the pencil icon, make the change,
then **Commit changes**. The site updates a minute or so later.

**After any change, bump the version numbers** so everyone's device fetches the new version
instead of an old saved copy:
1. In `sw.js`, change `VERSION` (for example `my-days-v9` → `my-days-v10`) and `ASSET_V` (`'9'` → `'10'`).
2. In `index.html`, change every `?v=9` to `?v=10` (use Find & Replace).
3. In `js/app.js`, change `APP_VERSION` near the top to match – it shows in Settings.

People's devices then switch to the new version by themselves the next time they open the app.

| I want to… | Edit this file |
|---|---|
| Add or change ideas | `js/ideas.js` – copy a line and change the words |
| Add birds or foraging finds | `js/nature.js` – copy an entry; `months` lists the months (1 = January) |
| Add sky events for next year | `data/sky-events.js` – see `UPDATING-SKY-EVENTS.md` |
| Change the location for sunrise/sunset | `js/sky.js` – change `LAT` and `LNG` near the top |
| Change the picture or colour choices | `js/app.js` – `AVATARS`, `CARD_EMOJIS`, `COLOURS` near the top |
| Change colours of the app | `css/styles.css` – the colour list at the very top |

### Try it on your own computer first (optional)
Double-clicking `index.html` works for a quick look. For the offline feature to work you need a
small local web server, for example from the folder: `python3 -m http.server`, then open
`http://localhost:8000`.

---

## Folder layout

```
index.html              The page itself
manifest.webmanifest    Lets it be installed like an app
sw.js                   Makes it work offline
.nojekyll               Tells GitHub Pages to serve the files as they are
css/styles.css          How it looks
js/app.js               The planner, people, settings and screens
js/sky.js               Sun, moon, seasons, clock changes (all calculated)
js/repeat.js            Repeating plans (rules like “every Thursday”)
js/reminders.js         Reminders, chimes and notifications
js/timer.js             The timer and chime
js/ideas.js             Activity kinds and the Ideas list
js/nature.js            Birds and foraging, month by month
js/home.js              Meals, self-care, clothes, health and birthdays
js/lib/suncalc.js       Sun & moon maths library (SunCalc, BSD licence)
data/sky-events.js      Meteor showers, eclipses and planets
icons/                  App icons
UPDATING-SKY-EVENTS.md  How to add next year's sky events
```

## Credits
Sun and moon positions use [SunCalc](https://github.com/mourner/suncalc) by Vladimir Agafonkin
(BSD 2-Clause licence, included in `js/lib/SUNCALC-LICENSE.txt`).
Equinox and solstice times use the formulas from Jean Meeus, *Astronomical Algorithms*.
