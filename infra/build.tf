resource "null_resource" "build" {
  triggers = {
    index   = filesha256("${path.module}/../src/index.mjs")
    cpf     = filesha256("${path.module}/../src/cpf.mjs")
    logger  = filesha256("${path.module}/../src/logger.mjs")
    package = filesha256("${path.module}/../package-lock.json")
  }

  provisioner "local-exec" {
    working_dir = "${path.module}/.."
    command     = "npm run build"
  }
}

data "archive_file" "lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../dist"
  output_path = "${path.module}/.build/lambda.zip"

  depends_on = [null_resource.build]
}
