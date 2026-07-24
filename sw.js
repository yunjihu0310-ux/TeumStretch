self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("push", event => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(data.title || "틈펴", {
    body:data.body || "스트레칭할 시간이에요.",
    icon:"icon.svg?v=4",
    badge:"icon.svg?v=4",
    tag:data.key || "teumpyeo-reminder",
    renotify:true,
    data:{ url:data.url || "./" }
  }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type:"window", includeUncontrolled:true }).then(clients => {
      const existing = clients.find(client => "focus" in client);
      if (existing) { existing.navigate(event.notification.data?.url || "./"); return existing.focus(); }
      return self.clients.openWindow(event.notification.data?.url || "./");
    })
  );
});
