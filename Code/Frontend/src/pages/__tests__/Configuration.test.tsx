import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import Configuration from '../Configuration';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock LLMSelector
vi.mock('../../components/LLMSelector', () => ({
    default: () => <div data-testid="mock-llm-selector">LLMSelector</div>
}));

const mockSendMessage = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useOutletContext: () => ({
            sendMessage: mockSendMessage
        })
    };
});

const mockToast = vi.fn();
vi.mock('../../components/ui/Toast', () => ({
    useToast: () => ({ toast: mockToast })
}));

describe('Configuration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Header and default LLM tab', () => {
        render(<Configuration />);
        expect(screen.getByText('configuration')).toBeInTheDocument();
        expect(screen.getByTestId('mock-llm-selector')).toBeInTheDocument();
    });

    it('switches to Physics tab and renders sliders', async () => {
        const user = userEvent.setup({ delay: null });
        render(<Configuration />);

        const physicsTab = screen.getByText('config_tab_physics');
        await user.click(physicsTab);

        expect(screen.getByText('physics_parameters')).toBeInTheDocument();
        expect(screen.getByText('water_density')).toBeInTheDocument();

        // Change water density to trigger validation warning (min 900)
        const densitySlider = screen.getByLabelText('water_density');
        await user.click(densitySlider);

        fireEvent.change(densitySlider, { target: { value: '800' } });

        await waitFor(() => {
            expect(screen.getByText('⚠ Value exceeds recommended range')).toBeInTheDocument();
            expect(screen.getByText('800 kg/m³')).toBeInTheDocument();
        });
    });

    it('switches to Environment tab and edits inputs', async () => {
        const user = userEvent.setup({ delay: null });
        render(<Configuration />);

        const envTab = screen.getByText('config_tab_environment');
        await user.click(envTab);

        expect(screen.getByText('bounding_volume')).toBeInTheDocument();

        const boundsXInput = screen.getByLabelText('Bounds X');
        expect(boundsXInput).toHaveValue(100);

        await user.clear(boundsXInput);
        await user.type(boundsXInput, '150');

        expect(boundsXInput).toHaveValue(150);
    });

    it('shows toast on Apply and clears it', async () => {
        const user = userEvent.setup({ delay: null });
        render(<Configuration />);

        const physicsTab = screen.getByText('config_tab_physics');
        await user.click(physicsTab);

        const applyBtn = screen.getByText('apply_changes');
        await user.click(applyBtn);

        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
            title: 'config_applied_toast',
            variant: 'success'
        }));
    });

    it('resets values on Reset button click', async () => {
        const user = userEvent.setup({ delay: null });
        render(<Configuration />);

        const envTab = screen.getByText('config_tab_environment');
        await user.click(envTab);

        const boundsXInput = screen.getByLabelText('Bounds X');
        await user.clear(boundsXInput);
        await user.type(boundsXInput, '150');
        expect(boundsXInput).toHaveValue(150);

        const currentVxInput = screen.getByLabelText('Current Vx');
        await user.clear(currentVxInput);
        await user.type(currentVxInput, '1.5');
        expect(currentVxInput).toHaveValue(1.5);

        const resetBtn = screen.getByText('reset_to_defaults');
        await user.click(resetBtn);

        expect(boundsXInput).toHaveValue(100); // back to default
    });

    it('handles mode parameters scrolling and editing', async () => {
        const user = userEvent.setup({ delay: null });
        render(<Configuration />);

        const physicsTab = screen.getByText('config_tab_physics');
        await user.click(physicsTab);

        const scrollRight = screen.getByLabelText('Scroll right');
        await user.click(scrollRight);

        // Click on the second visible mode tab
        const attackTab = screen.getByText('ATTACK');
        await user.click(attackTab);

        const sepSlider = screen.getByLabelText('separation');
        expect(sepSlider).toHaveValue('1.5'); // Default target sep for ATTACK is 1.5

        const aliSlider = screen.getByLabelText('alignment');
        const cohSlider = screen.getByLabelText('cohesion');
        const tgtSlider = screen.getByLabelText('target_weights');
        const spdSlider = screen.getByLabelText('speed_multiplier');

        fireEvent.change(sepSlider, { target: { value: '2.0' } });
        fireEvent.change(aliSlider, { target: { value: '2.5' } });
        fireEvent.change(cohSlider, { target: { value: '3.0' } });
        fireEvent.change(tgtSlider, { target: { value: '1.5' } });
        fireEvent.change(spdSlider, { target: { value: '2.5' } });

        await waitFor(() => {
            expect(sepSlider).toHaveValue('2');
            expect(aliSlider).toHaveValue('2.5');
            expect(cohSlider).toHaveValue('3');
            expect(tgtSlider).toHaveValue('1.5');
            expect(spdSlider).toHaveValue('2.5');
        });

        // Scroll fully back
        const scrollLeft = screen.getByLabelText('Scroll left');
        await user.click(scrollLeft);
        await user.click(scrollLeft);

        expect(scrollLeft).toBeDisabled();
    });
});
