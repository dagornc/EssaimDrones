import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Cpu, Waves, MapPin, ChevronLeft, ChevronRight, Check, AlertTriangle, Download, Upload } from 'lucide-react';
import LLMSelector from '../components/LLMSelector';
import { useOutletContext } from 'react-router-dom';
import type { OutletContextType } from '../types/simulation';
import { useToast } from '../components/ui/Toast';
import * as Tabs from '@radix-ui/react-tabs';

/* ── Types ───────────────────────────────────────────────────── */
type ModeParams = { sep: number; ali: number; coh: number; target: number; speed_mult: number };

const DEFAULT_MODE_PARAMS: Record<string, ModeParams> = {
    PATROL: { sep: 4.0, ali: 0.5, coh: 0.5, target: 0.5, speed_mult: 0.8 },
    ATTACK: { sep: 1.5, ali: 2.0, coh: 1.0, target: 3.0, speed_mult: 1.2 },
    DEFEND: { sep: 2.0, ali: 1.5, coh: 3.0, target: 0.2, speed_mult: 0.6 },
    ENCIRCLE: { sep: 2.5, ali: 1.0, coh: 1.0, target: 1.0, speed_mult: 1.0 },
    SHIELD: { sep: 3.0, ali: 2.0, coh: 2.0, target: 2.0, speed_mult: 1.0 },
    SEARCH: { sep: 2.0, ali: 0.5, coh: 0.1, target: 0.0, speed_mult: 1.0 },
    'FLASH EXP': { sep: 10.0, ali: 0.0, coh: 0.0, target: 0.0, speed_mult: 5.0 },
    SCHOOLING: { sep: 1.5, ali: 3.0, coh: 2.5, target: 1.0, speed_mult: 1.0 },
    'PRED. PACK': { sep: 3.0, ali: 1.5, coh: 1.0, target: 4.0, speed_mult: 1.5 },
    EXPLORATION: { sep: 8.0, ali: 0.2, coh: 0.0, target: 0.5, speed_mult: 0.8 },
};

const MODE_NAMES = Object.keys(DEFAULT_MODE_PARAMS);

/* ── ConfigSlider ────────────────────────────────────────────── */
function ConfigSlider({ label, unit, value, min, max, step, onChange, validate }: {
    label: string; unit: string; value: number; min: number; max: number; step: number;
    onChange: (v: number) => void; validate?: (v: number) => boolean;
}) {
    const isValid = validate ? validate(value) : true;
    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</label>
                <div className="flex items-center gap-1.5">
                    {isValid
                        ? <Check className="w-3 h-3 text-green-500" />
                        : <AlertTriangle className="w-3 h-3 text-red-500" />}
                    <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${isValid ? 'bg-cyan-500/10 text-cyan-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                        {value.toFixed(step < 1 ? 1 : 0)} {unit}
                    </span>
                </div>
            </div>
            <input
                type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(Number(e.target.value))}
                className={`w-full accent-cyan-500 ${!isValid ? 'accent-red-500' : ''}`}
                aria-label={label}
            />
            {!isValid && <p className="text-[10px] text-red-400 mt-0.5">⚠ Value exceeds recommended range</p>}
        </div>
    );
}

/* ── SpiderChart ─────────────────────────────────────────────── */
function SpiderChart({ values, labels }: { values: number[]; labels: string[] }) {
    const cx = 100, cy = 100, r = 70, n = values.length, maxVal = 10;
    const getPoint = (i: number, val: number) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const radius = (val / maxVal) * r;
        return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
    };
    const gridLevels = [0.25, 0.5, 0.75, 1.0];
    const dataPoints = values.map((v, i) => getPoint(i, v));
    const pathData = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

    return (
        <svg viewBox="0 0 200 200" className="w-full max-w-[180px] mx-auto">
            {gridLevels.map(level => {
                const pts = Array.from({ length: n }, (_, i) => getPoint(i, level * maxVal));
                const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
                return <path key={level} d={d} fill="none" stroke="#1e293b" strokeWidth="0.5" />;
            })}
            {Array.from({ length: n }, (_, i) => {
                const p = getPoint(i, maxVal);
                return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#1e293b" strokeWidth="0.5" />;
            })}
            <path d={pathData} fill="rgba(6, 182, 212, 0.15)" stroke="#06b6d4" strokeWidth="1.5" />
            {dataPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="#06b6d4" />)}
            {labels.map((label, i) => {
                const p = getPoint(i, maxVal + 2);
                return (
                    <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
                        className="fill-slate-400 text-[8px] font-semibold uppercase">{label}</text>
                );
            })}
        </svg>
    );
}

/* ── Tab definitions ─────────────────────────────────────────── */
const TABS = [
    { id: 'llm', labelKey: 'config_tab_llm', icon: Cpu },
    { id: 'physics', labelKey: 'config_tab_physics', icon: Waves },
    { id: 'environment', labelKey: 'config_tab_environment', icon: MapPin },
] as const;

type TabId = typeof TABS[number]['id'];

/* ── Configuration Page ──────────────────────────────────────── */
export default function Configuration() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<TabId>('llm');
    const [modeTabIdx, setModeTabIdx] = useState(0);
    const [modeTabScroll, setModeTabScroll] = useState(0);
    const { sendMessage } = useOutletContext<OutletContextType>();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Physics
    const [waterDensity, setWaterDensity] = useState(1025.0);
    const [dragCoeff, setDragCoeff] = useState(1.0);
    const [draftingBonus, setDraftingBonus] = useState(0.3);
    const [timeStep, setTimeStep] = useState(0.1);

    // Drone
    const [maxSpeed, setMaxSpeed] = useState(12.5);
    const [maxForce, setMaxForce] = useState(10.0);
    const [mass, setMass] = useState(10.0);
    const [perceptionRadius, setPerceptionRadius] = useState(15.0);
    const [crowdingRadius, setCrowdingRadius] = useState(5.0);

    // Mode Params
    const [modeParams, setModeParams] = useState<Record<string, ModeParams>>({ ...DEFAULT_MODE_PARAMS });

    // Environment
    const [boundsX, setBoundsX] = useState(100);
    const [boundsY, setBoundsY] = useState(100);
    const [boundsZ, setBoundsZ] = useState(100);
    const [curX, setCurX] = useState(0.5);
    const [curY, setCurY] = useState(0.0);
    const [curZ, setCurZ] = useState(0.0);

    const currentMode = MODE_NAMES[modeTabIdx];
    const currentParams = modeParams[currentMode];
    const visibleTabs = 5;
    const tabsToShow = MODE_NAMES.slice(modeTabScroll, modeTabScroll + visibleTabs);

    const updateModeParam = (key: keyof ModeParams, val: number) => {
        setModeParams(prev => ({ ...prev, [currentMode]: { ...prev[currentMode], [key]: val } }));
    };

    const handleApply = () => {
        if (sendMessage) {
            sendMessage(JSON.stringify({
                type: 'config_update',
                physics: { waterDensity, dragCoeff, draftingBonus, timeStep },
                drone: { maxSpeed, maxForce, mass, perceptionRadius, crowdingRadius },
                modeParams,
                environment: { bounds: [boundsX, boundsY, boundsZ], current: [curX, curY, curZ] }
            }));
        }
        toast({
            title: t('config_applied_toast'),
            variant: 'success'
        });
    };

    const handleExport = () => {
        const config = {
            physics: { waterDensity, dragCoeff, draftingBonus, timeStep },
            drone: { maxSpeed, maxForce, mass, perceptionRadius, crowdingRadius },
            modeParams,
            environment: { boundsX, boundsY, boundsZ, curX, curY, curZ }
        };
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aquaswarm-config.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const config = JSON.parse(ev.target?.result as string);
                if (config.physics) {
                    setWaterDensity(config.physics.waterDensity); setDragCoeff(config.physics.dragCoeff);
                    setDraftingBonus(config.physics.draftingBonus); setTimeStep(config.physics.timeStep);
                }
                if (config.drone) {
                    setMaxSpeed(config.drone.maxSpeed); setMaxForce(config.drone.maxForce);
                    setMass(config.drone.mass); setPerceptionRadius(config.drone.perceptionRadius);
                    setCrowdingRadius(config.drone.crowdingRadius);
                }
                if (config.modeParams) setModeParams(config.modeParams);
                if (config.environment) {
                    setBoundsX(config.environment.boundsX); setBoundsY(config.environment.boundsY); setBoundsZ(config.environment.boundsZ);
                    setCurX(config.environment.curX); setCurY(config.environment.curY); setCurZ(config.environment.curZ);
                }
                toast({ title: t('config_imported', { defaultValue: 'Configuration importée' }), variant: 'success' });
            } catch {
                toast({
                    title: t('config_import_error', { defaultValue: "Erreur d'importation" }), variant: 'destructive'
                });
            }
        };
        reader.readAsText(file);
        // reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    const handleReset = () => {
        setModeParams({ ...DEFAULT_MODE_PARAMS });
        setWaterDensity(1025.0); setDragCoeff(1.0); setDraftingBonus(0.3); setTimeStep(0.1);
        setMaxSpeed(12.5); setMaxForce(10.0); setMass(10.0); setPerceptionRadius(15.0); setCrowdingRadius(5.0);
        setBoundsX(100); setBoundsY(100); setBoundsZ(100); setCurX(0.5); setCurY(0.0); setCurZ(0.0);
    };

    return (
        <div className="p-6 max-h-full overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Settings className="w-6 h-6 text-cyan-500" />
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('configuration')}</h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">ENVIRONMENT & PHYSICS ENGINE V4.2.0</p>
                    </div>
                </div>
                {activeTab !== 'llm' && (
                    <div className="flex gap-2">
                        <button onClick={handleReset} className="px-4 py-2 text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                            {t('reset_to_defaults')}
                        </button>
                        <button onClick={handleApply} className="px-4 py-2 text-xs font-bold bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">
                            {t('apply_changes')}
                        </button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <Tabs.Root value={activeTab} onValueChange={(val) => setActiveTab(val as TabId)}>
                <Tabs.List className="flex gap-1 mb-6 border-b border-slate-200 dark:border-slate-800 pb-px">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <Tabs.Trigger
                                key={tab.id}
                                value={tab.id}
                                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 data-[state=active]:bg-cyan-500/5 data-[state=inactive]:border-transparent data-[state=inactive]:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                            >
                                <Icon className="w-4 h-4" />
                                {t(tab.labelKey)}
                            </Tabs.Trigger>
                        );
                    })}
                </Tabs.List>

                {/* Tab Content */}
                <div className="animate-in fade-in duration-200">

                    {/* ────── LLM Tab ────── */}
                    <Tabs.Content value="llm">
                        <section className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                            <LLMSelector />
                        </section>
                    </Tabs.Content>

                    {/* ────── Physics & Drone Tab ────── */}
                    <Tabs.Content value="physics">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Physics */}
                            <div className="glass-card p-5">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-cyan-500" />{t('physics_parameters')}
                                </h3>
                                <ConfigSlider label={t('water_density')} unit="kg/m³" value={waterDensity} min={800} max={1200} step={1} onChange={setWaterDensity} validate={v => v >= 900 && v <= 1200} />
                                <ConfigSlider label={t('drag_coefficient')} unit="" value={dragCoeff} min={0} max={5} step={0.1} onChange={setDragCoeff} validate={v => v >= 0 && v <= 5} />
                                <ConfigSlider label={t('drafting_bonus')} unit="" value={draftingBonus} min={0} max={1} step={0.05} onChange={setDraftingBonus} />
                                <ConfigSlider label={t('time_step')} unit="s" value={timeStep} min={0.01} max={0.5} step={0.01} onChange={setTimeStep} validate={v => v >= 0.01 && v <= 0.5} />
                            </div>

                            {/* Drone */}
                            <div className="glass-card p-5">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-cyan-500" />{t('drone_specifications')}
                                </h3>
                                <ConfigSlider label={t('max_speed')} unit="m/s" value={maxSpeed} min={0} max={25} step={0.5} onChange={setMaxSpeed} />
                                <ConfigSlider label={t('max_force')} unit="N" value={maxForce} min={0} max={30} step={0.5} onChange={setMaxForce} />
                                <ConfigSlider label={t('mass')} unit="kg" value={mass} min={1} max={50} step={0.5} onChange={setMass} validate={v => v >= 1 && v <= 50} />
                                <ConfigSlider label={t('perception_radius')} unit="m" value={perceptionRadius} min={1} max={50} step={0.5} onChange={setPerceptionRadius} />
                                <ConfigSlider label={t('crowding_radius')} unit="m" value={crowdingRadius} min={0.5} max={20} step={0.5} onChange={setCrowdingRadius} />
                            </div>

                            {/* Mode Parameters — full width */}
                            <div className="lg:col-span-2 glass-card p-5">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-cyan-500" />{t('mode_parameters')}
                                </h3>
                                {/* Scrollable mode tabs */}
                                <div className="flex items-center gap-1 mb-4">
                                    <button onClick={() => setModeTabScroll(Math.max(0, modeTabScroll - 1))} disabled={modeTabScroll === 0}
                                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30" aria-label="Scroll left">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <div className="flex gap-1 flex-1 overflow-hidden">
                                        {tabsToShow.map((name, i) => {
                                            const realIdx = modeTabScroll + i;
                                            return (
                                                <button key={name} onClick={() => setModeTabIdx(realIdx)}
                                                    className={`flex-1 text-[10px] font-bold py-1.5 px-2 rounded-md transition-all whitespace-nowrap ${modeTabIdx === realIdx ? 'bg-cyan-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                        }`}>{name}</button>
                                            );
                                        })}
                                    </div>
                                    <button onClick={() => setModeTabScroll(Math.min(MODE_NAMES.length - visibleTabs, modeTabScroll + 1))}
                                        disabled={modeTabScroll >= MODE_NAMES.length - visibleTabs}
                                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30" aria-label="Scroll right">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6">
                                    <div>
                                        <ConfigSlider label={t('separation')} unit="" value={currentParams.sep} min={0} max={10} step={0.1} onChange={v => updateModeParam('sep', v)} />
                                        <ConfigSlider label={t('alignment')} unit="" value={currentParams.ali} min={0} max={5} step={0.1} onChange={v => updateModeParam('ali', v)} />
                                        <ConfigSlider label={t('cohesion')} unit="" value={currentParams.coh} min={0} max={5} step={0.1} onChange={v => updateModeParam('coh', v)} />
                                        <ConfigSlider label={t('target_weights')} unit="" value={currentParams.target} min={0} max={5} step={0.1} onChange={v => updateModeParam('target', v)} />
                                        <ConfigSlider label={t('speed_multiplier')} unit="x" value={currentParams.speed_mult} min={0} max={5} step={0.1} onChange={v => updateModeParam('speed_mult', v)} />
                                    </div>
                                    <SpiderChart
                                        values={[currentParams.sep, currentParams.ali, currentParams.coh, currentParams.target, currentParams.speed_mult]}
                                        labels={['SEP', 'ALI', 'COH', 'TGT', 'SPD']}
                                    />
                                </div>
                            </div>
                        </div>
                    </Tabs.Content>

                    {/* ────── Environment Tab ────── */}
                    <Tabs.Content value="environment">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="glass-card p-5">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-cyan-500" />{t('bounding_volume')}
                                </h3>
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    {[{ label: 'X', val: boundsX, set: setBoundsX }, { label: 'Y', val: boundsY, set: setBoundsY }, { label: 'Z', val: boundsZ, set: setBoundsZ }].map(b => (
                                        <div key={b.label} className="relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">{b.label}</span>
                                            <input type="number" value={b.val} onChange={e => b.set(Number(e.target.value))}
                                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-7 pr-2 py-2.5 text-sm font-mono text-cyan-600 dark:text-cyan-400 outline-none focus-visible:ring-2 ring-cyan-500"
                                                aria-label={`Bounds ${b.label}`} />
                                        </div>
                                    ))}
                                </div>

                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-cyan-500" />{t('global_current_vector')}
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {[{ label: 'Vx', val: curX, set: setCurX }, { label: 'Vy', val: curY, set: setCurY }, { label: 'Vz', val: curZ, set: setCurZ }].map(c => (
                                        <div key={c.label} className="relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">{c.label}</span>
                                            <input type="number" step="0.1" value={c.val} onChange={e => c.set(Number(e.target.value))}
                                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-2 py-2.5 text-sm font-mono text-cyan-600 dark:text-cyan-400 outline-none focus-visible:ring-2 ring-cyan-500"
                                                aria-label={`Current ${c.label}`} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Import/Export panel */}
                            <div className="glass-card p-5 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-cyan-500" />{t('config_import_export')}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                                        {t('config_import_export_desc')}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 w-full py-3 text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                                        <Upload className="w-4 h-4" /> {t('config_import')}
                                    </button>
                                    <button onClick={handleExport} className="flex items-center justify-center gap-2 w-full py-3 text-xs font-bold bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-all">
                                        <Download className="w-4 h-4" /> {t('config_export')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Tabs.Content>
                </div>
            </Tabs.Root >
        </div >
    );
}
