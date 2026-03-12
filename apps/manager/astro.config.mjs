import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import markdoc from '@astrojs/markdoc';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
    site: 'https://example.com',
    integrations: [
        react(),
        tailwind({
            applyBaseStyles: false,
        }),
        markdoc()
    ],
    output: 'hybrid',
    adapter: node({
        mode: 'standalone'
    })
});
