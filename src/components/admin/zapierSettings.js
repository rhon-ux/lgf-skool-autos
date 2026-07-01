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

/** POST JSON to a Zapier Catch Hook (must use cors — no-cors blocks application/json). */
export async function postZapierWebhook(url, body) {
  const response = await fetch(url.trim(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Webhook returned ${response.status}`);
  }
  return response;
}
