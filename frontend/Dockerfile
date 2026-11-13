# Build context: raiz do repositório (o lockfile é compartilhado pelos workspaces)
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace frontend

COPY frontend/ frontend/

# Variáveis VITE_* são embutidas no bundle durante o build
ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build --workspace frontend

FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace frontend --omit=dev

COPY --from=build /app/frontend/build frontend/build

WORKDIR /app/frontend
ENV NODE_ENV=production
ENV PORT=5173
EXPOSE 5173

CMD ["npm", "run", "start"]
