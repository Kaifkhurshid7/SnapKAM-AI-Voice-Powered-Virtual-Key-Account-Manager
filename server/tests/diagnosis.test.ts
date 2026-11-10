import { describe, expect, it } from 'vitest';
import { compareMetrics, diagnose } from '../src/services/diagnosis.service.js';
import { loadSellerData } from '../src/services/seller.service.js';

describe('diagnosis', () => {
  it('computes month-over-month changes from the assignment data', async () => {
    const data = await loadSellerData();
    const byKey = Object.fromEntries(compareMetrics(data).map((m) => [m.key, m]));

    expect(byKey.sales?.changePercent).toBe(-32.5);
    expect(byKey.orders?.changePercent).toBe(-32.5);
    expect(byKey.cancellationRatePercent?.change).toBe(6);
    expect(byKey.averageSellingPrice?.direction).toBe('flat');
    expect(byKey.outOfStockProducts?.thisMonth).toBe(18);
  });

  it('marks worsening metrics as negative and flat price as neutral', async () => {
    const data = await loadSellerData();
    const byKey = Object.fromEntries(compareMetrics(data).map((m) => [m.key, m]));

    expect(byKey.sales?.sentiment).toBe('negative');
    expect(byKey.cancellationRatePercent?.sentiment).toBe('negative');
    expect(byKey.outOfStockProducts?.sentiment).toBe('negative');
    expect(byKey.averageSellingPrice?.sentiment).toBe('neutral');
  });

  it('ranks stock-outs and cancellations as the most severe issues', async () => {
    const { insights } = diagnose(await loadSellerData());

    expect(insights.slice(0, 2).map((i) => i.id)).toEqual(
      expect.arrayContaining(['inventory', 'cancellations']),
    );
    expect(insights[0]?.severity).toBe('high');
    expect(insights.find((i) => i.id === 'pricing')?.severity).toBe('low');
  });

  it('provides two to three practical recommendations', async () => {
    const { recommendations } = diagnose(await loadSellerData());
    expect(recommendations.length).toBeGreaterThanOrEqual(2);
    expect(recommendations.length).toBeLessThanOrEqual(3);
  });

  it('describes each recommendation with problem, impact, action and priority', async () => {
    const { recommendations } = diagnose(await loadSellerData());
    for (const rec of recommendations) {
      expect(rec.problem.length).toBeGreaterThan(0);
      expect(rec.impact.length).toBeGreaterThan(0);
      expect(rec.action.length).toBeGreaterThan(0);
      expect(['high', 'medium', 'low']).toContain(rec.priority);
    }
    expect(recommendations.map((r) => r.id).sort()).toEqual([
      'cancellations',
      'inventory',
      'orders',
    ]);
  });

  it('keeps weekly sales consistent with the monthly totals', async () => {
    const data = await loadSellerData();
    const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
    expect(sum(data.weeklySales.lastMonth)).toBe(data.metrics.sales.lastMonth);
    expect(sum(data.weeklySales.thisMonth)).toBe(data.metrics.sales.thisMonth);
  });
});
