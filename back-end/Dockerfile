FROM node:20

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système nécessaires
RUN apt-get update && apt-get install -y build-essential python3 && rm -rf /var/lib/apt/lists/*

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances et forcer la compilation des modules natifs pour Linux
RUN npm install && npm install @css-inline/css-inline-linux-x64-gnu && npm rebuild @css-inline/css-inline

# Copier le reste du code de l'application
COPY . .

# Construire l'application NestJS
RUN npm run build

# Exposer le port utilisé par NestJS (par défaut 3000)
EXPOSE 3000

# Commande pour démarrer l'application en production
CMD ["npm", "run", "start:prod"]
