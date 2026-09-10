#!/bin/sh
# 纯静态 SPA 没有常驻进程能读 process.env，只能在容器启动时把
# configSchema 的值写进构建产物里——见 apps/pc/src/config.ts、
# apps/mobile/index.html 的说明。这个脚本放在官方 nginx 镜像的
# /docker-entrypoint.d/ 目录下，是该镜像文档化的机制：容器启动时
# nginx 主进程之前按文件名顺序执行这个目录下所有可执行脚本。
#
# 平台注入的环境变量名是 configSchema 属性名的 SCREAMING_SNAKE_CASE
# 转换（be-sdk-ts 的 configEnvVarName 算法，见 tools/be-sdk-ts/src/config.ts）：
# gatewayBaseUrl -> GATEWAY_BASE_URL，iamIssuerUrl -> IAM_ISSUER_URL，
# casdoorClientId -> CASDOOR_CLIENT_ID。
set -eu

GATEWAY_BASE_URL="${GATEWAY_BASE_URL:-}"
IAM_ISSUER_URL="${IAM_ISSUER_URL:-}"
CASDOOR_CLIENT_ID="${CASDOOR_CLIENT_ID:-}"

PC_CONFIG=/usr/share/nginx/html/config.js
cat > "$PC_CONFIG" <<EOF
window.__BE_CONFIG__ = {
  gatewayBaseUrl: "$GATEWAY_BASE_URL",
  iamIssuerUrl: "$IAM_ISSUER_URL",
  casdoorClientId: "$CASDOOR_CLIENT_ID"
};
EOF

# 移动端没有独立的 config.js（真机踩过的坑，见根 docs/dev/实测踩坑记录.md
# A15：uni-app 的 Vite 插件在 dev 模式下会把 <script src> 都当模块请求
# 预处理，跟 Vite 的"public 目录文件不许被当模块 import"规则冲突）——
# 配置直接内联在 index.html 的一整行里，这里用单行替换（不用多行
# 区间删除+插入——BusyBox sed 对 GNU sed 的 `a\` 多行追加语法支持有限，
# 单行替换在两边都可靠，已在真实 alpine 容器里验证过）。
MOBILE_INDEX=/usr/share/nginx/html/m/index.html
sed -i "s|window\\.__BE_CONFIG__ = .*|window.__BE_CONFIG__ = { gatewayBaseUrl: \\\"$GATEWAY_BASE_URL\\\", iamIssuerUrl: \\\"$IAM_ISSUER_URL\\\", casdoorClientId: \\\"$CASDOOR_CLIENT_ID\\\" };|" "$MOBILE_INDEX"
