# syntax=docker/dockerfile:1

FROM node:20-slim AS builder

WORKDIR /usr/src/app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
COPY public ./public
COPY README.md ./README.md
COPY SETUP_GUIDE.md ./SETUP_GUIDE.md

RUN npm exec -- tsc -p tsconfig.json
RUN npm prune --omit=dev

FROM node:20-slim AS runner

WORKDIR /usr/src/app
ENV NODE_ENV=production
ENV HOST=0.0.0.0

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/public ./public
# Copy lang directory - needed at runtime (JSON files aren't compiled by TypeScript)
COPY --from=builder /usr/src/app/src/lang ./dist/lang

EXPOSE 4000

CMD ["node", "dist/index.js"]

