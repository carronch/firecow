import { makeHandler } from '@keystatic/astro/api';
import config from '../../../../keystatic.config';

// This is required for static site generation
export function getStaticPaths() {
    return [
        { params: { params: [] } }
    ];
}

export const ALL = makeHandler({
    config,
});
