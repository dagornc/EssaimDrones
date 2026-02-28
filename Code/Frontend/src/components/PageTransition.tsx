import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

/**
 * Wraps page content with a fade-in + slide-up transition on route change.
 * Pure CSS animation — no external libraries.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
    const location = useLocation();
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Delay to avoid cascading render lint error
        const timer1 = setTimeout(() => setShow(false), 0);
        const timer2 = setTimeout(() => setShow(true), 50);
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [location.pathname]);

    return (
        <div
            className={`transition-all duration-300 ease-out ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}
            style={{ minHeight: '100%' }}
        >
            {children}
        </div>
    );
}
