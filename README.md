# EssaimDrones : Système Avancé de Commandement d'Essaims Sous-marins

![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![Type](https://img.shields.io/badge/Simulation-Underwater-teal.svg)
![Algorithm](https://img.shields.io/badge/Algorithm-Hydro--Boids-orange.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

**EssaimDrones**, également connu sous le nom de **AquaSwarm**, est une plateforme de commandement et de contrôle de nouvelle génération avec un focus sur les environnements sous-marins et les comportements biomimétiques. En utilisant les modèles Hydro-Boids et des orchestrateurs IA pour la planification, ce projet permet de simuler et visualiser l'évolution de drones pour des missions complexes.

## 🌊 Table des matières
- [Présentation](#présentation)
- [Architecture](#architecture)
- [Fonctionnalités & Modes](#fonctionnalités--modes)
- [Installation](#installation)
- [Usage](#usage)
- [Documentation](#documentation)
- [Tests & Qualité](#tests--qualité)

## 🎯 Présentation
L'objectif du projet est de gérer un comportement collectif en environnement hydrodynamique (courants turbulents, sillage). L'intégration récente d'un front-end en React et d'une orchestration Backend IA rend possible le commandement multi-agent en temps réel, ainsi qu'une interaction fluide grâce aux websockets.

## 🏗 Architecture
L'arborescence suit des principes stricts et une séparation claire Backend/Frontend :

- `Code/Backend` : Système Python utilisant FastAPI et agents LangChain (OpenAI/Gemini). Logiques de simulation hydrodynamiques (`underwater_swarm`), API WebSocket, gestion des drones.
- `Code/Frontend` : Application Web React + Tailwind + Vite (Shadcn/UI, React Flow), offrant un Dashboard temps-réel avec mode clair/sombre, timers de mission et interaction directe avec l'Orchestrateur.
- `Cmd/` : Scripts shell standalone (lancement, ingestion, etc).
- `Config/` : Fichiers YAML de configuration globaux.
- `Doc/` : Documentation générée (Sphinx, pdoc).
- `Log/` : Fichiers logs (ex: firebase-debug.log).
- `Test/` : Tests unitaires, de couverture, tests pytest pour backend/frontend.

## ✨ Fonctionnalités & Modes
- **Interface Utilisateur Moderne** : Dashboard fluide, statistiques des flottes, logs, sélecteur LLM avec persistance locale (SQLite).
- **Communication Temps Réel** : WebSockets pour recevoir l'état des drones (position, statut, batterie) 60 fois par seconde.
- **Orchestrateur IA** : Module IA permettant d'interagir via chat (LangChain, GPT-OSS/Gemini) pour envoyer des missions tactiques.
- **Modes de combat** :
  - **PATROL** : Dispersion et couverture maximale.
  - **ATTACK** : Attaque alignée rapide.
  - **DEFEND** : Cohésion maximale (formation compacte).
  - **ENCIRCLE** : Encerclement en tangente.
  - **FLASH_EXPANSION** : Dispersion d'urgence.
  - **RECON** / **SWARM_DISPERSAL** etc...

## 🚀 Installation

1. Cloner le projet :
```bash
git clone https://github.com/dagornc/EssaimDrones.git
cd EssaimDrones
```

2. Configuration de l'environnement Python :
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

3. Configuration Frontend (Node.js requis) :
```bash
cd Code/Frontend
npm install
```

4. Variables d'environnement :
Copiez `.env.example` en `.env` (à la racine) et ajoutez votre `OPENROUTER_API_KEY`.

## 💻 Usage

### Lancement Rapide
Un script `start.sh` est disponible pour lancer le backend, le frontend et ouvrir automatiquement le navigateur:
```bash
./start.sh
```

### Lancement Manuel
**Backend** :
```bash
cd Code/Backend
python -m uvicorn api.main:app --reload --port 8000
```

**Frontend** :
```bash
cd Code/Frontend
npm run dev
```

## 📖 Documentation
La documentation complète du projet Backend est générée via **Sphinx** :
```bash
cd Doc/sphinx
make html
```
Les fichiers HTML générés sont consultables dans `Doc/sphinx/_build/html/`.

## 🧪 Tests & Qualité
Le code est conçu selon des principes stricts (TDD) et une Qualité Gate forte :
- Exécution de Mypy (Typage statique) et Flake8 (Linting).
- Couverture Tests à plus de 95% minimum.
```bash
# Tests Backend
pytest Test/

# Tests Frontend
cd Code/Frontend
npm run test:coverage
```

### Analyse SonarQube
Un fichier `sonar-project.properties` est configuré à la racine pour assurer le respect des métriques de qualité globales (Backend + Frontend).
Pour lancer l'analyse locale (nécessite `sonar-scanner` installé) :
```bash
sonar-scanner
```

> Application conçue avec une approche Lean, orientée Artifact-first par l'Agent Antigravity.
