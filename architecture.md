# BookHaven — Architecture Diagram

```
Developer (you)
    │
    │ git push
    ▼
GitHub Repository (mosestyps/BookHaven)
    │
    ├─ CI Pipeline (every push) → lint/test/build check
    │
    └─ merge to master
         │
         ▼
    CD Pipeline → builds Docker images → pushes to Docker Hub
         (bookhaven-backend, bookhaven-frontend)


GCP Project (bookhaven-506317)
    │
    ▼
Terraform provisions:
    - VPC + Subnet + Firewall
    - Compute Engine VM (bookhaven-k8s-node)
         │
         ▼
    Ansible configures the VM:
         - Installs k3s (Kubernetes)
         - Confirms Docker images are pullable
         - Prepares MongoDB storage directory
         │
         ▼
    kubectl apply deploys onto k3s:

    ┌─────────────────────────────────────┐
    │         Kubernetes Cluster           │
    │                                       │
    │  MongoDB StatefulSet ── PVC (1Gi)    │
    │       │                              │
    │  mongodb-service (headless)          │
    │       │                              │
    │  Backend Deployment (3 replicas)     │
    │       │  connects via MONGODB_URI    │
    │  backend-service (NodePort 30000)    │
    │       │                              │
    │  Frontend Deployment (3 replicas)    │
    │       │                              │
    │  frontend-service (NodePort 30001)   │
    └─────────────────────────────────────┘
         │
         ▼
    User's browser → http://34.10.177.61 & http://35.222.168.44:5000/api/books 
```
