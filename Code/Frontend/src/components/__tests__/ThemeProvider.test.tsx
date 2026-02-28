import { render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeProvider';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import React from 'react';

const TestComponent = () => {
    const { theme, setTheme } = useTheme();
    return (
        <div>
            <span data-testid="current-theme">{theme}</span>
            <button onClick={() => setTheme('light')}>Set Light</button>
            <button onClick={() => setTheme('dark')}>Set Dark</button>
            <button onClick={() => setTheme('system')}>Set System</button>
        </div>
    );
};

describe('ThemeProvider', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.classList.remove('light', 'dark');
        vi.clearAllMocks();
    });

    it('throws error when used outside of provider', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
            constructor(props: any) {
                super(props);
                this.state = { hasError: false };
            }
            static getDerivedStateFromError() {
                return { hasError: true };
            }
            render() {
                if (this.state.hasError) return <div data-testid="error-catcher">Error Caught</div>;
                return this.props.children;
            }
        }

        const BuggyComponent = () => {
            useTheme();
            return null;
        };

        render(
            <ErrorBoundary>
                <BuggyComponent />
            </ErrorBoundary>
        );

        expect(screen.getByTestId('error-catcher')).toHaveTextContent('Error Caught');
        consoleSpy.mockRestore();
    });

    it('provides default theme (dark)', () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('respects defaultTheme prop', () => {
        render(
            <ThemeProvider defaultTheme="light">
                <TestComponent />
            </ThemeProvider>
        );
        expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
        expect(document.documentElement.classList.contains('light')).toBe(true);
    });

    it('reads from localStorage', () => {
        localStorage.setItem('vite-ui-theme', 'light');
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
        expect(document.documentElement.classList.contains('light')).toBe(true);
    });

    it('changes theme on setTheme call', async () => {
        const user = userEvent.setup();
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        await user.click(screen.getByText('Set Light'));
        expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
        expect(document.documentElement.classList.contains('light')).toBe(true);
        expect(localStorage.getItem('vite-ui-theme')).toBe('light');

        await user.click(screen.getByText('Set Dark'));
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(localStorage.getItem('vite-ui-theme')).toBe('dark');
    });

    it('handles system theme matchMedia', async () => {
        const user = userEvent.setup();
        // Mock matchMedia for system dark preference
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: query.includes('dark'),
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        await user.click(screen.getByText('Set System'));
        expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
});
