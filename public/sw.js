// Self-unregistering service worker
// This clears any previously cached service worker

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.registration.unregister().then(() => {
    console.log('Service worker unregistered');
  });
});
