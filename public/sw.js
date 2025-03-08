
// This is the service worker with the combined offline experience
const CACHE = "LuFashion-v1";

const offlineFallbackPage = "index.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.add(offlineFallbackPage);
    })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        event.waitUntil(updateCache(event.request, response.clone()));
        return response;
      })
      .catch((error) => {
        return fromCache(event.request);
      })
  );
});

function fromCache(request) {
  return caches.open(CACHE).then((cache) => {
    return cache.match(request).then((matching) => {
      if (!matching || matching.status === 404) {
        return Promise.reject("no-match");
      }
      return matching;
    });
  });
}

function updateCache(request, response) {
  return caches.open(CACHE).then((cache) => {
    return cache.put(request, response);
  });
}
