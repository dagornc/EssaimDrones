# Rapport Final : Essaim de Drones Sous-Marins Bio-Inspirés

## 1. Objectif et Réalisation
Nous avons conçu et implémenté une simulation d'essaim de drones de combat sous-marins en Python ("Mode YOLO"). L'objectif était de démontrer un comportement collectif coordonné en utilisant des règles bio-inspirées.

**Algorithme Choisi : Hydro-Boids**
*   **Base** : Modèle de Reynolds (Séparation, Alignement, Cohésion).
*   **Bio-Mimétisme** :
    *   **Rheotaxis** : Les drones perçoivent et s'alignent partiellement avec le courant local pour optimiser leur déplacement.
    *   **Drafting (Sillage)** : Implémentation d'un bonus d'hydrodynamisme (réduction de traînée de 30%) lorsqu'un drone se trouve dans le cône de sillage d'un autre, encourageant naturellement les formations en ligne.

## 2. Architecture Technique
Le projet est structuré de manière modulaire dans `underwater_swarm/` :
*   `drone.py` : Agent autonome avec physique newtonienne simplifiée (F=ma) et gestion de la traînée quadratique.
*   `swarm.py` : Cerveau collectif. Calcule les forces d'interaction (voisins) et les forces environnementales.
*   `environment.py` : Simule un champ de courant avec turbulence.
*   `simulation.py` : Boucle principale.
*   `viz.py` : Visualisation 3D avec Matplotlib.

## 3. Résultats de la Simulation
*   **Comportement** : L'essaim parvient à rester groupé tout en se dirigeant vers une cible mouvante.
*   **Fluidité** : Les mouvements sont lissés par l'inertie et la traînée de l'eau, donnant un aspect plus "organique" que des drones aériens.
*   **Formation** : On observe des micro-alignements dus à la règle de drafting, bien que le chaos de la turbulence perturbe les lignes parfaites (réaliste).

## 4. Limites Actuelles
*   **Hydrodynamique** : Modèle très simplifié. Pas de calcul de pression ou de vrais tourbillons (Navier-Stokes est trop lourd pour du temps réel Python simple).
*   **Capteurs** : Vision omnisciente (rayon parfait). Pas d'occlusion ou de bruit de capteur.
*   **Collision** : La force de séparation évite le chevauchement, mais à haute vitesse, des "collisions" physiques pourraient encore survenir théoriquement.

## 5. Pistes d'Amélioration
1.  **Optimisation RL** : Utiliser l'apprentissage par renforcement (Multi-Agent RL) pour que les drones *apprennent* à drafter efficacement au lieu de suivre une règle codée en dur.
2.  **Courants Complexes** : Intégrer des cartes de courants océaniques réels ou des obstacles générant des tourbillons de Von Kármán.
3.  **Scénarios Tactiques** : Ajouter des "prédateurs" ou des zones de danger à éviter (mines), nécessitant une dispersion puis un regroupement.
4.  **Hardware-in-the-loop** : Porter le code de contrôle sur ROS2 pour tester sur de vrais robots simulés (Gazebo).

## Instructions de Lancement
```bash
# Installer les dépendances
pip install -r requirements.txt

# Lancer la simulation (30 drones, 500 pas)
python3.11 main.py --drones 30 --steps 500

# Lancer les tests
export PYTHONPATH=$PYTHONPATH:.
python3.11 -m pytest
```
