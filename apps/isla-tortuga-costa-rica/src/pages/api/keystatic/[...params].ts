import { makeHandler } from '@keystatic/astro/api';
import type { APIRoute } from 'astro';
import config from '../../../../keystatic.config';

// SSR mode enabled
export const prerender = false;

export const ALL: APIRoute = makeHandler({
    config,
});
