import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Crosshair, Settings, ChevronRight, X } from 'lucide-react';

const STORAGE_KEY = 'aquaswarm-onboarded';

const STEPS = [
    {
        icon: Activity,
        titleKey: 'onboarding_step1_title',
        descKey: 'onboarding_step1_desc',
        color: 'text-cyan-500',
        bg: 'bg-cyan-500/10',
    },
    {
        icon: Crosshair,
        titleKey: 'onboarding_step2_title',
        descKey: 'onboarding_step2_desc',
        color: 'text-indigo-500',
        bg: 'bg-indigo-500/10',
    },
    {
        icon: Settings,
        titleKey: 'onboarding_step3_title',
        descKey: 'onboarding_step3_desc',
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
    },
];

export default function OnboardingWizard() {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(() => {
        const seen = localStorage.getItem(STORAGE_KEY);
        return !seen;
    });
    const [step, setStep] = useState(0);

    const dismiss = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setVisible(false);
    };

    const next = () => {
        if (step < STEPS.length - 1) {
            setStep(s => s + 1);
        } else {
            dismiss();
        }
    };

    if (!visible) return null;

    const current = STEPS[step];
    const Icon = current.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md mx-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                {/* Close */}
                <button
                    onClick={dismiss}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors z-10"
                    aria-label="Close onboarding"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Illustration area */}
                <div className={`${current.bg} w-full h-40 flex items-center justify-center transition-colors duration-300`}>
                    <div className={`w-20 h-20 rounded-2xl ${current.bg} border-2 border-current ${current.color} flex items-center justify-center`}>
                        <Icon className="w-10 h-10" />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {t(current.titleKey)}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                        {t(current.descKey)}
                    </p>

                    {/* Stepper dots */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {STEPS.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setStep(i)}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${i === step ? 'bg-cyan-500 w-6' : 'bg-slate-300 dark:bg-slate-700'
                                    }`}
                                aria-label={`Step ${i + 1}`}
                            />
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={dismiss}
                            className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                            {t('onboarding_skip')}
                        </button>
                        <button
                            onClick={next}
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-cyan-500 text-white text-sm font-bold rounded-lg hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
                        >
                            {step < STEPS.length - 1 ? t('onboarding_next') : t('onboarding_start')}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
