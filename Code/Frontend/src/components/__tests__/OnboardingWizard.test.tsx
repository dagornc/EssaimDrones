import { render, screen, fireEvent } from '@testing-library/react';
import OnboardingWizard from '../OnboardingWizard';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import React from 'react';

const STORAGE_KEY = 'aquaswarm-onboarded';

describe('OnboardingWizard', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('renders on first visit', () => {
        render(<OnboardingWizard />);
        expect(screen.getByText('onboarding_step1_title')).toBeInTheDocument(); // translated via mock
    });

    it('does not render if already onboarded', () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        const { container } = render(<OnboardingWizard />);
        expect(container).toBeEmptyDOMElement();
    });

    it('advances to next step on Next click', async () => {
        const user = userEvent.setup();
        render(<OnboardingWizard />);

        expect(screen.getByText('onboarding_step1_title')).toBeInTheDocument();

        await user.click(screen.getByText('onboarding_next'));

        expect(screen.getByText('onboarding_step2_title')).toBeInTheDocument();

        await user.click(screen.getByText('onboarding_next'));

        expect(screen.getByText('onboarding_step3_title')).toBeInTheDocument();
        // Now button should say 'onboarding_start'
        expect(screen.getByText('onboarding_start')).toBeInTheDocument();
    });

    it('dismisses wizard on Finish click', async () => {
        const user = userEvent.setup();
        render(<OnboardingWizard />);

        await user.click(screen.getByText('onboarding_next')); // step 2
        await user.click(screen.getByText('onboarding_next')); // step 3

        // finish
        await user.click(screen.getByText('onboarding_start'));

        expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
        expect(screen.queryByText('onboarding_step3_title')).not.toBeInTheDocument();
    });

    it('dismisses wizard on Skip click', async () => {
        const user = userEvent.setup();
        render(<OnboardingWizard />);

        await user.click(screen.getByText('onboarding_skip'));

        expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
        expect(screen.queryByText('onboarding_step1_title')).not.toBeInTheDocument();
    });

    it('dismisses wizard on Close (X) click', async () => {
        const user = userEvent.setup();
        render(<OnboardingWizard />);

        const closeBtn = screen.getByLabelText('Close onboarding');
        await user.click(closeBtn);

        expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
        expect(screen.queryByText('onboarding_step1_title')).not.toBeInTheDocument();
    });

    it('allows jumping to specific step using stepper dots', async () => {
        const user = userEvent.setup();
        render(<OnboardingWizard />);

        const dots = screen.getAllByRole('button').filter(b => b.getAttribute('aria-label')?.startsWith('Step'));
        expect(dots).toHaveLength(3);

        await user.click(dots[2]);
        expect(screen.getByText('onboarding_step3_title')).toBeInTheDocument();
    });
});
