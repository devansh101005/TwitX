import { Router } from 'express';
import { prisma } from '../db/prisma';

const router = Router();

// POST /users — create a user record. Email is auto-generated for MVP single-user mode.
router.post('/', async (req, res) => {
  const { name, email } = req.body ?? {};

  const finalEmail =
    email ??
    `user-${Math.random().toString(36).slice(2, 10)}-${Date.now()}@local`;

  try {
    const user = await prisma.user.create({
      data: { name, email: finalEmail },
    });
    res.json(user);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// GET /users/:id — used by the dashboard to check Telegram binding state.
router.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { preferences: true },
  });
  if (!user) {
    res.status(404).json({ error: 'user not found' });
    return;
  }
  res.json(user);
});

export default router;
