output "function_name" {
  value = aws_lambda_function.auth.function_name
}

output "function_arn" {
  value = aws_lambda_function.auth.arn
}

output "auth_endpoint" {
  value = "${data.terraform_remote_state.k8s.outputs.api_gateway_url}/auth/cpf"
}

output "log_group" {
  value = aws_cloudwatch_log_group.lambda.name
}
