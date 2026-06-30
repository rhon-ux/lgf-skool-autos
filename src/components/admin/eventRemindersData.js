/** Communities with `event_reminders_enabled = true` in the database */
export const MOCK_EVENT_REMINDER_COMMUNITIES = [
  {
    id: "lgf-gold",
    name: "LGF GOLD (Scale your offer)",
    eventRemindersEnabled: true,
    reminderEnabled: true,
  },
];

export const TEMPLATE_PLACEHOLDERS = [
  { key: "{{firstName}}", description: "Member first name" },
  { key: "{{eventTitle}}", description: "Event title" },
  { key: "{{eventTime}}", description: "Formatted event start time" },
  { key: "{{communityName}}", description: "Community display name" },
];

export const DEFAULT_EVENT_REMINDER_CONFIG = {
  messageTemplate:
    "Hi {{firstName}},\n\n{{eventTitle}}\n\nIf you're serious about leveling up, you should be plugging into the daily calls. This is where strategy gets sharpened and real progress happens.",
  leadTimeMinutes: 3,
  eventMovedToleranceMinutes: 30,
  lastActiveDays: 30,
  recipientLimit: 500,
};

export const MOCK_SCHEDULED_REMINDERS = [
  {
    id: 1,
    event: "ADS & MARKETING w Trey (FB/IG)",
    sendAt: "Jun 30, 2026, 4:57 AM",
    status: "Scheduled",
    skipReason: null,
  },
];

const COMMUNITIES_STORAGE_KEY = "highthrive-event-reminders";
const CONFIG_STORAGE_KEY = "highthrive-event-reminder-configs";

export function loadStoredEventReminders() {
  try {
    const raw = localStorage.getItem(COMMUNITIES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeEventReminders(communities) {
  localStorage.setItem(COMMUNITIES_STORAGE_KEY, JSON.stringify(communities));
}

export function getCommunityById(communities, id) {
  return communities.find(c => c.id === id) ?? null;
}

export function loadStoredConfig(communityId) {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    return all[communityId] ?? null;
  } catch {
    return null;
  }
}

export function storeConfig(communityId, config) {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[communityId] = config;
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore storage errors in demo
  }
}

export function configEqual(a, b) {
  if (!a || !b) return false;
  return (
    a.messageTemplate === b.messageTemplate
    && a.leadTimeMinutes === b.leadTimeMinutes
    && a.eventMovedToleranceMinutes === b.eventMovedToleranceMinutes
    && a.lastActiveDays === b.lastActiveDays
    && a.recipientLimit === b.recipientLimit
  );
}
