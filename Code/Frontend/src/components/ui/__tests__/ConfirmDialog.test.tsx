import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from '../ConfirmDialog';
import { describe, it, expect, vi } from 'vitest';

describe('ConfirmDialog', () => {
    it('does not render when open is false', () => {
        const { container } = render(
            <ConfirmDialog
                open={false}
                title="Test Title"
                message="Test Message"
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('renders correctly when open is true', () => {
        render(
            <ConfirmDialog
                open={true}
                title="Test Title"
                message="Test Message"
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        );
        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test Message')).toBeInTheDocument();
        expect(screen.getByText('confirm_cancel')).toBeInTheDocument();
        expect(screen.getByText('confirm_ok')).toBeInTheDocument();
    });

    it('uses custom labels when provided', () => {
        render(
            <ConfirmDialog
                open={true}
                title="Test"
                message="Msg"
                confirmLabel="Yes, do it"
                cancelLabel="No, wait"
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        );
        expect(screen.getByText('No, wait')).toBeInTheDocument();
        expect(screen.getByText('Yes, do it')).toBeInTheDocument();
    });

    it('calls onConfirm when confirm button is clicked', () => {
        const handleConfirm = vi.fn();
        render(
            <ConfirmDialog
                open={true}
                title="Test"
                message="Msg"
                onConfirm={handleConfirm}
                onCancel={vi.fn()}
            />
        );
        fireEvent.click(screen.getByText('confirm_ok'));
        expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when cancel button is clicked', () => {
        const handleCancel = vi.fn();
        render(
            <ConfirmDialog
                open={true}
                title="Test"
                message="Msg"
                onConfirm={vi.fn()}
                onCancel={handleCancel}
            />
        );
        fireEvent.click(screen.getByText('confirm_cancel'));
        expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('renders with danger variant', () => {
        const { container } = render(
            <ConfirmDialog
                open={true}
                title="Danger"
                message="Msg"
                variant="danger"
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        );
        expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
    });

    it('renders with warning variant', () => {
        const { container } = render(
            <ConfirmDialog
                open={true}
                title="Warning"
                message="Msg"
                variant="warning"
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        );
        expect(container.querySelector('.bg-orange-500')).toBeInTheDocument(); // For warning button style
    });
});
