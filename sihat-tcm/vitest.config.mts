import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/setupTests.ts'],
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        // Property-based testing configuration
        testTimeout: 30000, // Increased timeout for property tests
        // Include property test files
        include: [
            'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            'src/lib/testing/**/*.test.{js,ts,tsx}'
        ],
        // Exclude performance tests by default (can be run separately)
        exclude: [
            'node_modules/**',
            'dist/**',
            '.next/**',
            'src/**/*.perf.test.{js,ts,tsx}'
        ]
    },
})
