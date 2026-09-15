AWS_PROFILE ?= auto-repair
export AWS_PROFILE

.PHONY: test build init plan up down logs invoke

test:
	npm test

build:
	npm run build

init:
	terraform -chdir=infra init -input=false

plan:
	terraform -chdir=infra plan -input=false

up:
	terraform -chdir=infra apply -input=false -auto-approve

down:
	terraform -chdir=infra destroy -input=false -auto-approve

logs:
	aws logs tail /aws/lambda/auto-repair-auth --follow

invoke:
	@ENDPOINT=$$(terraform -chdir=infra output -raw auth_endpoint); \
	curl -s -X POST "$$ENDPOINT" -H 'content-type: application/json' \
	  -d "{\"cpf\":\"$(CPF)\"}" | jq .
