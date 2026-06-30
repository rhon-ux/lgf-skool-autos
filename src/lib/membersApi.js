import { makeAvatar, COMMUNITY_PRESETS } from "../components/admin/membersData";
import { isDatabaseEnabled, supabase } from "./supabase";

function rowToMember(row) {
  const firstName = row.first_name ?? "";
  const lastName = row.last_name ?? "";
  const name = `${firstName} ${lastName}`.trim() || row.email;

  return {
    id: row.id,
    firstName,
    lastName,
    name,
    email: row.email,
    invitedBy: row.invited_by ?? "",
    joinedDate: row.joined_date,
    joined: row.joined_date,
    question1: row.question1 ?? "",
    answer1: row.answer1 ?? "",
    question2: row.question2 ?? "",
    answer2: row.answer2 ?? "",
    question3: row.question3 ?? "",
    answer3: row.answer3 ?? "",
    price: row.price ?? "",
    recurringInterval: row.recurring_interval ?? "",
    tier: row.tier ?? "",
    ltv: row.ltv ?? "$0",
    // UI compatibility fields
    role: "CSM",
    status: "Active",
    level: "Level 1",
    currentMembership: row.recurring_interval ?? row.price ?? "",
    communities: [COMMUNITY_PRESETS.starter],
    lastActive: row.joined_date,
    avatarUrl: row.avatar_url ?? null,
    avatar: makeAvatar({ firstName, name }),
    skoolId: row.skool_id ?? null,
    phone: row.phone ?? "",
    migrationStatus: row.migration_status ?? "pending",
    dmSent: row.dm_sent ?? false,
    dateMessaged: row.date_messaged ?? null,
    fbJoined: row.fb_joined ?? false,
  };
}

function memberToRow(member) {
  const firstName = member.firstName ?? member.name?.split(" ")[0] ?? "";
  const lastName = member.lastName ?? member.name?.split(" ").slice(1).join(" ") ?? "";

  return {
    first_name: firstName,
    last_name: lastName,
    email: member.email,
    invited_by: member.invitedBy || null,
    joined_date: member.joinedDate ?? member.joined,
    question1: member.question1 || null,
    answer1: member.answer1 || null,
    question2: member.question2 || null,
    answer2: member.answer2 || null,
    question3: member.question3 || null,
    answer3: member.answer3 || null,
    price: member.price || null,
    recurring_interval: member.recurringInterval || member.currentMembership || null,
    tier: member.tier || null,
    ltv: member.ltv ?? "$0",
    avatar_url: member.avatarUrl || null,
    skool_id: member.skoolId || null,
    phone: member.phone || null,
    migration_status: member.migrationStatus ?? "pending",
    dm_sent: member.dmSent ?? false,
    date_messaged: member.dateMessaged || null,
    fb_joined: member.fbJoined ?? false,
  };
}

export async function fetchMembersFromDb() {
  if (!isDatabaseEnabled) return [];

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("joined_date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToMember);
}

export async function insertMemberInDb(member) {
  if (!isDatabaseEnabled) throw new Error("Database not configured");

  const { data, error } = await supabase
    .from("members")
    .insert(memberToRow(member))
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToMember(data);
}

export async function updateMemberInDb(id, member) {
  if (!isDatabaseEnabled) throw new Error("Database not configured");

  const { data, error } = await supabase
    .from("members")
    .update(memberToRow(member))
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToMember(data);
}

export async function deleteMemberFromDb(id) {
  if (!isDatabaseEnabled) throw new Error("Database not configured");

  const { error } = await supabase
    .from("members")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function bulkInsertMembersInDb(records, onProgress) {
  if (!isDatabaseEnabled) throw new Error("Database not configured");

  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("members")
      .upsert(batch, { onConflict: "email", ignoreDuplicates: false });

    if (error) throw new Error(error.message);
    inserted += batch.length;
    onProgress?.(inserted, records.length);
  }

  return inserted;
}

export function memberRecordsToMembers(records, startId = Date.now()) {
  return records.map((row, i) => rowToMember({ id: startId + i, ...row }));
}

export function mergeMembersByEmail(existing, imported) {
  const byEmail = new Map(existing.map(m => [m.email.toLowerCase(), m]));
  for (const member of imported) {
    const key = member.email.toLowerCase();
    const prev = byEmail.get(key);
    byEmail.set(key, prev ? { ...prev, ...member, id: prev.id } : member);
  }
  return [...byEmail.values()];
}

export async function fetchDailySendLog() {
  if (!isDatabaseEnabled) return [];

  const { data, error } = await supabase
    .from("daily_send_log")
    .select("*")
    .order("send_date", { ascending: false })
    .limit(14);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export function getPendingMembersForBatch(members, limit = 1000) {
  return members
    .filter(m => !m.dmSent && !m.fbJoined)
    .slice(0, limit);
}
