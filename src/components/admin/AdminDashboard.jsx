import { useEffect, useState } from "react";
import "./AdminDashboard.css";
import {
  MOCK_MEMBERS,
  DEFAULT_MEMBER_FILTERS,
  DEFAULT_NEW_MEMBER,
  createMemberFromForm,
  getMemberStats,
  memberToForm,
  loadStoredMembers,
  storeMembers,
  isMemberFormValid,
} from "./membersData";
import { filterMembers } from "./utils";
import { isDatabaseEnabled } from "../../lib/supabase";
import {
  deleteMemberFromDb,
  fetchMembersFromDb,
  insertMemberInDb,
  updateMemberInDb,
  bulkInsertMembersInDb,
  memberRecordsToMembers,
  mergeMembersByEmail,
  fetchDailySendLog,
} from "../../lib/membersApi";
import { parseSkoolCsv } from "../../lib/csvImport";
import { uploadMemberAvatar } from "../../lib/avatarUpload";
import LoginPage from "./LoginPage";
import Sidebar from "./Sidebar";
import Notification from "./Notification";
import DashboardPage from "./DashboardPage";
import MembersPage from "./MembersPage";
import MemberDetailPage from "./MemberDetailPage";
import DmSequencesPage from "./DmSequencesPage";
import ZapierPage from "./ZapierPage";
import MemberModal from "./MemberModal";
import EventRemindersPage from "./EventRemindersPage";
import EventReminderConfigPage from "./EventReminderConfigPage";
import BulkDmsPage from "./BulkDmsPage";
import FbGroupTransferPage from "./FbGroupTransferPage";
import {
  MOCK_EVENT_REMINDER_COMMUNITIES,
  loadStoredEventReminders,
  storeEventReminders,
  getCommunityById,
} from "./eventRemindersData";

export default function AdminDashboard() {
  const [page, setPage] = useState("login");
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberDataSource, setMemberDataSource] = useState(
    isDatabaseEnabled ? "database" : "local",
  );
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [search, setSearch] = useState("");
  const [memberFilters, setMemberFilters] = useState(DEFAULT_MEMBER_FILTERS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [zapWebhook, setZapWebhook] = useState("");
  const [zapEvents, setZapEvents] = useState(["member.created", "fb_transfer.daily_batch"]);
  const [zapLog, setZapLog] = useState([]);
  const [zapSaved, setZapSaved] = useState(false);
  const [zapTesting, setZapTesting] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [newMember, setNewMember] = useState(DEFAULT_NEW_MEMBER);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [eventReminderCommunities, setEventReminderCommunities] = useState(
    () => loadStoredEventReminders() ?? MOCK_EVENT_REMINDER_COMMUNITIES,
  );
  const [selectedEventReminderId, setSelectedEventReminderId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvImportProgress, setCsvImportProgress] = useState(null);
  const [dailyLog, setDailyLog] = useState([]);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadMembers = async () => {
    setMembersLoading(true);
    try {
      if (isDatabaseEnabled) {
        const rows = await fetchMembersFromDb();
        setMembers(rows);
        setMemberDataSource("database");
        try {
          const log = await fetchDailySendLog();
          setDailyLog(log);
        } catch {
          setDailyLog([]);
        }
      } else {
        setMembers(loadStoredMembers() ?? MOCK_MEMBERS);
        setMemberDataSource("local");
      }
    } catch (err) {
      setMembers(loadStoredMembers() ?? MOCK_MEMBERS);
      setMemberDataSource("local");
      notify(err.message || "Database unavailable — using local data", "error");
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    if (page !== "login") loadMembers();
  }, [page]);

  const handleLogin = () => {
    if (loginForm.email === "rhon@letsgetfunded.com" && loginForm.password === "admin123") {
      setPage("dashboard");
      setLoginError("");
    } else {
      setLoginError(
        import.meta.env.PROD
          ? "Invalid credentials."
          : "Invalid credentials. Try rhon@letsgetfunded.com / admin123",
      );
    }
  };

  const triggerZapier = async (eventId, payload) => {
    if (!zapWebhook || !zapEvents.includes(eventId)) {
      if (!zapWebhook) throw new Error("No webhook");
      return;
    }
    const entry = { time: new Date().toLocaleTimeString(), event: eventId, payload, status: "pending" };
    setZapLog(prev => [...prev, entry]);
    try {
      await fetch(zapWebhook, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: eventId, timestamp: new Date().toISOString(), data: payload }),
      });
      setZapLog(prev => prev.map((e, i) => i === prev.length - 1 ? { ...e, status: "sent" } : e));
    } catch {
      setZapLog(prev => prev.map((e, i) => i === prev.length - 1 ? { ...e, status: "error" } : e));
    }
  };

  const persistMembersLocal = (nextMembers) => {
    setMembers(nextMembers);
    if (!isDatabaseEnabled) storeMembers(nextMembers);
  };

  const resolveAvatarUrl = async (form) => {
    if (form.avatarFile) {
      return uploadMemberAvatar(form.avatarFile, form.email);
    }
    return form.avatarUrl || null;
  };

  const handleAddMember = async () => {
    if (!isMemberFormValid(newMember)) return;
    try {
      const avatarUrl = await resolveAvatarUrl(newMember);
      const draft = createMemberFromForm({ ...newMember, avatarUrl });
      if (isDatabaseEnabled) {
        const saved = await insertMemberInDb(draft);
        setMembers(prev => [...prev, saved]);
        triggerZapier("member.created", saved);
      } else {
        const nextMembers = [...members, draft];
        persistMembersLocal(nextMembers);
        triggerZapier("member.created", draft);
      }
      setShowAddModal(false);
      setNewMember(DEFAULT_NEW_MEMBER);
      notify("Member added successfully");
    } catch (err) {
      notify(err.message || "Failed to add member", "error");
    }
  };

  const handleDeleteMember = async (id) => {
    const m = members.find(x => x.id === id);
    try {
      if (isDatabaseEnabled) await deleteMemberFromDb(id);
      const nextMembers = members.filter(x => x.id !== id);
      persistMembersLocal(nextMembers);
      triggerZapier("member.deleted", m);
      notify("Member removed", "error");
    } catch (err) {
      notify(err.message || "Failed to delete member", "error");
    }
  };

  const handleSaveMemberChanges = async () => {
    if (!isMemberFormValid(editMember)) return;

    const existing = members.find(m => m.id === editMember.id);
    if (!existing) {
      notify("Member not found", "error");
      return;
    }

    const updated = createMemberFromForm(editMember, existing);
    try {
      const avatarUrl = await resolveAvatarUrl(editMember);
      const withAvatar = { ...updated, avatarUrl: avatarUrl ?? null };
      const saved = isDatabaseEnabled
        ? await updateMemberInDb(withAvatar.id, withAvatar)
        : withAvatar;
      const nextMembers = members.map(m => (m.id === saved.id ? saved : m));
      persistMembersLocal(nextMembers);
      triggerZapier("member.updated", saved);
      setEditMember(null);
      notify(`"${saved.name}" saved`);
    } catch (err) {
      notify(err.message || "Failed to save member", "error");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const m = members.find(x => x.id === id);
    const updated = { ...m, status: newStatus };
    try {
      const saved = isDatabaseEnabled
        ? await updateMemberInDb(id, updated)
        : updated;
      const nextMembers = members.map(x => x.id === id ? saved : x);
      persistMembersLocal(nextMembers);
      triggerZapier("member.status_changed", { ...saved, previousStatus: m.status });
      notify(`Status updated to ${newStatus}`);
    } catch (err) {
      notify(err.message || "Failed to update status", "error");
    }
  };

  const handleImportCsv = async (file) => {
    setCsvImporting(true);
    setCsvImportProgress(null);
    try {
      const text = await file.text();
      const records = parseSkoolCsv(text);
      if (records.length === 0) {
        notify("No valid rows found in CSV. Check Skool export columns.", "error");
        return;
      }

      if (isDatabaseEnabled) {
        await bulkInsertMembersInDb(records, (done, total) => {
          setCsvImportProgress({ done, total });
        });
        await loadMembers();
      } else {
        const imported = memberRecordsToMembers(records);
        const merged = mergeMembersByEmail(members, imported);
        persistMembersLocal(merged);
        setCsvImportProgress({ done: records.length, total: records.length });
      }

      notify(`Imported ${records.length} member${records.length === 1 ? "" : "s"} from Skool CSV`);
    } catch (err) {
      notify(err.message || "CSV import failed", "error");
    } finally {
      setCsvImporting(false);
      setCsvImportProgress(null);
    }
  };

  const handleTestZap = async () => {
    if (!zapWebhook) return;
    setZapTesting(true);
    const payload = { event: "test", message: "Webhook test from HighThrive Admin", timestamp: new Date().toISOString() };
    const entry = { time: new Date().toLocaleTimeString(), event: "test.ping", payload, status: "pending" };
    setZapLog(prev => [...prev, entry]);
    try {
      await fetch(zapWebhook, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      setZapLog(prev => prev.map((e, i) => i === prev.length - 1 ? { ...e, status: "sent" } : e));
      notify("Test webhook fired — check Zapier");
    } catch {
      setZapLog(prev => prev.map((e, i) => i === prev.length - 1 ? { ...e, status: "error" } : e));
      notify("Webhook failed", "error");
    }
    setZapTesting(false);
  };

  const filtered = filterMembers(members, search, memberFilters);
  const statValues = getMemberStats(members);

  if (page === "login") {
    return (
      <LoginPage
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        loginError={loginError}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="admin admin-layout">
      <Notification notification={notification} />

      <Sidebar
        page={page}
        onNavigate={id => {
          setPage(id);
          if (id !== "member-detail") setSelectedMemberId(null);
          if (id !== "event-reminder-config") setSelectedEventReminderId(null);
        }}
        onSignOut={() => { setPage("login"); setLoginForm({ email: "", password: "" }); }}
      />

      <main className="main-content">
        {page === "dashboard" && (
          <DashboardPage members={members} statValues={statValues} dailyLog={dailyLog} />
        )}
        {page === "members" && (
          <MembersPage
            members={members}
            filtered={filtered}
            active={statValues.active}
            search={search}
            onSearchChange={setSearch}
            filters={memberFilters}
            onFiltersChange={setMemberFilters}
            onAddClick={() => setShowAddModal(true)}
            onImportCsv={handleImportCsv}
            importing={csvImporting}
            importProgress={csvImportProgress}
            onViewMember={m => { setSelectedMemberId(m.id); setPage("member-detail"); }}
            onEdit={m => setEditMember(memberToForm(m))}
            onDelete={handleDeleteMember}
            loading={membersLoading}
            dataSource={memberDataSource}
          />
        )}
        {page === "member-detail" && (
          <MemberDetailPage
            member={members.find(m => m.id === selectedMemberId)}
            onBack={() => { setSelectedMemberId(null); setPage("members"); }}
          />
        )}
        {page === "dm-sequences" && <DmSequencesPage onNotify={notify} />}
        {page === "bulk-dms" && (
          <BulkDmsPage
            members={members}
            loading={membersLoading}
            dataSource={memberDataSource}
            onRefresh={loadMembers}
            onNotify={notify}
          />
        )}
        {page === "fb-transfer" && (
          <FbGroupTransferPage
            members={members}
            zapWebhook={zapWebhook}
            zapSaved={zapSaved}
            onWebhookChange={value => { setZapWebhook(value); setZapSaved(false); }}
            onSaveWebhook={() => { if (zapWebhook) { setZapSaved(true); notify("Webhook saved"); } }}
            onSendBatch={payload => triggerZapier("fb_transfer.daily_batch", payload)}
            onNotify={notify}
          />
        )}
        {page === "event-reminders" && (
          <EventRemindersPage
            communities={eventReminderCommunities}
            onToggleReminder={(id, enabled) => {
              const next = eventReminderCommunities.map(c =>
                c.id === id ? { ...c, reminderEnabled: enabled } : c,
              );
              setEventReminderCommunities(next);
              storeEventReminders(next);
              const name = getCommunityById(next, id)?.name ?? "Community";
              notify(`Reminders ${enabled ? "enabled" : "disabled"} for ${name}`);
            }}
            onConfigure={id => {
              setSelectedEventReminderId(id);
              setPage("event-reminder-config");
            }}
          />
        )}
        {page === "event-reminder-config" && (
          <EventReminderConfigPage
            community={getCommunityById(eventReminderCommunities, selectedEventReminderId)}
            onBack={() => {
              setSelectedEventReminderId(null);
              setPage("event-reminders");
            }}
            onToggleEnabled={(id, enabled) => {
              const next = eventReminderCommunities.map(c =>
                c.id === id ? { ...c, reminderEnabled: enabled } : c,
              );
              setEventReminderCommunities(next);
              storeEventReminders(next);
            }}
            onNotify={notify}
          />
        )}
        {page === "zapier" && (
          <ZapierPage
            zapWebhook={zapWebhook}
            onWebhookChange={value => { setZapWebhook(value); setZapSaved(false); }}
            zapEvents={zapEvents}
            onEventsChange={(id, checked) => {
              setZapEvents(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
            }}
            zapLog={zapLog}
            onClearLog={() => setZapLog([])}
            zapSaved={zapSaved}
            onSaveWebhook={() => { if (zapWebhook) { setZapSaved(true); notify("Webhook saved"); } }}
            zapTesting={zapTesting}
            onTestWebhook={handleTestZap}
          />
        )}
      </main>

      {showAddModal && (
        <MemberModal
          title="Add new member"
          member={newMember}
          onChange={setNewMember}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddMember}
          submitLabel="Add member"
          placeholders={{ name: "Juan dela Cruz", email: "juan@letsgetfunded.com" }}
        />
      )}

      {editMember && (
        <MemberModal
          title="Edit member"
          member={editMember}
          onChange={setEditMember}
          onClose={() => setEditMember(null)}
          onSubmit={handleSaveMemberChanges}
          submitLabel="Save changes"
        />
      )}
    </div>
  );
}
