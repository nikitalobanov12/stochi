terraform {
  required_providers {
    fly = {
      source  = "fly-apps/fly"
      version = "~> 0.1"
    }
  }
}

# Configure the Fly provider
# Set FLY_API_TOKEN environment variable before running
# Get token: fly tokens create deploy -x 999999h
provider "fly" {}

variable "app_name" {
  description = "Name of the Fly.io app"
  type        = string
  default     = "stochi-engine"
}

variable "org" {
  description = "Fly.io organization slug"
  type        = string
  default     = "personal"
}

# Create the Fly.io app
resource "fly_app" "engine" {
  name = var.app_name
  org  = var.org
}

# Allocate shared IPv4 (free)
resource "fly_ip" "engine_ipv4" {
  app        = fly_app.engine.name
  type       = "shared_v4"
  depends_on = [fly_app.engine]
}

# Allocate IPv6 (free)
resource "fly_ip" "engine_ipv6" {
  app        = fly_app.engine.name
  type       = "v6"
  depends_on = [fly_app.engine]
}

output "app_url" {
  description = "URL of the deployed engine"
  value       = "https://${var.app_name}.fly.dev"
}

output "app_name" {
  description = "Name of the Fly.io app"
  value       = fly_app.engine.name
}

output "next_steps" {
  description = "Commands to complete deployment"
  value       = <<-EOT
    
    App created! Complete deployment with:
    
    1. Set the database secret:
       cd apps/engine && fly secrets set DATABASE_URL="your-neon-connection-string"
    
    2. Deploy the app:
       cd apps/engine && fly deploy
    
    3. Verify it's running:
       curl https://${var.app_name}.fly.dev/health
    
    4. Add ENGINE_URL to your web app environment:
       ENGINE_URL=https://${var.app_name}.fly.dev
  EOT
}
