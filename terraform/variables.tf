variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  default = "us-central1"
}

variable "zone" {
  default = "us-central1-a"
}

variable "ssh_user" {
  description = "SSH username for the VM (used by Ansible)"
  type        = string
  default     = "ansible"
}

variable "ssh_pub_key_path" {
  description = "Path to your public SSH key"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}
