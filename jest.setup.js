// Jest setup file

// Mock Electron APIs
global.require = jest.fn();
global.process = {
  cwd: jest.fn(() => '/mock/path'),
  env: {}
};

// Mock fetch for file loading
global.fetch = jest.fn();

// Mock DOM methods
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
