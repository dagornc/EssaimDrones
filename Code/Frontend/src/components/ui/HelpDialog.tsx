import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { HelpCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HelpDialogProps {
    title: string;
    description: React.ReactNode;
}

export function HelpDialog({ title, description }: HelpDialogProps) {
    const [open, setOpen] = useState(false);
    const { t } = useTranslation();

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <button
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    aria-label={t('help.buttonAria', 'Obtenir de l\'aide sur cette page')}
                >
                    <HelpCircle className="w-5 h-5" />
                </button>
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in transition-all" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 text-slate-100 p-6 rounded-xl shadow-2xl z-50 w-[90vw] max-w-lg animate-in zoom-in-95 duration-200 border border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                            <HelpCircle className="w-6 h-6 text-teal-400" />
                            {title}
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button
                                className="p-1 rounded-full hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
                                aria-label={t('help.close', 'Fermer')}
                            >
                                <X className="w-5 h-5 text-slate-400 hover:text-white" />
                            </button>
                        </Dialog.Close>
                    </div>
                    <div className="text-slate-300 text-sm leading-relaxed space-y-3">
                        {description}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
