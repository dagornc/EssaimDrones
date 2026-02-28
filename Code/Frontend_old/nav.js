/**
 * AquaSwarm Command — Shared Navigation & Interactivity Module
 *
 * Provides:
 *   - Sidebar navigation with active-state highlighting
 *   - Dark / Light mode toggle
 *   - Slider live-value binding
 *   - Basic i18n skeleton (FR / EN)
 */

"use strict";

/* ---------- Navigation ---------- */

const NAV_ITEMS = [
    { icon: "dashboard", label: "Dashboard", href: "dashboard.html" },
    { icon: "view_in_ar", label: "3D Viewport", href: "tactical.html" },
    { icon: "memory", label: "Configuration", href: "configuration.html" },
    { icon: "monitoring", label: "Metrics", href: "metrics.html" },
    { icon: "article", label: "Logs", href: "#" },
];

/**
 * Highlight the sidebar link that matches the current page.
 */
function initSidebarNavigation() {
    const currentPage = window.location.pathname.split("/").pop() || "dashboard.html";
    const navButtons = document.querySelectorAll("[data-nav-target]");

    navButtons.forEach((btn) => {
        const target = btn.getAttribute("data-nav-target");
        const isActive = target === currentPage;

        btn.classList.remove(
            "text-primary", "bg-primary/10", "active-glow",
            "ring-1", "ring-primary/30"
        );
        btn.classList.remove("text-slate-400");

        if (isActive) {
            btn.classList.add("text-primary", "bg-primary/10", "rounded-lg");
            btn.style.boxShadow = "0 0 15px rgba(0, 212, 255, 0.3)";
        } else {
            btn.classList.add("text-slate-400");
            btn.style.boxShadow = "";
        }
    });
}

/* ---------- Dark / Light Mode ---------- */

/**
 * Toggle the `dark` class on <html> and persist in localStorage.
 */
function initDarkModeToggle() {
    const toggleBtn = document.getElementById("theme-toggle");
    if (!toggleBtn) return;

    const html = document.documentElement;
    const stored = localStorage.getItem("aquaswarm-theme");
    if (stored === "light") {
        html.classList.remove("dark");
    } else {
        html.classList.add("dark");
    }

    toggleBtn.addEventListener("click", () => {
        html.classList.toggle("dark");
        const mode = html.classList.contains("dark") ? "dark" : "light";
        localStorage.setItem("aquaswarm-theme", mode);

        const icon = toggleBtn.querySelector(".material-symbols-outlined");
        if (icon) {
            icon.textContent = mode === "dark" ? "dark_mode" : "light_mode";
        }
    });
}

/* ---------- Sliders ---------- */

/**
 * Wire every `<input type="range">` to its associated `<span>` display.
 * Convention: the display span must be inside the same parent `.space-y-*`
 * container and carry the class `slider-value` OR be the `text-primary`
 * `font-mono` span found inside the sibling label row.
 */
function initSliders() {
    document.querySelectorAll('input[type="range"]').forEach((slider) => {
        const container = slider.closest(".space-y-1, .space-y-1\\.5, .space-y-2");
        if (!container) return;

        const valueSpan = container.querySelector(
            ".text-primary.font-mono, .slider-value"
        );
        if (!valueSpan) return;

        const update = () => {
            let val = parseFloat(slider.value);
            const step = parseFloat(slider.step) || 1;
            if (step < 1) {
                const decimals = step.toString().split(".")[1]?.length || 1;
                valueSpan.textContent = val.toFixed(decimals);
            } else {
                valueSpan.textContent = val;
            }
        };

        slider.addEventListener("input", update);
    });
}

/* ---------- i18n skeleton ---------- */

const I18N = {
    en: {
        "nav.dashboard": "Dashboard",
        "nav.viewport": "3D Viewport",
        "nav.config": "Configuration",
        "nav.metrics": "Metrics",
        "nav.logs": "Logs",
        "kpi.active_drones": "Active Drones",
        "kpi.current_mode": "Current Mode",
        "kpi.cohesion": "Cohesion Index",
        "kpi.violations": "Safety Violations",
        "label.dark_mode": "Dark Mode",
        "label.language": "Language",
    },
    fr: {
        "nav.dashboard": "Tableau de Bord",
        "nav.viewport": "Vue 3D Tactique",
        "nav.config": "Configuration",
        "nav.metrics": "Métriques",
        "nav.logs": "Journaux",
        "kpi.active_drones": "Drones Actifs",
        "kpi.current_mode": "Mode Actuel",
        "kpi.cohesion": "Indice de Cohésion",
        "kpi.violations": "Violations de Sécurité",
        "label.dark_mode": "Mode Sombre",
        "label.language": "Langue",
    },
};

let currentLang = localStorage.getItem("aquaswarm-lang") || "en";

/**
 * Apply translations to elements with `data-i18n="key"`.
 */
function applyTranslations(lang) {
    currentLang = lang;
    localStorage.setItem("aquaswarm-lang", lang);
    const dict = I18N[lang] || I18N.en;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (dict[key]) {
            el.textContent = dict[key];
        }
    });
}

function initLanguageToggle() {
    const langBtn = document.getElementById("lang-toggle");
    if (!langBtn) return;

    langBtn.addEventListener("click", () => {
        const next = currentLang === "en" ? "fr" : "en";
        applyTranslations(next);
    });
}

/* ---------- Boot ---------- */

document.addEventListener("DOMContentLoaded", () => {
    initSidebarNavigation();
    initDarkModeToggle();
    initSliders();
    initLanguageToggle();
    applyTranslations(currentLang);
});
