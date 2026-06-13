IMAGE_NAME ?= address-service
TAG ?= latest

install:
	pip install -r requirements.txt

lint:
	flake8

test:
	pytest

build:
	docker bbuild -t $(IMAGE_NAME):$(TAG)