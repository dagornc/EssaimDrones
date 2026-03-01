import { useRef, useMemo, useState, Suspense, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { useOutletContext } from 'react-router-dom';
import type { SimulationData, OutletContextType, DronePosition } from '../types/simulation';
import { useTranslation } from 'react-i18next';
import { Maximize2 } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

extend({ OrbitControls: OrbitControlsImpl });

const CustomOrbitControls = forwardRef<OrbitControlsImpl, any>((props, ref) => {
    const { camera, gl } = useThree();
    const controls = useMemo(() => new OrbitControlsImpl(camera, gl.domElement), [camera, gl.domElement]);

    // Ensure ref correctly gets controls instance regardless of R3F primitive handling in tests
    // Using any because of TypeScript issues with useImperativeHandle
    (useImperativeHandle as any)(ref, () => controls, [controls]);

    useFrame(() => controls.update());

    useEffect(() => {
        if (props.target && Array.isArray(props.target)) {
            controls.target.set(props.target[0], props.target[1], props.target[2]);
        }
        if (props.maxPolarAngle !== undefined) controls.maxPolarAngle = props.maxPolarAngle;
        if (props.minDistance !== undefined) controls.minDistance = props.minDistance;
        if (props.maxDistance !== undefined) controls.maxDistance = props.maxDistance;
        if (props.enableDamping !== undefined) controls.enableDamping = props.enableDamping;
        if (props.dampingFactor !== undefined) controls.dampingFactor = props.dampingFactor;
        controls.update();
    }, [props, controls]);

    useEffect(() => {
        return () => controls.dispose();
    }, [controls]);

    return <primitive object={controls} />;
});

/* ── Drone Component ───────────────────────────────────────────── */
function Drone({ position }: { position: DronePosition }) {
    const pos = useMemo<[number, number, number]>(() => [position[0], position[2] || 50, position[1]], [position]);
    return (
        <group position={pos}>
            {/* Main Body */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.8, 2.5, 12]} />
                <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.8} />
            </mesh>
            {/* Core engine glow */}
            <mesh position={[0, 0, 1.2]}>
                <sphereGeometry args={[0.4, 8, 8]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
            <pointLight distance={15} intensity={0.8} color="#06b6d4" />
        </group>
    );
}

/* ── Drone Swarm ─────────────────────────────────────────────── */
function DroneSwarm({ positions }: { positions: DronePosition[] }) {
    if (positions.length === 0) return null;
    return (
        <group>
            {positions.map((p, i) => <Drone key={`drone-${i}`} position={p} />)}
        </group>
    );
}

/* ── Marker (Enemy/Friend) ──────────────────────────────────── */
function Marker({ position, color, shape }: { position: DronePosition; color: string; shape: 'x' | 'triangle' | 'sphere' }) {
    const pos: [number, number, number] = [position[0], position[2] || 50, position[1]];

    return (
        <group>
            {/* Stem */}
            <mesh position={[pos[0], pos[1] / 2, pos[2]]}>
                <cylinderGeometry args={[0.05, 0.05, pos[1], 4]} />
                <meshBasicMaterial color={color} transparent opacity={0.3} />
            </mesh>

            {/* Marker */}
            <mesh position={pos}>
                {shape === 'triangle' ? (
                    <coneGeometry args={[1.2, 2.4, 3]} />
                ) : (
                    <octahedronGeometry args={[1.2]} />
                )}
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.85} />
            </mesh>
        </group>
    );
}

/* ── Ocean Floor Grid ────────────────────────────────────────── */
function OceanFloorGrid() {
    const gridHelper = useMemo(() => {
        const grid = new THREE.GridHelper(100, 20, '#0ea5e9', '#1e3a5f');
        grid.position.set(50, 0, 50);
        return grid;
    }, []);
    return <primitive object={gridHelper} />;
}

/* ── Scene ───────────────────────────────────────────────────── */
function Scene({ data, controlsRef }: { data: SimulationData; controlsRef: React.MutableRefObject<OrbitControlsImpl | null> }) {
    return (
        <>
            <ambientLight intensity={0.8} color="#bacde8" />
            <directionalLight position={[50, 100, 50]} intensity={0.6} color="#e0f2fe" />

            <OceanFloorGrid />

            {/* Simple dark square instead of ContactShadows */}
            <mesh position={[50, 0.05, 50]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[150, 150]} />
                <meshBasicMaterial color="#020617" transparent opacity={0.5} depthWrite={false} />
            </mesh>

            <DroneSwarm positions={data.drones} />

            {data.targets?.map((t, i) => (
                <Marker key={`t-${i}`} position={t} color="#ef4444" shape="x" />
            ))}
            {data.friends?.map((f, i) => (
                <Marker key={`f-${i}`} position={f} color="#22c55e" shape="triangle" />
            ))}
            {data.obstacles?.map((o, i) => (
                <Marker key={`o-${i}`} position={o} color="#94a3b8" shape="sphere" />
            ))}

            <CustomOrbitControls
                ref={controlsRef}
                target={[50, 30, 50]}
                maxPolarAngle={Math.PI / 2}
                minDistance={20}
                maxDistance={200}
                enableDamping
                dampingFactor={0.05}
            />
            <fog attach="fog" args={['#030a15', 60, 250]} />
        </>
    );
}

/* ── 2D Top-Down View ────────────────────────────────────────── */
function TopDownView({ data, placementTool, depthValue, sendMessage, onPlaced }: { data: SimulationData, placementTool: 'enemy' | 'friend' | 'obstacle' | null, depthValue: number, sendMessage: (msg: string) => void, onPlaced: () => void }) {
    const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!placementTool) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * 100;
        const y = (e.clientY - rect.top) / rect.height * 100;
        sendMessage(JSON.stringify({
            action: 'place_entity',
            entity_type: placementTool,
            position: [x, y, depthValue]
        }));
        onPlaced();
    };
    return (
        <div className="w-full h-full bg-[#030a15] relative overflow-hidden">
            <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
                backgroundSize: '5% 5%',
            }} />
            <svg viewBox="0 0 100 100" className={`w-full h-full relative z-10 ${placementTool ? 'cursor-crosshair' : 'cursor-default'}`} onClick={handleClick}>
                {/* Radar rings */}
                <circle cx="50" cy="50" r="20" className="stroke-slate-700/50 fill-none" strokeWidth="0.5" strokeDasharray="2,2" />
                <circle cx="50" cy="50" r="40" className="stroke-slate-700/50 fill-none" strokeWidth="0.5" strokeDasharray="2,2" />
                <circle cx="50" cy="50" r="1.5" className="fill-cyan-500/20" />

                {/* Drones */}
                {data.drones.map((d: DronePosition, i: number) => (
                    <circle key={`d-${i}`} cx={d[0]} cy={d[1]} r={1} className="fill-cyan-500 transition-all duration-300" />
                ))}

                {/* Targets */}
                {data.targets?.map((tgt: DronePosition, i: number) => (
                    <g key={`t-${i}`} transform={`translate(${tgt[0]}, ${tgt[1]})`}>
                        <line x1="-1.5" y1="-1.5" x2="1.5" y2="1.5" className="stroke-red-500" strokeWidth="0.6" />
                        <line x1="1.5" y1="-1.5" x2="-1.5" y2="1.5" className="stroke-red-500" strokeWidth="0.6" />
                    </g>
                ))}

                {/* Friends */}
                {data.friends?.map((f: DronePosition, i: number) => (
                    <polygon key={`f-${i}`} points={`${f[0]},${f[1] - 1.5} ${f[0] - 1.5},${f[1] + 1.5} ${f[0] + 1.5},${f[1] + 1.5}`} className="fill-green-500" />
                ))}

                {/* Obstacles */}
                {data.obstacles?.map((o: DronePosition, i: number) => (
                    <circle key={`o-${i}`} cx={o[0]} cy={o[1]} r={2} className="fill-slate-500 stroke-slate-400 stroke-1" />
                ))}
            </svg>
        </div>
    );
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function TacticalViewport() {
    const { t } = useTranslation();
    const { data, sendMessage } = useOutletContext<OutletContextType>();
    const [placementTool, setPlacementTool] = useState<'enemy' | 'friend' | 'obstacle' | null>(null);
    const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [depthValue, setDepthValue] = useState(50);
    const controlsRef = useRef<OrbitControlsImpl | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = async () => {
        if (!document.fullscreenElement) {
            await containerRef.current?.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    };

    const handleResetCamera = useCallback(() => {
        if (controlsRef.current) {
            controlsRef.current.reset();
            controlsRef.current.target.set(50, 30, 50);
            controlsRef.current.update();
        }
    }, []);

    if (!data) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    return (
        <div className="flex h-full">
            {/* 3D/2D Canvas */}
            <div ref={containerRef} className={`flex-1 relative bg-[#030a15] ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
                {viewMode === '3d' ? (
                    <Suspense fallback={
                        <div className="flex items-center justify-center h-full bg-[#030a15] text-cyan-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mr-3"></div>
                            Loading 3D Engine...
                        </div>
                    }>
                        <Canvas
                            camera={{ position: [120, 80, 120], fov: 50 }}
                            gl={{ antialias: true, alpha: false }}
                            style={{ background: '#030a15' }}
                        >
                            <Scene data={data} controlsRef={controlsRef} />
                        </Canvas>
                    </Suspense>
                ) : (
                    <TopDownView
                        data={data}
                        placementTool={placementTool}
                        depthValue={depthValue}
                        sendMessage={sendMessage}
                        onPlaced={() => setPlacementTool(null)}
                    />
                )}

                <button
                    onClick={toggleFullscreen}
                    className="absolute top-4 right-4 p-2 bg-slate-900/80 backdrop-blur-sm text-cyan-400 border border-slate-700 rounded-lg hover:bg-slate-800 transition-all z-10"
                    aria-label="Toggle fullscreen"
                >
                    <Maximize2 className="w-4 h-4" />
                </button>

                <div className="absolute bottom-0 left-0 right-0 h-8 bg-slate-950/90 backdrop-blur-sm border-t border-slate-800 flex items-center justify-between px-4 text-[10px] font-mono text-slate-400 z-10">
                    <span>{data.drones.length} ACTIVE DRONES &nbsp;•&nbsp; {data.metrics.safety || 0} VIOLATIONS</span>
                    <span>MODE: {data.mode} &nbsp;•&nbsp; {viewMode.toUpperCase()}</span>
                    <span>DEPTH: {depthValue.toFixed(1)}M</span>
                </div>
            </div>

            {/* Right Panel */}
            {!isFullscreen && (
                <aside className="w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto shrink-0">
                    {/* Mission Controls */}
                    <section className="p-4 border-b border-slate-200 dark:border-slate-800">
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                            {t('mission_controls')}
                        </h3>
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1 block">ACTIVE MODE</label>
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm font-bold text-cyan-600 dark:text-cyan-400 mb-3">{data.mode}</div>
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1 block">{t('drone_count')}</label>
                        <div className="flex items-center gap-2 mb-3">
                            <input
                                type="range"
                                min="1"
                                max="50"
                                value={data.drones.length}
                                onChange={(e) => sendMessage(JSON.stringify({ action: 'set_num_drones', value: parseInt(e.target.value, 10) }))}
                                className="flex-1 accent-cyan-500"
                            />
                            <span className="text-sm font-mono font-bold text-cyan-500 w-8 text-right">{data.drones.length}</span>
                        </div>
                    </section>

                    {/* Placement Tools */}
                    <section className="p-4 border-b border-slate-200 dark:border-slate-800">
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                            {t('placement_tools')}
                        </h3>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            {([
                                { id: 'enemy' as const, label: t('place_enemy'), active: 'ring-red-400 bg-red-500' },
                                { id: 'friend' as const, label: t('place_friend'), active: 'ring-green-400 bg-green-500' },
                                { id: 'obstacle' as const, label: t('place_obstacle'), active: 'ring-slate-400 bg-slate-500' },
                            ]).map(tool => (
                                <button
                                    key={tool.id}
                                    onClick={() => setPlacementTool(placementTool === tool.id ? null : tool.id)}
                                    className={`text-[10px] font-bold py-2 rounded-lg border transition-all ${placementTool === tool.id
                                        ? `${tool.active} text-white ring-2 border-transparent`
                                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                        }`}
                                >
                                    {tool.label.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        {placementTool && <p className="text-[10px] text-cyan-500 italic animate-pulse">Click in viewport to place {placementTool}...</p>}

                        <div className="mt-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg p-3">
                            <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('selection_info')}</h4>
                            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                                <span className="text-slate-500">Type:</span>
                                <span className="font-bold text-red-400">ENEMY</span>
                                {['X', 'Y', 'Z'].map((axis, i) => (
                                    <div key={axis} className="contents">
                                        <span className="text-slate-500">{axis}:</span>
                                        <input type="number" defaultValue={data.targets?.[0]?.[i]?.toFixed(1) || '0.0'}
                                            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 font-mono text-xs text-cyan-600 dark:text-cyan-400 w-full outline-none focus:ring-1 focus:ring-cyan-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Depth Slider */}
                    <section className="p-4 border-b border-slate-200 dark:border-slate-800">
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">{t('depth')} (Z)</h3>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-[9px] text-slate-500 font-mono px-1">
                                <span>0m</span><span>25m</span><span>50m</span><span>75m</span><span>100m</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={depthValue}
                                    onChange={e => setDepthValue(Number(e.target.value))}
                                    className="accent-cyan-500 w-full"
                                    aria-label="Depth slider"
                                />
                                <span className="text-sm font-mono font-bold text-cyan-500 w-12 text-right">{depthValue.toFixed(1)}m</span>
                            </div>
                        </div>
                    </section>

                    {/* View Controls */}
                    <section className="p-4">
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                            {t('view_controls')}
                        </h3>
                        <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 mb-3">
                            <button onClick={() => setViewMode('3d')}
                                className={`flex-1 py-2 text-[11px] font-bold ${viewMode === '3d' ? 'bg-cyan-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{t('3d_view')}</button>
                            <button onClick={() => setViewMode('2d')}
                                className={`flex-1 py-2 text-[11px] font-bold ${viewMode === '2d' ? 'bg-cyan-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{t('top_down')}</button>
                        </div>
                        <button
                            onClick={handleResetCamera}
                            className="w-full py-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 text-xs font-bold rounded-lg hover:bg-cyan-500/20 transition-all"
                        >
                            {t('reset_camera')}
                        </button>
                    </section>
                </aside>
            )}
        </div>
    );
}
