## Live Application

**Live URL:** http://34.61.63.222:30001

The application is deployed on a self-managed Kubernetes (k3s) cluster running on a Google Cloud Platform Compute Engine instance, provisioned via Terraform and configured via Ansible.

## Architecture

- **Source control:** GitHub, feature-branch workflow with PRs into master
- **CI:** GitHub Actions — lints/tests on every push
- **CD:** GitHub Actions — builds and pushes Docker images to Docker Hub on merge to master
- **Containerization:** Multi-stage Dockerfiles for backend (Node/Express) and frontend (React, served via nginx)
- **Infrastructure:** Terraform provisions a GCP VPC, subnet, firewall, and Compute Engine VM
- **Configuration management:** Ansible installs k3s (lightweight Kubernetes) on the VM and prepares MongoDB storage + confirms Docker image availability
- **Orchestration:** Kubernetes — MongoDB StatefulSet with PersistentVolumeClaim, backend/frontend Deployments with resource limits, all exposed via NodePort Services

See `explanation.md` for full reasoning behind each phase's design decisions.

## Tech Stack

- Frontend: React (Create React App)
- Backend: Node.js, Express, Mongoose
- Database: MongoDB
- CI/CD: GitHub Actions
- Containerization: Docker, Docker Compose
- IaC: Terraform (GCP)
- Configuration Management: Ansible
- Orchestration: Kubernetes (k3s)
