export default {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/helpers/'],
}
