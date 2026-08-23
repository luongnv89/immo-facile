module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.js'],
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js'],
  coverageReporters: ['text', 'text-summary', 'lcov'],
  // Task 5.6 (#48) ratchet — bound below measured floor on 2026-08-23
  // (81.96% stmts / 72.64% branches / 91.25% funcs / 82.05% lines).
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 88,
      lines: 80,
    },
  },
};
