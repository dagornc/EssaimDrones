import { useOutletContext } from 'react-router-dom';
import { ShieldAlert, Activity, GitCommitHorizontal, Focus } from 'lucide-react';
import type { OutletContextType } from '../types/simulation';
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/ui/Toast';
import { useMemo } from 'react';
import type { DronePosition } from '../types/simulation';

const MODES = [
    { id: 'PATROL', label: 'PATROL', color: 'bg-cyan-500' },
    { id: 'ATTACK', label: 'ATTACK', color: 'bg-red-500' },
    { id: 'DEFEND', label: 'DEFEND', color: 'bg-green-500' },
    { id: 'ENCIRCLE', label: 'ENCIRCLE', color: 'bg-orange-500' },
    { id: 'SHIELD', label: 'SHIELD', color: 'bg-purple-500' },
    { id: 'SEARCH', label: 'SEARCH', color: 'bg-yellow-500' },
    { id: 'FLASH_EXPANSION', label: 'FLASH EXPANSION', color: 'bg-pink-500' },
    { id: 'SCHOOLING', label: 'SCHOOLING', color: 'bg-teal-500' },
    { id: 'PREDATOR_PACK', label: 'PREDATOR PACK', color: 'bg-rose-500' },
    { id: 'EXPLORATION', label: 'EXPLORATION', color: 'bg-indigo-500' },
];

export default function Dashboard() {
    const { t } = useTranslation();
    const { data, metricsHistory, sendMessage } = useOutletContext<OutletContextType>();
    const { toast } = useToast();

    // Use real metrics history for chart data, fallback to current snapshot if history is short
    // Moved above early return to respect React Rules of Hooks
    const chartData = useMemo(() => {
        if (!data || !data.metrics) return [];
        if (metricsHistory.length >= 2) {
            return metricsHistory.map((m, i) => ({
                name: String(i),
                cohesion: m.cohesion,
                alignment: m.alignment,
            }));
        }
        // Minimal fallback
        return [
            { name: '0', cohesion: data.metrics.cohesion, alignment: data.metrics.alignment },
        ];
    }, [data, metricsHistory]);

    if (!data) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <div className="flex flex-col items-center gap-4 text-slate-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                    <p>{t('empty_no_backend_desc')}</p>
                </div>
            </div>
        );
    }

    const activeDrones = data.drones?.length || 0;

    const handleModeSwitch = (modeId: string) => {
        sendMessage(JSON.stringify({ mode: modeId }));
        toast({
            title: t('mode_changed'),
            description: `→ ${modeId}`,
            variant: 'info',
        });
    };

    return (
        <div className="p-6 max-h-full overflow-auto space-y-6">

            {/* Top row: KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Active Drones */}
                <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('active_drones')}</h3>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-light text-slate-900 dark:text-white">{activeDrones}<span className="text-lg text-slate-500">/30</span></span>
                        <span className="text-cyan-500 text-sm font-bold tracking-wide">{t('stable')}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 mt-4 rounded-full overflow-hidden">
                        <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${(activeDrones / 30) * 100}%` }}></div>
                    </div>
                </div>

                {/* Current Mode */}
                <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]"></div>
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 pl-2">{t('current_mode')}</h3>
                    <div className="flex items-center justify-between pl-2">
                        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{data.mode}</span>
                        <ShieldAlert className="text-cyan-500 w-6 h-6 opacity-80" />
                    </div>
                </div>

                {/* Cohesion Index */}
                <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('cohesion_index')}</h3>
                    <div className="flex items-center justify-between">
                        <span className="text-4xl font-light text-slate-900 dark:text-white font-mono">{data.metrics.cohesion?.toFixed(2) || '0.00'}</span>
                        <div className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-cyan-500 transform -rotate-45"></div>
                    </div>
                </div>

                {/* Safety Violations */}
                <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('safety_violations')}</h3>
                    <div className="flex items-center justify-between">
                        <span className="text-4xl font-light text-slate-900 dark:text-white">{data.metrics.safety || 0}</span>
                        <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 2D Mini Viewport (60%) */}
                <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-1 relative overflow-hidden shadow-lg h-[400px]">
                    {/* Grid Background */}
                    <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)', backgroundSize: '4% 4%' }}></div>

                    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 preserve-3d">
                        {/* Radar Rings */}
                        <circle cx="50" cy="50" r="20" className="stroke-slate-700/50 fill-none" strokeWidth="0.5" strokeDasharray="2,2" />
                        <circle cx="50" cy="50" r="40" className="stroke-slate-700/50 fill-none" strokeWidth="0.5" strokeDasharray="2,2" />
                        <circle cx="50" cy="50" r="1.5" className="fill-cyan-500/20" />

                        {/* Drones */}
                        {data.drones.map((d: DronePosition, i: number) => (
                            <circle key={`d-${i}`} cx={d[0]} cy={d[1]} r={1} className="fill-cyan-500 transition-all duration-300 shadow-[0_0_8px_cyan]" />
                        ))}

                        {/* Targets */}
                        {data.targets && data.targets.map((tgt: DronePosition, i: number) => (
                            <g key={`t-${i}`} transform={`translate(${tgt[0]}, ${tgt[1]})`}>
                                <line x1="-1.5" y1="-1.5" x2="1.5" y2="1.5" className="stroke-red-500" strokeWidth="0.6" />
                                <line x1="1.5" y1="-1.5" x2="-1.5" y2="1.5" className="stroke-red-500" strokeWidth="0.6" />
                            </g>
                        ))}

                        {/* Friends */}
                        {data.friends && data.friends.map((f: DronePosition, i: number) => (
                            <polygon key={`f-${i}`} points={`${f[0]},${f[1] - 1.5} ${f[0] - 1.5},${f[1] + 1.5} ${f[0] + 1.5},${f[1] + 1.5}`} className="fill-green-500" />
                        ))}
                    </svg>

                    <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded bg-black/50 px-3 py-1.5 flex gap-4 text-[10px] font-mono text-slate-400">
                        <span>DEPTH: 50.0M</span>
                        <span>POV: TOP-DOWN</span>
                    </div>
                </div>

                {/* Swarm Modes (40%) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-100 tracking-wide">{t('swarm_modes')}</h3>
                        <Activity className="w-4 h-4 text-cyan-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 flex-1">
                        {MODES.map(m => {
                            const isActive = data.mode === m.id;
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => handleModeSwitch(m.id)}
                                    className={`relative text-[11px] font-bold tracking-wider rounded-lg border flex items-center justify-center transition-all overflow-hidden hover:scale-[1.02] active:scale-[0.98] ${isActive
                                        ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                                        : 'bg-transparent border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                                        }`}
                                >
                                    {isActive && (
                                        <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
                                            <div className="absolute top-0 right-0 w-0 h-0 border-t-[16px] border-r-[16px] border-t-cyan-500 border-r-cyan-500 border-b-transparent border-b-[16px] border-l-transparent border-l-[16px]"></div>
                                        </div>
                                    )}
                                    {m.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Performance Metrics Chart */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-100 tracking-wide">{t('performance_metrics')}</h3>
                        <div className="flex items-center gap-4 text-[10px] font-bold tracking-wider">
                            <span className="flex items-center gap-1.5 text-cyan-400"><div className="w-2 h-2 rounded-full bg-cyan-400"></div> COHESION</span>
                            <span className="flex items-center gap-1.5 text-green-400"><div className="w-2 h-2 rounded-full bg-green-400"></div> ALIGNMENT</span>
                        </div>
                    </div>

                    <div className="h-48" style={{ minWidth: 200, minHeight: 100 }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={100}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="name" hide />
                                <YAxis hide />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                                    itemStyle={{ color: '#94a3b8' }}
                                />
                                <Line type="monotone" dataKey="cohesion" stroke="#06b6d4" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="alignment" stroke="#4ade80" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Safety Monitor */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col">
                    <h3 className="font-bold text-slate-100 tracking-wide mb-6">{t('safety_monitor')}</h3>

                    <div className="flex flex-col gap-4 flex-1">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <Focus className="w-4 h-4 text-cyan-500" />
                                <span className="text-sm font-semibold text-slate-300">{t('geofence')}</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">{t('secure')}</span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <GitCommitHorizontal className="w-4 h-4 text-cyan-500" />
                                <span className="text-sm font-semibold text-slate-300">{t('collisions')}</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">{t('clear')}</span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <ShieldAlert className="w-4 h-4 text-cyan-500" />
                                <span className="text-sm font-semibold text-slate-300">{t('out_of_bounds')}</span>
                            </div>
                            <span className="text-sm font-bold text-slate-300 font-mono">0</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
