import { prisma } from '../../db/prisma';
import { TelegramAdapter } from './TelegramAdapter';
import type { GeneratedPost } from '@prisma/client';

export class NotificationService {
  private telegram = new TelegramAdapter();
  // DiscordAdapter is wired in Phase 5.

  /**
   * Best-effort delivery of already-persisted posts. Returns true only if a
   * channel actually sent them. Never throws — drafts are already saved, so a
   * delivery failure just means "review them in the dashboard".
   */
  async send(userId: string, posts: GeneratedPost[]): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true },
    });

    if (!user || !user.preferences) {
      console.warn(`[notify] user ${userId} has no preferences, skipping`);
      return false;
    }

    const channel = user.preferences.deliveryChannel;

    if ((channel === 'telegram' || channel === 'both') && user.telegramChatId) {
      try {
        await this.telegram.sendDrafts(user.telegramChatId, posts);
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(
          `[notify] telegram delivery failed (${msg}). Drafts saved — review in dashboard.`,
        );
        return false;
      }
    }

    if (channel === 'discord' || channel === 'both') {
      console.warn(`[notify] Discord delivery not yet implemented (Phase 5)`);
    } else {
      console.warn(
        `[notify] user ${userId} has no usable channel binding — drafts saved, review in dashboard`,
      );
    }
    return false;
  }
}
