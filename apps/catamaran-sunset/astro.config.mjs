import { defineConfig } from 'astro/config';
import baseConfig from '../template/astro.config.mjs';

export default defineConfig({
    ...baseConfig,
    site: 'https://catamaransunset.com',
});
