IMAGE_NAME = frontend
IMAGE_TAG = latest
ACR_REGISTRY ?= utkexampleappfrontend.azurecr.io
ACR_IMAGE = $(ACR_REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)

install:
	npm install

lint:
	npm run lint

test:
	npm run test

build:
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .

scan:
	trivy image $(IMAGE_NAME):$(IMAGE_TAG)

publish:
	az acr login --name utkexampleappfrontend
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(ACR_IMAGE)
	docker push $(ACR_IMAGE)

