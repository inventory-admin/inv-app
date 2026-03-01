/** @type {import('jest').Config} */
const config = {
  projects: [
    // Node environment for API routes, server actions, lib
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/__tests__/api/**/*.test.ts',
        '<rootDir>/__tests__/actions/**/*.test.ts',
        '<rootDir>/__tests__/lib/**/*.test.ts',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
      },
    },
    // JSDOM environment for React components
    {
      displayName: 'client',
      testEnvironment: 'jest-environment-jsdom',
      testMatch: [
        '<rootDir>/__tests__/components/**/*.test.tsx',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
      },
      setupFilesAfterSetup: ['<rootDir>/__tests__/setup.ts'],  // TODO: enable when component tests added
    },
  ],
}

module.exports = config