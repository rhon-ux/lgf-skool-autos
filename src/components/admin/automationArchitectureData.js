/** Full automation architecture — Skool → Zapier → Supabase → Dashboard */

export const AUTOMATION_LAYERS = [
  {
    id: "skool",
    label: "Skool",
    color: "#1d9e75",
    nodes: [
      {
        id: "csv",
        title: "CSV export",
        subtitle: "18k members · one-time pull",
        arrow: "imported to backend",
      },
      {
        id: "webhook",
        title: "Skool webhook",
        subtitle: "Fires on member.created",
        arrow: "live trigger",
      },
    ],
  },
  {
    id: "zapier",
    label: "Zapier",
    color: "#ff4f00",
    nodes: [
      {
        id: "zap1",
        title: "Zap 1 — daily scheduler",
        subtitle: "Schedule → GET batch → POST to Zap 2",
        isZap: true,
      },
      {
        id: "zap2",
        title: "Zap 2 — main migration",
        subtitle: "Catch Hook → Paths → Skool DM",
        isZap: true,
        paths: [
          {
            label: "Path A — daily batch",
            steps: ["Loop", "Skool DM", "POST backend"],
          },
          {
            label: "Path B — new member",
            steps: ["Skool DM", "POST backend"],
          },
        ],
      },
    ],
  },
  {
    id: "backend",
    label: "Rhon's Backend API & Dashboard",
    color: "#7c3aed",
    nodes: [
      {
        id: "api-update",
        title: "POST /members/update",
        subtitle: "skool_id · status · date_messaged · dm_sent: true",
      },
      {
        id: "api-add",
        title: "POST /members/add",
        subtitle: "name · email · skool_id · phone · status: new",
      },
      {
        id: "db",
        title: "Backend database",
        subtitle: "Members table · source of truth",
      },
      {
        id: "dashboard",
        title: "HighThrive Admin Dashboard",
        subtitle: "recillagimson.github.io/lgf-skool-automation",
        metrics: ["Total", "Messaged", "Pending", "FB Joined", "Daily log"],
      },
    ],
  },
];

export const ZAPIER_API_ENDPOINTS = [
  {
    name: "GET daily batch (Zap 1)",
    method: "POST",
    path: "/rest/v1/rpc/zapier_get_daily_batch",
    body: { p_api_key: "your-key", p_limit: 1000 },
    desc: "Returns pending members for today's Skool DM batch",
  },
  {
    name: "POST /members/add (Path B)",
    method: "POST",
    path: "/rest/v1/rpc/zapier_add_member",
    body: {
      p_api_key: "your-key",
      p_name: "Rhon Rico",
      p_email: "rhon@example.com",
      p_skool_id: "lpf-123",
      p_phone: null,
    },
    desc: "Skool new member → status: new, dm_sent: false",
  },
  {
    name: "POST /members/update (Path A & B)",
    method: "POST",
    path: "/rest/v1/rpc/zapier_update_member",
    body: {
      p_api_key: "your-key",
      p_skool_id: "lpf-123",
      p_dm_sent: true,
      p_date_messaged: "2026-06-29",
      p_status: "messaged",
    },
    desc: "After Skool DM sent → dm_sent: true",
  },
  {
    name: "Log daily send",
    method: "POST",
    path: "/rest/v1/rpc/zapier_log_daily_send",
    body: { p_api_key: "your-key", p_members_sent: 1000 },
    desc: "Writes to daily_send_log for dashboard",
  },
];

export function supabaseRpcUrl(supabaseUrl, rpcPath) {
  if (!supabaseUrl) return `https://your-project.supabase.co${rpcPath}`;
  return `${supabaseUrl.replace(/\/$/, "")}${rpcPath}`;
}
