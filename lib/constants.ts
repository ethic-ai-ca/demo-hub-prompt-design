/** Home route for the prompt-iteration chat UI (root `/` redirects here). */
export const PI_HOME_PATH = "/pi";

/** Guardrails & constraints lab — same compare UX as `/pi`, separate starters and system scenarios. */
export const GC_HOME_PATH = "/gc";

export const isProductionEnvironment = process.env.NODE_ENV === "production";
export const isDevelopmentEnvironment = process.env.NODE_ENV === "development";
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
);

/** Chats exist only in memory / client state; refresh starts a new conversation. */
export const isEphemeralChatMode = true;

/**
 * Used for artifact/document rows when auth is disabled.
 * `lib/db/migrate.ts` seeds this user on migrate so FK constraints succeed.
 */
export const ANONYMOUS_USER_ID = "00000000-0000-0000-0000-000000000001";

/** Shared shape for `/pi` and `/gc` starter tiles. */
export type ChatStarterRow = {
  promptCompareScenarioIndex: number;
  title: string;
  text: string;
};

/** Starter capsules for chat; each maps to a prompt-compare scenario (system prompts). */
export const CHAT_STARTER_SUGGESTIONS: readonly ChatStarterRow[] = [
  {
    promptCompareScenarioIndex: 0,
    title: "SUPPORT CLASSIFICATION",
    text: "I was charged twice for my order and still haven't received a refund. This is really frustrating.",
  },
  {
    promptCompareScenarioIndex: 1,
    title: "TASK EXTRACTION",
    text: "Hey, can you send the updated report to Sarah and also check if the dashboard numbers are correct before tomorrow?",
  },
  {
    promptCompareScenarioIndex: 2,
    title: "DOCUMENT → DECISION SUMMARY",
    text: "Here is a short report: Sales dropped 12% last quarter due to supply delays and increased competition. Marketing spend increased but did not improve conversion. Inventory issues remain unresolved.",
  },
  {
    promptCompareScenarioIndex: 3,
    title: "RESUME SCREENING",
    text: "Candidate has 3 years of marketing experience, worked with campaigns and analytics tools, no automation or AI experience. Applying for AI Automation Specialist role.",
  },
  {
    promptCompareScenarioIndex: 4,
    title: "RISK DETECTION",
    text: "We might miss the launch deadline because approvals are delayed and we don't have enough resources assigned yet.",
  },
  {
    promptCompareScenarioIndex: 5,
    title: "DATA EXTRACTION",
    text: "Order #12345 was delivered late on March 3rd and the customer requested compensation.",
  },
];

export const suggestions: string[] = CHAT_STARTER_SUGGESTIONS.map(
  (s) => s.text
);

/** Placeholder starters for `/gc`; replace titles and text when you define guardrails examples. */
export const GC_STARTER_SUGGESTIONS: readonly ChatStarterRow[] = [
  {
    promptCompareScenarioIndex: 0,
    title: "GC — SUPPORT CLASSIFICATION",
    text: "I was charged twice for my order and still haven't received a refund. This is really frustrating.",
  },
  {
    promptCompareScenarioIndex: 1,
    title: "GC — TASK EXTRACTION",
    text: "Hey, can you send the updated report to Sarah and also check if the dashboard numbers are correct before tomorrow?",
  },
  {
    promptCompareScenarioIndex: 2,
    title: "GC — DOCUMENT → DECISION SUMMARY",
    text: "Here is a short report: Sales dropped 12% last quarter due to supply delays and increased competition. Marketing spend increased but did not improve conversion. Inventory issues remain unresolved.",
  },
  {
    promptCompareScenarioIndex: 3,
    title: "GC — RESUME SCREENING",
    text: "Candidate has 3 years of marketing experience, worked with campaigns and analytics tools, no automation or AI experience. Applying for AI Automation Specialist role.",
  },
  {
    promptCompareScenarioIndex: 4,
    title: "GC — RISK DETECTION",
    text: "We might miss the launch deadline because approvals are delayed and we don't have enough resources assigned yet.",
  },
  {
    promptCompareScenarioIndex: 5,
    title: "GC — DATA EXTRACTION",
    text: "Order #12345 was delivered late on March 3rd and the customer requested compensation.",
  },
];
