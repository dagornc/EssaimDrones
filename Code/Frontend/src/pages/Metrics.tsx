import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { OutletContextType } from '../types/simulation';
import { useTranslation } from 'react-i18next';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, BarChart, Bar, LineChart, Line, Cell
} from 'recharts';
import { Download, Search, ArrowUp, ArrowDown } from 'lucide-react';
import type { DronePosition } from '../types/simulation';

const MODES_TIMELINE = [
    { name: 'PATROL', color: '#06b6d4' },
    { name: 'ATTACK', color: '#ef4444' },
    { name: 'DEFEND', color: '#22c55e' },
    { name: 'ENCIRCLE', color: '#f97316' },
    { name: 'SHIELD', color: '#a855f7' },
    { name: 'SEARCH', color: '#eab308' },
    { name: 'FLASH EXP', color: '#ec4899' },
    { name: 'SCHOOLING', color: '#14b8a6' },
    { name: 'PRED. PACK', color: '#e11d48' },
    { name: 'EXPLORATION', color: '#6366f1' },
];

/* ── Spatial Heatmap (Canvas) ──────────────────────────────── */
function SpatialHeatmap({ drones }: { drones: DronePosition[] }) {
    const canvasRef = useMemo(() => {
        // Generate heatmap data
        const grid = Array.from({ length: 20 }, () => Array(20).fill(0));
        drones.forEach(d => {
            if (!d || d.length < 2 || typeof d[0] !== 'number' || typeof d[1] !== 'number') return;
            const gx = Math.min(19, Math.max(0, Math.floor(d[0] / 5)));
            const gy = Math.min(19, Math.max(0, Math.floor(d[1] / 5)));
            grid[gy][gx] += 1;
        });
        return grid;
    }, [drones]);

    const maxVal = Math.max(1, ...canvasRef.flat());

    return (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(20, 1fr)', gap: '1px' }}>
            {canvasRef.flatMap((row, y) =>
                row.map((val: number, x: number) => {
                    const intensity = val / maxVal;
                    const hue = 180 + intensity * 40; // dark blue to cyan
                    const lightness = 10 + intensity * 50;
                    return (
                        <div
                            key={`${y}-${x}`}
                            className="aspect-square rounded-sm"
                            style={{ backgroundColor: `hsl(${hue}, 70%, ${lightness}%)` }}
                            title={`(${x * 5}-${(x + 1) * 5}, ${y * 5}-${(y + 1) * 5}): ${val} drones`}
                        />
                    );
                })
            )}
        </div>
    );
}

/* ── Metrics Page ────────────────────────────────────────────── */
export default function Metrics() {
    const { t } = useTranslation();
    const { data, metricsHistory } = useOutletContext<OutletContextType>();
    const [searchFilter, setSearchFilter] = useState('');
    const [sortField, setSortField] = useState<'id' | 'speed'>('id');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const safeData = useMemo(() => data || {
        mode: 'OFFLINE',
        drones: [],
        targets: [],
        friends: [],
        metrics: { cohesion: 0, alignment: 0, safety: 0 }
    }, [data]);

    // Use real metrics history for cohesion chart
    const cohesionData = useMemo(() => {
        return metricsHistory.map((m, i) => ({ step: i * 10, value: m.cohesion || 0 }));
    }, [metricsHistory]);

    // Use real metrics history for alignment chart
    const alignmentData = useMemo(() => {
        return metricsHistory.map((m, i) => ({ step: i * 10, value: m.alignment || 0 }));
    }, [metricsHistory]);

    // Safety violations over recent history
    const violationsData = useMemo(() => {
        const recent = metricsHistory.slice(-8);
        return recent.map((m, i) => ({
            interval: `t-${(recent.length - i) * 10}`,
            value: m.safety || 0,
        }));
    }, [metricsHistory]);

    // Velocity distribution — no random
    const velocityBins = useMemo(() => {
        return Array.from({ length: 10 }, (_, i) => {
            const binStart = i * 1.25;
            const binEnd = binStart + 1.25;
            const count = safeData.drones.filter(d => {
                if (!d || d.length < 2) return false;
                const speed = Math.sqrt(((d[0] as number) - 50) ** 2 + ((d[1] as number) - 50) ** 2) / 10;
                return speed >= binStart && speed < binEnd;
            }).length;
            return { bin: `${binStart.toFixed(1)}`, count };
        });
    }, [safeData]);

    if (!safeData.metrics || !safeData.drones) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    // Drone telemetry table data
    const telemetryData = safeData.drones.map((d, i) => {
        const x = typeof d[0] === 'number' ? d[0] : 0;
        const y = typeof d[1] === 'number' ? d[1] : 0;
        const z = typeof d[2] === 'number' ? d[2] : 50;
        const speed = Math.sqrt((x - 50) ** 2 + (y - 50) ** 2) / 8;
        return {
            id: `AS-${String(i + 1).padStart(3, '0')}`,
            x: x.toFixed(1),
            y: y.toFixed(1),
            z: z.toFixed(1),
            speed: speed.toFixed(1),
            active: (d as any).active ?? true,
        };
    });

    const filtered = telemetryData
        .filter(d => d.id.toLowerCase().includes(searchFilter.toLowerCase()))
        .sort((a, b) => {
            if (sortField === 'id') return sortDir === 'asc' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
            return sortDir === 'asc' ? Number(a.speed) - Number(b.speed) : Number(b.speed) - Number(a.speed);
        });

    const toggleSort = (field: 'id' | 'speed') => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    const renderSortIcon = (field: 'id' | 'speed') => (
        sortField === field
            ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3 inline" /> : <ArrowDown className="w-3 h-3 inline" />)
            : <span className="text-slate-600 text-[10px]">▲▼</span>
    );

    const exportCsv = () => {
        const header = 'DroneID,X,Y,Z,Speed,Status\n';
        const rows = telemetryData.map(d => `${d.id},${d.x},${d.y},${d.z},${d.speed},${d.active ? 'Active' : 'Inactive'}`).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'drone_telemetry.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const chartTooltipStyle = { backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' };

    return (
        <div className="p-6 max-h-full overflow-auto space-y-6">

            {/* Row 1: 3 main metric charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Cohesion Over Time */}
                <div className="glass-card-dark p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t('cohesion_over_time')}</h3>
                            <p className="text-[10px] text-slate-500 mt-0.5">{t('distance_to_centroid')}</p>
                        </div>
                        <span className="text-xl font-bold text-cyan-400 font-mono">{safeData.metrics.cohesion?.toFixed(1)}m</span>
                    </div>
                    <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={50}>
                            <AreaChart data={cohesionData}>
                                <defs>
                                    <linearGradient id="cohGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="step" hide />
                                <YAxis hide />
                                <RechartsTooltip contentStyle={chartTooltipStyle} />
                                <Area type="monotone" dataKey="value" stroke="#06b6d4" fill="url(#cohGrad)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Alignment */}
                <div className="glass-card-dark p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t('alignment_order_parameter')}</h3>
                            <p className="text-[10px] text-slate-500 mt-0.5">0.0 — 1.0</p>
                        </div>
                        <span className="text-xl font-bold text-green-400 font-mono">{safeData.metrics.alignment?.toFixed(2)}</span>
                    </div>
                    <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={50}>
                            <LineChart data={alignmentData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="step" hide />
                                <YAxis domain={[0, 1]} hide />
                                <RechartsTooltip contentStyle={chartTooltipStyle} />
                                <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Safety Violations */}
                <div className="glass-card-dark p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t('safety_violations')}</h3>
                        <span className={`text-xl font-bold font-mono ${(safeData.metrics.safety || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {safeData.metrics.safety || 0}
                        </span>
                    </div>
                    <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={50}>
                            <BarChart data={violationsData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="interval" tick={{ fontSize: 9, fill: '#64748b' }} />
                                <YAxis hide />
                                <RechartsTooltip contentStyle={chartTooltipStyle} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {violationsData.map((entry, i) => (
                                        <Cell key={i} fill={entry.value > 0 ? '#f97316' : '#1e293b'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 2: Velocity Distribution + Heatmap */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card-dark p-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">{t('drone_velocity_distribution')}</h3>
                    <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={50}>
                            <BarChart data={velocityBins}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="bin" tick={{ fontSize: 9, fill: '#64748b' }} />
                                <YAxis hide />
                                <RechartsTooltip contentStyle={chartTooltipStyle} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {velocityBins.map((_, i) => (
                                        <Cell key={i} fill={`hsl(${186 - i * 5}, 80%, ${50 + i * 2}%)`} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card-dark p-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">{t('spatial_coverage_heatmap')}</h3>
                    <SpatialHeatmap drones={safeData.drones} />
                    {/* Color Scale Legend */}
                    <div className="flex items-center gap-2 mt-2 text-[9px] text-slate-500">
                        <span>Low</span>
                        <div className="flex-1 h-2 rounded-full" style={{ background: 'linear-gradient(to right, hsl(220,70%,10%), hsl(186,70%,50%), hsl(55,70%,60%))' }}></div>
                        <span>High</span>
                    </div>
                </div>
            </div>

            {/* Row 3: Mode Timeline + Telemetry Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Mode Timeline */}
                <div className="glass-card-dark p-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">{t('mode_usage_timeline')}</h3>
                    <div className="space-y-2">
                        {MODES_TIMELINE.map((mode) => {
                            const isActive = safeData.mode === mode.name.replace('.', '_').replace(' ', '_').toUpperCase();
                            return (
                                <div key={mode.name} className="flex items-center gap-3">
                                    <span className="text-[9px] font-bold text-slate-400 w-20 text-right truncate">{mode.name}</span>
                                    <div className="flex-1 bg-slate-800 rounded-sm h-4 overflow-hidden relative">
                                        <div
                                            className="h-full rounded-sm transition-all"
                                            style={{
                                                width: `${isActive ? 100 : 0}%`,
                                                backgroundColor: mode.color,
                                                opacity: isActive ? 1 : 0.6,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Telemetry Table */}
                <div className="glass-card-dark p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t('per_drone_telemetry')}</h3>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder={t('search_by_drone_id')}
                                    value={searchFilter}
                                    onChange={e => setSearchFilter(e.target.value)}
                                    className="bg-slate-800 border border-slate-700 text-xs rounded-md pl-7 pr-2 py-1.5 text-slate-300 w-36 outline-none focus:ring-1 ring-cyan-500"
                                    aria-label="Search drones"
                                />
                            </div>
                            <button onClick={exportCsv} className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 px-2 py-1.5 bg-cyan-500/10 rounded-md border border-cyan-500/20">
                                <Download className="w-3 h-3" /> {t('export_csv')}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-auto flex-1 max-h-60">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-slate-500 border-b border-slate-800">
                                    <th className="text-left py-2 px-2 cursor-pointer hover:text-white" onClick={() => toggleSort('id')}>
                                        {t('drone_id')} {renderSortIcon('id')}
                                    </th>
                                    <th className="text-left py-2 px-2">{t('position')}</th>
                                    <th className="text-left py-2 px-2 cursor-pointer hover:text-white" onClick={() => toggleSort('speed')}>
                                        {t('speed')} {renderSortIcon('speed')}
                                    </th>
                                    <th className="text-left py-2 px-2">{t('status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((d, i) => (
                                    <tr key={d.id} className={`${i % 2 === 0 ? 'bg-slate-800/30' : ''} hover:bg-slate-800/60 transition-colors`}>
                                        <td className="py-1.5 px-2 font-bold text-cyan-400 font-mono">{d.id}</td>
                                        <td className="py-1.5 px-2 font-mono text-slate-300">{d.x}, {d.y}, {d.z}</td>
                                        <td className="py-1.5 px-2 font-mono text-slate-300">{d.speed} m/s</td>
                                        <td className="py-1.5 px-2">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                <span className="text-green-400">{t('active')}</span>
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
