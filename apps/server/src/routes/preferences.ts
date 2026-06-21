import { Router } from 'express';
import { prisma } from '../db/prisma';

const router = Router();

// GET /preferences — the authenticated user's preferences.
router.get('/', async (req, res) => {
  const prefs = await prisma.userPreference.findUnique({
    where: { userId: req.appUser!.id },
  });
  if (!prefs) {
    res.status(404).json({ error: 'preferences not set' });
    return;
  }
  res.json(prefs);
});

// POST /preferences — upsert the authenticated user's preferences.
router.post('/', async (req, res) => {
  const userId = req.appUser!.id;
  const { niches, tone, postingStyle, postsPerDay, deliveryChannel, twitterTier, voiceSamples } =
    req.body;

  if (!Array.isArray(niches) || !tone || !postingStyle || !deliveryChannel) {
    res.status(400).json({ error: 'missing required fields' });
    return;
  }

  // Normalize voiceSamples: accept array (or omit); trim, drop blanks, cap at 20.
  const samples = Array.isArray(voiceSamples)
    ? voiceSamples
        .filter((s: unknown): s is string => typeof s === 'string')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 20)
    : undefined;

  const prefs = await prisma.userPreference.upsert({
    where: { userId },
    update: {
      niches,
      tone,
      postingStyle,
      postsPerDay,
      deliveryChannel,
      twitterTier,
      ...(samples !== undefined ? { voiceSamples: samples } : {}),
    },
    create: {
      userId,
      niches,
      tone,
      postingStyle,
      postsPerDay: postsPerDay ?? 3,
      deliveryChannel,
      twitterTier: twitterTier ?? 'free',
      voiceSamples: samples ?? [],
    },
  });

  res.json(prefs);
});

export default router;
