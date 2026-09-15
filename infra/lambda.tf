resource "aws_security_group" "lambda" {
  name        = "${var.project}-auth-lambda"
  description = "Outbound access from the authentication function to the database"
  vpc_id      = local.vpc_id

  egress {
    description = "PostgreSQL inside the VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [local.vpc_cidr]
  }
}

data "aws_iam_policy_document" "assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${var.project}-auth-lambda"
  assume_role_policy = data.aws_iam_policy_document.assume.json
}

resource "aws_iam_role_policy_attachment" "vpc_access" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.function_name}"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "auth" {
  function_name = var.function_name
  role          = aws_iam_role.lambda.arn
  handler       = "src/index.handler"
  runtime       = var.runtime
  memory_size   = var.memory_size
  timeout       = var.timeout

  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256

  vpc_config {
    subnet_ids         = local.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DB_HOST           = local.app_secret.host
      DB_PORT           = tostring(local.app_secret.port)
      DB_USER           = local.app_secret.username
      DB_PASSWORD       = local.app_secret.password
      DB_NAME           = local.app_secret.dbname
      JWT_SECRET        = local.app_secret.jwt_secret
      TOKEN_TTL_SECONDS = tostring(var.token_ttl_seconds)
      NODE_OPTIONS      = "--enable-source-maps"
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.vpc_access,
    aws_cloudwatch_log_group.lambda
  ]
}
