# Configuration Azure (Sans Docker)

Pour déployer vos services sans Docker, vous devez créer des **Azure App Services** (Web Apps) natifs pour chaque composant.

## 1. Créer les ressources sur Azure

### Backend Principal (NestJS)
1. Allez sur le portail Azure.
2. Créez une **Web App**.
3. **Runtime stack** : Node 22 LTS.
4. **Operating System** : Linux (recommandé).
5. **Startup Command** : `node dist/main` (à configurer dans "Configuration" > "General settings").

### Microservices (ML Service, Voice API, Road Predictor)
Pour chaque microservice Python :
1. Créez une **Web App**.
2. **Runtime stack** : Python 3.12 (ou version compatible).
3. **Operating System** : Linux.
4. **Startup Command** : `python -m uvicorn main:app --host 0.0.0.0 --port 8000` (ajustez le port et le nom du fichier si nécessaire).

## 2. Configurer les Secrets GitHub

Dans votre dépôt GitHub, allez dans **Settings > Secrets and variables > Actions** et ajoutez les secrets suivants :

| Secret | Description |
| --- | --- |
| `AZUREAPPSERVICE_CLIENTID_32` | Client ID de votre Service Principal Azure |
| `AZUREAPPSERVICE_CLIENTSECRET` | Client Secret de votre Service Principal Azure |
| `AZUREAPPSERVICE_SUBSCRIPTIONID` | ID de votre abonnement Azure |
| `AZUREAPPSERVICE_TENANTID_66` | ID de votre Tenant Azure |
| `MONGO_URI` | L'URL de votre base de données MongoDB (ex: Atlas) |
| `STRIPE_SECRET_KEY` | Votre clé Stripe |
| `OPENAI_API_KEY` | Votre clé OpenAI |
| `GEMINI_API_KEY` | Votre clé Gemini |

## 3. Variables d'Environnement sur Azure

Pour chaque App Service, n'oubliez pas d'ajouter les variables d'environnement (Settings > Configuration) correspondant à votre fichier `.env`.

> [!IMPORTANT]
> Assurez-vous que `BACKEND_URL` et `FRONTEND_URL` sont mis à jour avec les URLs de production (Vercel et Azure).
