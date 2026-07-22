/// <reference types="vite/client" />

// Electron 桥接 API 类型声明（统一入口，取代各文件内的局部声明）
export {};

declare global {
  interface LoggerReadOptions {
    lines?: number;
    level?: 'all' | 'info' | 'warn' | 'error';
    keyword?: string;
    fromLine?: number;
    source?: string | string[] | null;
  }

  interface LogFileInfo {
    name: string;
    path: string;
    archive: boolean;
    size: number;
    mtime: string;
  }

  interface LogReadResult {
    file: string;
    path: string;
    totalLines: number;
    returnedLines: number;
    startLine: number;
    lines: string[];
  }

  interface TruncateResult {
    file: string;
    path: string;
    originalLines: number;
    keptLines: number;
  }

  interface ChangeQueryOptions {
    limit?: number;
    offset?: number;
    type?: 'add' | 'edit' | 'delete';
    target?: 'asset' | 'liability';
    category?: string;
    keyword?: string;
    fromDate?: string;
    toDate?: string;
  }

  interface ArchiveResult {
    source: string;
    archivePath: string;
    archiveName: string;
    size: number;
  }

  interface ExtractResult {
    source?: string;
    targetPath: string;
    size: number;
    fileCount?: number;
  }

  interface ElectronAPI {
    isElectron: boolean;
    platform: string;
    db: {
      getAllAssets: () => Promise<any[]>;
      addAsset: (asset: any) => Promise<any>;
      updateAsset: (id: string, updates: any) => Promise<any>;
      deleteAsset: (id: string) => Promise<any>;
      getAllLiabilities: () => Promise<any[]>;
      addLiability: (liability: any) => Promise<any>;
      updateLiability: (id: string, updates: any) => Promise<any>;
      deleteLiability: (id: string) => Promise<any>;
      getAllChanges: (options?: ChangeQueryOptions) => Promise<any[]>;
      getChangesCount: (options?: ChangeQueryOptions) => Promise<number>;
      addChange: (change: any) => Promise<any>;
      migrate: (data: { assets: any[]; liabilities: any[]; changes: any[] }) => Promise<boolean>;
      importDbFile: (filePath: string) => Promise<void>;
      backupDb: () => Promise<string | null>;
    };
    config: {
      getDbPath: () => Promise<string>;
      getDefaultDbPath: () => Promise<string>;
      selectFolder: () => Promise<string | null>;
      selectDbFile: () => Promise<string | null>;
      setDbPath: (dbPath: string) => Promise<{ dbPath: string }>;
      getLogDir: () => Promise<string>;
      getDefaultLogDir: () => Promise<string>;
      selectLogFolder: () => Promise<string | null>;
      setLogDir: (logDir: string) => Promise<{ logDir: string }>;
    };
    logger: {
      listLogs: () => Promise<LogFileInfo[]>;
      getRecentLogs: (count?: number) => Promise<string[]>;
      readLog: (filePath: string, options?: LoggerReadOptions) => Promise<LogReadResult>;
      truncateLog: (filePath: string, keepLines?: number) => Promise<TruncateResult>;
      archiveLog: (filePath: string) => Promise<ArchiveResult>;
      archiveAllLogs: () => Promise<string[]>;
      extractLog: (filePath: string, targetPath: string) => Promise<ExtractResult>;
      extractLogsAsBundle: (filePaths: string[], targetPath: string) => Promise<ExtractResult>;
      selectSavePath: (defaultName?: string) => Promise<string | null>;
      getLogDir: () => Promise<string>;
      write: (level: 'info' | 'warn' | 'error', source: string, ...args: any[]) => Promise<boolean>;
    };
  }

  interface Window {
    electronAPI?: ElectronAPI;
  }
}
