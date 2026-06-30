/** Skool CSV column headers */
export const SKOOL_CSV_COLUMNS = [
  "FirstName",
  "LastName",
  "Email",
  "Invited By",
  "JoinedDate",
  "Question1",
  "Answer1",
  "Question2",
  "Answer2",
  "Question3",
  "Answer3",
  "Price",
  "Recurring Interval",
  "Tier",
  "LTV",
];

const HEADER_ALIASES = {
  firstname: "first_name",
  lastname: "last_name",
  email: "email",
  invitedby: "invited_by",
  joineddate: "joined_date",
  question1: "question1",
  answer1: "answer1",
  question2: "question2",
  answer2: "answer2",
  question3: "question3",
  answer3: "answer3",
  price: "price",
  recurringinterval: "recurring_interval",
  recurringir: "recurring_interval",
  tier: "tier",
  ltv: "ltv",
};

function normalizeHeader(header) {
  return header.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function parseDate(value) {
  if (!value?.trim()) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export function rowToMemberRecord(row) {
  return {
    first_name: row.first_name?.trim() || "Unknown",
    last_name: row.last_name?.trim() || "",
    email: row.email?.trim().toLowerCase() || "",
    invited_by: row.invited_by?.trim() || null,
    joined_date: parseDate(row.joined_date),
    question1: row.question1?.trim() || null,
    answer1: row.answer1?.trim() || null,
    question2: row.question2?.trim() || null,
    answer2: row.answer2?.trim() || null,
    question3: row.question3?.trim() || null,
    answer3: row.answer3?.trim() || null,
    price: row.price?.trim() || null,
    recurring_interval: row.recurring_interval?.trim() || null,
    tier: row.tier?.trim() || null,
    ltv: row.ltv?.trim() || "$0",
    migration_status: "pending",
    dm_sent: false,
    fb_joined: false,
    skool_id: row.skool_id?.trim() || emailToSkoolId(row.email),
  };
}

function emailToSkoolId(email) {
  const local = (email ?? "").split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return local ? `lpf-${local}` : null;
}

export function parseSkoolCsv(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const fieldKeys = headers.map(h => HEADER_ALIASES[normalizeHeader(h)] ?? null);

  const records = [];
  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    if (values.every(v => !v.trim())) continue;

    const row = {};
    fieldKeys.forEach((key, idx) => {
      if (key) row[key] = values[idx] ?? "";
    });

    if (!row.email?.trim()) continue;
    records.push(rowToMemberRecord(row));
  }

  return records;
}
