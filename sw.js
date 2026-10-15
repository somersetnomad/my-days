/*
  Makes My Days work offline.

  The first time the app is opened with a connection, every file it needs is
  saved on the device. After that it opens and works fully with no internet:
  plans, repeats, reminders, timer, sky, nature, home, backups – everything.

  When you change any file, bump VERSION below AND the ?v= numbers in
  index.html (and APP_VERSION in js/app.js), so devices pick up the new copy.
*/
var VERSION = 'my-days-v9';
var ASSET_V = '9';  // must match the ?v= numbers in index.html
var FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/styles.css',
  'js/lib/suncalc.js',
  'data/sky-events.js',
  'js/sky.js',
  'js/repeat.js',
  'js/reminders.js',
  'js/ideas.js',
  'js/nature.js',
  'js/home.js',
  'js/timer.js',
  'js/app.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

// Save everything up front, fresh from the network (not from the browser's HTTP cache)
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return Promise.all(FILES.map(function (f) {
      return fetch(new Request(f, { cache: 'reload' })).then(function (res) {
        if (!res.ok) return;
        var jobs = [c.put(f, res.clone())];
        // also keep it under the exact address the page asks for
        if (/\.(js|css)$/.test(f)) jobs.push(c.put(f + '?v=' + ASSET_V, res));
        return Promise.all(jobs);
      });
    }));
  }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function fromCache(request) {
  return caches.open(VERSION).then(function (c) {
    return c.match(request, { ignoreSearch: true });
  });
}

function saveCopy(key, res) {
  if (res && res.ok) {
    var copy = res.clone();
    caches.open(VERSION).then(function (c) { c.put(key, copy); });
  }
  return res;
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // The page itself: try for a fresh copy, but never make you wait more than
  // 3 seconds on a slow or missing connection – use the saved copy instead.
  if (req.mode === 'navigate') {
    e.respondWith(new Promise(function (resolve) {
      var done = false;
      var timer = setTimeout(function () {
        fromCache('index.html').then(function (hit) { if (hit && !done) { done = true; resolve(hit); } });
      }, 3000);
      fetch(req, { cache: 'no-cache' }).then(function (res) {
        clearTimeout(timer);
        saveCopy(new URL('index.html', self.registration.scope).href, res.clone());
        if (!done) { done = true; resolve(res); }
      }).catch(function () {
        clearTimeout(timer);
        fromCache('index.html').then(function (hit) {
          if (!done) { done = true; resolve(hit || new Response('<h1>Offline</h1><p>Open My Days once with a connection first.</p>', { headers: { 'Content-Type': 'text/html' } })); }
        });
      });
    }));
    return;
  }

  // Files with a version tag (?v=…) never change: use the exact saved copy,
  // otherwise fetch it once and keep it. Offline, fall back to any saved copy.
  if (req.url.indexOf('?v=') > 0) {
    e.respondWith(caches.open(VERSION).then(function (c) {
      return c.match(req).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) { return saveCopy(req.url, res); })
          .catch(function () { return fromCache(req); });
      });
    }));
    return;
  }

  // Everything else: saved copy straight away, refreshed quietly in the background.
  e.respondWith(fromCache(req).then(function (hit) {
    var network = fetch(req).then(function (res) { return saveCopy(req.url.split('?')[0], res); });
    if (hit) { network.catch(function () { /* offline – fine */ }); return hit; }
    return network;
  }));
});

// Tapping a reminder notification opens (or brings back) My Days
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if ('focus' in list[i]) return list[i].focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow('./');
  }));
});
