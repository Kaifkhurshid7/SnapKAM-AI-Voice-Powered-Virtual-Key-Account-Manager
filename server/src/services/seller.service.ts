import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { SELLER_DATA_PATH } from '../config/paths.js';
import type { SellerData } from '../types.js';

const periodSchema = z.object({
  lastMonth: z.number().nonnegative(),
  thisMonth: z.number().nonnegative(),
});

const sellerDataSchema = z.object({
  note: z.string().optional(),
  currency: z.literal('INR'),
  seller: z.object({
    name: z.string().min(1),
    storeName: z.string().min(1),
    category: z.string().min(1),
    activeListings: z.number().int().positive(),
  }),
  metrics: z.object({
    sales: periodSchema,
    orders: periodSchema,
    cancellationRatePercent: periodSchema,
    averageSellingPrice: periodSchema,
    outOfStockProducts: periodSchema,
  }),
  weeklySales: z.object({
    lastMonth: z.array(z.number().nonnegative()).length(4),
    thisMonth: z.array(z.number().nonnegative()).length(4),
  }),
});

let cached: SellerData | undefined;

/**
 * Load (and cache) the mock seller dataset.
 * The data is validated so a malformed file fails loudly at startup rather than mid-call.
 */
export async function loadSellerData(path: string = SELLER_DATA_PATH): Promise<SellerData> {
  if (cached && path === SELLER_DATA_PATH) return cached;
  const raw = await readFile(path, 'utf8');
  const data = sellerDataSchema.parse(JSON.parse(raw));
  if (path === SELLER_DATA_PATH) cached = data;
  return data;
}
