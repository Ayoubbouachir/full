# DevOps Project Roadmap: Full Stack JS

This document outlines the implementation of the DevOps requirements for the Full Stack project.

## 1. CI/CD Pipelines
We have implemented 4 distinct pipelines located in `devops/cicd/`:
- **Backend CI (`Jenkinsfile.backend.ci`)**: Code checkout, dependency installation, unit testing with coverage, SonarQube analysis, security scanning (Trivy), and Docker image push.
- **Frontend CI (`Jenkinsfile.frontend.ci`)**: Similar flow for the React application.
- **Backend CD (`Jenkinsfile.backend.cd`)**: Automatically triggered by CI. Deploys the built image to the Kubernetes cluster using `kubectl`.
- **Frontend CD (`Jenkinsfile.frontend.cd`)**: Automatically triggered by CI. Deploys the React app to K8s.

## 2. Code Quality (SonarQube)
- **Configuration**: Managed via `sonar-project.properties` at the root and specific parameters in Jenkinsfiles.
- **Test Coverage**: Backend uses `npm run test:cov` (NestJS) and Frontend uses `npm test -- --coverage` (Jest). Reports are sent to SonarQube.
- **Presentation Tip**: Take a screenshot of the dashboard *before* fixing linting/test issues, then another *after* applying the suggested refactorings.

## 3. Kubernetes Architecture
The deployment manifests are in `devops/k8s/`:
- **Architecture**: Distributed system using Namespaces (`fullstakers` and `monitoring`).
- **Scalability**: Deployments are configured with multiple replicas for high availability.
- **Networking**: Service types `ClusterIP` for backend and `LoadBalancer` (or `NodePort`) for frontend.

## 4. Monitoring & Alerting
Located in `devops/monitoring/`:
- **Prometheus**: Scrapes metrics from the backend (port 3000) thanks to annotations.
- **Grafana**: Visualizes the performance of both apps and DevOps tools.
- **Alert Manager**: Configured to send notifications if services go down or performance degrades.

## 5. Excellence Points (Bonus)
- **Security Scanning**: Integrated **Trivy** in the CI pipelines to scan Docker images for vulnerabilities.
- **Health Checks**: Liveness and Readiness probes added to Kubernetes deployments.
- **Centralized Logging**: (Optional Suggestion) Add **Loki** and **Promtail** for logs visualization in Grafana.

---

### How to Run
1. **Jenkins**: Create 4 Pipeline jobs in Jenkins and point them to their respective Jenkinsfiles in the repository.
2. **Kubernetes**: Run `kubectl apply -f devops/k8s/` and `kubectl apply -f devops/monitoring/`.
3. **SonarQube**: Ensure your Jenkins handles the `sonar-token` credentials.
