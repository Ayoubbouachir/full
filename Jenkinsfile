pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                git branch: 'salim', url: 'https://github.com/marambeji/fullstakers.git'
            }
        }

        stage('Build Backend (Node.js)') {
            steps {
                dir('back-end') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

  stage('Frontend Build') {
            steps {
                dir('front-end') {
                    sh 'npm install --legacy-peer-deps'
                    sh 'CI=false npm run build'
                }
            }
        }

        stage('MVN SONARQUBE') {
            steps {
                // 'SonarQube' doit être le nom du serveur configuré dans Jenkins -> Administration -> Système
                withSonarQubeEnv('SonarQube') {
                    // Attention: Mvn est pour Java. Votre projet est Node.js.
                    // S'il s'agit strictement d'un atelier Java, la commande est :
                    sh 'mvn sonar:sonar'
                    
                    // Si vous analysez le code Node.js actuel, décommentez plutôt ceci :
                    // sh 'npx sonar-scanner'
                }
            }
        }

    }
}
