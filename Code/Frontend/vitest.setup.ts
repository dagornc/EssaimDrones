import '@testing-library/jest-dom';
import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock ResizeObserver for Recharts
window.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Mock translation
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (str: string) => str,
        i18n: {
            changeLanguage: () => new Promise(() => { }),
            language: 'en'
        },
    }),
    initReactI18next: { type: '3rdParty', init: vi.fn() }
}));

// Mock missing JSDOM methods for Radix UI
if (typeof window.PointerEvent === 'undefined') {
    class PointerEvent extends MouseEvent {
        pointerId = 1;
        constructor(type: string, params: PointerEventInit = {}) {
            super(type, params);
            if (params.pointerId) {
                this.pointerId = params.pointerId;
            }
        }
    }
    (window as any).PointerEvent = PointerEvent;
}
if (typeof EventTarget !== 'undefined') {
    EventTarget.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
    EventTarget.prototype.setPointerCapture = vi.fn();
    EventTarget.prototype.releasePointerCapture = vi.fn();
}

if (typeof HTMLElement !== 'undefined') {
    HTMLElement.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.releasePointerCapture = vi.fn();
}
