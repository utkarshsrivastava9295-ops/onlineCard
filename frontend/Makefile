IMAGE_NAME = frontend
IMAGE_TAG = latest

install:
	npm install

lint:
	npm run lint

test:
	npm run test

deploy:
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG)