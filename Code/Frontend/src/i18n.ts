import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    en: {
        translation: {
            // Navigation
            "dashboard": "Dashboard",
            "tactical_viewport": "Tactical Viewport",
            "swarm_controls": "Swarm Controls",
            "metrics": "Metrics & Analytics",
            "configuration": "Configuration",
            "logs": "Logs",

            // Dashboard KPIs
            "active_drones": "Active Drones",
            "current_mode": "Current Mode",
            "cohesion_index": "Cohesion Index",
            "safety_violations": "Safety Violations",
            "swarm_modes": "Swarm Modes",
            "performance_metrics": "Performance Metrics",
            "safety_monitor": "Safety Monitor",
            "geofence": "Geofence",
            "collisions": "Collisions",
            "out_of_bounds": "Out of Bounds",
            "stable": "STABLE",
            "secure": "SECURE",
            "clear": "CLEAR",

            // Tactical Viewport
            "mission_controls": "Mission Controls",
            "drone_count": "Drone Count",
            "speed_multiplier": "Speed Multiplier",
            "placement_tools": "Placement Tools",
            "place_enemy": "Enemy",
            "place_friend": "Friend",
            "place_obstacle": "Obstacle",
            "selection_info": "Selection Info",
            "type": "Type",
            "depth": "Depth",
            "view_controls": "View Controls",
            "3d_view": "3D VIEW",
            "top_down": "TOP DOWN",
            "elevation": "Elevation",
            "azimuth": "Azimuth",
            "reset_camera": "RESET CAMERA VIEW",

            // Configuration Tabs
            "config_tab_llm": "AI Model",
            "config_tab_physics": "Physics & Drone",
            "config_tab_environment": "Environment",
            "config_import_export": "Import / Export",
            "config_import_export_desc": "Save your current configuration to a JSON file or import a previously saved configuration.",
            "config_import": "Import Configuration",
            "config_export": "Export Configuration",
            "config_applied_toast": "Configuration applied successfully!",

            // Physics
            "physics_parameters": "Physics Parameters",
            "water_density": "Water Density (kg/m³)",
            "drag_coefficient": "Drag Coefficient",
            "drafting_bonus": "Drafting Bonus",
            "time_step": "Time Step (s)",

            // Drone
            "drone_specifications": "Drone Specifications",
            "max_speed": "Max Speed (m/s)",
            "max_force": "Max Force (N)",
            "mass": "Mass (kg)",
            "perception_radius": "Perception Radius (m)",
            "crowding_radius": "Crowding Radius (m)",

            // Mode Parameters
            "mode_parameters": "Mode Parameters",
            "separation": "Separation",
            "alignment": "Alignment",
            "cohesion": "Cohesion",
            "target_weights": "Target Weights",
            "environment": "Environment",
            "bounding_volume": "Bounding Volume (X, Y, Z meters)",
            "global_current_vector": "Global Current Vector (m/s)",
            "reset_to_defaults": "RESET TO DEFAULTS",
            "apply_changes": "APPLY CHANGES",

            // Metrics
            "cohesion_over_time": "Cohesion Over Time",
            "distance_to_centroid": "Distance to Centroid (m)",
            "alignment_order_parameter": "Alignment Order Parameter",
            "drone_velocity_distribution": "Drone Velocity Distribution (m/s)",
            "spatial_coverage_heatmap": "Spatial Coverage Heatmap (X-Y Plane)",
            "mode_usage_timeline": "Mode Usage Timeline",
            "per_drone_telemetry": "Per-Drone Telemetry",
            "search_by_drone_id": "Search by Drone ID...",
            "export_csv": "Export CSV",
            "drone_id": "Drone ID",
            "position": "Position (X,Y,Z)",
            "speed": "Speed",
            "status": "Status",
            "active": "Active",
            "inactive": "Inactive",

            // LLM Selector
            "llm_selector_title": "LLM Model Selection",
            "llm_selector_subtitle": "Choose your AI provider and model for the tactical orchestrator.",
            "llm_active_model": "Active Model",
            "llm_provider": "Provider",
            "llm_recommended": "Recommended",
            "llm_active": "Active",
            "llm_search_models": "Search models...",
            "llm_free_only": "Free only",
            "llm_refresh_models": "Refresh models",
            "llm_no_models": "No models found.",
            "llm_select": "Select",
            "llm_use_provider": "Use this provider",
            "llm_test_connection": "Test Connection",

            // Onboarding
            "onboarding_step1_title": "10 Tactical Swarm Modes",
            "onboarding_step1_desc": "Control your underwater drone fleet with 10 specialized behavioral modes — from Patrol to Flash Expansion. Each mode adjusts separation, alignment, cohesion and targeting dynamically.",
            "onboarding_step2_title": "3D Tactical Placement",
            "onboarding_step2_desc": "Place enemies, allies and obstacles directly in the 3D underwater viewport. Use the depth slider to set positions at different ocean layers.",
            "onboarding_step3_title": "Fine-Tune Everything",
            "onboarding_step3_desc": "Adjust physics parameters, drone specifications and mode weights through an intuitive configuration panel. Select your AI orchestrator model for intelligent mission planning.",
            "onboarding_skip": "Skip",
            "onboarding_next": "Next",
            "onboarding_start": "Get Started",

            // Agent
            "agent_welcome": "Orchestrator online. The swarm is synchronized. How can I help you?",
            "agent_input_placeholder": "Enter a command...",

            // Empty states
            "empty_no_backend": "No connection to backend",
            "empty_no_backend_desc": "Waiting for WebSocket connection to the simulation server...",
            "empty_retry": "Retry Connection",
            "empty_no_drones": "No active drones",
            "empty_no_drones_desc": "Launch a simulation to see drone telemetry.",

            // Confirm dialogs
            "confirm_cancel": "Cancel",
            "confirm_ok": "Confirm",
            "confirm_reset_title": "Reset Configuration?",
            "confirm_reset_message": "This will reset all parameters to their default values. This action cannot be undone.",

            // Logs page
            "log_events": "Event Log",
            "log_search_placeholder": "Filter events...",
            "ws_connected": "WebSocket connected",
            "ws_disconnected": "WebSocket disconnected",
            "mode_changed": "Mode changed",
            "chat_error": "Failed to reach orchestrator",
            "chat_sending": "Thinking..."
        }
    },
    fr: {
        translation: {
            // Navigation
            "dashboard": "Tableau de bord",
            "tactical_viewport": "Vue Tactique 3D",
            "swarm_controls": "Contrôles",
            "metrics": "Métriques & Analytique",
            "configuration": "Configuration",
            "logs": "Journaux",

            // Dashboard KPIs
            "active_drones": "Drones Actifs",
            "current_mode": "Mode Actuel",
            "cohesion_index": "Indice Cohésion",
            "safety_violations": "Violations Sécurité",
            "swarm_modes": "Modes d'Essaim",
            "performance_metrics": "Métriques de Performance",
            "safety_monitor": "Moniteur de Sécurité",
            "geofence": "Geofence",
            "collisions": "Collisions",
            "out_of_bounds": "Hors Limites",
            "stable": "STABLE",
            "secure": "SÉCURISÉ",
            "clear": "OK",

            // Tactical Viewport
            "mission_controls": "Contrôles Mission",
            "drone_count": "Nombre Drones",
            "speed_multiplier": "Multiplicateur Vitesse",
            "placement_tools": "Outils de Placement",
            "place_enemy": "Ennemi",
            "place_friend": "Allié",
            "place_obstacle": "Obstacle",
            "selection_info": "Info Sélection",
            "type": "Type",
            "depth": "Profondeur",
            "view_controls": "Contrôles Caméra",
            "3d_view": "VUE 3D",
            "top_down": "VUE DESSUS",
            "elevation": "Élévation",
            "azimuth": "Azimut",
            "reset_camera": "RÉINITIALISER CAMÉRA",

            // Configuration Tabs
            "config_tab_llm": "Modèle IA",
            "config_tab_physics": "Physique & Drone",
            "config_tab_environment": "Environnement",
            "config_import_export": "Import / Export",
            "config_import_export_desc": "Sauvegardez votre configuration actuelle en fichier JSON ou importez une configuration précédemment sauvegardée.",
            "config_import": "Importer Configuration",
            "config_export": "Exporter Configuration",
            "config_applied_toast": "Configuration appliquée avec succès !",

            // Physics
            "physics_parameters": "Paramètres Physiques",
            "water_density": "Densité Eau (kg/m³)",
            "drag_coefficient": "Coéfficient Traînée",
            "drafting_bonus": "Bonus Aspiration",
            "time_step": "Pas de Temps (s)",

            // Drone
            "drone_specifications": "Spécifications Drone",
            "max_speed": "Vitesse Max (m/s)",
            "max_force": "Force Max (N)",
            "mass": "Masse (kg)",
            "perception_radius": "Rayon Perception (m)",
            "crowding_radius": "Rayon Encombrement (m)",

            // Mode Parameters
            "mode_parameters": "Paramètres Mode",
            "separation": "Séparation",
            "alignment": "Alignement",
            "cohesion": "Cohésion",
            "target_weights": "Poids Cible",
            "environment": "Environnement",
            "bounding_volume": "Volume Limite (X, Y, Z mètres)",
            "global_current_vector": "Vecteur Courant Global (m/s)",
            "reset_to_defaults": "RÉTABLIR DÉFAUT",
            "apply_changes": "APPLIQUER MODIFICATIONS",

            // Metrics
            "cohesion_over_time": "Cohésion dans le Temps",
            "distance_to_centroid": "Distance au Centre (m)",
            "alignment_order_parameter": "Paramètre Alignement",
            "drone_velocity_distribution": "Distribution Vitesses (m/s)",
            "spatial_coverage_heatmap": "Carte de Chaleur (Plan X-Y)",
            "mode_usage_timeline": "Historique des Modes",
            "per_drone_telemetry": "Télémétrie par Drone",
            "search_by_drone_id": "Chercher par ID...",
            "export_csv": "Exporter CSV",
            "drone_id": "ID Drone",
            "position": "Position (X,Y,Z)",
            "speed": "Vitesse",
            "status": "Statut",
            "active": "Actif",
            "inactive": "Inactif",

            // LLM Selector
            "llm_selector_title": "Sélection du Modèle LLM",
            "llm_selector_subtitle": "Choisissez le fournisseur et le modèle IA pour l'orchestrateur tactique.",
            "llm_active_model": "Modèle actif",
            "llm_provider": "Fournisseur",
            "llm_recommended": "Recommandé",
            "llm_active": "Actif",
            "llm_search_models": "Rechercher un modèle...",
            "llm_free_only": "Gratuit seulement",
            "llm_refresh_models": "Actualiser",
            "llm_no_models": "Aucun modèle trouvé.",
            "llm_select": "Sélectionner",
            "llm_use_provider": "Utiliser ce fournisseur",
            "llm_test_connection": "Tester la Connexion",

            // Onboarding
            "onboarding_step1_title": "10 Modes Tactiques d'Essaim",
            "onboarding_step1_desc": "Contrôlez votre flotte de drones sous-marins avec 10 modes comportementaux spécialisés — de la Patrouille à l'Expansion Flash. Chaque mode ajuste dynamiquement la séparation, l'alignement, la cohésion et le ciblage.",
            "onboarding_step2_title": "Placement Tactique 3D",
            "onboarding_step2_desc": "Placez ennemis, alliés et obstacles directement dans la vue 3D sous-marine. Utilisez le slider de profondeur pour positionner à différentes couches océaniques.",
            "onboarding_step3_title": "Configuration Avancée",
            "onboarding_step3_desc": "Ajustez les paramètres physiques, les spécifications des drones et les poids de chaque mode via un panneau intuitif. Sélectionnez votre modèle IA pour la planification de mission intelligente.",
            "onboarding_skip": "Passer",
            "onboarding_next": "Suivant",
            "onboarding_start": "Commencer",

            // Agent
            "agent_welcome": "Orchestrateur en ligne. L'essaim est synchronisé. Comment puis-je vous aider ?",
            "agent_input_placeholder": "Entrez une commande...",

            // Empty states
            "empty_no_backend": "Pas de connexion au backend",
            "empty_no_backend_desc": "En attente de connexion WebSocket au serveur de simulation...",
            "empty_retry": "Retenter la connexion",
            "empty_no_drones": "Aucun drone actif",
            "empty_no_drones_desc": "Lancez une simulation pour voir la télémétrie.",

            // Confirm dialogs
            "confirm_cancel": "Annuler",
            "confirm_ok": "Confirmer",
            "confirm_reset_title": "Réinitialiser la configuration ?",
            "confirm_reset_message": "Cela réinitialisera tous les paramètres à leurs valeurs par défaut. Cette action est irréversible.",

            // Logs page
            "log_events": "Journal des événements",
            "log_search_placeholder": "Filtrer les événements...",
            "ws_connected": "WebSocket connecté",
            "ws_disconnected": "WebSocket déconnecté",
            "mode_changed": "Mode changé",
            "chat_error": "Impossible de joindre l'orchestrateur",
            "chat_sending": "Réflexion en cours..."
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
