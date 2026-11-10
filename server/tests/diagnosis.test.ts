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
});
