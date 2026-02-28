import { render, screen, waitFor } from '@testing-library/react';
import LLMSelector from '../LLMSelector';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import React from 'react';

describe('LLMSelector', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                providers: [
                    {
                        name: 'local',
                        display_name: 'Local',
                        base_url: 'http://localhost',
                        icon: 'server',
                        description: 'Local provider',
                        recommended: false,
                        default_model: 'llama',
                        models: ['llama', 'mistral'],
                        is_custom: false
                    },
                    {
                        name: 'custom_prov',
                        display_name: 'Custom',
                        base_url: 'http://custom',
                        icon: 'globe',
                        description: 'Custom provider',
                        recommended: true,
                        default_model: 'gpt',
                        models: ['gpt', 'gpt-free'],
                        is_custom: true
                    }
                ],
                active_provider: 'local',
                active_model: 'llama'
            })
        });

        // Mock confirm
        window.confirm = vi.fn().mockReturnValue(true);
    });

    it('renders providers after fetch', async () => {
        render(<LLMSelector />);

        expect(screen.getByText('llm_selector_title')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Local')).toBeInTheDocument();
            expect(screen.getByText('Custom')).toBeInTheDocument();
        });

        // Active model display
        expect(screen.getAllByText('llama')[0]).toBeInTheDocument();
    });

    it('expands provider and shows models', async () => {
        const user = userEvent.setup();
        render(<LLMSelector />);
        await waitFor(() => expect(screen.getByText('Local')).toBeInTheDocument());

        // Click on provider card
        const localProviderBtn = screen.getByText('Local').closest('div[role="button"]');
        await user.click(localProviderBtn!);

        // Models should be visible
        await waitFor(() => {
            expect(screen.getByText('mistral')).toBeInTheDocument();
        });
    });

    it('switches model', async () => {
        const user = userEvent.setup();
        const fetchSpy = vi.spyOn(global, 'fetch');
        fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ // load providers
                providers: [{ name: 'local', display_name: 'Local', models: ['test1', 'test2'], default_model: 'test1' }],
                active_provider: 'local',
                active_model: 'test1'
            })
        });

        render(<LLMSelector />);
        await waitFor(() => expect(screen.getByText('Local')).toBeInTheDocument());

        await user.click(screen.getByText('Local').closest('div[role="button"]')!);
        await waitFor(() => expect(screen.getByText('test2')).toBeInTheDocument());

        fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ status: 'ok', provider: 'local', model: 'test2' })
        });

        await user.click(screen.getByText('test2'));

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledWith('http://localhost:8000/api/models/switch', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ provider: 'local', model: 'test2' })
            }));
        });
    });

    it('filters models (free only and text search)', async () => {
        const user = userEvent.setup();
        render(<LLMSelector />);
        await waitFor(() => expect(screen.getByText('Custom')).toBeInTheDocument());

        await user.click(screen.getByText('Custom').closest('div[role="button"]')!);
        await waitFor(() => expect(screen.getByText('gpt-free')).toBeInTheDocument());

        const freeCheckbox = screen.getByLabelText('llm_free_only');
        await user.click(freeCheckbox);

        // gpt should be hidden, gpt-free should remain
        expect(screen.getByText('gpt-free')).toBeInTheDocument();
        expect(screen.queryByText('gpt')).not.toBeInTheDocument();

        await user.click(freeCheckbox); // uncheck

        const searchInput = screen.getByPlaceholderText('llm_search_models');
        await user.type(searchInput, 'xyz');

        expect(screen.getByText('llm_no_models')).toBeInTheDocument();
        expect(screen.queryByText('gpt')).not.toBeInTheDocument();
    });

    it('handles test connection', async () => {
        const user = userEvent.setup();
        render(<LLMSelector />);
        await waitFor(() => expect(screen.getByText('Local')).toBeInTheDocument());

        await user.click(screen.getByText('Local').closest('div[role="button"]')!);

        const fetchSpy = vi.spyOn(global, 'fetch');
        fetchSpy.mockResolvedValueOnce({ // test endpoint
            ok: true,
            json: async () => ({ success: true, message: 'Test OK', response_time_ms: 100 })
        });

        const testBtn = screen.getByText('llm_test_connection');
        await user.click(testBtn);

        await waitFor(() => {
            expect(screen.getByText('Test OK')).toBeInTheDocument();
        });
    });

    it('handles fetching dynamic models', async () => {
        const user = userEvent.setup();
        render(<LLMSelector />);
        await waitFor(() => expect(screen.getByText('Local')).toBeInTheDocument());

        await user.click(screen.getByText('Local').closest('div[role="button"]')!);

        const fetchSpy = vi.spyOn(global, 'fetch');
        fetchSpy.mockResolvedValueOnce({ // fetch models endpoint
            ok: true,
            json: async () => (['dynamic-model'])
        });

        // The refresh button uses title="llm_refresh_models" or similar, maybe aria-label
        // Or find by role button, title
        const refreshBtn = screen.getByTitle('llm_refresh_models');
        await user.click(refreshBtn);

        await waitFor(() => {
            expect(screen.getByText('dynamic-model')).toBeInTheDocument();
        });
    });

    it('adds custom provider', async () => {
        const user = userEvent.setup();
        render(<LLMSelector />);
        await waitFor(() => expect(screen.getByText('Local')).toBeInTheDocument());

        const addBtn = screen.getByText('llm_add_custom');
        await user.click(addBtn);

        const nameInput = screen.getByPlaceholderText('ID Name (e.g. my_server)');
        await user.type(nameInput, 'new_prov');

        const urlInput = screen.getByPlaceholderText('Base URL (e.g. http://localhost:11434/v1)');
        await user.type(urlInput, 'http://new');

        const fetchSpy = vi.spyOn(global, 'fetch');
        fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({}) }); // save custom
        fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ providers: [], active_model: '', active_provider: '' }) }); // reload

        const saveBtn = screen.getByText('save');
        await user.click(saveBtn);

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledWith('http://localhost:8000/api/models/custom', expect.objectContaining({
                method: 'POST'
            }));
        });
    });

    it('deletes custom provider', async () => {
        const user = userEvent.setup();
        render(<LLMSelector />);
        await waitFor(() => expect(screen.getByText('Custom')).toBeInTheDocument());

        const fetchSpy = vi.spyOn(global, 'fetch');
        fetchSpy.mockResolvedValueOnce({ ok: true }); // delete
        fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ providers: [], active_model: '', active_provider: '' }) }); // reload

        const deleteBtns = screen.getAllByRole('button').filter(b => b.title === 'llm_delete_provider');
        await user.click(deleteBtns[0]);

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledWith('http://localhost:8000/api/models/custom/custom_prov', expect.objectContaining({
                method: 'DELETE'
            }));
        });
    });
});
