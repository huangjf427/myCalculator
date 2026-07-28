# WealthCare（财富管家）

本地优先的个人财产管理桌面应用 —— 统一管理**银行存款、证券投资、理财基金、负债**，并提供实时净资产视图、**多币种折算**、**操作审计**与**系统日志**。离线运行，数据不出本机。

> 平台：Windows 10/11 x64（Electron）　|　版本：v2.0

## 功能特性

- **资产管理**：银行存款（活/定期）、证券投资、理财基金、其他资产，支持增删改查与分类汇总。
- **负债管理**：贷款、信用卡、其他负债，支持增删改查。
- **多币种支持**：资产/负债均支持币种，汇率在设置中维护；汇总、仪表盘、统计分析与打印表统一折算为人民币（RMB/CNY）。
- **仪表盘**：总资产 / 总负债 / 净资产 / 负债率，以及资产、负债分类占比。
- **统计分析**：资产与负债构成饼图、按月到期分布组合图，支持打印。
- **操作审计**：对资产/负债的每一次增、删、改均留痕（类型、对象、金额、时间、**变更前/后快照**、可读摘要），支持筛选、分页、前后对比。
- **系统日志**：独立于数据库的文件日志系统 —— 按日期分文件、级别/来源/关键字过滤、今日实时视图、截断、归档、导出（单文件/汇总）；单文件超 5MB 自动轮转。
- **设置**：数据库文件位置与日志存放目录均可配置（选择 / 恢复默认 / 导入 / 备份）。

## 技术栈

Electron 42 · React 18 · TypeScript 5.6 · Vite 6 · TailwindCSS 3 · Zustand 5 · recharts 2 · sql.js 1.14（SQLite WASM）· electron-builder 26

## 目录结构

```
electron/   主进程（main / db / logger / config / preload）
src/        渲染进程（pages / store / types / components）
docs/       需求文档.md、设计文档.md
```

## 快速开始

```bash
npm install                # 安装依赖

npm run dev:electron       # 开发模式（Vite + Electron，自动打开 DevTools）

npm run lint               # ESLint 代码检查（请先安装 eslint 依赖）
npm run build              # 类型检查 + 前端构建（产出 dist/）

npm run build:win:setup    # 打包 Windows NSIS 安装包（dist-electron/）
npm run build:win:portable # 打包便携版 exe
```

## 架构简述

- **主进程 ↔ 渲染进程**：通过 `preload.cjs` 暴露 `window.electronAPI`，渲染层用 `ipcRenderer.invoke('ns:method', ...)` 调用主进程能力；主进程开启 `contextIsolation`、关闭 `nodeIntegration`。
- **数据持久化**：sql.js 内存 SQLite，写操作后 300ms 防抖落盘；退出前强制 `flushSave()`。
- **审计双写**：资产/负债增删改时，`wealthStore` 同时写入 `changes` 表（结构化、可分页查询）与 `audit` 来源文件日志（用于截断/归档）。
- **日志系统**：`logger.cjs` 独立文件系统，包含自污染防护（截断/轮转/切换目录只写内存不回写文件）。

## 文档

- [需求文档](./docs/需求文档.md)
- [设计文档](./docs/设计文档.md)

## 说明

所有数据仅存储于本机，应用不发起任何网络请求、不上传任何信息。
