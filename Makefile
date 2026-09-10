IMAGE   := brickenterprise/frontend-standard
VERSION := $(shell grep -E '^\s+version:' component.yaml | head -1 | awk '{print $$2}')

.DEFAULT_GOAL := help
.PHONY: help all check-version test image migrate-idempotent dag-check contract-check import-scan module-check docs-check smoke

help:  ## 列出所有目标
	@awk 'BEGIN{FS=":.*##"; printf "\n用法: make <目标>\n\n"} \
	     /^[a-zA-Z0-9_-]+:.*##/ {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2} \
	     /^##@/ {printf "\n\033[1m%s\033[0m\n", substr($$0,5)}' $(MAKEFILE_LIST)
	@echo ""

##@ 汇总
all: check-version test dag-check contract-check import-scan module-check docs-check  ## 7 个门禁（不含 image/smoke，它们要真建镜像/真起容器）

##@ 9 个门禁
check-version:  ## component.yaml 的 version、git tag、deployment.image 三者不许分叉（§9.1 两个真相源）
	@tag="$$(git describe --tags --exact-match 2>/dev/null || true)"; \
	 if [ -n "$$tag" ] && [ "$$tag" != "v$(VERSION)" ]; then \
	   echo "✗ git tag $$tag 与 component.yaml 的 $(VERSION) 不一致"; exit 1; fi; \
	 img_ver="$$(grep -E '^[[:space:]]+image:' component.yaml | head -1 | sed -E 's#.*:([0-9]+\.[0-9]+\.[0-9]+)[[:space:]]*$$#\1#')"; \
	 if [ "$$img_ver" != "$(VERSION)" ]; then \
	   echo "✗ deployment.image 的 tag ($$img_ver) 与 component.yaml 的 version ($(VERSION)) 不一致"; exit 1; fi; \
	 echo "✓ version=$(VERSION)（git tag 与 deployment.image 一致）"

test:  ## 全部 packages/apps 的 typecheck + 单测（design-tokens/ui-kit-pc 真挂载测试，apps/pc 真 vue-tsc）
	pnpm install --frozen-lockfile
	pnpm -r --if-present run typecheck
	pnpm -r --if-present run test

image:  ## 建镜像（PC+移动端合一个 Nginx 容器，见 Dockerfile 注释）并确认里面有 sh + wget（§12.3.7）
	docker build -t $(IMAGE):$(VERSION) .
	@docker run --rm --entrypoint sh $(IMAGE):$(VERSION) -c 'wget --version >/dev/null' \
	  && echo "✓ 镜像里有 sh + wget"

migrate-idempotent:  ## N/A：前端无数据库，没有迁移（design.md §2）
	@echo "N/A：frontend-standard 无数据库，没有迁移可跑"

dag-check:  ## N/A：component.yaml 的 dependencies.components 永远是空数组（design.md §5，前端只认网关）
	@bad="$$(grep -A5 '^dependencies:' component.yaml | grep -E '^\s*-\s')"; \
	 if [ -n "$$bad" ]; then echo "✗ frontend-standard 不该声明任何 dependencies.components：$$bad"; exit 1; fi
	@echo "✓ 无依赖声明（前端只认网关，不建依赖边）"

contract-check:  ## N/A：对外无 API（design.md §3："我是纯静态资源，不提供任何接口"）
	@echo "N/A：frontend-standard 不发布任何 API 契约"

import-scan:  ## 铁律六 + 决策 111：业务页面不许绕开 ui-kit-pc/ui-kit-mobile 直接 import vxe-table/vxe-pc-ui（AntDV 基础控件本身是锁死的 UI 库，直接用不算违反——只有换表格引擎那条真实有风险的边才需要包一层，见 AGENTS.md「读代码前的自查」）。main.ts 的一次性 app.use() 接线是唯一例外
	@bad="$$(grep -rlE 'from .(vxe-table|vxe-pc-ui).' apps/pc/src/pages apps/pc/src/layouts apps/pc/src/components apps/mobile/src/pages 2>/dev/null || true)"; \
	 if [ -n "$$bad" ]; then echo "✗ 业务页面直接 import 了 vxe-table/vxe-pc-ui，必须走 @be/ui-kit-pc 的 <BeTable>：$$bad"; exit 1; fi
	@bad="$$(grep -rlE 'from .wot-design-uni.' apps/mobile/src 2>/dev/null || true)"; \
	 if [ -n "$$bad" ]; then echo "✗ 移动端页面直接 import wot-design-uni 包（组件应走 easycom 标签，不需要 import）：$$bad"; exit 1; fi
	@echo "✓ 无绕开 ui-kit-* 的第三方表格库 import"

module-check:  ## 前端版铁律七：不许在业务页面裸调平台保留变量/绕开 config.ts 读运行时配置
	@bad="$$(grep -rlE 'process\.env\.' apps/pc/src apps/mobile/src 2>/dev/null || true)"; \
	 if [ -n "$$bad" ]; then echo "✗ 前端代码里没有 process.env 可读（构建期没有，运行期走 window.__BE_CONFIG__）：$$bad"; exit 1; fi
	@bad="$$(grep -rlE 'window\.__BE_CONFIG__' apps/pc/src apps/mobile/src 2>/dev/null | grep -vE 'src/config\.ts$$' || true)"; \
	 if [ -n "$$bad" ]; then echo "✗ 只许 config.ts 读 window.__BE_CONFIG__，其余代码走 getConfig()：$$bad"; exit 1; fi
	@echo "✓ 运行时配置读取路径唯一"

docs-check:  ## 四份文档结构检查（总纲 §4 SOP-D）
	@bash ../../../infra/scripts/docs-check.sh frontend-standard

smoke:  ## 原则一：只装这一个组件就能起来（§1.5、§3.11 第 8 条）——前端零依赖，天然满足
	@(cd ../../.. && brickkit up --dry-run >/dev/null) && echo "✓ smoke（完整版见 make tier0）"
