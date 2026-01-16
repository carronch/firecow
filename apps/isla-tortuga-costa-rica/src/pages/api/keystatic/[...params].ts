import { makeHandler } from '@keystatic/astro/api';
import type { APIRoute } from 'astro';
import config from '../../../../keystatic.config';

// SSR mode enabled
export const prerender = false;

export const ALL: APIRoute = async (context) => {
    // Cloudflare Pages compatibility: Inject env vars from runtime context into process.env
    // This allows Keystatic's internal code to find the secrets it expects
    if (context.locals?.runtime?.env) {
        for (const [key, value] of Object.entries(context.locals.runtime.env)) {
            process.env[key] = value as string;
        }
    }

    const handler = makeHandler({
        config,
    });

    return handler(context);
};
