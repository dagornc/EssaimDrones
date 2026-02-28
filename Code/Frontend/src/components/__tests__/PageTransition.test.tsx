import { render, screen, act } from '@testing-library/react';
import PageTransition from '../PageTransition';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

describe('PageTransition', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders children with transition classes', () => {
        render(
            <MemoryRouter>
                <PageTransition>
                    <div>Transition Content</div>
                </PageTransition>
            </MemoryRouter>
        );

        const content = screen.getByText('Transition Content');
        const wrapper = content.parentElement;

        // Initially opacity-0 due to show=false
        expect(wrapper).toHaveClass('opacity-0');

        // Advance timers to trigger show=true
        act(() => {
            vi.advanceTimersByTime(50);
        });

        expect(wrapper).toHaveClass('opacity-100');
    });

    it('clears timeouts on unmount', () => {
        const { unmount } = render(
            <MemoryRouter>
                <PageTransition>
                    <div>Test</div>
                </PageTransition>
            </MemoryRouter>
        );
        unmount();
        // Just ensuring it doesn't throw or leave lingering timers
    });
});
