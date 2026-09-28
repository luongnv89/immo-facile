import '@testing-library/jest-dom/vitest';

// Node >=23 registers a native `localStorage` global that stays undefined
// without --localstorage-file, shadowing jsdom's Storage under vitest.
// Install a small in-memory stub only when no usable implementation exists,
// so Node 22 + jsdom keep using the real Storage.
const usableStorage = s => !!s && typeof s.getItem === 'function' && typeof s.clear === 'function';

const createMemoryStorage = () => {
  const data = new Map();
  return {
    getItem: key => (data.has(String(key)) ? data.get(String(key)) : null),
    setItem: (key, value) => {
      data.set(String(key), String(value));
    },
    removeItem: key => {
      data.delete(String(key));
    },
    clear: () => data.clear(),
    key: index => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  };
};

for (const name of ['localStorage', 'sessionStorage']) {
  if (!usableStorage(globalThis[name])) {
    const stub = createMemoryStorage();
    // Node's builtin is a getter — defineProperty replaces it safely; the
    // plain assignment fallback covers plain-data global environments.
    try {
      Object.defineProperty(globalThis, name, {
        value: stub,
        configurable: true,
        writable: true,
      });
    } catch {
      globalThis[name] = stub;
    }
    if (typeof window !== 'undefined' && window !== globalThis && !usableStorage(window[name])) {
      try {
        Object.defineProperty(window, name, {
          value: stub,
          configurable: true,
          writable: true,
        });
      } catch {
        window[name] = stub;
      }
    }
  }
}

// jsdom lacks IntersectionObserver and matchers used by some components
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
