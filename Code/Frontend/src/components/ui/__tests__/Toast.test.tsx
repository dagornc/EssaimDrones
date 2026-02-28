import { render, screen, act, waitFor } from '@testing-library/react';
import { ToastProvider, useToast } from '../Toast';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import React from 'react';

const TestComponent = () => {
    const { toast } = useToast();
    return (
        <div>
            <button onClick={() => toast({ title: 'Success', variant: 'success' })}>Success Toast</button>
            <button onClick={() => toast({ title: 'Error', description: 'Error desc', variant: 'error' })}>Error Toast</button>
            <button onClick={() => toast({ title: 'Warning', variant: 'warning' })}>Warning Toast</button>
            <button onClick={() => toast({ title: 'Info', variant: 'info' })}>Info Toast</button>
        </div>
    );
};

describe('Toast Component', () => {

    it('throws error if useToast is used outside provider', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        expect(() => render(<TestComponent />)).toThrow('useToast must be used within ToastProvider');
        consoleSpy.mockRestore();
    });

    it('renders success toast', async () => {
        const user = userEvent.setup({ delay: null });
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        await user.click(screen.getByText('Success Toast'));
        expect(await screen.findByText('Success')).toBeInTheDocument();
    });

    it('renders error toast with description', async () => {
        const user = userEvent.setup({ delay: null });
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        await user.click(screen.getByText('Error Toast'));
        expect(await screen.findByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Error desc')).toBeInTheDocument();
    });

    it('renders warning and info toasts', async () => {
        const user = userEvent.setup({ delay: null });
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        await user.click(screen.getByText('Warning Toast'));
        await user.click(screen.getByText('Info Toast'));

        expect(await screen.findByText('Warning')).toBeInTheDocument();
        expect(await screen.findByText('Info')).toBeInTheDocument();
    });

    it('closes toast on close button click', async () => {
        const user = userEvent.setup({ delay: null });
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        await user.click(screen.getByText('Success Toast'));
        expect(await screen.findByText('Success')).toBeInTheDocument();

        const closeButton = screen.getByRole('button', { name: 'Close' });
        await user.click(closeButton);

        await waitFor(() => {
            expect(screen.queryByText('Success')).not.toBeInTheDocument();
        });
    });

    it('closes toast on Escape and covers onOpenChange', async () => {
        const user = userEvent.setup({ delay: null });
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        await user.click(screen.getByText('Success Toast'));
        const successToast = await screen.findByText('Success');
        expect(successToast).toBeInTheDocument();

        // Radix Toast closes on Escape key when focused
        const toastRoot = screen.getByRole('status') || screen.getAllByRole('region')[0];
        await user.keyboard('{Escape}');

        await waitFor(() => {
            expect(screen.queryByText('Success')).not.toBeInTheDocument();
        });
    });
});
