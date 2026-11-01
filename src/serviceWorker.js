// Keep the original URL so existing Workbox registrations can migrate.
// The replacement worker never intercepts requests or caches private pages.
export function register() {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const install = () => navigator.serviceWorker
        .register("/service-worker.js", { updateViaCache: "none" })
        .catch(() => undefined);
    if (document.readyState === "complete") install();
    else window.addEventListener("load", install, { once: true });
}
