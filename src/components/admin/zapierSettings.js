const STORAGE_KEY = "highthrive-zapier";

export const DEFAULT_ZAPIER_EVENTS = ["member.created", "fb_transfer.daily_batch"];

export function loadZapierSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      webhook: typeof parsed.webhook === "string" ? parsed.webhook : "",
      events: Array.isArray(parsed.events) ? parsed.events : DEFAULT_ZAPIER_EVENTS,
    };
  } catch {
    return null;
  }
}

export function storeZapierSettings({ webhook, events }) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      webhook: webhook ?? "",
      events: events ?? DEFAULT_ZAPIER_EVENTS,
    }),
  );
}
