/** Zapier 2-Zap automation build */

export const ZAPIER_WORKFLOW_TRIGGER = {
  step: 1,
  app: "Webhooks by Zapier",
  event: "Catch Hook (Zap 2)",
  hint: "Receives batch from Zap 1 or from HighThrive Admin",
};

export const ZAPIER_WORKFLOW_PATHS = {
  step: 2,
  app: "Paths",
  event: "Split into paths",
};

export const ZAPIER_ZAP1 = {
  title: "Zap 1 — daily scheduler",
  steps: [
    "Schedule by Zapier → every day 9:00 AM",
    "Webhooks by Zapier → POST to Supabase RPC zapier_get_daily_batch",
    "Webhooks by Zapier → POST batch to Zap 2 Catch Hook URL",
  ],
};

export const ZAPIER_WORKFLOW_BRANCHES = [
  {
    id: "a",
    label: "Path A",
    title: "Daily batch migration",
    condition: {
      step: 3,
      rules: [
        { field: "event", operator: "Exactly matches", value: "fb_transfer.daily_batch" },
      ],
    },
    actions: [
      {
        step: 4,
        app: "Looping by Zapier",
        event: "Create loop from line items",
        detail: "Loop field: members",
      },
      {
        step: 5,
        app: "Skool",
        event: "Send DM",
        detail: "Message → personalized FB invite · Member → email",
      },
      {
        step: 6,
        app: "Webhooks by Zapier",
        event: "POST backend",
        detail: "RPC zapier_update_member → dm_sent: true",
      },
    ],
  },
  {
    id: "b",
    label: "Path B",
    title: "Skool new member (live)",
    condition: {
      step: 7,
      rules: [
        { field: "event", operator: "Exactly matches", value: "member.created" },
      ],
    },
    actions: [
      {
        step: 8,
        app: "Skool",
        event: "Send DM",
        detail: "Welcome message via Skool platform",
      },
      {
        step: 9,
        app: "Webhooks by Zapier",
        event: "POST backend",
        detail: "RPC zapier_add_member → status: new, dm_sent: false",
      },
      {
        step: 10,
        app: "Webhooks by Zapier",
        event: "POST backend",
        detail: "RPC zapier_update_member → dm_sent: true after DM",
      },
    ],
  },
];

export const ZAPIER_PATH_SETUP_STEPS = [
  "Skool: export CSV → import in HighThrive Admin (18k members, status: pending)",
  "Skool: connect webhook for member.created → Zap 2 Catch Hook",
  "Zap 1: Schedule daily → POST zapier_get_daily_batch → POST result to Zap 2",
  "Zap 2: Catch Hook → Paths",
  "Path A: event = fb_transfer.daily_batch → Loop → Skool DM → POST zapier_update_member",
  "Path B: event = member.created → Skool DM → POST zapier_add_member → POST zapier_update_member",
  "Dashboard reads live from Supabase: Total · Messaged · Pending · FB Joined · Daily log",
];
