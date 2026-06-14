# InviteShop Frontend 

This directory contains the frontend application for the InviteShop project.
It is built with React, Vite, TypeScript, and Tailwind CSS.

## Prerequisites

- Node.js 20.x
- npm
- Docker (optional, for container build)

## Install

```bash
cd frontend
npm install
```

## Development

Run the local development server:

```bash
npm run dev
```

Then open the displayed local URL in your browser.

## Build

To build the production frontend:

```bash
npm run build
```

The production-ready files are generated in the `dist/` folder.

## Preview

To preview the built app locally:

```bash
npm run preview
```

## Docker

The frontend includes a `Dockerfile` that builds the app and serves it with Nginx.

Build the image:

```bash
docker build -t inviteshop-frontend:latest .
```

Run the container:

```bash
docker run -d -p 8080:80 inviteshop-frontend:latest
```

Then visit `http://localhost:8080`.

## Notes

- The Docker build uses the `nginx.conf` file to configure Nginx.
- If you add linting or testing scripts, update this README accordingly.
