/**
 * Vercel entrypoint. The @vercel/node runtime calls this default export
 * as a standard HTTP handler; Express apps are valid handlers.
 */
import { app } from '../src/app';

export default app;
