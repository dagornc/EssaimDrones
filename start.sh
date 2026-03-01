#!/bin/bash

echo "=== 🚀 Démarrage du centre de commandement AquaSwarm ==="

# 1. Vérification des prérequis Python
echo "📦 Vérification des dépendances Python backend..."
if [ ! -d ".venv" ]; then
    echo "❌ Erreur: L'environnement virtuel .venv n'existe pas."
    echo "Veuillez exécuter: python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

source .venv/bin/activate
if ! python3 -c "import fastapi, uvicorn, langchain" 2>/dev/null; then
    echo "⚠️ Certaines dépendances Python sont manquantes. Installation depuis requirements.txt..."
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "❌ Échec de l'installation des dépendances Python."
        exit 1
    fi
else
    echo "✅ Dépendances Python OK."
fi

# 2. Vérification des prérequis Node / Frontend
echo "📦 Vérification des dépendances Node frontend..."
if [ ! -d "Code/Frontend/node_modules" ]; then
    echo "⚠️ Le dossier node_modules est introuvable. Installation des dépendances NPM..."
    cd Code/Frontend && npm install && cd ../..
    if [ $? -ne 0 ]; then
        echo "❌ Échec de l'installation des dépendances NPM."
        exit 1
    fi
else
    echo "✅ Dépendances NPM OK."
fi

# 3. Test de la connexion LLM
echo "🌐 Test de la connexion au LLM..."
if [ ! -f ".env" ]; then
    echo "❌ Fichier .env manquant à la racine du projet."
    exit 1
fi

# Charger les variables du .env (compatible avec les valeurs contenant des espaces)
set -a
[ -f .env ] && source .env
set +a

if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "⚠️ Attention: OPENROUTER_API_KEY n'est pas définie dans .env"
    echo "L'Orchestrateur Intelligence Artificielle sera inactif. Configurez la clé dans l'UI."
else
    MODEL="${LLM_MODEL:-meta-llama/llama-3.3-70b-instruct:free}"
    echo "Test du modèle en cours : $MODEL..."

    # Test API OpenRouter
    HTTP_STATUS=$(curl -s -o /tmp/openrouter_test.json -w "%{http_code}" \
      -H "Authorization: Bearer $OPENROUTER_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"model\": \"$MODEL\", \"messages\": [{\"role\": \"user\", \"content\": \"ping\"}]}" \
      "https://openrouter.ai/api/v1/chat/completions")

    if [ "$HTTP_STATUS" -ne 200 ]; then
        echo "⚠️ Échec de la connexion LLM (HTTP $HTTP_STATUS) - Modèle possiblement surchargé ou clé non valide."
        cat /tmp/openrouter_test.json 2>/dev/null
        echo ""
        echo "L'application démarrera quand même. Veuillez vérifier votre modèle depuis l'Interface Utilisateur."
    elif grep -q '"error"' /tmp/openrouter_test.json 2>/dev/null; then
        echo "⚠️ Échec API de la connexion LLM:"
        cat /tmp/openrouter_test.json 2>/dev/null
        echo ""
        echo "L'application démarrera quand même. Veuillez vérifier votre modèle ou clé dans UI."
    else
        echo "✅ Test de connexion LLM réussi!"
    fi
fi


# 4. Lancement asynchrone Backend & Frontend
# On capture le code de fin en tuant tout le groupe à la sortie
trap 'kill 0' SIGINT SIGTERM EXIT

echo "🚀 Lancement du Backend en arrière-plan..."
bash Cmd/start_backend.sh &
BACKEND_PID=$!
sleep 3

echo "🚀 Lancement du Frontend en arrière-plan..."
bash Cmd/start_frontend.sh &
FRONTEND_PID=$!
sleep 3

# 5. Lancement de Google Chrome sur l'application
echo "🌐 Ouverture de l'application sous Google Chrome..."
if command -v google-chrome &> /dev/null; then
    google-chrome "http://localhost:5173" &
elif command -v google-chrome-stable &> /dev/null; then
    google-chrome-stable "http://localhost:5173" &
elif [ "$(uname)" == "Darwin" ]; then
    # MacOS
    open -a "Google Chrome" "http://localhost:5173" &
else
    echo "⚠️ Google Chrome non trouvé. Veuillez ouvrir manuellement http://localhost:5173"
fi

echo "✅ Application démarrée."
echo "Appuyez sur 'Ctrl+C' pour fermer le backend et le frontend."

# Attendre la fermeture
wait $BACKEND_PID $FRONTEND_PID
