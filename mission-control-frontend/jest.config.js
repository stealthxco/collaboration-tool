export default {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Module file extensions for importing
  moduleFileExtensions: ['js', 'jsx', 'json'],
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.{js,jsx}',
    '**/src/**/*.test.{js,jsx}',
    '**/__tests__/**/*.{js,jsx}'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/main.jsx',
    '!src/index.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
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
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  
  // Module name mapping
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/tests/__mocks__/fileMock.js'
  },
  
  // Module paths
  modulePaths: ['<rootDir>/src'],
  
  // Global variables
  globals: {
    'NODE_ENV': 'test'
  }
};