import { Router } from 'express';
import { prisma } from '../db/prisma';

const router = Router();

// GET /me — the authenticated user with preferences + telegram binding state.
// The user row is auto-provisioned by resolveAppUser on first request.
router.get('/', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.appUser!.id },
    include: { preferences: true },
  });
  res.json(user);
});

// POST /me/telegram/disconnect — unbind this user's Telegram chat.
// (Binding happens out-of-band via the bot's /start link.)
router.post('/telegram/disconnect', async (req, res) => {
  await prisma.user.update({
    where: { id: req.appUser!.id },
    data: { telegramChatId: null },
  });
  res.json({ ok: true });
});

export default router;
