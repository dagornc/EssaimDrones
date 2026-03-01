/**
 * LLMSelector — Provider & model selection component for AquaSwarm.
 *
 * Inspired by the DagBot SettingsPanel pattern:
 * - Lists providers with cards
 * - Expandable model list with search/filter
 * - Test connection button
 * - Hot-swap active model via backend API
 */
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Globe, Server, ChevronDown, ChevronUp,
    Search, RefreshCw, Loader2, CheckCircle2,
    XCircle, Zap, Cpu, Plus, Trash2, Save
} from 'lucide-react';

interface ProviderInfo {
    name: string;
    display_name: string;
    base_url: string;
    icon: string;
    description: string;
    recommended: boolean;
    default_model: string;
    models: string[];
    is_custom?: boolean;
    api_key?: string;
}

interface ModelsResponse {
    providers: ProviderInfo[];
    active_provider: string;
    active_model: string;
}

interface TestResult {
    success: boolean;
    message: string;
    response_time_ms?: number;
}

const ICON_MAP: Record<string, React.ReactNode> = {
    globe: <Globe className="w-5 h-5" />,
    server: <Server className="w-5 h-5" />,
    settings: <Cpu className="w-5 h-5" />,
};

const API_BASE = 'http://localhost:8000';

export default function LLMSelector() {
    const { t } = useTranslation();

    const [providers, setProviders] = useState<ProviderInfo[]>([]);
    const [activeProvider, setActiveProvider] = useState('');
    const [activeModel, setActiveModel] = useState('');
    const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
    const [modelSearch, setModelSearch] = useState('');
    const [freeOnly, setFreeOnly] = useState(false);
    const [testing, setTesting] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
    const [switching, setSwitching] = useState(false);
    const [dynamicModels, setDynamicModels] = useState<Record<string, string[]>>({});
    const [fetchingModels, setFetchingModels] = useState<string | null>(null);

    // Custom provider state
    const [showAddForm, setShowAddForm] = useState(false);
    const [savingProvider, setSavingProvider] = useState(false);
    const [newProvider, setNewProvider] = useState({
        name: '',
        display_name: '',
        base_url: '',
        api_key: '',
        default_model: '',
    });

    // Fetch providers on mount
    const loadProviders = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/models`);
            if (res.ok) {
                const data: ModelsResponse = await res.json();
                setProviders(data.providers);
                setActiveProvider(data.active_provider);
                setActiveModel(data.active_model);
            }
        } catch (err) {
            console.error('Failed to load providers:', err);
        }
    }, []);

    useEffect(() => {
        loadProviders();
    }, [loadProviders]);

    // Switch model
    const handleSwitchModel = async (providerName: string, model: string) => {
        setSwitching(true);
        try {
            const res = await fetch(`${API_BASE}/api/models/switch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: providerName, model }),
            });
            const data = await res.json();
            if (data.status === 'ok') {
                setActiveProvider(data.provider);
                setActiveModel(data.model);
            }
        } catch (err) {
            console.error('Switch failed:', err);
        } finally {
            setSwitching(false);
        }
    };

    // Test connection
    const handleTest = async (providerName: string) => {
        setTesting(providerName);
        try {
            const res = await fetch(`${API_BASE}/api/models/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: providerName }),
            });
            const data: TestResult = await res.json();
            setTestResults(prev => ({ ...prev, [providerName]: data }));
        } catch {
            setTestResults(prev => ({
                ...prev,
                [providerName]: { success: false, message: 'Network error' },
            }));
        } finally {
            setTesting(null);
        }
    };

    // Fetch models dynamically
    const handleRefreshModels = async (providerName: string) => {
        setFetchingModels(providerName);
        try {
            const res = await fetch(`${API_BASE}/api/models/${providerName}/fetch`);
            if (res.ok) {
                const models: string[] = await res.json();
                setDynamicModels(prev => ({ ...prev, [providerName]: models }));
            }
        } catch (err) {
            console.error('Failed to fetch models:', err);
        } finally {
            setFetchingModels(null);
        }
    };

    // Save custom provider
    const handleSaveCustom = async () => {
        if (!newProvider.name || !newProvider.base_url) return;
        setSavingProvider(true);
        try {
            const res = await fetch(`${API_BASE}/api/models/custom`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newProvider.name.toLowerCase().replace(/\s+/g, '_'),
                    display_name: newProvider.display_name || newProvider.name,
                    base_url: newProvider.base_url,
                    api_key: newProvider.api_key,
                    default_model: newProvider.default_model,
                }),
            });
            if (res.ok) {
                setShowAddForm(false);
                setNewProvider({ name: '', display_name: '', base_url: '', api_key: '', default_model: '' });
                loadProviders();
            }
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setSavingProvider(false);
        }
    };

    // Delete custom provider
    const handleDeleteCustom = async (name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm(t('llm_confirm_delete') || 'Delete this provider?')) return;
        try {
            const res = await fetch(`${API_BASE}/api/models/custom/${name}`, { method: 'DELETE' });
            if (res.ok) {
                if (activeProvider === name) setActiveProvider('');
                loadProviders();
            }
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/20">
                    <Cpu className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {t('llm_selector_title')}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t('llm_selector_subtitle')}
                    </p>
                </div>
            </div>

            {/* Active Model Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/5 via-indigo-500/5 to-purple-500/5 p-4">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Zap className="w-5 h-5 text-cyan-400" />
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                                {t('llm_active_model')}
                            </p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                                {activeModel || '—'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {t('llm_provider')}
                        </p>
                        <p className="text-sm font-semibold text-cyan-500 capitalize">
                            {activeProvider}
                        </p>
                    </div>
                </div>
            </div>

            {/* Provider Cards */}
            <div className="space-y-3">
                {providers.map(provider => {
                    const isActive = activeProvider === provider.name;
                    const isExpanded = expandedProvider === provider.name;
                    const testResult = testResults[provider.name];

                    // Merge static + dynamic models
                    const baseModels = provider.models || [];
                    const dynModels = dynamicModels[provider.name] || [];
                    const allModels = Array.from(new Set([...baseModels, ...dynModels]));

                    // Filter
                    let filteredModels = allModels;
                    if (freeOnly) {
                        filteredModels = filteredModels.filter(m =>
                            m.toLowerCase().includes('free') || m.toLowerCase().endsWith(':free')
                        );
                    }
                    if (modelSearch) {
                        const q = modelSearch.toLowerCase();
                        filteredModels = filteredModels.filter(m => m.toLowerCase().includes(q));
                    }

                    return (
                        <div
                            key={provider.name}
                            className={`rounded-2xl border transition-all duration-300 overflow-hidden ${isActive
                                ? 'border-cyan-500/40 bg-cyan-500/5 shadow-lg shadow-cyan-500/5'
                                : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700'
                                }`}
                        >
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => setExpandedProvider(isExpanded ? null : provider.name)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpandedProvider(isExpanded ? null : provider.name) }}
                                className="w-full flex items-center justify-between p-4 text-left group cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl transition-colors ${isActive
                                        ? 'bg-cyan-500/10 text-cyan-500'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                                        }`}>
                                        {ICON_MAP[provider.icon] || <Cpu className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-900 dark:text-white text-sm">
                                                {provider.display_name}
                                            </span>
                                            {provider.recommended && (
                                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                                                    {t('llm_recommended')}
                                                </span>
                                            )}
                                            {isActive && (
                                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-500 border border-green-500/20 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                    {t('llm_active')}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            {provider.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {provider.is_custom && (
                                        <button
                                            onClick={(e) => handleDeleteCustom(provider.name, e)}
                                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                            title={t('llm_delete_provider') || 'Delete Provider'}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    {testResult && (
                                        testResult.success
                                            ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            : <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                    {isExpanded
                                        ? <ChevronUp className="w-4 h-4 text-slate-400" />
                                        : <ChevronDown className="w-4 h-4 text-slate-400" />
                                    }
                                </div>
                            </div>

                            {/* Expanded Section */}
                            {isExpanded && (
                                <div className="px-4 pb-4 space-y-4 animate-[fadeIn_0.2s_ease-in-out]">
                                    {/* Divider */}
                                    <div className="h-px bg-slate-200 dark:bg-slate-800" />

                                    {/* Model Search + Filters */}
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder={t('llm_search_models')}
                                                value={modelSearch}
                                                onChange={(e) => setModelSearch(e.target.value)}
                                                className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 ring-cyan-500/30 transition-all"
                                            />
                                        </div>

                                        <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={freeOnly}
                                                onChange={(e) => setFreeOnly(e.target.checked)}
                                                className="rounded border-slate-300 dark:border-slate-600 text-cyan-500 focus:ring-cyan-500/30"
                                            />
                                            {t('llm_free_only')}
                                        </label>

                                        <button
                                            onClick={() => handleRefreshModels(provider.name)}
                                            disabled={fetchingModels === provider.name}
                                            className={`p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${fetchingModels === provider.name ? 'animate-spin opacity-50' : 'opacity-70 hover:opacity-100'
                                                }`}
                                            title={t('llm_refresh_models')}
                                        >
                                            <RefreshCw className="w-4 h-4 text-slate-500" />
                                        </button>
                                    </div>

                                    {/* Model List */}
                                    <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-1.5 space-y-1">
                                        {filteredModels.length === 0 ? (
                                            <p className="text-xs text-slate-400 text-center py-4">
                                                {t('llm_no_models')}
                                            </p>
                                        ) : (
                                            filteredModels.map(model => {
                                                const isModelActive = isActive && activeModel === model;
                                                return (
                                                    <button
                                                        key={model}
                                                        onClick={() => handleSwitchModel(provider.name, model)}
                                                        disabled={switching}
                                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-mono transition-all duration-200 flex items-center justify-between group ${isModelActive
                                                            ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/20'
                                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                                                            }`}
                                                    >
                                                        <span className="truncate">{model}</span>
                                                        {isModelActive && (
                                                            <span className="flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-wider">
                                                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                                                ACTIVE
                                                            </span>
                                                        )}
                                                        {!isModelActive && (
                                                            <span className="opacity-0 group-hover:opacity-100 text-[10px] font-sans text-cyan-500 transition-opacity">
                                                                {t('llm_select')}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {!isActive && (
                                            <button
                                                onClick={() => handleSwitchModel(provider.name, provider.default_model)}
                                                disabled={switching}
                                                className="px-4 py-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-semibold hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
                                            >
                                                {t('llm_use_provider')}
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleTest(provider.name)}
                                            disabled={testing === provider.name}
                                            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {testing === provider.name && <Loader2 className="w-3 h-3 animate-spin" />}
                                            {t('llm_test_connection')}
                                        </button>
                                    </div>

                                    {/* Test Result */}
                                    {testResult && (
                                        <div className={`rounded-xl p-3 text-xs flex items-start gap-2 ${testResult.success
                                            ? 'bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300'
                                            : 'bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300'
                                            }`}>
                                            {testResult.success
                                                ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                                : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                            }
                                            <div>
                                                <p className="font-medium">{testResult.message}</p>
                                                {testResult.response_time_ms && (
                                                    <p className="text-[10px] opacity-70 mt-0.5">
                                                        {testResult.response_time_ms}ms
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div >

            {/* Add Custom Provider Button & Form */}
            < div className="pt-2 border-t border-slate-200 dark:border-slate-800" >
                {!showAddForm ? (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="w-full py-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-500 dark:text-slate-400 hover:border-cyan-500 hover:text-cyan-500 hover:bg-cyan-500/5 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        {t('llm_add_custom') || 'Add Custom Provider'}
                    </button>
                ) : (
                    <div className="p-4 rounded-2xl border border-cyan-500/30 bg-white/50 dark:bg-slate-900/50 space-y-4 animate-[fadeIn_0.2s_ease-in-out]">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Server className="w-4 h-4 text-cyan-500" />
                                {t('llm_new_provider') || 'New Custom Provider'}
                            </h3>
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="ID Name (e.g. my_server)"
                                value={newProvider.name}
                                onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                                className="px-3 py-2 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 ring-cyan-500/30 w-full"
                            />
                            <input
                                type="text"
                                placeholder="Display Name (e.g. My Server)"
                                value={newProvider.display_name}
                                onChange={(e) => setNewProvider({ ...newProvider, display_name: e.target.value })}
                                className="px-3 py-2 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 ring-cyan-500/30 w-full"
                            />
                            <input
                                type="text"
                                placeholder="Base URL (e.g. http://localhost:11434/v1)"
                                value={newProvider.base_url}
                                onChange={(e) => setNewProvider({ ...newProvider, base_url: e.target.value })}
                                className="px-3 py-2 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 ring-cyan-500/30 w-full md:col-span-2"
                            />
                            <input
                                type="password"
                                placeholder="API Key (Optional)"
                                value={newProvider.api_key}
                                onChange={(e) => setNewProvider({ ...newProvider, api_key: e.target.value })}
                                className="px-3 py-2 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 ring-cyan-500/30 w-full"
                            />
                            <input
                                type="text"
                                placeholder="Default Model ID"
                                value={newProvider.default_model}
                                onChange={(e) => setNewProvider({ ...newProvider, default_model: e.target.value })}
                                className="px-3 py-2 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 ring-cyan-500/30 w-full"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleSaveCustom}
                                disabled={savingProvider || !newProvider.name || !newProvider.base_url}
                                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                            >
                                {savingProvider ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                {t('save')}
                            </button>
                        </div>
                    </div>
                )}
            </div >
        </div >
    );
}
