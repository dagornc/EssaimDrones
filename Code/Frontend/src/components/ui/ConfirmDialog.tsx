import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'default';
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    open, title, message,
    confirmLabel, cancelLabel,
    variant = 'default',
    onConfirm, onCancel,
}: ConfirmDialogProps) {
    const { t } = useTranslation();

    if (!open) return null;

    const variantStyles = {
        danger: 'bg-red-500 hover:bg-red-400',
        warning: 'bg-orange-500 hover:bg-orange-400',
        default: 'bg-cyan-500 hover:bg-cyan-400',
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-sm mx-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
                {/* Icon + Title */}
                <div className="flex items-center gap-3 mb-4">
                    {variant !== 'default' && (
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
                            }`}>
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    )}
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{message}</p>

                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                        {cancelLabel || t('confirm_cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2.5 text-sm font-bold text-white rounded-lg transition-all ${variantStyles[variant]}`}
                    >
                        {confirmLabel || t('confirm_ok')}
                    </button>
                </div>
            </div>
        </div>
    );
}
