# Guide de Test et de Déploiement via WSL

Puisque vous venez d'installer WSL, suivez ces étapes pour tester votre projet DevOps localement.

## 1. Accéder à votre projet depuis WSL
Ouvrez votre terminal WSL (Ubuntu par exemple). Votre bureau Windows est accessible via le chemin `/mnt/c/`.
Naviguez vers votre projet :
```bash
cd /mnt/c/Users/Mega\ Pc/Desktop/fullstakers-main
```

## 2. Installation des outils nécessaires (dans WSL)
Vous aurez besoin de Docker et d'un cluster Kubernetes local (Minikube ou Kind).

### Installer Docker
Si vous avez "Docker Desktop" sur Windows, assurez-vous que l'option **"Use the WSL 2 based engine"** et **"WSL Integration"** pour votre distro sont activées dans les paramètres de Docker Desktop.

### Installer Kubectl (pour commander Kubernetes)
```bash
sudo apt-get update && sudo apt-get install -y apt-transport-https ca-certificates curl
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.28/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.28/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update
sudo apt-get install -y kubectl
```

## 3. Tester les tests unitaires et la couverture
Avant de lancer les pipelines, vérifiez que les commandes de test fonctionnent :

**Backend (NestJS) :**
```bash
cd back-end
npm install
npm run test:cov
```
*Cela génèrera un dossier `coverage/` utilisé par SonarQube.*

**Frontend (React) :**
```bash
cd ../front-end
npm install
npm test -- --coverage --watchAll=false
```

## 4. Tester Kubernetes localement
Si vous avez activé Kubernetes dans les paramètres de **Docker Desktop**, vous pouvez simplement faire :

```bash
cd /mnt/c/Users/Mega\ Pc/Desktop/fullstakers-main/devops/k8s
kubectl apply -f backend-k8s.yml
kubectl apply -f frontend-k8s.yml
```

Vérifiez que vos pods démarrent :
```bash
kubectl get pods -n fullstakers
```

## 5. Lancer l'Analyse SonarQube (Localement)
Si vous voulez tester SonarQube sans Jenkins :
1. Lancez un container SonarQube :
   ```bash
   docker run -d --name sonarqube -p 9000:9000 sonarqube
   ```
2. Lancez le scanner depuis la racine du projet :
   ```bash
   npx sonar-scanner
   ```

## 6. Pour Jenkins (Partie CI/CD)
Pour vraiment tester les `Jenkinsfile`, vous devrez installer Jenkins (via Docker c'est le plus simple) :
```bash
docker run -d -p 8080:8080 -p 50000:50000 --name jenkins jenkins/jenkins:lts
```
Ensuite, allez sur `localhost:8080`, installez les plugins (Pipeline, Docker, SonarQube) et créez vos jobs.
