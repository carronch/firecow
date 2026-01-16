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
        const env = runtime.env;
        // manually inject for session secret if keystatic reads process.env directly
        process.env.KEYSTATIC_SECRET = env.KEYSTATIC_SECRET;

        if (runtimeConfig.storage && runtimeConfig.storage.kind === 'github') {
            runtimeConfig.storage = {
                ...runtimeConfig.storage,
                clientId: env.KEYSTATIC_GITHUB_CLIENT_ID,
                clientSecret: env.KEYSTATIC_GITHUB_CLIENT_SECRET
            } as any;
        }
    }

    const handler = makeHandler({
        config: runtimeConfig,
    });

    return handler(context);
};
