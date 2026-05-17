import { Router } from 'express';
import { prisma } from '../db/prisma';

const router = Router();

const STATUS_BY_FEEDBACK: Record<string, string> = {
  liked: 'approved',
  skipped: 'skipped',
  edited: 'edited',
};

router.post('/', async (req, res) => {
  const { userId, postId, feedbackType, editedVersion } = req.body;

  if (!userId || !postId || !feedbackType) {
    res.status(400).json({ error: 'userId, postId, and feedbackType are required' });
    return;
  }

  const status = STATUS_BY_FEEDBACK[feedbackType];
  if (!status) {
    res.status(400).json({ error: `invalid feedbackType: ${feedbackType}` });
    return;
  }

  const [feedback] = await prisma.$transaction([
    prisma.feedback.upsert({
      where: { postId },
      update: { feedbackType, editedVersion },
      create: { userId, postId, feedbackType, editedVersion },
    }),
    prisma.generatedPost.update({
      where: { id: postId },
      data: { status },
    }),
  ]);

  res.json(feedback);
});

export default router;
