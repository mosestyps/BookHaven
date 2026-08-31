# BookHaven — Technical Explanation
**Live URL Frontend:** http://34.10.177.61
**Live URL Backend:** http://35.222.168.44:5000/api/books   

## 1. Git Workflow

Work was organized into feature branches, one per phase (e.g. `feature/cicd-pipeline`, `feature/terraform-infra`, `feature/gke-cluster`, `feature/k8s-manifests`), each merged into `master` via Pull Request on GitHub. A `.gitignore` excludes `node_modules`, `.env` files, and Terraform state (`*.tfstate`, `.terraform/`).

## 2. CI/CD Pipeline Design

Two separate GitHub Actions workflows were used:

- **`ci.yml`** — triggers on every push to any branch. Installs backend and client dependencies, runs backend tests (`--if-present`), and builds the client. This gives fast feedback on every commit regardless of branch.
- **`cd.yml`** — triggers only on push to `master` (i.e. after a PR merge). Logs into Docker Hub using GitHub Secrets (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`), then builds and pushes both backend and frontend images, tagged with SemVer using GitHub's built-in `github.run_number` (e.g. `1.0.4`) so each merge produces a uniquely versioned image.

Splitting CI and CD keeps fast/cheap checks (lint/test) separate from expensive checks (image build/push), and ensures untested code never reaches Docker Hub.

## 3. Containerization

Both backend and frontend use **multi-stage Dockerfiles**:

- **Backend**: `node:18-alpine` builder stage installs dependencies, production stage copies only the built app — keeping the image lean.
- **Frontend**: `node:18-alpine` builder stage runs `npm run build` to produce a static React bundle, then a final `nginx:alpine` stage serves the static files. This avoids shipping Node.js and `node_modules` in production — nginx is dramatically smaller and faster for serving static assets.

`.dockerignore` files in both `backend/` and `client/` exclude `node_modules`, logs, `.git`, and `.env` from the build context.

## 4. Docker Compose

`docker-compose.yml` orchestrates three services — backend, frontend, and MongoDB — on a shared network locally for development, with a **named volume** for MongoDB's data directory so data survives container restarts.

## 5. Infrastructure Approach (GKE)

The production infrastructure utilizes **Google Kubernetes Engine (GKE)**, a managed Kubernetes service on Google Cloud Platform. 
- **Managed Control Plane:** GCP manages the underlying master nodes, scaling, and high availability.
- **Worker Nodes:** Compute resources are automatically provisioned and managed within the GKE cluster pool, abstracting away manual VM configuration and providing enterprise-grade reliability compared to a single self-managed VM.

This ensures a robust, production-ready Kubernetes environment where cloud components like LoadBalancers seamlessly integrate with the cluster services.

## 6. Kubernetes Object Choices

- **StatefulSet (not Deployment) for MongoDB**: MongoDB needs a stable identity and stable, non-shared storage. A StatefulSet with a `volumeClaimTemplate` guarantees the same PersistentVolumeClaim is reattached to the same pod across restarts — a plain Deployment with a shared volume would risk data corruption from multiple replicas writing to the same volume.
- **ClusterIP Service for MongoDB** (`clusterIP: None` / headless service): gives the backend a stable DNS name to connect directly to the specific MongoDB pod.
- **Deployments for backend and frontend**: both are stateless — any replica can serve any request — so a Deployment is appropriate, giving redundancy and rolling-update / recreate strategies.
- **Exposure method**: Cloud **LoadBalancer Services** expose both backend (`5000`) and frontend (`80`) externally via dedicated cloud IPs, making the app globally reachable.
- **Persistent storage**: a PersistentVolumeClaim backs MongoDB's data directory, ensuring data persistence across pod rescheduling.
- **Resource requests/limits**: set deliberately on every container to manage cluster capacity efficiently.

## 7. How It All Connects
  
Push to GitHub → CI runs lint/tests on every branch
→ merge to master triggers CD
→ CD builds + pushes Docker images to Docker Hub
→ GKE cluster runs the Kubernetes manifests (`kubectl apply`)
→ App is live and reachable at http://34.10.177.61 & http://35.222.168.44:5000/api/books  
Each phase's output is a direct input to the next: CD's pushed images are what Kubernetes pulls and deploys to GKE.