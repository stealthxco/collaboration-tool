export default {
  // Test environment
  testEnvironment: 'node',
  
  // Module file extensions for importing
  moduleFileExtensions: ['js', 'json'],
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/src/**/*.test.js',
    '**/__tests__/**/*.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/index.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Test timeout
  testTimeout: 10000,
  
  // Transform configuration
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  
  // Module paths
  modulePaths: ['<rootDir>/src'],
  
  // Global variables
  globals: {
    'NODE_ENV': 'test'
  }
};