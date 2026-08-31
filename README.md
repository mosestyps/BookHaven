# BookHaven — Library Management Application

## Live Application

**Live URL Frontend:** http://34.10.177.61
**Live URL Backend:** http://35.222.168.44:5000/api/books        

The application is deployed on a managed Google Kubernetes Engine (GKE) cluster on Google Cloud Platform, exposing services via cloud LoadBalancers.

## Architecture

- **Source control:** GitHub, feature-branch workflow with PRs into master
- **CI:** GitHub Actions — lints/tests on every push
- **CD:** GitHub Actions — builds and pushes Docker images to Docker Hub on merge to master
- **Containerization:** Multi-stage Dockerfiles for backend (Node/Express) and frontend (React, served via nginx)
- **Infrastructure & Orchestration:** Google Kubernetes Engine (GKE) managed Kubernetes cluster
- **Deployment & Scaling:** Kubernetes — MongoDB StatefulSet with PersistentVolumeClaim (PVC), backend/frontend Deployments with resource limits, all exposed via cloud LoadBalancer Services

See `explanation.md` for full reasoning behind each phase's design decisions.

## Tech Stack

- Frontend: React
- Backend: Node.js, Express, Mongoose
- Database: MongoDB
- CI/CD: GitHub Actions
- Containerization: Docker
- Orchestration: Kubernetes (GKE) & Docker