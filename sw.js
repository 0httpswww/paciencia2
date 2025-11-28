self.options = {
    "domain": "5gvci.com",
    "zoneId": 10234210
}
self.lary = ""
importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw')

// PWA Handler to satisfy installation criteria
self.addEventListener('fetch', function(event) {
  // Empty fetch handler allows the browser to recognize this as an installable PWA
});