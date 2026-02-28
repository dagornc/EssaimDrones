import { useTranslation } from 'react-i18next';
import { HelpDialog } from './ui/HelpDialog';

interface PageHelpProps {
    path: string;
}

export default function PageHelp({ path }: PageHelpProps) {
    const { t } = useTranslation();

    const getHelpContent = () => {
        switch (path) {
            case '/':
                return {
                    title: "Aide : Tableau de bord (Dashboard)",
                    desc: (
                        <div className="space-y-4 text-justify">
                            <p><strong>À quoi sert cette fenêtre ?</strong><br />
                                Le Tableau de bord est votre centre de commandement principal. Il vous donne une vue d'ensemble instantanée de l'état de votre essaim de drones.</p>
                            <p><strong>Actions possibles :</strong></p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Surveiller les <em>KPIs (Indicateurs Clés)</em> : nombre de drones actifs, niveau de cohésion et violations de sécurité.</li>
                                <li><strong>Changer le comportement (Mode)</strong> : Cliquez sur un des "Swarm Modes" (ex: PATROL, ATTACK) pour ordonner immédiatement à l'essaim de changer de stratégie.</li>
                                <li>Visualiser la formation de base avec le mini-radar 2D.</li>
                                <li>Suivre l'évolution des métriques de performance sur le graphique en temps réel.</li>
                            </ul>
                            <p className="text-xs text-slate-400 mt-4 italic">Astuce : Si le graphique est inactif, vérifiez que le backend et la simulation sont bien démarrés.</p>
                        </div>
                    )
                };
            case '/tactical':
                return {
                    title: "Aide : Vue Tactique 3D",
                    desc: (
                        <div className="space-y-4 text-justify">
                            <p><strong>À quoi sert cette fenêtre ?</strong><br />
                                C'est une visualisation en 3 dimensions de votre environnement sous-marin. Elle vous permet d'interagir directement avec la scène de la simulation.</p>
                            <p><strong>Actions possibles :</strong></p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>Navigation Caméra :</strong> Utilisez la souris (clic gauche pour tourner, clic droit pour drag, molette pour zoomer) pour explorer l'essaim.</li>
                                <li><strong>Placement d'entités :</strong> Utilisez le panneau "Outils de Placement" pour ajouter des ennemis, des alliés ou des obstacles. Réglez la profondeur souhaitée (axe Z) avant de cliquer sur la carte.</li>
                                <li>Ajuster la vitesse de simulation du temps.</li>
                                <li>Basculer entre des vues prédéfinies (Vue de dessus, Vue 3D, Réinitialiser la caméra).</li>
                            </ul>
                        </div>
                    )
                };
            case '/config':
                return {
                    title: "Aide : Configuration",
                    desc: (
                        <div className="space-y-4 text-justify">
                            <p><strong>À quoi sert cette fenêtre ?</strong><br />
                                Cette page vous permet de régler tous les paramètres internes de l'essaim et de la simulation, comme les contraintes physiques ou le modèle IA.</p>
                            <p><strong>Actions possibles :</strong></p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>Physique et Drones :</strong> Ajuster la vitesse max, la masse, ou les forces d'interaction comme la répulsion (Separation) et l'alignement. Cliquez sur "APPLIQUER MODIFICATIONS" pour envoyer ces réglages à la simulation.</li>
                                <li><strong>Modèle IA (LLM) :</strong> Configurer le fournisseur externe (par exemple OpenRouter) que l'agent IA "Orchestrateur" utilisera pour répondre à vos ordres tactiques. Indispensable pour discuter avec l'IA.</li>
                                <li><strong>Import / Export :</strong> Sauvegardez vos réglages dans un fichier pour les recharger plus tard.</li>
                            </ul>
                        </div>
                    )
                };
            case '/metrics':
                return {
                    title: "Aide : Métriques & Analytique",
                    desc: (
                        <div className="space-y-4 text-justify">
                            <p><strong>À quoi sert cette fenêtre ?</strong><br />
                                Cette page est dédiée à l'analyse détaillée des performances de l'essaim. Contrairement au tableau de bord, ici vous trouverez des statistiques historiques par drone individuel.</p>
                            <p><strong>Actions possibles :</strong></p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Rechercher un drone spécifique via son `Drone ID`.</li>
                                <li>Analyser la "Télémétrie par Drone" (Position et Vitesse de chaque UAV).</li>
                                <li>Étudier comment les drones se répartissent la vitesse dans le graphique de distribution.</li>
                                <li>Exporter ou analyser des KPIs plus poussés (comme la distance au centre).</li>
                            </ul>
                        </div>
                    )
                };
            case '/logs':
                return {
                    title: "Aide : Journaux (Logs)",
                    desc: (
                        <div className="space-y-4 text-justify">
                            <p><strong>À quoi sert cette fenêtre ?</strong><br />
                                L'historique technique de tout ce qui s'est passé dans le système de Commandement.</p>
                            <p><strong>Actions possibles :</strong></p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Filtrer les événements pour retrouver une déconnexion, un changement de mode ou une erreur d'intelligence artificielle.</li>
                                <li>Déboguer la communication entre le Navigateur Web et le Serveur Python grâce aux logs système (info, errors).</li>
                            </ul>
                        </div>
                    )
                };
            default:
                return {
                    title: "Aide",
                    desc: <p>Information non disponible pour cette vue.</p>
                };
        }
    };

    const content = getHelpContent();

    return <HelpDialog title={content.title} description={content.desc} />;
}
