# 个人财产管理工具 - 技术架构文档

## 1. 架构设计

```mermaid
flowchart TB
    subgraph Frontend["前端层"]
        UI["React 18 组件"]
        State["Zustand 状态管理"]
        Router["React Router 路由"]
        Charts["Recharts 图表库"]
    end
    
    subgraph Data["数据层"]
        LocalStorage["LocalStorage 持久化"]
        DataModel["TypeScript 数据模型"]
    end
    
    UI --> State
    State --> LocalStorage
    State --> DataModel
    Router --> UI
    Charts --> UI
```

## 2. 技术描述

- **前端**：React 18 + TypeScript + Vite
- **样式**：Tailwind CSS 3
- **状态管理**：Zustand（轻量级，适合单用户应用）
- **图表库**：Recharts（React 原生图表库）
- **路由**：React Router v6
- **数据持久化**：LocalStorage（无需后端，数据存本地）
- **后端**：无（纯前端应用）
- **初始化**：Vite + React + TypeScript 模板

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| `/` | 仪表盘总览（默认首页） |
| `/assets` | 资产录入与管理（银行存款、证券、理财基金） |
| `/liabilities` | 负债管理（贷款、信用卡） |
| `/analysis` | 统计分析与图表 |

## 4. API 定义

本应用为纯前端，无后端 API。数据通过 Zustand store 管理并持久化到 LocalStorage。

### 4.1 数据模型类型定义

```typescript
// 资产基础类型
interface Asset {
  id: string;
  category: 'bank_deposit' | 'securities' | 'fund_wealth';
  name: string;          // 资产名称
  amount: number;        // 金额
  date: string;          // 录入日期
  notes?: string;        // 备注
  createdAt: string;
  updatedAt: string;
}

// 银行存款
interface BankDeposit extends Asset {
  category: 'bank_deposit';
  bankName: string;      // 银行名称
  depositType: 'demand' | 'fixed'; // 活期/定期
  interestRate?: number; // 利率
  maturityDate?: string; // 到期日
}

// 证券投资
interface Securities extends Asset {
  category: 'securities';
  securityType: 'stock' | 'bond' | 'other'; // 股票/债券/其他
  ticker?: string;       // 证券代码
  quantity?: number;     // 数量
  costPrice?: number;    // 成本价
  currentPrice?: number; // 当前价
}

// 理财和基金
interface FundWealth extends Asset {
  category: 'fund_wealth';
  productType: 'wealth_management' | 'mutual_fund' | 'private_fund'; // 理财/公募/私募
  institution: string;   // 发行机构
  expectedReturn?: number; // 预期收益率
  startDate?: string;    // 起息日
  endDate?: string;      // 到期日
}

// 负债基础类型
interface Liability {
  id: string;
  category: 'loan' | 'credit_card';
  name: string;
  amount: number;        // 欠款余额
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 贷款
interface Loan extends Liability {
  category: 'loan';
  loanType: 'mortgage' | 'car_loan' | 'consumer_loan' | 'other'; // 房贷/车贷/消费贷/其他
  lender: string;        // 贷款机构
  monthlyPayment?: number; // 月供
  interestRate?: number; // 利率
  totalMonths?: number;  // 总期数
  remainingMonths?: number; // 剩余期数
}

// 信用卡
interface CreditCard extends Liability {
  category: 'credit_card';
  bankName: string;      // 发卡银行
  creditLimit: number;   // 信用额度
  currentBalance: number; // 当前欠款
  dueDate?: string;      // 还款日
  minimumPayment?: number; // 最低还款
}

// 汇总统计
interface FinancialSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  debtRatio: number;     // 负债率 = 总负债/总资产
  assetBreakdown: {
    bankDeposit: number;
    securities: number;
    fundWealth: number;
  };
  liabilityBreakdown: {
    loan: number;
    creditCard: number;
  };
}
```

## 5. 服务器架构图

不适用（纯前端应用，无服务器）

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    ASSET {
        string id PK
        string category
        string name
        number amount
        string date
        string notes
        string createdAt
        string updatedAt
    }
    
    BANK_DEPOSIT {
        string id FK
        string bankName
        string depositType
        number interestRate
        string maturityDate
    }
    
    SECURITIES {
        string id FK
        string securityType
        string ticker
        number quantity
        number costPrice
        number currentPrice
    }
    
    FUND_WEALTH {
        string id FK
        string productType
        string institution
        number expectedReturn
        string startDate
        string endDate
    }
    
    LIABILITY {
        string id PK
        string category
        string name
        number amount
        string date
        string notes
        string createdAt
        string updatedAt
    }
    
    LOAN {
        string id FK
        string loanType
        string lender
        number monthlyPayment
        number interestRate
        number totalMonths
        number remainingMonths
    }
    
    CREDIT_CARD {
        string id FK
        string bankName
        number creditLimit
        number currentBalance
        string dueDate
        number minimumPayment
    }
    
    ASSET ||--o| BANK_DEPOSIT : "extends"
    ASSET ||--o| SECURITIES : "extends"
    ASSET ||--o| FUND_WEALTH : "extends"
    LIABILITY ||--o| LOAN : "extends"
    LIABILITY ||--o| CREDIT_CARD : "extends"
```

### 6.2 数据存储方式

使用 LocalStorage 存储 JSON 格式数据：

```typescript
// LocalStorage keys
const STORAGE_KEYS = {
  ASSETS: 'wealth_tracker_assets',
  LIABILITIES: 'wealth_tracker_liabilities',
};
```

无需 DDL 语句（无数据库）。
