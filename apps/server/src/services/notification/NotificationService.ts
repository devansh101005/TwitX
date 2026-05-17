import { prisma } from '../../db/prisma';
import { TelegramAdapter } from './TelegramAdapter';
import type { DraftPost } from '../ai/groq';

export class NotificationService {
  private telegram = new TelegramAdapter();
  // DiscordAdapter is wired in Phase 5.

  async send(userId: string, drafts: DraftPost[]): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true },
    });

    if (!user || !user.preferences) {
      console.warn(`[notify] user ${userId} has no preferences, skipping`);
      return;
    }

    const channel = user.preferences.deliveryChannel;

    if ((channel === 'telegram' || channel === 'both') && user.telegramChatId) {
      await this.telegram.sendDrafts(user.telegramChatId, drafts, userId);
    } else if (channel === 'discord' || channel === 'both') {
      console.warn(`[notify] Discord delivery not yet implemented (Phase 5)`);
    } else {
      console.warn(`[notify] user ${userId} has no usable channel binding`);
    }
  }
}
