FROM oven/bun:1 AS build
WORKDIR /usr/src/app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY . .

RUN bun run db:generate
RUN bun run build

FROM node:22-alpine AS runtime
WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=build /usr/src/app/dist/index.js ./dist/index.js
COPY --from=build /usr/src/app/src/generated/prisma ./src/generated/prisma

USER node
ENTRYPOINT ["node", "dist/index.js"]