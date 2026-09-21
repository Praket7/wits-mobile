jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Default API base URL so httpRepository tests can exercise the hardened
// request path; individual tests may override or clear it.
process.env.EXPO_PUBLIC_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.test.example';
