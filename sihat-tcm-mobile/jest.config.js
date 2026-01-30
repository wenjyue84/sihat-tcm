/**
 * Jest Configuration for Sihat TCM Mobile
 * 
 * This configuration sets up Jest with React Native Testing Library
 * for unit and component testing in the Expo-based mobile app.
 */
module.exports = {
    // Use the react-native preset as a base
    preset: 'react-native',

    // Setup files to run after Jest is initialized
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

    // Transform files using babel
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
    ],

    // Module file extensions
    moduleFileExtensions: ['js', 'jsx', 'json', 'node'],

    // Test file patterns
    testMatch: [
        '**/__tests__/**/*.test.js',
        '**/__tests__/**/*.test.jsx',
        '**/?(*.)+test.js',
        '**/?(*.)+test.jsx',
    ],

    // Collect coverage from these directories
    collectCoverageFrom: [
        'components/**/*.js',
        'screens/**/*.js',
        'lib/**/*.js',
        'hooks/**/*.js',
        '!**/node_modules/**',
        '!**/__tests__/**',
    ],

    // Coverage output directory
    coverageDirectory: 'coverage',

    // Module name mapper for path aliases
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },

    // Test environment
    testEnvironment: 'node',

    // Clear mocks between tests
    clearMocks: true,

    // Verbose output for better debugging
    verbose: true,
};
