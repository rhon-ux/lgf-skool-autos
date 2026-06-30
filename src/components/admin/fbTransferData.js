export const SKOOL_COMMUNITY_URL = "https://www.skool.com/lpf";
export const SKOOL_COMMUNITY_NAME = "LPF (Skool)";
export const DEFAULT_TOTAL_MEMBERS = 18000;
export const DEFAULT_DAILY_LIMIT = 1000;

export const DEFAULT_FB_TRANSFER_CONFIG = {
  fbGroupUrl: "",
  messageTemplate:
    "Hi {{firstName}},\n\nWe're moving our community conversations to Facebook for faster updates and support.\n\nJoin the group here: {{fbGroupUrl}}\n\nSee you inside!",
  dailyLimit: DEFAULT_DAILY_LIMIT,
  totalMembers: DEFAULT_TOTAL_MEMBERS,
  sentCount: 0,
  todaySent: 0,
  lastBatchDate: null,
  status: "active",
};

export const DEFAULT_ZAPIER_BATCH_PAYLOAD = {
  event: "fb_transfer.daily_batch",
  source: {
    platform: "skool",
    url: SKOOL_COMMUNITY_URL,
    name: SKOOL_COMMUNITY_NAME,
  },
  destination: {
    platform: "facebook_group",
    url: "{{fbGroupUrl}}",
  },
  delivery: {
    channel: "skool_dm",
    platform: "skool",
    note: "Send each member.message via Skool DM — message includes the FB group invite link",
  },
  limits: {
    dailyCap: DEFAULT_DAILY_LIMIT,
    totalMembers: DEFAULT_TOTAL_MEMBERS,
  },
  members: [
    {
      id: "sample-1",
      name: "Ava Ballenger",
      firstName: "Ava",
      email: "ava@example.com",
      handle: "@ava-ballenger-8613",
      message: "Hi Ava, …",
    },
  ],
};

const STORAGE_KEY = "highthrive-fb-transfer";

export function loadTransferConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_FB_TRANSFER_CONFIG, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

export function storeTransferConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function resetDailyCountIfNeeded(config) {
  const today = getTodayKey();
  if (config.lastBatchDate !== today) {
    return { ...config, todaySent: 0, lastBatchDate: today };
  }
  return config;
}

export function getTransferStats(config, members = []) {
  const pendingFromDb = members.filter(m => !m.dmSent && !m.fbJoined).length;
  const messagedFromDb = members.filter(m => m.dmSent).length;
  const total = members.length > 0 ? members.length : config.totalMembers;
  const sentCount = members.length > 0 ? messagedFromDb : config.sentCount;
  const remaining = members.length > 0 ? pendingFromDb : Math.max(0, config.totalMembers - config.sentCount);
  const daysLeft = config.dailyLimit > 0 ? Math.ceil(remaining / config.dailyLimit) : 0;
  const todayRemaining = Math.max(0, config.dailyLimit - config.todaySent);
  const nextBatchSize = Math.min(todayRemaining, remaining);
  const progress = total > 0 ? Math.round((sentCount / total) * 100) : 0;

  return { remaining, daysLeft, todayRemaining, nextBatchSize, progress, sentCount, total };
}

export function membersToBatchRows(members, limit) {
  return members
    .filter(m => !m.dmSent && !m.fbJoined)
    .slice(0, limit)
    .map(m => ({
      id: m.id,
      skoolMemberId: m.skoolId,
      skool_id: m.skoolId,
      name: m.name,
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email,
      phone: m.phone,
      handle: m.email ? `@${m.email.split("@")[0]}` : "",
    }));
}

export function personalizeMessage(template, member, fbGroupUrl) {
  const firstName = member.firstName ?? member.name?.split(" ")[0] ?? "there";
  return template
    .replace(/\{\{firstName\}\}/g, firstName)
    .replace(/\{\{fbGroupUrl\}\}/g, fbGroupUrl)
    .replace(/\{\{name\}\}/g, member.name ?? "");
}

export function buildBatchMembers(count, startIndex = 0) {
  const firstNames = ["Ava", "Jerry", "Maria", "James", "Ana", "George", "Sofia", "Marcus"];
  const lastNames = ["Ballenger", "Kim", "Santos", "Chen", "Reyes", "Dicdiquin", "Malik", "Johnson"];

  return Array.from({ length: count }, (_, i) => {
    const id = startIndex + i + 1;
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[(i * 2) % lastNames.length];
    const name = `${firstName} ${lastName}`;
    return {
      id: `skool-${id}`,
      name,
      firstName,
      email: null,
      handle: `@${firstName.toLowerCase()}-${lastName.toLowerCase()}-${String(id).padStart(4, "0")}`,
      skoolMemberId: `lpf-${id}`,
    };
  });
}

export function buildZapierBatchPayload(config, members) {
  const fbGroupUrl = config.fbGroupUrl.trim();
  return {
    event: "fb_transfer.daily_batch",
    timestamp: new Date().toISOString(),
    source: {
      platform: "skool",
      url: SKOOL_COMMUNITY_URL,
      name: SKOOL_COMMUNITY_NAME,
    },
    destination: {
      platform: "facebook_group",
      url: fbGroupUrl,
    },
    delivery: {
      channel: "skool_dm",
      platform: "skool",
      communityUrl: SKOOL_COMMUNITY_URL,
      communityName: SKOOL_COMMUNITY_NAME,
    },
    campaign: {
      sentTotal: config.sentCount,
      sentToday: config.todaySent,
      dailyLimit: config.dailyLimit,
      totalMembers: config.totalMembers,
    },
    members: members.map(member => ({
      ...member,
      message: personalizeMessage(config.messageTemplate, member, fbGroupUrl),
      deliveryChannel: "skool_dm",
    })),
  };
}

export const MOCK_SEND_LOG = [
  {
    id: 1,
    date: "Jun 28, 2026",
    count: 1000,
    status: "Completed",
    zapierStatus: "Delivered",
  },
  {
    id: 2,
    date: "Jun 27, 2026",
    count: 1000,
    status: "Completed",
    zapierStatus: "Delivered",
  },
];
