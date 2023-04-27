FROM node:18 AS builder
WORKDIR /app

COPY package.json .
COPY package-lock.json .

COPY client client
COPY server server
COPY common common

RUN ls

RUN npm ci
RUN npm run build

FROM node:18 AS runtime
WORKDIR /app
COPY --from=builder /app/server/dist /app
COPY --from=builder /app/server/package.json /app
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/client/dist /app/public
CMD ["node", "/app/server.js"]
