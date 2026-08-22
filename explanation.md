# BookHaven — Technical Explanation

## 1. Git Workflow

Work was organized into feature branches, one per phase (e.g. `feature/cicd-pipeline`, `feature/terraform-infra`, `feature/ansible-k3s`, `feature/k8s-manifests`), each merged into `master` via Pull Request on GitHub. A `.gitignore` excludes `node_modules`, `.env` files, Terraform state (`*.tfstate`, `.terraform/`), and the real `inventory.ini` (which contains the VM's IP, gitignored in favor of a committed `inventory.ini.example` template, since the IP changes on every `terraform apply`).

## 2. CI/CD Pipeline Design

Two separate GitHub Actions workflows were used:

- **`ci.yml`** — triggers on every push to any branch. Installs backend and client dependencies, runs backend tests (`--if-present`), and builds the client. This gives fast feedback on every commit regardless of branch.
- **`cd.yml`** — triggers only on push to `master` (i.e. after a PR merge). Logs into Docker Hub using GitHub Secrets (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`), then builds and pushes both backend and frontend images, tagged with SemVer using GitHub's built-in `github.run_number` (e.g. `1.0.4`) so each merge produces a uniquely versioned image.

Splitting CI and CD keeps fast/cheap checks (lint/test) separate from expensive checks (image build/push), and ensures untested code never reaches Docker Hub.

## 3. Containerization

Both backend and frontend use **multi-stage Dockerfiles**:

- **Backend**: `node:18-alpine` builder stage installs dependencies, production stage copies only the built app — keeping the image lean.
- **Frontend**: `node:18-alpine` builder stage runs `npm run build` to produce a static React bundle, then a final `nginx:alpine` stage serves the static files. This avoids shipping Node.js and `node_modules` in production — nginx is dramatically smaller and faster for serving static assets, directly supporting the sub-400MB image size target.

`.dockerignore` files in both `backend/` and `client/` exclude `node_modules`, logs, `.git`, and `.env` from the build context.

## 4. Docker Compose

`docker-compose.yml` orchestrates three services — backend, frontend, and MongoDB — on a shared network, with a **named volume** for MongoDB's data directory so data survives `docker-compose down && docker-compose up`.

## 5. Terraform and Ansible Approach

**What Terraform provisions:** a GCP VPC, subnet, firewall (allowing SSH, HTTP/HTTPS, app ports, and the Kubernetes API/NodePort range), and a single Compute Engine VM (`e2-medium`, Ubuntu 22.04) — this is the "node that will run the Kubernetes cluster," per the assignment's Phase 4 wording, which specifically says "compute instance" rather than a managed GKE cluster resource.

**What Ansible configures:** once the node exists, Ansible:
1. Installs and starts **k3s** (lightweight, single-binary Kubernetes), turning the raw VM into a working Kubernetes cluster
2. Runs three roles — `setup-mongodb` (creates the host directory used for MongoDB's future persistent storage), `backend-deployment` and `frontend-deployment` (install Docker and confirm both application images are pullable from Docker Hub, catching image/registry issues before Kubernetes ever tries to schedule a pod)

This split reflects a clean separation of concerns: **Terraform provisions infrastructure that doesn't yet run anything**; **Ansible configures that infrastructure until it's a working platform**; **Kubernetes manifests then deploy the actual application** onto that platform.

## 6. Kubernetes Object Choices

- **StatefulSet (not Deployment) for MongoDB**: MongoDB needs a stable identity and stable, non-shared storage. A StatefulSet with a `volumeClaimTemplate` guarantees the same PersistentVolumeClaim is reattached to the same pod across restarts — a plain Deployment with a shared volume would risk data corruption from multiple replicas writing to the same volume, and wouldn't guarantee the pod keeps its identity/storage pairing across rescheduling.
- **Headless Service for MongoDB** (`clusterIP: None`): gives the backend a stable DNS name (`mongodb-0.mongodb-service...`) to connect directly to the specific MongoDB pod, which is the correct pattern for stateful, non-load-balanced services.
- **Deployments for backend and frontend**: both are stateless — any replica can serve any request — so a Deployment (with 3 replicas each) is appropriate, giving redundancy and rolling-update support.
- **Exposure method**: NodePort Services expose both backend (`30000`) and frontend (`30001`) directly on the VM's public IP, making the app reachable at a live URL without needing a cloud load balancer.
- **Persistent storage**: a 1Gi PersistentVolumeClaim backs MongoDB's `/data/db`, verified by deleting and recreating the `mongodb-0` pod and confirming previously added data was still present.
- **Resource requests/limits**: set deliberately on every container (e.g. backend: 100m/128Mi requests, 300m/256Mi limits) to avoid one component starving others on the single-node cluster.

## 7. How It All Connects
  
  Push to GitHub → CI runs lint/tests on every branch
→ merge to master triggers CD
→ CD builds + pushes Docker images to Docker Hub
→ (separately) Terraform provisions GCP VPC + VM
→ Ansible installs k3s on that VM, confirms images are pullable
→ kubectl apply deploys StatefulSet/Deployments/Services
→ App is live and reachable at http://34.61.63.222:30001

  
Each phase's output is a direct input to the next: CD's pushed images are what Kubernetes actually deploys; Terraform's VM is what Ansible configures; Ansible's working k3s cluster is what `kubectl apply` targets.
