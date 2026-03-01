# 🌊 EssaimDrones (AquaSwarm) : Système de Commandement Tactique

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg?style=for-the-badge&logo=python)
![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-v0.100+-009688.svg?style=for-the-badge&logo=fastapi)
![LangChain](https://img.shields.io/badge/LangChain-Enabled-white.svg?style=for-the-badge&logo=chainlink)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg?style=for-the-badge&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)

**EssaimDrones** est une plateforme de simulation et de contrôle tactique pour essaims de drones sous-marins autonomes. Le système intègre des algorithmes biomimétiques (Hydro-Boids) et une orchestration par Intelligence Artificielle (LangGraph) pour des missions de surveillance, défense et exploration.

---

## 📋 Table des matières
1. [🎯 Présentation](#-présentation)
2. [🏗 Architecture du Système](#-architecture-du-système)
3. [✨ Fonctionnalités Clés](#-fonctionnalités-clés)
4. [🧠 Intelligence Collective & Modes](#-intelligence-collective--modes)
5. [🚀 Installation](#-installation)
6. [💻 Usage](#-usage)
7. [🧪 Tests & Qualité](#-tests--qualité)
8. [📖 Documentation](#-documentation)
9. [🗺 Roadmap](#-roadmap)

---

## 🎯 Présentation

Le projet **EssaimDrones** vise à simuler des comportements collectifs complexes au sein d'une flotte de drones sous-marins. Contrairement aux approches centralisées classiques, AquaSwarm repose sur l'émergence de comportements à partir de règles locales simples, supervisées par une IA tactique de haut niveau.

### 🌀 Le Cycle de Commandement
```mermaid
graph TD
    A[🎯 Objectif de Mission] --> B{🧠 Orchestrateur IA}
    B -->|Choix Tactique| C[🐟 Contrôleur d'Essaim]
    C -->|Forces Physiques| D[🛸 Drones Individuels]
    D -->|Métriques & Capteurs| E[📊 Analyse Temps Réel]
    E --> B
    
    style B fill:#f3e5f5,stroke:#4a148c
    style C fill:#fff3e0,stroke:#e65100
    style D fill:#e1f5fe,stroke:#01579b
```

---

## 🏗 Architecture du Système

L'architecture est conçue pour la performance et l'extensibilité, utilisant **FastAPI** pour la communication asynchrone et **NumPy** pour les calculs vectorisés.

### 🧱 Décomposition des Composants
```mermaid
graph TD
    subgraph "Frontend (React + Vite)"
        V[Vue Tactique Canvas]
        D[Dashboard Metrics]
        C[Agent Chat Interface]
        H[Hooks WebSocket]
    end

    subgraph "Backend (FastAPI)"
        S[Engine: NumPy Physics]
        O[Orchestrator: LangGraph Agent]
        A[API: WebSocket/REST]
        DB[(SQLite DB)]
    end

    H <--> A
    A <--> S
    S <--> O
    O <--> DB
    
    style S fill:#fff3e0,stroke:#e65100
    style O fill:#f3e5f5,stroke:#4a148c
    style V fill:#e8f5e9,stroke:#2e7d32
```

---

## ✨ Fonctionnalités Clés

Le système AquaSwarm offre un ensemble complet d'outils pour la gestion d'essaims :

```mermaid
mindmap
  root((AquaSwarm))
    Physique
      Biomimétisme Boids
      Optimisation PSO
      Effet Drafting
    Intelligence
      Agent LangGraph
      Multi-LLM Support
      Analyse Tactique
    Interface
      Visualisation 2D/3D
      Logs Interactifs
      Configuration Dynamique
    Qualité
      Tests Pytest/Vitest
      Typage Mypy
      CI/CD Ready
```

---

## 🧠 Intelligence Collective & Modes

L'essaim peut adopter différentes formations et stratégies selon la situation.

### ⚔️ Modes de Combat & Formations
| Mode | Schéma Conceptuel | Description |
| :--- | :--- | :--- |
| **PATROL** | `⸫ ⸪ ⸬` | Dispersion optimisée pour couvrir une zone maximale. |
| **ATTACK** | `▶ ▶ ▶` | Formation en pointe (wedge) pour percer une défense. |
| **SHIELD** | `( ⦿ )` | Formation sphérique dense autour d'une cible alliée. |
| **ENCIRCLE**| `⟳ ⦿ ⟲` | Encerclement tangentiel pour neutraliser une cible. |

### 🔄 Logique de Transition
```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Patrol : Start Mission
    Patrol --> Attack : Threat Detected
    Attack --> Patrol : Target Neutralized
    Patrol --> Search : Zone Unknown
    Search --> Patrol : Pattern Complete
    any --> Flash_Expansion : Critical Hazard!
```

---

## 🚀 Installation

L'installation est simplifiée par l'utilisation d'environnements virtuels et de gestionnaires de paquets modernes.

### 🛠 Workflow d'Installation
```mermaid
flowchart LR
    A[Clone Repo] --> B[Create Venv]
    B --> C[Install Python Deps]
    C --> D[Install NPM Deps]
    D --> E[Config .env]
    E --> F[Launch start.sh]
    
    style F fill:#dcedc8,stroke:#33691e
```

1. **Backend** : `pip install -r requirements.txt`
2. **Frontend** : `cd Code/Frontend && npm install`
3. **Variables** : Configurer la clé `OPENROUTER_API_KEY` dans le fichier `.env`.

---

## 💻 Usage

### 🎮 Expérience Utilisateur
```mermaid
journey
    title Utilisation d'AquaSwarm
    section Démarrage
      Lancer start.sh: 5: User
      Vérification Services: 3: App
      Ouverture Browser: 5: App
    section Mission
      Configurer Flotte: 4: User
      Sélectionner LLM: 4: User
      Envoyer Ordre Chat: 5: User
    section Analyse
      Suivre Métriques: 4: User
      Consulter Logs: 3: User
```

- **Automatique** : `./start.sh` (recommandé).
- **Manuel** : Lancer `uvicorn` (port 8000) et `npm run dev` (port 5173).

---

## 🧪 Tests & Qualité

La robustesse du système est garantie par une suite de tests complète couvrant tous les niveaux de l'application.

### 📐 Pyramide des Tests
```mermaid
graph BT
    U[Unit Tests: Pytest/Vitest] --> I[Integration: API/WebSocket]
    I --> E[E2E: Simulation Scenarios]
    E --> Q[Quality: Sonar/Mypy/Lint]
    
    style U fill:#c8e6c9
    style I fill:#fff9c4
    style E fill:#ffccbc
    style Q fill:#e1f5fe
```

### Commandes utiles :
- `pytest Test/` : Lance les tests unitaires backend.
- `npm run test` : Lance les tests unitaires frontend.
- `mypy Code/Backend` : Vérification du typage statique.

---

## 📖 Documentation

Consultez la documentation technique complète générée via **Sphinx** pour plus de détails sur les classes et algorithmes.

```bash
cd Doc/sphinx
make html
```

---

## 🗺 Roadmap
- [ ] **2024.Q4** : Support Multi-Swarm (Flottes adverses).
- [ ] **2025.Q1** : Intégration de modèles de drones 3D complexes.
- [ ] **2025.Q2** : Déploiement Cloud (Docker/K8s).

---
*Développé avec ❤️ pour l'innovation sous-marine.*
> **Contact** : [Dagornc sur GitHub](https://github.com/dagornc)
