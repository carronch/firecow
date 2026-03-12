import sharedConfig from '@firecow/config/tailwind.config.mjs';

/** @type {import('tailwindcss').Config} */
export default {
    ...sharedConfig,
    content: [
        './src/**/*.{astro,html,js,jsx,ts,tsx}',
    ],
};
