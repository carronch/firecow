import { makeHandler } from '@keystatic/astro/api';
import type { APIRoute } from 'astro';
import config from '../../../../keystatic.config';

// SSR mode enabled
export const prerender = false;

export const ALL: APIRoute = async (context) => {
    // Cloudflare Pages compatibility: Inject env vars from runtime context into process.env
    // This allows Keystatic's internal code to find the secrets it expects
    // Dynamic usage of variables
    // We clone the config and force the credentials if available in the runtime context
    const runtimeConfig = { ...config };
    const runtime = (context.locals as any)?.runtime;

    if (runtime?.env) {
        // ... (existing Cloudflare logic)
        const env = runtime.env;
        process.env.KEYSTATIC_SECRET = env.KEYSTATIC_SECRET;
        if (runtimeConfig.storage && runtimeConfig.storage.kind === 'github') {
            runtimeConfig.storage = {
                ...runtimeConfig.storage,
                clientId: env.KEYSTATIC_GITHUB_CLIENT_ID,
                clientSecret: env.KEYSTATIC_GITHUB_CLIENT_SECRET
            } as any;
        }
    } else {
        // Fallback for Local Development (using import.meta.env from .env file)
        if (runtimeConfig.storage && runtimeConfig.storage.kind === 'github') {
            runtimeConfig.storage = {
                ...runtimeConfig.storage,
                clientId: import.meta.env.KEYSTATIC_GITHUB_CLIENT_ID,
                clientSecret: import.meta.env.KEYSTATIC_GITHUB_CLIENT_SECRET
            } as any;
        }
    }

    const handler = makeHandler({
        config: runtimeConfig,
        // Passing arguments directly to makeHandler to bypass process.env reliance
        clientId: runtime?.env?.KEYSTATIC_GITHUB_CLIENT_ID || import.meta.env.KEYSTATIC_GITHUB_CLIENT_ID,
        clientSecret: runtime?.env?.KEYSTATIC_GITHUB_CLIENT_SECRET || import.meta.env.KEYSTATIC_GITHUB_CLIENT_SECRET,
        secret: runtime?.env?.KEYSTATIC_SECRET || import.meta.env.KEYSTATIC_SECRET,
    } as any);

    return handler(context);
};
