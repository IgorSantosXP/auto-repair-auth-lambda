variable "project" {
  type    = string
  default = "auto-repair"
}

variable "region" {
  type    = string
  default = "us-east-1"
}

variable "function_name" {
  type    = string
  default = "auto-repair-auth"
}

variable "runtime" {
  type    = string
  default = "nodejs22.x"
}

variable "memory_size" {
  type    = number
  default = 256
}

variable "timeout" {
  type    = number
  default = 10
}

variable "token_ttl_seconds" {
  type    = number
  default = 3600
}

variable "log_retention_days" {
  type    = number
  default = 7
}
