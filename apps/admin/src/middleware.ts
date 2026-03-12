import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
    // CF Access injects this header on authenticated requests.
    // In dev it won't be present — fall back to a local label.
    const email =
        context.request.headers.get('cf-access-authenticated-user-email') ??
        'dev@local';
    context.locals.userEmail = email;
    return next();
});
