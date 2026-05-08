module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  testMatch: ['**/__tests__/**/*.spec.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: ['src/**/*.{ts,js}', '!src/**/*.d.ts', '!src/**/migrations/**'],
  // Transform node_modules except for packages that use ESM syntax (uuid)
  transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],
};
