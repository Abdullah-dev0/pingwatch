# One image: Express serves the API and the built React app on the same port.

# --- build: install everything, compile server + client ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci

COPY . .
# empty = call the API on the same origin (/api/...), no CORS needed
ENV VITE_API_URL=""
RUN npm run build

# --- runtime: only what `node` needs ---
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --omit=dev --workspace=server && npm cache clean --force

COPY --from=build /app/server/dist server/dist
COPY --from=build /app/server/db server/db
COPY --from=build /app/client/dist client/dist

USER node
EXPOSE 3001
CMD ["node", "server/dist/index.js"]
