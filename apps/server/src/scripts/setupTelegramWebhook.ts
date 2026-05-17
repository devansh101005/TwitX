/**
 * One-shot: point Telegram at your deployed webhook URL.
 *
 * Run after deploy (and any time PUBLIC_URL changes):
 *   PUBLIC_URL=https://your-app.vercel.app npm run webhook:setup
 *
 * Reads:
 *   TELEGRAM_BOT_TOKEN          — required
 *   PUBLIC_URL                  — required, no trailing slash
 *   TELEGRAM_WEBHOOK_SECRET     — recommended; if set, Telegram includes it as
 *                                 X-Telegram-Bot-Api-Secret-Token on each call.
 */
import 'dotenv/config';
import { setupTelegramWebhook, getTelegramBot } from '../services/notification/TelegramAdapter';

async function main() {
  const publicUrl = process.env.PUBLIC_URL;
  if (!publicUrl) {
    console.error('PUBLIC_URL is required (e.g. https://your-app.vercel.app)');
    process.exit(1);
  }
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is not set');
    process.exit(1);
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    console.warn(
      '[webhook] TELEGRAM_WEBHOOK_SECRET is not set — webhook will be unauthenticated.',
    );
  }

  await setupTelegramWebhook(publicUrl, secret);

  const info = await getTelegramBot().getWebHookInfo();
  console.log('[webhook] registered:');
  console.log(`  url            : ${info.url}`);
  console.log(`  pending_updates: ${info.pending_update_count}`);
  console.log(`  has_custom_cert: ${info.has_custom_certificate}`);
  console.log(`  max_connections: ${info.max_connections}`);
  if (info.last_error_message) {
    console.log(`  last_error     : ${info.last_error_message}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
