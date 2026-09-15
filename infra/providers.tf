provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project   = var.project
      ManagedBy = "terraform"
      Repo      = "auto-repair-auth-lambda"
    }
  }
}

data "terraform_remote_state" "k8s" {
  backend = "s3"

  config = {
    bucket = "auto-repair-tfstate-814623398856"
    key    = "infra-k8s/terraform.tfstate"
    region = "us-east-1"
  }
}

data "terraform_remote_state" "database" {
  backend = "s3"

  config = {
    bucket = "auto-repair-tfstate-814623398856"
    key    = "infra-database/terraform.tfstate"
    region = "us-east-1"
  }
}

data "aws_secretsmanager_secret_version" "app" {
  secret_id = data.terraform_remote_state.database.outputs.secret_arn
}

locals {
  vpc_id             = data.terraform_remote_state.k8s.outputs.vpc_id
  vpc_cidr           = data.terraform_remote_state.k8s.outputs.vpc_cidr
  private_subnet_ids = data.terraform_remote_state.k8s.outputs.private_subnet_ids
  api_gateway_id     = data.terraform_remote_state.k8s.outputs.api_gateway_id

  app_secret = jsondecode(data.aws_secretsmanager_secret_version.app.secret_string)
}
