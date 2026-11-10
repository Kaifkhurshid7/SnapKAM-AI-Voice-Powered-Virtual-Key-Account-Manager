/**
 * API contract types. These mirror `server/src/types.ts`; keep the two in sync when
 * the API changes.
 */

export type MetricUnit = 'currency' | 'count' | 'percent';

export interface MetricComparison {
  key: string;
  label: string;
  unit: MetricUnit;
  lastMonth: number;
  thisMonth: number;
  change: number;
  changePercent: number | null;
  direction: 'up' | 'down' | 'flat';
  sentiment: 'positive' | 'negative' | 'neutral';
}

export type Severity = 'high' | 'medium' | 'low';

export interface Insight {
  id: string;
  title: string;
  severity: Severity;
  finding: string;
  evidence: string[];
}

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

export interface SellerProfile {
  name: string;
  storeName: string;
  category: string;
  activeListings: number;
}

export interface WeeklySales {
  lastMonth: number[];
  thisMonth: number[];
}

export interface SellerResponse {
  seller: SellerProfile;
  currency: 'INR';
  weeklySales: WeeklySales;
  diagnosis: Diagnosis;
}

export interface ConversationSummary {
  primaryConcern: string;
  keyIssues: string[];
  recommendations: string[];
  nextSteps: string[];
}

export type ChatRole = 'user' | 'assistant';
export type ConversationPhase = 'greeting' | 'discovery' | 'recommendation' | 'summary';
export type EngineName = 'gemini' | 'rule-based';
export type Language = 'en-IN' | 'hi-IN';

export interface ApiMessage {
  role: ChatRole;
  content: string;
}

export interface ChatResponse {
  reply: string;
  phase: ConversationPhase;
  summary?: ConversationSummary;
  engine: EngineName;
}
