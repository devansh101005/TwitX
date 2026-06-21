// Next.js 16 renamed `middleware` to `proxy`. Clerk's clerkMiddleware() returns
// a handler compatible with the proxy signature, exported as the default.
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/onboarding(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Run on all routes except Next internals and static assets...
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|gif|png|svg|ico|webp|woff2?|ttf|map)).*)',
    // ...and always on API routes.
    '/(api|trpc)(.*)',
  ],
};
