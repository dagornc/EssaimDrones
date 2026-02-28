import { render, screen } from '@testing-library/react';
import { Tooltip, TooltipProvider } from '../Tooltip';
import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import React from 'react';

describe('Tooltip', () => {
    it('renders trigger and shows tooltip on hover', async () => {
        const user = userEvent.setup({ delay: null });
        render(
            <TooltipProvider delayDuration={0}>
                <Tooltip content="Tooltip message">
                    <button>Hover me</button>
                </Tooltip>
            </TooltipProvider>
        );

        expect(screen.getByText('Hover me')).toBeInTheDocument();
        expect(screen.queryByText('Tooltip message')).not.toBeInTheDocument();

        await user.hover(screen.getByText('Hover me'));

        const tooltips = await screen.findAllByText('Tooltip message');
        expect(tooltips.length).toBeGreaterThan(0);
        expect(tooltips[0]).toBeInTheDocument();

        await user.unhover(screen.getByText('Hover me'));
    });
});
