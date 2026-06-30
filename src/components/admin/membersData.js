/** Member table columns (Members page) — Skool export fields */
export const MEMBER_COLUMNS = [
  "Member",
  "Tier",
  "Price",
  "Recurring",
  "Joined",
  "LTV",
  "Invited By",
  "Actions",
];

/** Community presets shown as badges in the Communities column */
export const COMMUNITY_PRESETS = {
  starter: { title: "LetsGetFunded", subtitle: "Starter (Free)" },
  pro: { title: "LetsGetFunded PRO" },
  innerCircle: { title: "LetsGetFunded", subtitle: "Inner Circle" },
};

export const COMMUNITY_OPTIONS = [
  { value: "starter", label: "LetsGetFunded Starter (Free)", community: COMMUNITY_PRESETS.starter },
  { value: "pro", label: "LetsGetFunded PRO", community: COMMUNITY_PRESETS.pro },
  { value: "inner-circle", label: "LetsGetFunded Inner Circle", community: COMMUNITY_PRESETS.innerCircle },
];

/** Filter defaults & options (Members page filters) */
export const DEFAULT_MEMBER_FILTERS = {
  community: "",
  tier: "",
  status: "",
  sort: "newest",
  level: "",
  joinedFrom: "",
  joinedTo: "",
  activeInPast: "",
};

export const COMMUNITY_FILTER_OPTIONS = [
  { value: "", label: "All communities" },
  ...COMMUNITY_OPTIONS.map(({ value, label }) => ({ value, label })),
];

export const TIER_OPTIONS = ["Platinum", "Gold", "Silver", "Bronze"];
export const STATUS_OPTIONS = ["Active", "Review", "Inactive"];
export const STATUS_QUICK_FILTERS = ["All", "Active", "Review", "Inactive"];
export const LEVEL_OPTIONS = ["Level 1", "Level 2", "Level 3", "Level 4"];
export const ROLE_OPTIONS = ["Admin", "CTO", "CSM", "Funding", "Dev", "Reports", "Social"];
export const MEMBERSHIP_OPTIONS = ["Annual Pro", "Monthly Pro", "Monthly Basic", "Expired"];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest Joined" },
  { value: "oldest", label: "Oldest Joined" },
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "name-desc", label: "Name (Z–A)" },
  { value: "ltv-desc", label: "Highest LTV" },
];

export const ACTIVE_PAST_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
];

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];
export const DEFAULT_PAGE_SIZE = 5;

/** Empty form state for add-member modal */
export const DEFAULT_NEW_MEMBER = {
  name: "",
  email: "",
  avatarUrl: "",
  avatarFile: null,
  tier: "Bronze",
  price: "",
  recurringInterval: "",
  invitedBy: "",
  role: "CSM",
  status: "Active",
  level: "Level 1",
  communityKey: "starter",
  currentMembership: "Monthly Basic",
};

function skoolMember(overrides) {
  const firstName = overrides.firstName ?? "Member";
  const lastName = overrides.lastName ?? "";
  const name = `${firstName} ${lastName}`.trim();
  return {
    role: "CSM",
    status: "Active",
    level: "Level 1",
    communities: [COMMUNITY_PRESETS.starter],
    currentMembership: overrides.recurringInterval ?? "",
    lastActive: overrides.joinedDate ?? overrides.joined,
    avatar: makeAvatar({ firstName, lastName, name }),
    avatarUrl: overrides.avatarUrl ?? null,
    question1: "", answer1: "",
    question2: "", answer2: "",
    question3: "", answer3: "",
    skoolId: overrides.skoolId ?? null,
    phone: overrides.phone ?? "",
    migrationStatus: overrides.migrationStatus ?? "pending",
    dmSent: overrides.dmSent ?? false,
    dateMessaged: overrides.dateMessaged ?? null,
    fbJoined: overrides.fbJoined ?? false,
    ...overrides,
    firstName,
    lastName,
    name,
    joined: overrides.joinedDate ?? overrides.joined,
    joinedDate: overrides.joinedDate ?? overrides.joined,
  };
}

/** Full member records — demo data */
export const MOCK_MEMBERS = [
  skoolMember({ id: 1, firstName: "Rhon", lastName: "Rico", email: "rhon@letsgetfunded.com", tier: "Platinum", price: "$997", recurringInterval: "Annual", ltv: "$4,820", joinedDate: "2025-12-05", invitedBy: "Direct" }),
  skoolMember({ id: 2, firstName: "Martha", lastName: "Cruz", email: "martha@letsgetfunded.com", tier: "Gold", price: "$97", recurringInterval: "Monthly", ltv: "$3,150", joinedDate: "2025-12-10", invitedBy: "Rhon Rico" }),
  skoolMember({ id: 3, firstName: "Jean", lastName: "Dela Cruz", email: "jean@letsgetfunded.com", tier: "Silver", price: "$0", recurringInterval: "Free", ltv: "$890", joinedDate: "2026-01-15", invitedBy: "Martha Cruz" }),
];

export const MEMBER_PAYLOAD_PREVIEW = `{
  "event": "member.created",
  "timestamp": "2026-06-26T10:00:00.000Z",
  "data": {
    "id": 9,
    "name": "New Member",
    "email": "new@letsgetfunded.com",
    "role": "CSM",
    "status": "Active",
    "level": "Level 1",
    "communities": [
      { "title": "LetsGetFunded", "subtitle": "Starter (Free)" }
    ],
    "tier": "Bronze",
    "currentMembership": "Monthly Basic",
    "ltv": "$0",
    "joined": "2026-06-26",
    "lastActive": "2026-06-26",
    "avatar": "NM"
  }
}`;

export function makeAvatar(nameOrMember) {
  const name = typeof nameOrMember === "object"
    ? (nameOrMember.firstName || nameOrMember.name || "")
    : (nameOrMember || "");
  const letter = name.trim()[0];
  return letter ? letter.toUpperCase() : "?";
}

export function communityFromKey(key) {
  return COMMUNITY_OPTIONS.find(c => c.value === key)?.community ?? COMMUNITY_PRESETS.starter;
}

export function memberToForm(member) {
  const communityKey = COMMUNITY_OPTIONS.find(c =>
    member.communities?.some(mc =>
      mc.title === c.community.title && mc.subtitle === c.community.subtitle
    )
  )?.value ?? "starter";

  return {
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    status: member.status,
    tier: member.tier,
    level: member.level,
    communityKey,
    currentMembership: member.currentMembership,
    price: member.price ?? "",
    recurringInterval: member.recurringInterval ?? member.currentMembership ?? "",
    invitedBy: member.invitedBy ?? "",
    avatarUrl: member.avatarUrl ?? "",
    avatarFile: null,
  };
}

export function createMemberFromForm(form, existing) {
  const today = new Date().toISOString().slice(0, 10);
  const parts = form.name.trim().split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");

  return {
    ...existing,
    firstName,
    lastName,
    name: form.name.trim(),
    email: form.email,
    role: form.role,
    status: form.status,
    tier: form.tier,
    level: form.level,
    price: form.price ?? "",
    recurringInterval: form.recurringInterval ?? form.currentMembership ?? "",
    invitedBy: form.invitedBy ?? "",
    currentMembership: form.recurringInterval ?? form.currentMembership ?? "",
    joinedDate: existing?.joinedDate ?? existing?.joined ?? today,
    communities: existing?.communities ?? [communityFromKey(form.communityKey)],
    id: existing?.id ?? Date.now(),
    joined: existing?.joined ?? today,
    lastActive: existing?.lastActive ?? today,
    ltv: existing?.ltv ?? "$0",
    avatar: makeAvatar({ firstName, lastName, name }),
    avatarUrl: form.avatarUrl === "" ? null : (form.avatarUrl ?? existing?.avatarUrl ?? null),
    question1: existing?.question1 ?? "",
    answer1: existing?.answer1 ?? "",
    question2: existing?.question2 ?? "",
    answer2: existing?.answer2 ?? "",
    question3: existing?.question3 ?? "",
    answer3: existing?.answer3 ?? "",
  };
}

export function getMemberStats(members) {
  const messaged = members.filter(m => m.dmSent).length;
  const pending = members.filter(m => !m.dmSent && !m.fbJoined).length;
  const fbJoined = members.filter(m => m.fbJoined).length;

  return {
    total: members.length,
    messaged,
    pending,
    fbJoined,
    active: members.filter(m => m.status === "Active").length,
    review: members.filter(m => m.status === "Review").length,
    inactive: members.filter(m => m.status === "Inactive").length,
  };
}

export const MEMBERS_STORAGE_KEY = "highthrive-members";

export function loadStoredMembers() {
  try {
    const raw = localStorage.getItem(MEMBERS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function storeMembers(members) {
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
}

export function isMemberFormValid(form) {
  return Boolean(form?.name?.trim() && form?.email?.trim());
}
