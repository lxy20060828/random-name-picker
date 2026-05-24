# 随机点名器

一个基于 Vue 3 + TypeScript + Vite 的课堂随机点名工具，支持 Excel/CSV/TXT 批量导入、随机抽取、点名记录、统计和 localStorage 持久化。

## 技术栈

- Vue 3
- TypeScript
- Composition API (`<script setup>`)
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

## 功能清单

- 添加、编辑、删除、搜索学生
- Excel、CSV、TXT 批量导入
- 下载导入模板
- 自动识别姓名列和常见表头
- 跳过重复名单和无效行
- 随机点名动画和结果展示
- 点名次数累计
- 最近 100 条点名记录
- 记录统计页
- 导出学生名单
- localStorage 数据持久化
- Hitokoto 一言免费语句接口扩展模块
- 手机、平板、电脑响应式布局

## Excel 导入规范

推荐 Excel 第一行使用表头：

| 姓名 | 学号 | 班级 | 备注 |
|:---|:---|:---|:---|
| 张三 | 20260001 | 软件1班 | 示例 |
| 李四 | 20260002 | 软件1班 |  |

说明：

- `姓名` 必填，其余列可选。
- 支持常见表头：`姓名`、`名字`、`学生姓名`、`name`。
- 支持无表头文件，系统会自动选择最像姓名的一列。
- 空行、序号列、重复姓名会被跳过并提示。
- 示例文件：`public/examples/students_import.csv`，包含 40 名学生。

## 外部 API 说明

项目使用 Hitokoto 一言免费接口作为加分项，不需要注册账号，也不需要 API Key。

接口地址：

```text
https://v1.hitokoto.cn/?encode=json&c=d&c=i&c=k
```

官方文档：

- https://developer.hitokoto.cn/
- https://developer.hitokoto.cn/sentence/

如果网络异常或接口暂时不可用，项目会自动显示本地备用语句，不影响主要功能运行。

## 项目结构

```text
src/
├── components/        # 页面组件
├── composables/       # 组合式逻辑
├── router/            # vue-router
├── styles/            # 全局样式
├── test/              # Vitest 单元测试
├── types/             # TypeScript 类型
├── utils/             # 导入解析、随机函数等工具
└── views/             # 路由页面
```

## 作业要求对应

- 至少 4 个组件：已包含 Header、NameWheel、StudentList、HistoryPanel、StatsPanel、DailyQuoteCard、AddStudentDialog、ImportStudentDialog。
- 至少 3 种事件：点击、输入、选择文件、拖拽上传、键盘回车。
- 响应式数据：使用 `ref`、`reactive`。
- 列表渲染：学生列表、历史列表使用 `v-for`。
- 表单处理：添加、编辑、导入使用 `v-model`。
- 条件渲染：空状态、点名状态、导入结果使用 `v-if`。
- 生命周期：使用 `onMounted`、`onUpdated`、`onBeforeUnmount`。
- 计算属性或侦听器：使用 `computed`、`watch`。
- 路由：包含 `/` 和 `/history` 两个页面。
- 数据持久化：使用 localStorage。

## 部署说明

Vite 项目可以部署到 Vercel、Netlify 或 GitHub Pages。

常见流程：

```bash
pnpm build
```

将生成的 `dist/` 目录上传到静态托管平台即可。Vercel/Netlify 中构建命令填写 `pnpm build`，输出目录填写 `dist`。

## 文档

- `docs/01_项目功能说明.md`
- `docs/03_数据表设计.md`

## AI 辅助说明

本项目使用 Codex 辅助完成 Vue3 迁移、导入解析、组件实现、单元测试和文档编写。项目需求、页面风格、功能范围和最终验收由本人确认。
