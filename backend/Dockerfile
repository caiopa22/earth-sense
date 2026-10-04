# Build context: raiz do repositório (o lockfile é compartilhado pelos workspaces)
FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace backend

COPY backend/ backend/

WORKDIR /app/backend
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start"]
