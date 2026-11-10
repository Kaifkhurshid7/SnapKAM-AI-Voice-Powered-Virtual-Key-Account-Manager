import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Repository root. This file sits at `server/src/config` (dev) or `server/dist/config` (built),
 * so the root is three levels up in both cases.
 */
export const REPO_ROOT = path.resolve(here, '..', '..', '..');

export const SELLER_DATA_PATH = path.join(REPO_ROOT, 'data', 'seller-data.json');
export const SYSTEM_PROMPT_PATH = path.join(REPO_ROOT, 'prompts', 'system-prompt.md');
export const CLIENT_DIST_PATH = path.join(REPO_ROOT, 'client', 'dist');
