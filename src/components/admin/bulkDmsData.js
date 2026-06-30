export const BULK_DM_COMMUNITIES = [
  { id: "starter", label: "LetsGetFunded Starter (Free)" },
  { id: "pro", label: "LetsGetFunded PRO" },
  { id: "inner-circle", label: "LetsGetFunded Inner Circle" },
  { id: "lgf-gold", label: "LGF GOLD (Scale your offer)" },
];

export const DEFAULT_BULK_DM_FILTERS = {
  activeDays: 7,
  include: BULK_DM_COMMUNITIES.map(c => c.id),
  exclude: [],
};

export const MAX_ACTIVE_DAYS = 30;

const FIRST_NAMES = [
  "Ava", "Jerry", "Dontayvis", "Maria", "James", "Ana", "George", "Sofia",
  "Marcus", "Elena", "Tyler", "Priya", "Noah", "Chloe", "Diego", "Hannah",
  "Omar", "Lily", "Ethan", "Maya", "Lucas", "Zara", "Ryan", "Nina",
];

const LAST_NAMES = [
  "Ballenger", "Kim", "Williams", "Santos", "Chen", "Reyes", "Dicdiquin", "Malik",
  "Johnson", "Patel", "Garcia", "Nguyen", "Brown", "Lee", "Martinez", "Clark",
  "Walker", "Hall", "Allen", "Young", "King", "Wright", "Scott", "Green",
];

const COMMUNITY_POOL = BULK_DM_COMMUNITIES.map(c => c.id);

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function makeHandle(name, id) {
  return `@${slugify(name)}-${String(id).padStart(4, "0")}`;
}

function randomCommunities(id) {
  const count = (id % 3) + 1;
  const picked = [];
  for (let i = 0; i < count; i += 1) {
    const c = COMMUNITY_POOL[(id + i) % COMMUNITY_POOL.length];
    if (!picked.includes(c)) picked.push(c);
  }
  return picked;
}

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function generateBulkDmMembers(count = 189) {
  return Array.from({ length: count }, (_, i) => {
    const id = i + 1;
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 3) % LAST_NAMES.length];
    const name = `${first} ${last}`;
    const daysSinceActive = i % 7;
    return {
      id,
      name,
      handle: makeHandle(name, id),
      email: i % 4 === 0 ? null : `${slugify(first)}.${slugify(last)}@example.com`,
      lastActive: daysAgo(daysSinceActive),
      lastActiveDays: daysSinceActive,
      communities: randomCommunities(id),
    };
  });
}

export const MOCK_BULK_DM_MEMBERS = generateBulkDmMembers(189);

export const MOCK_BULK_DM_HISTORY = [
  {
    id: 1,
    sentAt: "Jun 28, 2026, 2:14 PM",
    preview: "Hey {{firstName}}, quick reminder about this week's calls…",
    recipients: 142,
    status: "Completed",
  },
  {
    id: 2,
    sentAt: "Jun 22, 2026, 9:30 AM",
    preview: "Hi {{firstName}}, we're hosting a live Q&A tomorrow…",
    recipients: 89,
    status: "Completed",
  },
];

export function communityLabel(id) {
  return BULK_DM_COMMUNITIES.find(c => c.id === id)?.label ?? id;
}

export function formatLastActive(days) {
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

function daysSinceDate(dateStr) {
  if (!dateStr) return 999;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 999;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

function communityIdsFromMember(member) {
  const ids = [];
  for (const mc of member.communities ?? []) {
    if (mc.subtitle?.includes("Inner")) ids.push("inner-circle");
    else if (mc.title?.includes("PRO")) ids.push("pro");
    else ids.push("starter");
  }
  return ids.length > 0 ? ids : ["starter"];
}

function memberHandle(member) {
  if (member.skoolId) return `@${member.skoolId}`;
  if (member.email) return `@${member.email.split("@")[0]}`;
  return `@member-${member.id}`;
}

/** Map dashboard/DB members → Bulk DMs row shape */
export function membersToBulkDmRows(members) {
  return (members ?? []).map(member => {
    const lastActive = member.dateMessaged ?? member.lastActive ?? member.joinedDate ?? member.joined;
    const lastActiveDays = daysSinceDate(lastActive);
    return {
      id: member.id,
      name: member.name,
      firstName: member.firstName ?? member.name?.split(" ")[0] ?? "",
      handle: memberHandle(member),
      email: member.email ?? null,
      skoolId: member.skoolId ?? null,
      tier: member.tier ?? "",
      migrationStatus: member.migrationStatus ?? "pending",
      dmSent: member.dmSent ?? false,
      lastActive,
      lastActiveDays,
      communities: communityIdsFromMember(member),
    };
  });
}

export function filterBulkDmMembers(members, { activeDays, include, exclude, search }) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - activeDays);

  return members.filter(member => {
    if (new Date(member.lastActive) < cutoff) return false;

    if (exclude.some(id => member.communities.includes(id))) return false;

    if (include.length > 0 && !include.some(id => member.communities.includes(id))) {
      return false;
    }

    if (search) {
      const q = search.toLowerCase();
      const email = member.email?.toLowerCase() ?? "";
      const tier = member.tier?.toLowerCase() ?? "";
      const skoolId = member.skoolId?.toLowerCase() ?? "";
      if (
        !member.name.toLowerCase().includes(q)
        && !member.handle.toLowerCase().includes(q)
        && !email.includes(q)
        && !tier.includes(q)
        && !skoolId.includes(q)
        && !(member.firstName?.toLowerCase().includes(q))
      ) {
        return false;
      }
    }

    return true;
  });
}
