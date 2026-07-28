# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-07-28

### Added
- **多币种支持**：资产与负债均支持币种字段，汇率在设置中维护，汇总统一折算为人民币（CNY）。
  - 新增 `currency` 字段到全部 7 种资产/负债类型。
  - 新增 `SUPPORTED_CURRENCIES`、`DEFAULT_EXCHANGE_RATES`、`toRMB()`、`getAssetAmountInBase()`、`getLiabilityAmountInBase()`、`formatMoney()` 等辅助函数。
  - 设置页新增「汇率设置」区块，可编辑、保存、恢复默认汇率。
  - 明细按原币种展示，仪表盘 / 资产 / 负债 / 分析 / 打印表统一按人民币汇总。
- 文档更新：`README.md`、`docs/需求文档.md`、`docs/设计文档.md` 已同步到 v2.0，新增 FR-8 多币种需求与设计说明。

### Fixed
- 修复银行资产中「活期」筛选失效的问题：新建活期时显式写入 `depositType: 'demand'`，并对历史/异常缺失值做兜底兼容。
- 修复 `npm run build` 构建错误：`src/pages/Analysis.tsx` 中 `inline-size` 改为合法 `width` 属性。

### Changed
- 应用版本号从 `1.0.0` 升级到 `2.0.0`。
- `getSummary()` 等汇总逻辑现在统一返回折算后的人民币金额。

### Compatibility
- 旧版 1.0 数据库无需修改表结构即可直接使用：缺失 `currency` 字段的资产/负债默认视为 `CNY`；缺失汇率配置时使用内置默认值。

## [1.0.0] - 2026-07-22

### Added
- 初始版本发布：资产管理、负债管理、仪表盘、统计分析、操作审计、系统日志、设置。
- Electron + React + TypeScript + Vite + TailwindCSS + Zustand 技术栈。
- 本地 SQLite 数据持久化、300ms 防抖写盘、退出前强制落盘。
- Windows NSIS 安装包与便携版打包。
