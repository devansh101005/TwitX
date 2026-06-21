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

export default router;
