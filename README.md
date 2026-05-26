# 随机点名器

一个基于 Vue 3 + TypeScript + Vite 的大学课堂随机点名工具，支持学生档案管理、多维筛选点名、Excel/CSV/TXT 批量导入、点名记录、统计、名单导出和 localStorage 持久化。

作者：李馨妍 / 240110065

## 技术栈

- Vue 3 + Composition API (`<script setup>`)
- TypeScript
- Vite
- Vue Router
- Element Plus
- Vitest
- localStorage

## 运行项目

```bash
pnpm install
pnpm dev
```

构建生产版本：

```bash
pnpm build
pnpm preview
```

运行单元测试：

```bash
pnpm test
```

当前验证结果：`pnpm test` 5 个测试文件、35 个用例全部通过；`pnpm build` 通过。Excel 解析依赖 `xlsx` 已拆成异步 chunk，主包体积明显下降。

## 外部 API 加分说明

每日一句模块优先调用 TianAPI 名言警句接口；如果未配置密钥、请求失败或额度异常，则自动降级到 Hitokoto 一言接口；如果两个远程接口都不可用，则显示本地备用语句，不影响点名功能。

调用顺序：

```text
TianAPI 名言警句接口 -> Hitokoto 一言接口 -> 本地备用语句
```

TianAPI 申请与使用：

1. 访问 https://www.tianapi.com/ 注册免费账号。
2. 打开名言警句接口文档：https://www.tianapi.com/apiview/26。
3. 在控制台申请接口并获取 API Key。
4. 复制 `.env.example` 为 `.env.local`，填写：

```env
VITE_TIANAPI_KEY=你的TianAPI密钥
```

5. 重新运行 `pnpm dev` 或 `pnpm build`。

注意：真实 API Key 不提交到仓库。GitHub Pages 部署时，将仓库 Settings -> Secrets and variables -> Actions 中新增 `VITE_TIANAPI_KEY`，workflow 会在构建时读取。

## 功能清单

- 添加、编辑、删除、搜索学生
- 按年级、院系、专业、班级、课程、标签筛选候选名单
- Excel、CSV、TXT 批量导入
- 下载导入模板
- 自动识别姓名、学号、年级、院系、专业、班级、课程、标签等常见表头
- 支持从文件名或工作表名推断年级、专业、班级、课程等信息
- 按学号合并学生档案，同一学生可补充新增班级、课程、标签
- 编辑时检测重复学号，并支持合并档案和迁移历史记录
- 随机点名动画和结果展示
- 点名历史完整保存，界面仅限制最近记录展示数量
- 根据历史记录同步计算点名次数，避免统计不一致
- 记录统计页、未点到学生列表、名单导出
- TianAPI 名言警句接口、Hitokoto 兜底接口、本地备用语句
- 手机、平板、电脑响应式布局

## Excel 导入规范

推荐 Excel 第一行使用表头：

| 姓名 | 学号 | 年级 | 院系 | 专业 | 班级 | 课程 | 标签 | 备注 |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| 张三 | 20260001 | 2026级 | 信息工程学院 | 软件工程 | 软件1班 | 数据结构 | 一组 | 示例 |
| 李四 | 20260002 | 2026级 | 信息工程学院 | 软件工程 | 软件1班 | 高等数学 |  |  |

说明：

- `姓名` 必填，其余列可选。
- `学号` 是主要唯一标识；同一学号再次导入时会合并到原学生档案。
- `班级`、`课程`、`标签` 支持多个值，可用 `、`、`,`、`;`、`/` 分隔。
- 支持无表头文件，系统会自动选择最像姓名的一列。
- 支持从文件名或工作表名推断信息，例如 `软件工程2026级名单.xlsx`、`软件1班.csv`、`数据结构课程名单.xlsx`。
- 示例文件：`public/examples/students_import.csv`，包含 40 名学生。

## 部署说明

项目已补充 GitHub Pages 和 Vercel 两套部署配置：

- GitHub Pages：`.github/workflows/pages.yml`
- Vercel：`vercel.json`

仓库地址：

```text
https://github.com/lxy20060828/random-name-picker
```

GitHub Pages 在线访问链接：

```text
https://lxy20060828.github.io/random-name-picker/
```

注意：我在 2026-05-25 验证该地址当前返回 GitHub Pages `404`，说明远端还没有发布本次构建产物。将本次代码推送到 `main` 并在仓库 Settings -> Pages 中启用 GitHub Actions 后，上述地址就是正式访问链接。

GitHub Pages 部署步骤：

1. 将代码推送到 `main` 分支。
2. 在 GitHub 仓库 Settings -> Pages 中选择 GitHub Actions 作为部署来源。
3. 如需展示 TianAPI 调用，在 Settings -> Secrets and variables -> Actions 中添加 `VITE_TIANAPI_KEY`。
4. GitHub Actions 会自动运行 `pnpm test`、`pnpm build` 并发布 `dist`。
5. workflow 中已设置 `VITE_BASE_PATH=/random-name-picker/`，适配 GitHub Pages 仓库子路径。

Vercel 部署步骤：

1. 访问 https://vercel.com/import/git，选择 `lxy20060828/random-name-picker` 仓库。
2. Framework Preset 选择 Vite，Build Command 使用 `pnpm build`，Output Directory 使用 `dist`。
3. 如需 TianAPI，在 Project Settings -> Environment Variables 中添加 `VITE_TIANAPI_KEY`。
4. Vercel 使用根路径部署，`vercel.json` 已配置 SPA rewrite，刷新页面不会丢失路由。

项目使用 hash 路由，GitHub Pages 上刷新记录页不会出现 404。

## 项目结构

```text
src/
├── components/        # 页面组件
├── composables/       # 组合式逻辑
├── router/            # vue-router
├── styles/            # 全局样式
├── test/              # Vitest 单元测试
├── types/             # TypeScript 类型
├── utils/             # 导入解析、随机函数、统计同步等工具
└── views/             # 路由页面
```

## 作业要求对应

- 至少 4 个组件：已包含 Header、NameWheel、StudentList、HistoryPanel、StatsPanel、DailyQuoteCard、AddStudentDialog、ImportStudentDialog。
- 至少 3 种事件：点击、输入、选择文件、拖拽上传、键盘回车。
- 响应式数据：使用 `ref`、`reactive`。
- 列表渲染：学生列表、历史列表使用 `v-for`。
- 表单处理：添加、编辑、导入使用 `v-model`。
- 条件渲染：空状态、点名状态、导入结果使用 `v-if`。
- 生命周期：使用 `onMounted`、`onBeforeUnmount`，并通过 `watch` 处理候选名单变化。
- 计算属性或侦听器：使用 `computed`、`watch`。
- 路由：包含首页和记录统计页，使用 `vue-router`。
- 数据持久化：使用 localStorage。

## 提交物

- 功能说明文档：`docs/01_项目功能说明.md`
- 界面设计图：`02_界面设计图/`
- 数据表设计文档：`docs/03_数据表设计.md`
- 演示视频脚本：`docs/05_演示视频脚本.md`
- 演示视频：`docs/随机点名器演示视频.mp4`
- 项目源码：当前仓库

## AI 辅助说明

本项目使用 Codex 辅助完成 Vue3 组件实现、导入解析、数据一致性修复、TianAPI 接入、单元测试、部署配置和文档编写。项目需求、功能选择、页面风格、最终验收由本人确认。
