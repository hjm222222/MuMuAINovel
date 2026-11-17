# AI 小说创作台

基于 [MuMuAINovel](https://github.com/xiamuceer-j/MuMuAINovel) 修改的裁剪版，专注「只做创作台」：世界设定、大纲、角色、章节写作与全书导出。

- 模型费用由用户自己承担（BYOK），站点不代收模型费用
- 去知识库/RAG、提示词工坊、MCP 插件、LinuxDO 登录、赞助与厂商推广
- 品牌名、标语、主题色、许可证信息均由环境变量配置
- 兼容原项目 PostgreSQL + Docker Compose 部署方式，默认对外端口 8090

[快速开始](#快速开始) · [配置说明](#配置说明) · [项目结构](#项目结构) · [许可证](#许可证)

## 特性

- 智能向导：AI 生成世界观、大纲、角色与组织
- 章节创作：创建、续写、重写、局部改写、批量生成
- 角色与关系：角色卡、组织架构、关系图谱、职业等级体系
- 伏笔追踪：未回收线索提醒与伏笔时间线
- 写作风格：自定义写作风格与项目默认风格
- 全书导出：Markdown / TXT 稿件，可选大纲与角色附录
- 用量统计：按场景与模型查看调用次数、Token 与耗时
- 密钥加固：用户自带 API Key 加密存储、接口只返回掩码
- 合规说明：隐私政策、用户协议、AI 生成内容标识、数据删除入口

## 快速开始

### 前置要求

- Docker 与 Docker Compose
- 一个可用的模型服务 API Key（OpenAI 兼容、Gemini 或 Anthropic）

### Docker Compose 部署

```bash
# 1. 克隆仓库
git clone https://github.com/hjm222222/MuMuAINovel.git
cd MuMuAINovel

# 2. 准备环境变量
cp .env.example .env

# 3. 生成两个高强度随机密钥并写入 .env
# SESSION_SECRET_KEY 用于会话签名
# CREDENTIAL_ENCRYPTION_KEY 用于加密用户自带 API Key
openssl rand -hex 32

# 4. 修改 .env 中的数据库密码与本地管理员密码

# 5. 启动服务
docker compose up -d

# 6. 访问应用
# 浏览器打开 http://localhost:8090
```

启动后：

- 应用首页：`http://localhost:8090`
- API 文档：`http://localhost:8090/docs`

数据库密码与管理员密码务必在首次启动前改掉，容器启动时会自动执行 Alembic 迁移。

### 本地开发

后端：

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 复制配置模板并按需修改
cp .env.example .env

# 启动开发服务
python -m uvicorn app.main:app --host localhost --port 8000 --reload
```

前端：

```bash
cd frontend
npm install
npm run dev
```

## 配置说明

### 品牌配置

站点名称、标语、主题色与许可证信息全部通过环境变量提供，前端启动时通过 `/api/site/branding` 获取：

```bash
APP_NAME=AI 小说创作台
APP_SLOGAN=只做创作台的自托管 AI 小说工作台
APP_DESCRIPTION=面向小说创作者的 AI 创作台
BRAND_PRIMARY_COLOR=#4D8088
BRAND_ACCENT_COLOR=#C08A6A
BRAND_FOOTER_NOTE=基于 MuMuAINovel 修改 · GPL v3
UPSTREAM_NAME=MuMuAINovel
UPSTREAM_URL=https://github.com/xiamuceer-j/MuMuAINovel
LICENSE_NAME=GPL-3.0
LICENSE_URL=https://www.gnu.org/licenses/gpl-3.0.html
AI_CONTENT_NOTICE=本站生成内容由 AI 辅助完成，请在发布或商用前进行人工审校。
```

### 安全配置

```bash
# 会话签名密钥，生产环境必填
SESSION_SECRET_KEY=

# 用户自带 API Key 的加密密钥，生产环境必填
# 生成方式：openssl rand -hex 32
CREDENTIAL_ENCRYPTION_KEY=

# HTTPS 部署时设为 true，HTTP 部署时设为 false
SESSION_COOKIE_SECURE=false
```

未配置 `CREDENTIAL_ENCRYPTION_KEY` 时会回退到 `SESSION_SECRET_KEY`，两者都缺失时用户密钥以明文保存并记录告警日志，生产环境务必配置。

### 上游云服务开关

本项目独立部署，默认关闭对上游云端工坊与云端公告的调用，公告使用本地数据：

```bash
CLOUD_SERVICES_ENABLED=false

# 更新日志来源，默认指向本 fork 仓库
CHANGELOG_ENABLED=true
CHANGELOG_REPO_OWNER=hjm222222
CHANGELOG_REPO_NAME=MuMuAINovel
```

### 模型服务配置

用户在「设置」页按账号配置自己的 API Key，管理员也可提供站点级默认配置：

```bash
DEFAULT_AI_PROVIDER=openai
DEFAULT_MODEL=gpt-4o-mini
DEFAULT_TEMPERATURE=0.7
DEFAULT_MAX_TOKENS=32000

OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
```

OpenAI 兼容的中转服务直接修改 `OPENAI_BASE_URL` 即可。

### 本地或内网模型

默认拒绝访问 `localhost`、私网 IP 与解析到内网的主机名，用于降低 SSRF 风险：

```bash
# 允许访问本机 Ollama / llama.cpp
ALLOW_PRIVATE_AI_ENDPOINTS=true
ALLOWED_AI_HOSTS=host.docker.internal,127.0.0.1
```

## Docker 部署详情

### 服务架构

- `postgres`：PostgreSQL 18，端口 5432，数据保存在 `postgres_data` volume
- `ai-novel`：主应用服务，宿主机端口由 `APP_PORT` 控制，默认 8090

### 常用命令

```bash
# 启动服务
docker compose up -d

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f ai-novel

# 停止服务
docker compose down

# 重启服务
docker compose restart
```

### 端口配置

```bash
# .env 中修改宿主机端口
APP_PORT=8090
```

### 数据持久化

- `postgres_data`：PostgreSQL 数据文件
- `./logs`：应用日志
- `./storage/generated_covers`：生成的项目封面

## 项目结构

```
MuMuAINovel/
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── api/             # API 路由
│   │   ├── models/          # 数据模型
│   │   ├── services/        # 业务逻辑
│   │   ├── middleware/      # 中间件
│   │   ├── database.py      # 数据库连接
│   │   └── main.py          # 应用入口
│   ├── alembic/             # 数据库迁移
│   └── requirements.txt
├── frontend/                # React 前端
│   ├── src/
│   │   ├── pages/           # 页面
│   │   ├── components/      # 通用组件
│   │   ├── services/        # API 客户端
│   │   ├── config/          # 品牌与版本配置
│   │   └── store/           # 状态管理
│   └── package.json
├── .github/workflows/ci.yml # CI：后端校验、前端构建、镜像构建与启动验收
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

## 技术栈

后端：FastAPI · SQLAlchemy · Alembic · PostgreSQL · Pydantic

前端：React 18 · TypeScript · Ant Design 5 · Zustand · Vite

## 使用指南

1. 登录系统：使用本地账户登录，管理员账号由 `LOCAL_AUTH_USERNAME` 与 `LOCAL_AUTH_PASSWORD` 指定
2. 配置模型：在「设置」页填写自己的 API Key，保存后即可测试连通性
3. 创建项目：通过向导生成世界观、大纲与角色，或手动创建
4. 创作章节：逐章生成、续写与改写，保持大纲与角色一致
5. 导出成果：章节页「导出全书」输出 Markdown / TXT，项目列表可导出完整 JSON

## 持续集成

`.github/workflows/ci.yml` 在每次推送执行三项检查：

- Backend：安装依赖、编译全部源码、导入应用做冒烟测试
- Frontend：`npm ci` 后执行类型检查与生产构建
- Docker image：构建镜像，用 PostgreSQL 服务容器启动容器并验证 `/health`

## 数据与隐私

- 用户 API Key 以 Fernet 加密存储，接口只返回掩码
- 提供用量统计（调用次数、Token、耗时），数据仅保存在本地数据库
- 提供创作数据删除与账号注销接口，前端入口位于「设置 - 数据与隐私」与合规页
- 生成内容带 AI 辅助生成标识声明

## 许可证

本项目基于 [MuMuAINovel](https://github.com/xiamuceer-j/MuMuAINovel) 修改，遵循 [GNU General Public License v3.0](LICENSE)。

GPL v3 意味着：

- 可自由使用、修改和分发
- 可用于商业目的
- 必须开源修改版本
- 必须保留原作者版权
- 衍生作品必须使用 GPL v3 协议

## 致谢

- [FastAPI](https://fastapi.tiangolo.com/) - Python Web 框架
- [React](https://react.dev/) - 前端框架
- [Ant Design](https://ant.design/) - UI 组件库
- [PostgreSQL](https://www.postgresql.org/) - 数据库
