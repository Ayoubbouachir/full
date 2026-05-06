FROM node:18-alpine

WORKDIR /app

# On copie les fichiers de dépendances
COPY package*.json ./

# On force l'installation propre avec le drapeau nécessaire pour les conflits de votre projet
RUN npm install --legacy-peer-deps

# On copie tout le code
COPY . .

# On expose le port 3001 (celui que vous utilisez dans votre compose)
EXPOSE 3001

# On force React à démarrer sur le port 3001 pour correspondre à votre Windows
ENV PORT=3001

# On lance le serveur de développement (votre logo apparaîtra !)
CMD ["npm", "start"]
