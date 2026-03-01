/**
 * Radix Toast notification system.
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast({ title: 'Connected', description: 'WebSocket link active', variant: 'success' });
 */

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

/* ── Types ───────────────────────────────────────────────────── */

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
    id: string;
    title: string;
    description?: string;
    variant: ToastVariant;
}

interface ToastContextValue {
    toast: (opts: Omit<ToastItem, 'id'>) => void;
}

/* ── Context ─────────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

/* ── Variant styles & icons ──────────────────────────────────── */

const VARIANT_STYLES: Record<ToastVariant, { bg: string; border: string; icon: React.ReactNode }> = {
    success: {
        bg: 'bg-green-500/10 dark:bg-green-900/20',
        border: 'border-green-500/30',
        icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    },
    error: {
        bg: 'bg-red-500/10 dark:bg-red-900/20',
        border: 'border-red-500/30',
        icon: <XCircle className="w-4 h-4 text-red-500" />,
    },
    warning: {
        bg: 'bg-orange-500/10 dark:bg-orange-900/20',
        border: 'border-orange-500/30',
        icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
    },
    info: {
        bg: 'bg-cyan-500/10 dark:bg-cyan-900/20',
        border: 'border-cyan-500/30',
        icon: <Info className="w-4 h-4 text-cyan-500" />,
    },
};

/* ── Provider ────────────────────────────────────────────────── */

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const toast = useCallback((opts: Omit<ToastItem, 'id'>) => {
        const id = crypto.randomUUID();
        setToasts(prev => [...prev, { ...opts, id }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            <ToastPrimitive.Provider swipeDirection="right" duration={4000}>
                {children}

                {toasts.map(item => {
                    const vs = VARIANT_STYLES[item.variant];
                    return (
                        <ToastPrimitive.Root
                            key={item.id}
                            className={`${vs.bg} ${vs.border} border backdrop-blur-md rounded-xl p-4 shadow-xl flex items-start gap-3 animate-in slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[swipe=end]:animate-out data-[swipe=end]:slide-out-to-right`}
                            onOpenChange={open => { if (!open) removeToast(item.id); }}
                        >
                            {vs.icon}
                            <div className="flex-1 min-w-0">
                                <ToastPrimitive.Title className="text-sm font-bold text-slate-900 dark:text-white">
                                    {item.title}
                                </ToastPrimitive.Title>
                                {item.description && (
                                    <ToastPrimitive.Description className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {item.description}
                                    </ToastPrimitive.Description>
                                )}
                            </div>
                            <ToastPrimitive.Close className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-0.5 rounded" aria-label="Close">
                                <X className="w-3 h-3" />
                            </ToastPrimitive.Close>
                        </ToastPrimitive.Root>
                    );
                })}

                <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 w-80 max-h-screen outline-none" />
            </ToastPrimitive.Provider>
        </ToastContext.Provider>
    );
}
