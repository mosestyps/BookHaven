# BookHaven — Architecture Diagram

```text
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
         (njengamoses/bookhaven-backend, njengamoses/bookhaven-frontend)


GCP Project (bookhaven-506317)
    │
    ▼
Google Kubernetes Engine (GKE) Cluster
    │
    ▼
    kubectl apply deploys manifests:

    ┌────────────────────────────────────────────────────────┐
    │                 Google Kubernetes Engine               │
    │                                                        │
    │  MongoDB StatefulSet ── Persistent Volume Claim (PVC)  │
    │       │                                                │
    │  mongodb-service (ClusterIP)                           │
    │       │                                                │
    │  Backend Deployment (Replicas)                         │
    │       │  connects via MONGODB_URI                      │
    │  backend-service (LoadBalancer)                        │
    │       │                                                │
    │  Frontend Deployment (Replicas / Recreate Strategy)    │
    │       │                                                │
    │  frontend-service (LoadBalancer)                       │
    └────────────────────────────────────────────────────────┘
         │
         ▼
    User's browser → [http://34.10.177.61](http://34.10.177.61) (Frontend) & [http://35.222.168.44:5000/api/books](http://35.222.168.44:5000/api/books) (Backend API)