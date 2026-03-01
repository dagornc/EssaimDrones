import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Cpu, Send, Loader2 } from 'lucide-react';

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface AgentChatProps {
    open: boolean;
    onClose: () => void;
}

export default function AgentChat({ open, onClose }: AgentChatProps) {
    const { t } = useTranslation();
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: t('agent_welcome') },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMsg: ChatMessage = { role: 'user', content: trimmed };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: trimmed }),
            });
            const data = await res.json();

            if (data.error) {
                setMessages(prev => [...prev, { role: 'system', content: `⚠ ${data.error}` }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
            }
        } catch {
            setMessages(prev => [...prev, { role: 'system', content: `⚠ ${t('chat_error')}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-30 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <Cpu className="w-5 h-5" />
                    <span className="font-semibold text-sm">{t('agent_orchestrator', 'Agent Orchestrateur')}</span>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-900 dark:hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md p-1"
                    aria-label="Close chat"
                >
                    ✕
                </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 p-4 overflow-auto bg-slate-50 dark:bg-slate-950/50 space-y-3">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`text-sm p-3 rounded-lg max-w-[90%] whitespace-pre-wrap ${msg.role === 'user'
                            ? 'ml-auto bg-cyan-500/10 text-cyan-900 dark:text-cyan-100 border border-cyan-500/20'
                            : msg.role === 'system'
                                ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                                : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100'
                            }`}
                    >
                        {msg.content}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 p-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {t('chat_sending')}
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={t('agent_input_placeholder')}
                    disabled={isLoading}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 text-sm px-3 py-2 rounded-md outline-none focus-visible:ring-2 ring-indigo-500 text-slate-900 dark:text-slate-100 disabled:opacity-50"
                    aria-label="Agent chat input"
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="p-2 text-indigo-500 hover:text-indigo-400 disabled:opacity-30 transition-all"
                    aria-label="Send message"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}
