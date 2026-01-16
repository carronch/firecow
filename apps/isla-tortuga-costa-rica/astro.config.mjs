import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
    site: 'https://example.com',
    integrations: [
        react(),
        tailwind({
            applyBaseStyles: false,
        }),
        markdoc(),
        keystatic()
    ],
    output: 'server',
    adapter: cloudflare({
        platformProxy: {
            enabled: true,
        },
    })
});
