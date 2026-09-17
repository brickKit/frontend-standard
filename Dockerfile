# component.yaml 锁死一个端口/一份镜像（同 slot:frontend 族既有约束，
# registry/ports.tsv 只给 frontend-standard 登记了一行）——PC 与移动端
# H5 合用同一个 Nginx 容器：PC 在 `/`，移动端在 `/m/`（apps/mobile 的
# vite.config.ts 已把 base 设成 `/m/`，见其注释）。

FROM node:24-slim AS builder
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate

# 先拷贝全部 package.json + lockfile 再装依赖，最大化利用层缓存
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/design-tokens/package.json packages/design-tokens/package.json
COPY packages/ui-kit-pc/package.json packages/ui-kit-pc/package.json
COPY packages/ui-kit-mobile/package.json packages/ui-kit-mobile/package.json
COPY apps/pc/package.json apps/pc/package.json
COPY apps/mobile/package.json apps/mobile/package.json
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @be/design-tokens build
RUN pnpm --filter @be/app-pc build
RUN pnpm --filter @be/app-mobile build

# ⚠️ 基底必须带 /bin/sh + wget（导读第 8 条）：平台健康检查是
# CMD-SHELL 形态的 wget --spider，distroless/scratch 会让 /healthz 永远
# 判不健康。官方 nginx 镜像默认没有 wget，需要显式装。
FROM nginx:1.27-alpine
RUN apk add --no-cache wget
COPY --from=builder /workspace/apps/pc/dist /usr/share/nginx/html
COPY --from=builder /workspace/apps/mobile/dist/build/h5 /usr/share/nginx/html/m
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.d/40-be-config.sh
RUN chmod +x /docker-entrypoint.d/40-be-config.sh

EXPOSE 80
