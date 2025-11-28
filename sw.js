// PWA Handler: Required for Chrome to show the Install Prompt
self.addEventListener('fetch', function(event) {
  // A dummy handler is enough to trick the browser into thinking it's offline-capable
  // This is essential for the "Add to Home Screen" button to appear.
});

self.options = {
    "domain": "5gvci.com",
    "zoneId": 10234210
}
self.lary = ""
importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw')