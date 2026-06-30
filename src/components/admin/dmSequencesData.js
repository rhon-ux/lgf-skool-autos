const WELCOME_STEPS = [
  {
    id: 1,
    delayDays: 0,
    message:
      "Hey {{firstName}}, Welcome to the Let's Get Funded community! I want to get a clear picture of where you're at so we can point you to the right resources. What sparked your interest in joining the community?",
  },
  {
    id: 2,
    delayDays: 2,
    message:
      "Hey {{firstName}}, just wanted to tap back in with you! How's your credit looking? Have you seen any wins or changes recently?",
  },
  {
    id: 3,
    delayDays: 2,
    message:
      "Let's make this easy, {{firstName}}. Book a quick call with me. I'll review your credit, answer your questions, show you your options, and then you can decide what's next! Here's the link: https://skool.letsgetfunded.com/fskool-group-onboarding-book",
  },
];

function makeSequence(id, category, name, steps = WELCOME_STEPS, enabled = false) {
  return { id, category, name, enabled, steps: steps.map(s => ({ ...s })) };
}

export const DEFAULT_DM_SEQUENCES = {
  starter: [
    makeSequence("welcome", "WELCOME", "Welcome"),
    makeSequence("premium-welcome", "WELCOME", "Premium Welcome"),
    makeSequence("vip-welcome", "WELCOME", "VIP Welcome"),
    makeSequence("tier-upgrade", "TIER", "Tier Upgrade"),
    makeSequence("tier-downgrade", "TIER", "Tier Downgrade"),
  ],
  pro: [
    makeSequence("welcome", "WELCOME", "Welcome", WELCOME_STEPS, true),
    makeSequence("premium-welcome", "WELCOME", "Premium Welcome"),
    makeSequence("tier-upgrade", "TIER", "Tier Upgrade"),
  ],
  "inner-circle": [
    makeSequence("vip-welcome", "WELCOME", "VIP Welcome"),
    makeSequence("tier-upgrade", "TIER", "Tier Upgrade"),
    makeSequence("tier-downgrade", "TIER", "Tier Downgrade"),
  ],
};

export const MOCK_DM_LOG = [
  { id: 1, member: "George Dicdiquin", sequence: "Welcome", step: 1, community: "LetsGetFunded Starter (Free)", sentAt: "Jun 26, 2026 9:14 AM", status: "Delivered" },
  { id: 2, member: "Maria Santos", sequence: "Welcome", step: 2, community: "LetsGetFunded PRO", sentAt: "Jun 26, 2026 8:02 AM", status: "Delivered" },
  { id: 3, member: "James Chen", sequence: "Tier Upgrade", step: 1, community: "LetsGetFunded Inner Circle", sentAt: "Jun 25, 2026 4:30 PM", status: "Delivered" },
  { id: 4, member: "Ana Reyes", sequence: "Welcome", step: 3, community: "LetsGetFunded Starter (Free)", sentAt: "Jun 25, 2026 11:20 AM", status: "Failed" },
];

export function cloneSequences(data) {
  return Object.fromEntries(
    Object.entries(data).map(([key, list]) => [
      key,
      list.map(seq => ({
        ...seq,
        steps: seq.steps.map(step => ({ ...step })),
      })),
    ]),
  );
}

export const DM_SEQUENCES_STORAGE_KEY = "highthrive-dm-sequences";

export function loadStoredSequences() {
  try {
    const raw = localStorage.getItem(DM_SEQUENCES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return cloneSequences(parsed);
  } catch {
    return null;
  }
}

export function storeSequences(data) {
  localStorage.setItem(DM_SEQUENCES_STORAGE_KEY, JSON.stringify(data));
}

export function sequencesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
