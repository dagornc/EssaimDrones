# Spécifications du Système d'Essaim de Drones Sous-marins

## 1. Objet et périmètre
Le système vise à contrôler un essaim de drones de combat sous‑marins autonomes, coopératifs et biomimétiques, capables d’exécuter des missions de surveillance, d’interdiction et de combat dans un environnement sous‑marin contesté.
Le cahier des charges couvre exclusivement la partie “commande et contrôle de l’essaim” (C2 essaim, coordination, modes de mouvement bio‑inspirés), en supposant que la conception matérielle (coque, propulsion, armement, capteurs physiques) est traitée par d’autres documents.

## 2. Architecture fonctionnelle de contrôle
Imposer une architecture à trois couches:

*   **Couche stratégique / C2**: opérateur humain, planification de mission, règles d’engagement.
*   **Couche essaim**: coordination multi‑drones, gestion de formation, allocation de tâches, transitions de modes bio‑inspirés.
*   **Couche locale drone**: navigation, stabilisation, évitement de collision, exécution d’actions élémentaires.

L’architecture doit être hybride: contrôle principalement distribué, avec la possibilité de leaders ou nœuds de référence redondants pour certaines formations ou missions spécifiques.

## 3. Modes de comportement biomimétiques
Le système doit implémenter au minimum les modes de mouvement suivants, inspirés de comportements collectifs animaux:

*   **Mode “Banc de poissons” (schooling 3D)**: formation serrée, alignement des vitesses, cohésion forte, optimisation de la signature acoustique et hydrodynamique pour le transit discret.
*   **Mode “Meute de prédateurs”**: sous‑groupes coordonnés pour l’encerclement, la poursuite, le harcèlement et le “canalisationnement” de cibles sous‑marines.
*   **Mode “Nuée exploratrice”**: dispersion contrôlée de l’essaim pour balayage de zone, recherche de cibles, cartographie, avec regroupement dynamique autour d’événements détectés.

Chaque mode doit être spécifié par:
*   Un ensemble de règles locales attraction / répulsion / alignement, avec plages paramétriques documentées et testées.
*   Une portée de perception locale (distance, angle) pour la prise en compte des voisins et obstacles.
*   Des critères d’entrée / sortie de mode (conditions tactiques, seuils de densité, ordres du C2).

## 4. Coordination, communications et capteurs
Le système doit privilégier la coordination implicite via:
*   Observation des voisins (position relative, vitesse, attitude) à partir de capteurs embarqués.
*   Comportements locaux garantissant la formation et la connectivité de l’essaim sans communications permanentes.

Les communications acoustiques explicites doivent être:
*   Faible débit, intermittentes, robustes aux perturbations, utilisées pour les changements de mission, les synchronisations globales ou la diffusion d’alertes critiques.
*   Couplées à des stratégies de fonctionnement dégradé: l’essaim doit continuer à opérer sur la base de règles locales et d’objectifs mémorisés en cas de perte prolongée de lien.

Exigences capteurs (à adapter au système réel):
*   Sonar passif/actif pour détection d’obstacles, de terrain et de cibles.
*   Centrale inertielle + DVL ou équivalent pour navigation.
*   Capteurs éventuels optiques ou autres en eaux peu profondes ou claires.

## 5. Stratégies de formation et de mouvement
Le cahier des charges doit imposer des stratégies de formation 3D adaptées au milieu sous‑marin:
*   Formations leader–follower avec contrôleurs de distance‑basés robustes, ne dépendant que des mesures locales des voisins.
*   Formations hybrides combinant structure centralisée (trajectoire de référence) et lois de contrôle distribuées pour maintenir les distances et la cohésion.

Les algorithmes de formation doivent:
*   Garantir la stabilité des formations pour des vitesses et des courants dans des plages spécifiées.
*   Intégrer des contraintes de collision (entre drones et avec l’environnement) et de connectivité minimale du graphe d’interactions.

## 6. IA, apprentissage et prise de décision
Le cahier des charges doit autoriser l’usage de méthodes d’IA distribuée (par ex. RL multi‑agents / MARL) pour l’optimisation des comportements coopératifs, mais avec:
*   Entraînement hors‑ligne (simulation, bassin, essais contrôlés) et politiques “gelées” en opération.
*   Paramètres adaptatifs bornés clairement spécifiés, afin de limiter les dérives et effets non désirés.

Les modes bio‑inspirés doivent être modélisés comme des “compétences” ou options hiérarchiques que la politique de haut niveau peut activer ou combiner selon le contexte tactique.

La prise de décision doit respecter une hiérarchie claire:
*   Règles symboliques de sécurité / droit des conflits armés / non‑fratricide prioritaire sur les politiques apprises.
*   Possibilité pour l’opérateur humain d’imposer, via le C2, le mode de comportement, des zones interdites et des objectifs prioritaires.

## 7. Sécurité, sûreté, vérifiabilité
Les fonctions suivantes doivent être considérées comme critiques sécurité et spécifiées pour être vérifiables (tests poussés, voire méthodes formelles):
*   Évitement de collision (entre drones, objets, fonds, surface).
*   Respect des zones interdites (géofencing 3D).
*   Règles d’engagement minimales (pas d’action létale sans conditions explicites satisfaites).

Le système doit prévoir des modes de sécurité:
*   Repli automatique vers un point sûr.
*   Immobilisation contrôlée.
*   Auto‑neutralisation / désactivation sécurisée en cas de compromission ou de perte de contrôle prolongée, conformément aux politiques nationales.

Exiger une journalisation détaillée des décisions de l’essaim (mode actif, cibles, événements critiques) pour permettre des analyses a posteriori et des enquêtes.

## 8. Performance, essais et validation
Définir des métriques de performance minimales, par exemple:
*   Stabilité de formation (erreur de distance moyenne entre drones, temps de convergence).
*   Efficacité de balayage / exploration (taux de couverture de zone, temps de détection de cible).
*   Résilience (capacité à poursuivre la mission avec X% de drones perdus ou déconnectés).

Imposer un plan d’essais multi‑niveaux:
*   Simulations numériques massives avec modèles environnementaux réalistes et adversaires simulés.
*   Essais contrôlés en bassin puis en mer, avec scénarios normaux et dégradés (brouillage, pannes, pertes de drones).
*   Protocoles d’essais pour calibrer et valider chaque mode bio‑inspiré sur des plages paramétriques documentées.

## 9. Contraintes d’intégration biomimétique
Le cahier des charges doit expliciter les exigences spécifiques liées au biomimétisme:
*   Compatibilité avec des systèmes de propulsion bio‑inspirés (nage ondulatoire, nage battante, propulsion hybride), en tenant compte de leurs signatures acoustiques et de leurs enveloppes de vitesse / manœuvrabilité.
*   Contrainte de réalisme comportemental: les formations et mouvements ne doivent pas compromettre la ressemblance avec la faune marine lorsque la furtivité par biomimétisme est un objectif.

## 10. Limitations et risques à signaler
Le document doit mentionner explicitement que:
*   La certifiabilité complète de comportements issus de MARL pour des systèmes létaux reste un problème de recherche ouvert; l’usage de ces techniques doit donc être circonscrit et encadré.
*   Les analogies avec bancs de poissons ou meutes sont des sources d’inspiration mais non des preuves de robustesse; seules la simulation, les essais et les métriques formelles doivent servir de base à l’acceptation.
