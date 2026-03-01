import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Wraps page content with a framer-motion fade-in + slide-up transition on route change.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{ minHeight: '100%', width: '100%' }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
