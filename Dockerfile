# Cloudflare Tunnel 뒤에서 돌릴 self-hosted 이미지를 기준으로, 재현 가능한 pnpm 버전을 고정한다.
ARG PNPM_VERSION=9.15.4

FROM node:20-slim AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# 의존성 해석은 package.json / lockfile 변화에만 반응하도록 초반 COPY를 최소화한다.
COPY package.json .
COPY pnpm-lock.yaml .

RUN corepack enable
RUN corepack prepare pnpm@${PNPM_VERSION} --activate

# ------------------------------------------------------------------------------------------

FROM base AS deps
# Install only prod deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# ------------------------------------------------------------------------------------------

FROM deps AS builder
COPY . .
# 빌드 스테이지에서는 devDependencies까지 설치해야 프론트 번들을 만들 수 있다.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm build

# ------------------------------------------------------------------------------------------

FROM base AS runtime
WORKDIR /app

COPY package.json .
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=builder /app/server ./server
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV RISU_ENABLE_HTTPS=false
EXPOSE 6001

CMD ["pnpm", "runserver"]
