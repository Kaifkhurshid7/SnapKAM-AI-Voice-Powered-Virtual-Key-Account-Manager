import { Router } from 'express';
import type { Diagnosis, SellerData } from '../types.js';

/** GET /api/seller - mock seller profile, metrics and the derived diagnosis for the dashboard. */
export function sellerRoutes(data: SellerData, diagnosis: Diagnosis): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json({
      seller: data.seller,
      currency: data.currency,
      weeklySales: data.weeklySales,
      diagnosis,
    });
  });

  return router;
}
