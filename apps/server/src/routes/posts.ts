import { Router } from 'express';
import { prisma } from '../db/prisma';
import { runPipelineForUser } from '../services/pipeline';

const router = Router();

// GET /posts/:userId — recent generated posts for the dashboard.
router.get('/:userId', async (req, res) => {
  const posts = await prisma.generatedPost.findMany({
    where: { userId: req.params.userId },
    orderBy: { generatedAt: 'desc' },
    take: 50,
  });
  res.json(posts);
});

// POST /posts/regenerate/:userId — on-demand pipeline trigger.
// Returns drafts; does NOT deliver via Telegram/Discord (that happens on cron).
router.post('/regenerate/:userId', async (req, res) => {
  try {
    const { result, drafts } = await runPipelineForUser(req.params.userId, { deliver: false });
    if (result.draftCount === 0) {
      res.status(422).json({ error: 'no drafts generated', result });
      return;
    }
    res.json({ result, drafts });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// POST /posts/trigger/:userId — full pipeline including delivery.
// Useful for manual testing without waiting for cron.
router.post('/trigger/:userId', async (req, res) => {
  try {
    const { result } = await runPipelineForUser(req.params.userId, { deliver: true });
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

export default router;
