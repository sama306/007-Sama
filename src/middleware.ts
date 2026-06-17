import { getSession } from 'auth-astro/server';
import { defineMiddleware } from 'astro/middleware';

const SSR_PREFIXES = ['/account', '/checkout', '/api'];
const PROTECTED_PREFIXES = ['/account', '/checkout'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const needsSession = SSR_PREFIXES.some((p) => pathname.startsWith(p));

  const session = needsSession ? await getSession(context.request) : null;

  context.locals.session = session;

  context.locals.user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: (session.user.role as 'guest' | 'user' | 'premium' | 'editor' | 'admin') || 'user',
      }
    : null;

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!session) {
      const redirect = encodeURIComponent(pathname);
      return context.redirect(`/auth/login?redirect=${redirect}`);
    }
  }

  return next();
});
