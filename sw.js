/* Service worker — makes the app open instantly and work with no signal.
   Only the app shell is cached; expense data never goes in here (it lives in
   localStorage and syncs to Supabase). Bump CACHE to push an update. */
var CACHE = "spendlog-v1";
var SHELL = [
  "./", "./index.html", "./app.css", "./app.js", "./config.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          return k === CACHE ? null : caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;                       // never cache writes
  if (req.url.indexOf("/rest/v1/") >= 0) return;          // never cache the API

  // Network-first for the shell so a redeploy is picked up, cache as fallback.
  e.respondWith(
    fetch(req)
      .then(function (res) {
        if (res && res.ok && new URL(req.url).origin === self.location.origin) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match("./index.html");
        });
      })
  );
});
