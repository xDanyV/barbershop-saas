// Solo muestra una pantalla clara cuando no hay internet.
// No guarda páginas ni datos: una agenda vieja haría creer a un barbero que sus citas están al día.
const CACHE = "offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(CACHE)
            .then((cache) => cache.add(OFFLINE_URL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.mode !== "navigate") return;

    event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});

// Avisos push: el servidor manda { title, body, url, tag } y aquí se muestran
self.addEventListener("push", (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch {
        data = { title: event.data ? event.data.text() : "" };
    }

    event.waitUntil(
        self.registration.showNotification(data.title || "Citas", {
            body: data.body || "",
            tag: data.tag,
            renotify: Boolean(data.tag),
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            data: { url: data.url || "/" },
        })
    );
});

// Al tocar el aviso se abre (o se enfoca) la pantalla que corresponde
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const target = new URL(event.notification.data?.url || "/", self.location.origin).href;

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
            const open = windows.find((client) => client.url === target);
            if (open) return open.focus();
            const any = windows.find((client) => client.url.startsWith(self.location.origin));
            if (any) return any.navigate(target).then((client) => client && client.focus());
            return self.clients.openWindow(target);
        })
    );
});
