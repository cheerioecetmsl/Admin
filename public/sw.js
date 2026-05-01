// Self-unregistering service worker to clean up any leftover SWs from other projects on the same localhost port
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    self.registration.unregister().then(() => {
      console.log('Service Worker unregistered.');
    })
  );
});
