import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';

const CHAT_ID = process.argv[2] ?? '1139403329';

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN not set');
    process.exit(1);
  }

  const bot = new TelegramBot(token, { polling: false });

  // Who is this bot? Confirms the token maps to the bot you started.
  const me = await bot.getMe();
  console.log(`bot: @${me.username} (id ${me.id})`);

  console.log(`sending test message to chat ${CHAT_ID}...`);
  try {
    const msg = await bot.sendMessage(CHAT_ID, '✅ ping from pingTelegram.ts');
    console.log('SENT OK — message_id', msg.message_id, 'to chat', msg.chat.id);
  } catch (e) {
    console.error('SEND FAILED:', e instanceof Error ? e.message : e);
    // node-telegram-bot-api attaches the raw Telegram response here:
    const resp = (e as { response?: { body?: unknown } }).response;
    if (resp?.body) console.error('telegram says:', JSON.stringify(resp.body));
  }
}

main();
