# EssaimDrones : Gestion intelligente d'essaims de drones autonomes

![Python](https://img.shields.io/badge/Python-3.11-blue.svg)
![Type](https://img.shields.io/badge/Simulation-Underwater-teal.svg)
![Algorithm](https://img.shields.io/badge/Algorithm-Hydro--Boids-orange.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

Simulateur d'essaim de drones sous-marins utilisant des règles bio-inspirées et une physique hydrodynamique simplifiée. Ce projet implémente le modèle **Hydro-Boids**, une adaptation du modèle de Reynolds intégrant les contraintes du milieu aquatique.

## 🌊 Table des matières
- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Modes de combat](#modes-de-combat)
- [Installation](#installation)
- [Usage](#usage)
- [Tests](#tests)

## 🎯 Présentation
L'objectif est de démontrer un comportement collectif coordonné ("flocking") pour des missions de surveillance ou d'interdiction sous-marine. La simulation prend en compte l'inertie, la traînée quadratique et les courants environnementaux.

### Bio-mimétisme & Hydrodynamique
- **Rheotaxis** : Alignement avec les courants locaux pour minimiser l'effort énergétique.
- **Drafting (Sillage)** : Réduction de traînée de 30% lorsqu'un drone suit un autre dans son cône de sillage.
- **Formations Organiques** : Émergence de micro-alignements dus au bonus de sillage.

## ✨ Fonctionnalités
- **Visualisation 3D en direct** (Matplotlib/PyQt5).
- **Physique Newtonienne** (F=ma) avec gestion de la traînée de l'eau.
- **Comportements d'essaim paramétrables** (Séparation, Alignement, Cohésion).
- **Environnement dynamique** avec champs de courants turbulents.
- **10 modes opérationnels** allant de la patrouille à l'expansion rapide.

## 🏗 Architecture
Le projet est modulaire :
- `underwater_swarm/drone.py` : Logique de l'agent individuel.
- `underwater_swarm/swarm.py` : Cerveau de l'essaim et calcul des forces d'interaction.
- `underwater_swarm/environment.py` : Simulation des courants et de la turbulence.
- `underwater_swarm/simulation.py` : Moteur de simulation principal.
- `underwater_swarm/viz.py` : Visualisation 3D temps réel.

## ⚔ Modes de combat
Le système supporte plusieurs modes tactiques prédéfinis :
- **PATROL** : Dispersion pour couvrir une zone maximale.
- **ATTACK** : Convergence rapide vers une cible avec alignement élevé.
- **DEFEND** : Formation compacte (ballon) avec cohésion maximale.
- **ENCIRCLE** : Orbite tangentielle autour d'une cible détectée.
- **FLASH_EXPANSION** : Dispersion immédiate en cas de danger (biomimétique).

## 🚀 Installation
1. Clonez le dépôt :
```bash
git clone https://github.com/dagornc/EssaimDrones.git
cd EssaimDrones
```

2. Installez les dépendances :
```bash
pip install -r requirements.txt
```

## 💻 Usage
Lancer une simulation interactive avec 30 drones :
```bash
python3 main.py --drones 30 --mode PATROL
```

Lancer une simulation sans interface graphique (Headless) :
```bash
python3 main.py --drones 50 --steps 1000 --no-viz
```

### Arguments CLI :
- `--drones` : Nombre de drones (défaut: 30).
- `--steps` : Nombre de pas de simulation (mode no-viz).
- `--no-viz` : Désactiver la visualisation.
- `--mode` : Mode de départ (`PATROL`, `ATTACK`, `DEFEND`, etc.).

## 🧪 Tests
Exécutez la suite de tests avec pytest :
```bash
export PYTHONPATH=$PYTHONPATH:.
python3 -m pytest
```
