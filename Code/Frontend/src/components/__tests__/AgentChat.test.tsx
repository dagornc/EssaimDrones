import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AgentChat from '../AgentChat';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock scrollTo since JSDOM doesn't implement it
Element.prototype.scrollTo = vi.fn();

describe('AgentChat Component', () => {
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it('returns null if not open', () => {
        const { container } = render(<AgentChat open={false} onClose={mockOnClose} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders correctly when open', () => {
        render(<AgentChat open={true} onClose={mockOnClose} />);
        expect(screen.getByText('agent_orchestrator')).toBeInTheDocument();
        expect(screen.getByText('agent_welcome')).toBeInTheDocument(); // from mock translation
    });

    it('calls onClose when close button is clicked', async () => {
        const user = userEvent.setup();
        render(<AgentChat open={true} onClose={mockOnClose} />);

        await user.click(screen.getByLabelText('Close chat'));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('sends message and handles success response', async () => {
        const user = userEvent.setup();
        (global.fetch as any).mockResolvedValueOnce({
            json: async () => ({ response: 'Assistant reply' })
        });

        render(<AgentChat open={true} onClose={mockOnClose} />);

        const input = screen.getByPlaceholderText('agent_input_placeholder');
        await user.type(input, 'Hello agent');

        const submitBtn = screen.getByLabelText('Send message');
        await user.click(submitBtn);

        expect(screen.getByText('Hello agent')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Assistant reply')).toBeInTheDocument();
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ message: 'Hello agent' })
        }));
    });

    it('handles api error response (data.error)', async () => {
        const user = userEvent.setup();
        (global.fetch as any).mockResolvedValueOnce({
            json: async () => ({ error: 'API Error' })
        });

        render(<AgentChat open={true} onClose={mockOnClose} />);

        const input = screen.getByPlaceholderText('agent_input_placeholder');
        await user.type(input, 'Test error');
        await user.click(screen.getByLabelText('Send message'));

        await waitFor(() => {
            expect(screen.getByText('⚠ API Error')).toBeInTheDocument();
        });
    });

    it('handles network error (fetch throws)', async () => {
        const user = userEvent.setup();
        (global.fetch as any).mockRejectedValueOnce(new Error('Network failure'));

        render(<AgentChat open={true} onClose={mockOnClose} />);

        const input = screen.getByPlaceholderText('agent_input_placeholder');
        await user.type(input, 'Test fail');
        await user.click(screen.getByLabelText('Send message'));

        await waitFor(() => {
            expect(screen.getByText('⚠ chat_error')).toBeInTheDocument();
        });
    });

    it('does not send empty message', async () => {
        const user = userEvent.setup();
        render(<AgentChat open={true} onClose={mockOnClose} />);

        // Form submit directly since button is disabled
        fireEvent.submit(screen.getByRole('textbox').closest('form')!);

        expect(global.fetch).not.toHaveBeenCalled();
    });
});
