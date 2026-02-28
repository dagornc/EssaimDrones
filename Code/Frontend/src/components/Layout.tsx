import { Outlet, Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, Box, SlidersHorizontal, BarChart3, FileText, Bell, Globe, Moon, Sun, Cpu, Menu, X, ToggleLeft, ToggleRight, Gamepad2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeProvider';
import { TooltipProvider, Tooltip } from './ui/Tooltip';
import { useWebSocket } from '../hooks/useWebSocket';
import { useMissionTimer } from '../hooks/useMissionTimer';
import PageTransition from './PageTransition';
import OnboardingWizard from './OnboardingWizard';
import AgentChat from './AgentChat';
import PageHelp from './PageHelp';
import { useState } from 'react';

export default function Layout() {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const { theme, setTheme } = useTheme();
    const { data, isConnected, metricsHistory, sendMessage } = useWebSocket();
    const missionTime = useMissionTimer(isConnected);
    const [chatOpen, setChatOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [simulationMode, setSimulationMode] = useState(true);

    const toggleSimulation = () => {
        setSimulationMode(prev => !prev);
        // Dispatch simulation control message to backend if connected
        if (isConnected && sendMessage) {
            sendMessage(JSON.stringify({
                type: 'control',
                action: 'set_simulation_mode',
                enabled: !simulationMode
            }));
        }
    };

    const activeDronesCount = data?.drones?.length || 0;

    const toggleLang = () => {
        i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en');
    };

    const navItems = [
        { name: t('dashboard'), path: '/', icon: LayoutDashboard },
        { name: t('tactical_viewport'), path: '/tactical', icon: Box },
        { name: t('configuration'), path: '/config', icon: SlidersHorizontal },
        { name: t('metrics'), path: '/metrics', icon: BarChart3 },
        { name: t('logs'), path: '/logs', icon: FileText },
    ];

    return (
        <TooltipProvider delayDuration={200}>
            <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans overflow-hidden transition-colors">

                {/* Onboarding Wizard */}
                <OnboardingWizard />

                {/* ────── Desktop Sidebar (hidden on mobile) ────── */}
                <nav className="hidden md:flex w-16 flex-col items-center py-4 bg-white dark:bg-[#0a1628] border-r border-slate-200 dark:border-slate-800 z-10 shrink-0" role="navigation" aria-label="Main navigation">
                    <div className="mb-8">
                        <Activity className="w-8 h-8 text-cyan-500" />
                    </div>

                    <div className="flex flex-col gap-3 w-full px-2">
                        {navItems.map((item) => {
                            const active = location.pathname === item.path;
                            const Icon = item.icon;
                            return (
                                <Tooltip key={item.path} content={item.name}>
                                    <Link
                                        to={item.path}
                                        aria-current={active ? 'page' : undefined}
                                        className={`p-3 rounded-xl flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${active
                                            ? 'bg-cyan-500/10 text-cyan-500 shadow-[inset_2px_0_0_0_#06b6d4]'
                                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </Link>
                                </Tooltip>
                            );
                        })}
                    </div>

                    <div className="mt-auto flex flex-col gap-3 w-full px-2">
                        <Tooltip content={simulationMode ? "Mode Simulation" : "Mode Réel"}>
                            <button
                                onClick={toggleSimulation}
                                className={`p-3 rounded-xl flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-cyan-500 ${simulationMode
                                    ? 'bg-amber-500/10 text-amber-500 shadow-[inset_2px_0_0_0_#f59e0b]'
                                    : 'bg-emerald-500/10 text-emerald-500 shadow-[inset_2px_0_0_0_#10b981]'
                                    }`}
                            >
                                <Gamepad2 className="w-5 h-5" />
                                <div className="absolute top-1 right-1">
                                    {simulationMode ? <ToggleRight className="w-3 h-3 text-amber-500" /> : <ToggleLeft className="w-3 h-3 text-emerald-500" />}
                                </div>
                            </button>
                        </Tooltip>

                        <Tooltip content="Agent Orchestrateur">
                            <button
                                onClick={() => setChatOpen(!chatOpen)}
                                className={`p-3 rounded-xl flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-cyan-500 ${chatOpen
                                    ? 'bg-indigo-500/10 text-indigo-500 shadow-[inset_2px_0_0_0_#6366f1]'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                                    }`}
                            >
                                <Cpu className="w-5 h-5" />
                            </button>
                        </Tooltip>

                        <Tooltip content="Profile">
                            <button className="p-3 text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl flex items-center justify-center focus-visible:ring-2 focus-visible:ring-cyan-500">
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden ring-1 ring-slate-300 dark:ring-slate-700">
                                    <div className="absolute bottom-0 w-4 h-3 bg-slate-400 dark:bg-slate-500 rounded-t-lg" />
                                    <div className="absolute top-1.5 w-3 h-3 bg-slate-400 dark:bg-slate-500 rounded-full" />
                                </div>
                            </button>
                        </Tooltip>
                    </div>
                </nav>

                {/* ────── Main Content ────── */}
                <div className="flex-1 flex flex-col relative min-w-0">

                    {/* Top Bar */}
                    <header className="h-14 bg-white/80 dark:bg-[#0d1f3c]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/50 flex justify-between items-center px-4 md:px-6 shrink-0 z-20">
                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>

                        {/* Breadcrumb */}
                        <div className="hidden md:flex items-center gap-2 text-sm">
                            <span className="font-semibold text-slate-500 dark:text-slate-400">AquaSwarm Command</span>
                            <span className="text-slate-400 dark:text-slate-600">/</span>
                            <span className="font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wide text-xs">
                                {navItems.find(i => i.path === location.pathname)?.name}
                            </span>
                            <PageHelp path={location.pathname} />
                        </div>

                        {/* Mobile title */}
                        <div className="md:hidden flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                                {navItems.find(i => i.path === location.pathname)?.name}
                            </span>
                            <PageHelp path={location.pathname} />
                        </div>

                        {/* Mission Timer */}
                        <div className="hidden sm:flex items-center">
                            <span className="text-slate-600 dark:text-slate-300 font-mono text-sm tracking-wider flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800">
                                T+ {missionTime}
                            </span>
                        </div>

                        {/* Right Tools */}
                        <div className="flex items-center gap-2 md:gap-4">
                            {/* Drone Status Badge */}
                            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold tracking-wide">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                                </span>
                                {activeDronesCount} {t('active_drones').toUpperCase()}
                            </div>

                            <button className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md p-1" aria-label="Notifications">
                                <Bell className="w-4 h-4" />
                            </button>

                            <button onClick={toggleLang} className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 text-xs font-bold focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md p-1" aria-label="Change language">
                                <Globe className="w-4 h-4" />
                                <span className="hidden sm:inline">{i18n.language.toUpperCase()}</span>
                            </button>

                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md p-1"
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="flex-1 overflow-auto bg-slate-100 dark:bg-[#060d18] relative">
                        <PageTransition>
                            <Outlet context={{ data, isConnected, metricsHistory, sendMessage, simulationMode }} />
                        </PageTransition>

                        {/* AI Agent Drawer */}
                        <AgentChat open={chatOpen} onClose={() => setChatOpen(false)} />
                    </main>
                </div>

                {/* ────── Mobile Bottom Tab Bar ────── */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-[#0a1628] border-t border-slate-200 dark:border-slate-800 z-40 flex items-center justify-around px-2 safe-area-bottom" role="navigation" aria-label="Mobile navigation">
                    {navItems.map((item) => {
                        const active = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                aria-current={active ? 'page' : undefined}
                                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${active
                                    ? 'text-cyan-500'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-[9px] font-bold tracking-wider">{item.name.split(' ')[0].toUpperCase()}</span>
                            </Link>
                        );
                    })}
                    <button
                        onClick={toggleSimulation}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${simulationMode ? 'text-amber-500' : 'text-emerald-500'}`}
                    >
                        <Gamepad2 className="w-5 h-5 relative">
                            {simulationMode ? <ToggleRight className="w-2.5 h-2.5 absolute -top-1 -right-2 tracking-tighter" /> : <ToggleLeft className="w-2.5 h-2.5 absolute -top-1 -right-2" />}
                        </Gamepad2>
                        <span className="text-[9px] font-bold tracking-wider">SIMU</span>
                    </button>
                    <button
                        onClick={() => setChatOpen(!chatOpen)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${chatOpen ? 'text-indigo-500' : 'text-slate-400'
                            }`}
                    >
                        <Cpu className="w-5 h-5" />
                        <span className="text-[9px] font-bold tracking-wider">AI</span>
                    </button>
                </nav>
            </div>
        </TooltipProvider>
    );
}
