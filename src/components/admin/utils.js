import { ROLE_COLORS } from "./constants";

export function roleColor(role) {
  return ROLE_COLORS[role] || "#1d9e75";
}

export function communityType(community) {
  if (community.title?.includes("PRO")) return "pro";
  if (community.subtitle === "Inner Circle") return "inner-circle";
  if (community.subtitle === "Starter (Free)") return "starter";
  return "default";
}

export const COMMUNITY_BAR_COLORS = {
  starter: "#94a3b8",
  pro: "#34d399",
  "inner-circle": "#c4b5fd",
  default: "#1d9e75",
};

export function communityColor(type) {
  return COMMUNITY_BAR_COLORS[type] || COMMUNITY_BAR_COLORS.default;
}

export function countByCommunity(members) {
  const counts = {};
  members.forEach(m => {
    m.communities.forEach(c => {
      const type = communityType(c);
      counts[type] = (counts[type] || 0) + 1;
    });
  });
  return counts;
}

export function memberMatchesCommunity(member, communityFilter) {
  if (!communityFilter) return true;
  return member.communities.some(c => communityType(c) === communityFilter);
}

export function filterMembers(members, search, filters) {
  const { community, tier, status, sort, level, joinedFrom, joinedTo, activeInPast } = filters;

  let result = members.filter(m => {
    if (search) {
      const q = search.toLowerCase();
      const haystack = [
        m.name,
        m.email,
        m.firstName,
        m.lastName,
        m.invitedBy,
      ].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (!memberMatchesCommunity(m, community)) return false;
    if (tier && m.tier !== tier) return false;
    if (status && m.status !== status) return false;
    if (level && m.level !== level) return false;
    if (joinedFrom && m.joined < joinedFrom) return false;
    if (joinedTo && m.joined > joinedTo) return false;
    if (activeInPast) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(activeInPast, 10));
      if (new Date(m.lastActive) < cutoff) return false;
    }
    return true;
  });

  result = [...result].sort((a, b) => {
    switch (sort) {
      case "oldest": return a.joined.localeCompare(b.joined);
      case "name-asc": return a.name.localeCompare(b.name);
      case "name-desc": return b.name.localeCompare(a.name);
      case "ltv-desc": return parseInt(b.ltv.replace(/\D/g, ""), 10) - parseInt(a.ltv.replace(/\D/g, ""), 10);
      default: return b.joined.localeCompare(a.joined);
    }
  });

  return result;
}
