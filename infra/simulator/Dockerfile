FROM node:22-alpine
WORKDIR /app
COPY infra/package.json ./
RUN npm install
COPY infra/simulator ./infra/simulator
CMD ["npx", "ts-node", "infra/simulator/simulator.ts"]
