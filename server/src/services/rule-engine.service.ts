import type { BotTurn, ChatRequest, ConversationEngine, Diagnosis, SellerData } from '../types.js';
import { spokenInr } from '../utils/format.js';
import { buildSummary } from './summary.service.js';

/** Phrases that signal the seller wants to wrap up the call. */
const WRAP_UP_PATTERN =
  /\b(bye|goodbye|thanks|thank you|that'?s all|that is all|nothing else|no more|done|dhanyavad|shukriya)\b/i;

/** Number of seller turns after which the bot always moves to the summary. */
const SUMMARY_TURN = 5;
/** Seller turn at which recommendations are delivered. */
const RECOMMENDATION_TURN = 4;
/** Earliest seller turn at which a wrap-up phrase may end the call. */
const EARLIEST_WRAP_UP_TURN = 2;

type Topic = 'inventory' | 'cancellations' | 'visibility';

/** Pick a short, relevant acknowledgement of what the seller just said about a topic. */
function acknowledge(topic: Topic, answer: string): string {
  const text = answer.toLowerCase();
  switch (topic) {
    case 'inventory':
      if (/supplier|vendor|delay|manufactur|raw material|cash|fund|payment/.test(text)) {
        return 'Supplier delays and cash flow are common reasons for that. Restocking only your top sellers first can help.';
      }
      return 'Thanks, that is helpful to know.';
    case 'cancellations':
      if (/stock|inventory/.test(text)) {
        return 'That matches what I see in the data, because stock-outs often lead straight to cancellations.';
      }
      if (/late|dispatch|courier|logistics|delivery|ship/.test(text)) {
        return 'Late dispatch is a very common cancellation trigger.';
      }
      return 'Understood, I will factor that in.';
    case 'visibility':
      return 'Got it, thank you.';
  }
}

/**
 * Deterministic conversation engine driven by the diagnosis.
 * It guarantees a complete, sensible call when no LLM is configured or the LLM is unavailable.
 * It supports English only; Hindi requests receive English replies.
 */
export class RuleBasedEngine implements ConversationEngine {
  readonly name = 'rule-based' as const;

  constructor(
    private readonly data: SellerData,
    private readonly diagnosis: Diagnosis,
  ) {}

  async respond(request: ChatRequest): Promise<BotTurn> {
    const userTurns = request.messages.filter((m) => m.role === 'user');
    const turn = userTurns.length;
    const lastAnswer = userTurns.at(-1)?.content ?? '';

    if (request.endCall) return this.summary(userTurns[0]?.content);
    if (turn === 0) return this.greeting();
    if (
      turn >= SUMMARY_TURN ||
      (turn >= EARLIEST_WRAP_UP_TURN && WRAP_UP_PATTERN.test(lastAnswer))
    ) {
      return this.summary(userTurns[0]?.content);
    }

    switch (turn) {
      case 1:
        return this.openDiscovery();
      case 2:
        return this.askAbout('inventory', 'cancellations', lastAnswer);
      case 3:
        return this.askAbout('cancellations', 'visibility', lastAnswer);
      case RECOMMENDATION_TURN:
        return this.recommend(lastAnswer);
      default:
        return this.summary(userTurns[0]?.content);
    }
  }

  private greeting(): BotTurn {
    const { seller } = this.data;
    return {
      phase: 'greeting',
      reply: `Namaste ${seller.name.split(' ')[0]} ji, this is your virtual Key Account Manager at Snapdeal. I can see your account for ${seller.storeName}. How can I help you today?`,
    };
  }

  /** Acknowledge the seller's concern, share the headline numbers and start with stock-outs. */
  private openDiscovery(): BotTurn {
    const { metrics } = this.data;
    const inventory = this.diagnosis.insights.find((i) => i.id === 'inventory');
    return {
      phase: 'discovery',
      reply:
        `I understand, and I am sorry you are dealing with this. I checked your numbers. Sales dropped from ${spokenInr(metrics.sales.lastMonth)} to ${spokenInr(metrics.sales.thisMonth)}, ` +
        `and orders fell from ${metrics.orders.lastMonth} to ${metrics.orders.thisMonth}, while your average price stayed the same. ` +
        `So this is about fewer orders, not pricing. One big change stands out: ${metrics.outOfStockProducts.thisMonth} of your products are out of stock, up from ${metrics.outOfStockProducts.lastMonth}. ` +
        (inventory?.followUpQuestion ?? 'Can you tell me more about your stock position?'),
    };
  }

  /** Acknowledge the previous answer, then ask the follow-up for the next topic. */
  private askAbout(answered: Topic, next: Topic, lastAnswer: string): BotTurn {
    const { metrics } = this.data;
    const question = this.diagnosis.insights.find((i) => i.id === next)?.followUpQuestion ?? '';
    const lead =
      next === 'cancellations'
        ? `Your cancellation rate also rose from ${metrics.cancellationRatePercent.lastMonth} percent to ${metrics.cancellationRatePercent.thisMonth} percent. `
        : '';
    return {
      phase: 'discovery',
      reply: `${acknowledge(answered, lastAnswer)} ${lead}${question}`.trim(),
    };
  }

  private recommend(lastAnswer: string): BotTurn {
    const [first, second, third] = this.diagnosis.recommendations;
    return {
      phase: 'recommendation',
      reply:
        `${acknowledge('visibility', lastAnswer)} Based on everything, here are three actions. ` +
        `First, ${first?.title.toLowerCase()}. Second, ${second?.title.toLowerCase()}. ` +
        `Third, ${third?.title.toLowerCase()}. Does this plan sound workable, or is there anything you would like to add?`,
    };
  }

  private summary(sellerConcern?: string): BotTurn {
    const summary = buildSummary(this.diagnosis, this.data, sellerConcern);
    return {
      phase: 'summary',
      summary,
      reply:
        'Let me summarise. The main issues are a jump in out-of-stock products and a higher cancellation rate, which together reduced visibility and orders. ' +
        'Please restock your best sellers this week, bring cancellations down by fixing the top cause, and then promote your recovered products. ' +
        'I will check in again in two weeks. Thank you, and good luck!',
    };
  }
}
