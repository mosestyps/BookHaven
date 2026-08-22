provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_compute_network" "bookhaven_vpc" {
  name                    = "bookhaven-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "bookhaven_subnet" {
  name          = "bookhaven-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.bookhaven_vpc.id
}

resource "google_compute_firewall" "bookhaven_firewall" {
  name    = "bookhaven-allow-access"
  network = google_compute_network.bookhaven_vpc.name

  allow {
    protocol = "tcp"
    ports    = ["22", "80", "443", "3000", "5000", "6443", "30000-32767"]
  }

  source_ranges = ["0.0.0.0/0"]
}

resource "google_compute_instance" "k8s_node" {
  name         = "bookhaven-k8s-node"
  machine_type = "e2-medium"
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 30
    }
  }

  network_interface {
    network    = google_compute_network.bookhaven_vpc.id
    subnetwork = google_compute_subnetwork.bookhaven_subnet.id
    access_config {}
  }

  metadata = {
    ssh-keys = "${var.ssh_user}:${file(var.ssh_pub_key_path)}"
  }

  tags = ["bookhaven-node"]
}

output "instance_ip" {
  value = google_compute_instance.k8s_node.network_interface[0].access_config[0].nat_ip
}

output "instance_name" {
  value = google_compute_instance.k8s_node.name
}
