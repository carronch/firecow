import sharedConfig from '@firecow/config/tailwind.config.mjs';

/** @type {import('tailwindcss').Config} */
export default {
    ...sharedConfig,
    content: [
        './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
        '../../packages/ui/src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'
    ],
};
