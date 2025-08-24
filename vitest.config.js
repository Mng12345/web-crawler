import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
        },
        include: ['**/*.test.ts'],
        exclude: ['node_modules', 'dist', '.idea', '.git'],
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
});
//# sourceMappingURL=vitest.config.js.map