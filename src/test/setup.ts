import '@testing-library/jest-dom';

// Polyfill ResizeObserver for jsdom
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock;

// Polyfill matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Polyfill canvas getContext for jsdom
HTMLCanvasElement.prototype.getContext = () => null;

// Polyfill createImageBitmap
if (!globalThis.createImageBitmap) {
  globalThis.createImageBitmap = async () => ({
    close: () => {},
    width: 0,
    height: 0,
  }) as unknown as ImageBitmap;
}

// Polyfill navigator.connection
Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: {
    effectiveType: '4g',
    saveData: false,
  },
});
