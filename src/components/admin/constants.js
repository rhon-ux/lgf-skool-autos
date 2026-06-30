export const ZAPIER_EVENTS = [
  { id: "member.created", label: "Member created", desc: "Fires when a new member is added" },
  { id: "member.updated", label: "Member updated", desc: "Fires when a member's profile changes" },
  { id: "member.deleted", label: "Member deleted", desc: "Fires when a member is removed" },
  { id: "member.status_changed", label: "Status changed", desc: "Fires when active/inactive/review status changes" },
  { id: "fb_transfer.daily_batch", label: "FB group transfer batch", desc: "Daily batch — Zapier sends Skool DMs with your FB group invite link" },
];

export const ROLE_COLORS = {
  Admin: "#7c3aed", CTO: "#1d4ed8", CSM: "#0f766e", Funding: "#b45309",
  Dev: "#1e40af", Reports: "#6d28d9", Social: "#be185d",
};

export const STAT_CARDS = [
  { label: "Total members", key: "total", color: "#1d9e75", bg: "#0d2e22" },
  { label: "Messaged", key: "messaged", color: "#22c55e", bg: "#0d2218" },
  { label: "Pending", key: "pending", color: "#f59e0b", bg: "#2a1f0d" },
  { label: "FB Joined", key: "fbJoined", color: "#3b82f6", bg: "#0d1a2e" },
];

export { MEMBER_PAYLOAD_PREVIEW as PAYLOAD_PREVIEW } from "./membersData";
