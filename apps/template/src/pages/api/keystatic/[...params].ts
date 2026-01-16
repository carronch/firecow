import { makeHandler } from '@keystatic/astro/api';
import config from '../../../../keystatic.config';

// SSR mode enabled
export const prerender = false;

export const ALL = makeHandler({
    config,
});
