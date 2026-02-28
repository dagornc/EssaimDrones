import { useState, useEffect, useRef, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { OutletContextType } from '../types/simulation';
import { Search, Trash2, ArrowDown } from 'lucide-react';

interface LogEntry {
    id: number;
    timestamp: Date;
    type: 'data' | 'connect' | 'disconnect' | 'mode_change';
    message: string;
}

const MAX_LOG_ENTRIES = 200;
let logIdCounter = 0;

export default function Logs() {
    const { t } = useTranslation();
    const { data, isConnected } = useOutletContext<OutletContextType>();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [searchFilter, setSearchFilter] = useState('');
    const [autoScroll, setAutoScroll] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const prevMode = useRef<string | null>(null);
    const prevConnected = useRef<boolean | null>(null);

    // Track connection state changes
    useEffect(() => {
        if (prevConnected.current === null) {
            prevConnected.current = isConnected;
            return;
        }
        if (isConnected !== prevConnected.current) {
            prevConnected.current = isConnected;
            const entry: LogEntry = {
                id: ++logIdCounter,
                timestamp: new Date(),
                type: isConnected ? 'connect' : 'disconnect',
                message: isConnected ? t('ws_connected') : t('ws_disconnected'),
            };
            setLogs(prev => [...prev.slice(-(MAX_LOG_ENTRIES - 1)), entry]);
        }
    }, [isConnected, t]);

    // Track mode changes
    useEffect(() => {
        if (!data) return;
        if (prevMode.current !== null && data.mode !== prevMode.current) {
            const entry: LogEntry = {
                id: ++logIdCounter,
                timestamp: new Date(),
                type: 'mode_change',
                message: `${t('mode_changed')}: ${prevMode.current} → ${data.mode}`,
            };
            setLogs(prev => [...prev.slice(-(MAX_LOG_ENTRIES - 1)), entry]);
        }
        prevMode.current = data.mode;
    }, [data, data?.mode, t]);

    // Track data events (every 2s max)
    const lastDataLog = useRef(0);
    useEffect(() => {
        if (!data) return;
        const now = Date.now();
        if (now - lastDataLog.current < 2000) return;
        lastDataLog.current = now;

        const entry: LogEntry = {
            id: ++logIdCounter,
            timestamp: new Date(),
            type: 'data',
            message: `[WS] drones=${data.drones.length} mode=${data.mode} cohesion=${data.metrics.cohesion?.toFixed(2)} alignment=${data.metrics.alignment?.toFixed(2)} safety=${data.metrics.safety}`,
        };
        setLogs(prev => [...prev.slice(-(MAX_LOG_ENTRIES - 1)), entry]);
    }, [data]);

    // Auto-scroll
    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, autoScroll]);

    const filtered = useMemo(() => {
        if (!searchFilter) return logs;
        const lower = searchFilter.toLowerCase();
        return logs.filter(l => l.message.toLowerCase().includes(lower) || l.type.includes(lower));
    }, [logs, searchFilter]);

    const typeColors: Record<LogEntry['type'], string> = {
        data: 'text-slate-400',
        connect: 'text-green-400',
        disconnect: 'text-red-400',
        mode_change: 'text-cyan-400',
    };

    const typeBadges: Record<LogEntry['type'], { bg: string; text: string }> = {
        data: { bg: 'bg-slate-500/10', text: 'text-slate-400' },
        connect: { bg: 'bg-green-500/10', text: 'text-green-400' },
        disconnect: { bg: 'bg-red-500/10', text: 'text-red-400' },
        mode_change: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
    };

    const formatTime = (d: Date) =>
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(d.getMilliseconds()).padStart(3, '0')}`;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-between shrink-0">
                <h1 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    {t('log_events')}
                    <span className="text-[10px] font-mono text-slate-500 ml-2">({filtered.length})</span>
                </h1>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={searchFilter}
                            onChange={e => setSearchFilter(e.target.value)}
                            placeholder={t('log_search_placeholder')}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-md pl-7 pr-2 py-1.5 text-slate-600 dark:text-slate-300 w-48 outline-none focus:ring-1 ring-cyan-500"
                            aria-label="Filter logs"
                        />
                    </div>

                    <button
                        onClick={() => setAutoScroll(!autoScroll)}
                        className={`p-1.5 rounded-md border text-xs font-bold transition-all ${autoScroll
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                            }`}
                        aria-label="Toggle auto-scroll"
                    >
                        <ArrowDown className="w-3 h-3" />
                    </button>

                    <button
                        onClick={() => setLogs([])}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-md border border-slate-200 dark:border-slate-700 transition-all"
                        aria-label="Clear logs"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Log entries */}
            <div ref={scrollRef} className="flex-1 overflow-auto p-1 font-mono text-xs bg-slate-950">
                {filtered.length === 0 && (
                    <div className="flex items-center justify-center h-full text-slate-600">
                        {logs.length === 0
                            ? t('empty_no_backend_desc')
                            : 'No matching entries'}
                    </div>
                )}
                <table className="w-full">
                    <tbody>
                        {filtered.map(entry => {
                            const badge = typeBadges[entry.type];
                            return (
                                <tr key={entry.id} className="hover:bg-slate-900/80 transition-colors group">
                                    <td className="py-0.5 px-2 text-slate-600 whitespace-nowrap select-all">{formatTime(entry.timestamp)}</td>
                                    <td className="py-0.5 px-1">
                                        <span className={`${badge.bg} ${badge.text} text-[9px] font-bold px-1.5 py-0.5 rounded uppercase`}>
                                            {entry.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className={`py-0.5 px-2 ${typeColors[entry.type]} break-all`}>{entry.message}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
