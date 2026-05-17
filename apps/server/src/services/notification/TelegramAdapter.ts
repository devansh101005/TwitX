import TelegramBot from 'node-telegram-bot-api';
import { prisma } from '../../db/prisma';
import type { DraftPost } from '../ai/groq';

let bot: TelegramBot | null = null;

/**
 * Returns the singleton bot instance. Always created with polling: false —
 * updates arrive via the /telegram/webhook route which calls bot.processUpdate().
 * Handlers are registered eagerly so they fire for both webhook and polling modes.
 */
export function getTelegramBot(): TelegramBot {
  if (bot) return bot;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');

  bot = new TelegramBot(token, { polling: false });
  registerHandlers(bot);

  return bot;
}

/**
 * One-shot helper to point Telegram at our webhook URL.
 * Called from scripts/setupTelegramWebhook.ts after deploy (and after PUBLIC_URL changes).
 */
export async function setupTelegramWebhook(
  publicUrl: string,
  secretToken?: string,
): Promise<void> {
  const tg = getTelegramBot();
  const url = `${publicUrl.replace(/\/$/, '')}/telegram/webhook`;
  await tg.setWebHook(url, {
    secret_token: secretToken,
    allowed_updates: ['message', 'callback_query'],
  });
}

export class TelegramAdapter {
  async sendDrafts(chatId: string, drafts: DraftPost[], userId: string): Promise<void> {
    const tg = getTelegramBot();

    await tg.sendMessage(chatId, '🔥 *Your daily content suggestions are ready*', {
      parse_mode: 'Markdown',
    });

    for (const draft of drafts) {
      const post = await prisma.generatedPost.create({
        data: {
          userId,
          content: draft.content,
          type: draft.type,
          status: 'pending',
        },
      });

      const label = draft.type === 'thread' ? '🧵 Thread' : '💬 Tweet';
      const preview = draft.content.slice(0, 3500);
      const message = `${label}\n\n${preview}${draft.content.length > 3500 ? '\n\n...(truncated)' : ''}`;

      await tg.sendMessage(chatId, message, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Approve', callback_data: `approve:${post.id}` },
              { text: '❌ Skip', callback_data: `skip:${post.id}` },
              { text: '✏️ Edit', callback_data: `edit:${post.id}` },
            ],
          ],
        },
      });
    }
  }
}

function registerHandlers(tg: TelegramBot): void {
  // /start <userId> — bind this Telegram chat to a user record.
  tg.onText(/\/start(?:\s+(\S+))?/, async (msg, match) => {
    const chatId = msg.chat.id.toString();
    const userId = match?.[1];

    if (!userId) {
      await tg.sendMessage(
        chatId,
        'Welcome! To connect, open the link from the web app — it looks like t.me/your_bot?start=YOUR_USER_ID',
      );
      return;
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      await tg.sendMessage(
        chatId,
        `Hmm — no user with id ${userId} exists yet. Onboard via the web app first.`,
      );
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { telegramChatId: chatId },
    });

    await tg.sendMessage(
      chatId,
      "✅ *Telegram connected!*\n\nYou'll receive your daily post suggestions at 9am and 7pm.\n\nUse /stop to disconnect.",
      { parse_mode: 'Markdown' },
    );
  });

  tg.onText(/\/stop/, async (msg) => {
    const chatId = msg.chat.id.toString();
    await prisma.user.updateMany({
      where: { telegramChatId: chatId },
      data: { telegramChatId: null },
    });
    await tg.sendMessage(chatId, "Disconnected. You won't receive suggestions anymore.");
  });

  // Approve / Skip / Edit button handler.
  tg.on('callback_query', async (query) => {
    if (!query.data || !query.message) return;
    const [action, postId] = query.data.split(':');
    const chatId = query.message.chat.id.toString();
    const messageId = query.message.message_id;

    const post = await prisma.generatedPost.findUnique({ where: { id: postId } });
    if (!post) {
      await tg.answerCallbackQuery(query.id, { text: 'Post not found.' });
      return;
    }

    try {
      if (action === 'approve') {
        await prisma.$transaction([
          prisma.generatedPost.update({
            where: { id: postId },
            data: { status: 'approved' },
          }),
          prisma.feedback.upsert({
            where: { postId },
            update: { feedbackType: 'liked' },
            create: { userId: post.userId, postId, feedbackType: 'liked' },
          }),
        ]);
        await tg.answerCallbackQuery(query.id, { text: 'Marked as approved!' });
        await tg.editMessageReplyMarkup(
          { inline_keyboard: [[{ text: '✅ Approved', callback_data: 'noop' }]] },
          { chat_id: chatId, message_id: messageId },
        );
        return;
      }

      if (action === 'skip') {
        await prisma.$transaction([
          prisma.generatedPost.update({
            where: { id: postId },
            data: { status: 'skipped' },
          }),
          prisma.feedback.upsert({
            where: { postId },
            update: { feedbackType: 'skipped' },
            create: { userId: post.userId, postId, feedbackType: 'skipped' },
          }),
        ]);
        await tg.answerCallbackQuery(query.id, { text: 'Skipped.' });
        await tg.editMessageReplyMarkup(
          { inline_keyboard: [[{ text: '❌ Skipped', callback_data: 'noop' }]] },
          { chat_id: chatId, message_id: messageId },
        );
        return;
      }

      if (action === 'edit') {
        const prompt = await tg.sendMessage(
          chatId,
          'Reply to *this* message with your edited version.',
          { parse_mode: 'Markdown', reply_markup: { force_reply: true, selective: true } },
        );
        await tg.answerCallbackQuery(query.id, { text: 'Send your edit as a reply.' });

        tg.onReplyToMessage(chatId, prompt.message_id, async (reply) => {
          const editedVersion = reply.text;
          if (!editedVersion) return;

          await prisma.$transaction([
            prisma.generatedPost.update({
              where: { id: postId },
              data: { status: 'edited' },
            }),
            prisma.feedback.upsert({
              where: { postId },
              update: { feedbackType: 'edited', editedVersion },
              create: { userId: post.userId, postId, feedbackType: 'edited', editedVersion },
            }),
          ]);

          await tg.sendMessage(chatId, '✏️ Edit saved. The model will learn from it.');
          await tg.editMessageReplyMarkup(
            { inline_keyboard: [[{ text: '✏️ Edited', callback_data: 'noop' }]] },
            { chat_id: chatId, message_id: messageId },
          );
        });
        return;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[telegram] callback ${action} failed: ${msg}`);
      await tg.answerCallbackQuery(query.id, { text: 'Something went wrong.' });
    }
  });
}
