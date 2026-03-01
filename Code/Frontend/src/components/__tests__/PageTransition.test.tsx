import { render, screen } from '@testing-library/react';
import PageTransition from '../PageTransition';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

describe('PageTransition', () => {
    it('renders children with framer-motion', () => {
        render(
            <MemoryRouter>
                <PageTransition>
                    <div>Transition Content</div>
                </PageTransition>
            </MemoryRouter>
        );

        const content = screen.getByText('Transition Content');
        expect(content).toBeInTheDocument();
    });
});
