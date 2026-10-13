FROM node:22-alpine
WORKDIR /app
COPY infra/package.json ./
RUN npm install
COPY infra/worker ./infra/worker
CMD ["npx", "ts-node", "infra/worker/worker.ts"]
