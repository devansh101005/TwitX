import type { Request, Response, NextFunction } from 'express';
import { getAuth, clerkClient } from '@clerk/express';
import { prisma } from '../db/prisma';
import type { User } from '@prisma/client';

// Augment Express's Request with the resolved application user.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      appUser?: User;
    }
  }
}

function pickEmail(clerkUser: {
  primaryEmailAddressId: string | null;
  emailAddresses: { id: string; emailAddress: string }[];
}): string | null {
  const primary = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId,
  );
  return primary?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? null;
}

/**
 * Resolve the Clerk session into our own User row, auto-provisioning on first
 * sign-in. Must run AFTER clerkMiddleware() + requireAuth() so getAuth() is
 * populated and the request is known to be authenticated.
 */
export async function resolveAppUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      res.status(401).json({ error: 'unauthenticated' });
      return;
    }

    let user = await prisma.user.findUnique({ where: { clerkId } });

    if (!user) {
      const clerkUser = await clerkClient.users.getUser(clerkId);
      const email =
        pickEmail(clerkUser) ?? `${clerkId}@clerk.local`;
      const name =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
        null;
      user = await prisma.user.create({ data: { clerkId, email, name } });
    }

    req.appUser = user;
    next();
  } catch (err) {
    next(err);
  }
}
