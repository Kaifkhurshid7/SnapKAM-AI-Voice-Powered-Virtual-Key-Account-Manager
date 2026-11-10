/**
 * Domain and API contract types shared across the server.
 * The client mirrors the API-facing types in `client/src/types/api.ts`.
 */

export type MetricKey =
  'sales' | 'orders' | 'cancellationRatePercent' | 'averageSellingPrice' | 'outOfStockProducts';

export interface PeriodValue {
  lastMonth: number;
  thisMonth: number;
}

export interface SellerProfile {
  name: string;
  storeName: string;
  category: string;
  activeListings: number;
}

export interface SellerData {
  note?: string;
  currency: 'INR';
  seller: SellerProfile;
  metrics: Record<MetricKey, PeriodValue>;
  /** Illustrative week-by-week sales (W1-W4) that sum to the monthly totals; dashboard only. */
  weeklySales: { lastMonth: number[]; thisMonth: number[] };
}

export type MetricUnit = 'currency' | 'count' | 'percent';

export interface MetricComparison {
  key: MetricKey;
  label: string;
  unit: MetricUnit;
  lastMonth: number;
  thisMonth: number;
  /** Absolute change (thisMonth - lastMonth). For percent metrics this is in percentage points. */
  change: number;
  /** Relative change in percent, or null when the baseline is zero. */
  changePercent: number | null;
  direction: 'up' | 'down' | 'flat';
  /** Whether the movement is good or bad for the seller. */
  sentiment: 'positive' | 'negative' | 'neutral';
}

export type InsightId = 'inventory' | 'cancellations' | 'visibility' | 'pricing';
export type Severity = 'high' | 'medium' | 'low';

export interface Insight {
  id: InsightId;
  title: string;
  severity: Severity;
  finding: string;
  evidence: string[];
  /** A natural follow-up question the bot can ask the seller about this area. */
  followUpQuestion: string;
}

/** A prioritised, actionable recommendation tied to one problem found in the data. */
export interface Recommendation {
  id: 'inventory' | 'cancellations' | 'orders';
  title: string;
  problem: string;
  impact: string;
  action: string;
  priority: Severity;
}

export interface Diagnosis {
  headline: string;
  metrics: MetricComparison[];
  insights: Insight[];
  recommendations: Recommendation[];
}

export interface ConversationSummary {
  /** The seller's main concern, in their own terms. */
  primaryConcern: string;
  keyIssues: string[];
  recommendations: string[];
  nextSteps: string[];
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type ConversationPhase = 'greeting' | 'discovery' | 'recommendation' | 'summary';
export type EngineName = 'gemini' | 'rule-based';
export type Language = 'en-IN' | 'hi-IN';

export interface ChatRequest {
  messages: ChatMessage[];
  language: Language;
  /** True when the seller hung up: the engine must return the final summary immediately. */
  endCall?: boolean;
}

/** A single bot turn, as produced by any conversation engine. */
export interface BotTurn {
  reply: string;
  phase: ConversationPhase;
  summary?: ConversationSummary;
}

export interface ChatResponse extends BotTurn {
  engine: EngineName;
}

/** Contract implemented by every conversation engine (LLM-backed or rule-based). */
export interface ConversationEngine {
  readonly name: EngineName;
  respond(request: ChatRequest): Promise<BotTurn>;
}
