import { describe, expect, it } from 'vitest';
import type { MetricComparison } from '../types/api';
import { formatChange, formatMetricValue } from './format';

const base: MetricComparison = {
  key: 'sales',
  label: 'Sales',
  unit: 'currency',
  lastMonth: 200000,
  thisMonth: 135000,
  change: -65000,
  changePercent: -32.5,
  direction: 'down',
  sentiment: 'negative',
};

describe('formatMetricValue', () => {
  it('uses Indian digit grouping for currency', () => {
    expect(formatMetricValue(135000, 'currency')).toContain('1,35,000');
  });

  it('formats percentages and counts', () => {
    expect(formatMetricValue(14, 'percent')).toBe('14%');
    expect(formatMetricValue(270, 'count')).toBe('270');
  });
});

describe('formatChange', () => {
  it('shows relative change for currency and count metrics', () => {
    expect(formatChange(base)).toBe('-32.5%');
  });

  it('shows percentage points for percent metrics', () => {
    expect(
      formatChange({ ...base, unit: 'percent', change: 6, changePercent: 75, direction: 'up' }),
    ).toBe('+6 pts');
  });

  it('shows "No change" for flat metrics', () => {
    expect(formatChange({ ...base, change: 0, changePercent: 0, direction: 'flat' })).toBe(
      'No change',
    );
  });
});
