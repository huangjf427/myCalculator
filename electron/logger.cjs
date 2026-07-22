const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const config = require('./config.cjs');

const ARCHIVE_DIR_NAME = 'archive';
const LOG_FILE_PREFIX = 'app-';
const LOG_FILE_SUFFIX = '.log';
const MAX_RING_BUFFER = 500;          // 内存中保留的最近日志条数
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 单文件超过 5MB 自动轮转归档

let initialized = false;
let logDir = null;
let archiveDir = null;
let ringBuffer = [];
let consoleCaptured = false;

// ========== 路径 ==========

function getLogDir() {
  if (!initialized) init();
  // 每次从 config 动态读取，支持切换后即时生效
  const dir = config.getLogDir();
  if (dir !== logDir) {
    logDir = dir;
    archiveDir = null; // 重置，下次 getArchiveDir 重新计算
  }
  return logDir;
}

function getArchiveDir() {
  if (!archiveDir) {
    archiveDir = path.join(getLogDir(), ARCHIVE_DIR_NAME);
  }
  return archiveDir;
}

function ensureDirs() {
  const dir = getLogDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const adir = getArchiveDir();
  if (!fs.existsSync(adir)) fs.mkdirSync(adir, { recursive: true });
}

// 今日日志文件名
function todayFileName(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${LOG_FILE_PREFIX}${y}-${m}-${d}${LOG_FILE_SUFFIX}`;
}

function todayLogPath(date = new Date()) {
  return path.join(getLogDir(), todayFileName(date));
}

// ========== 日志写入 ==========

function formatTimestamp(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}.${ms}`;
}

function stringifyArg(value) {
  if (value instanceof Error) {
    return value.stack || value.message;
  }
  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function buildLine(level, source, ...args) {
  const ts = formatTimestamp();
  const msg = args.map(stringifyArg).join(' ');
  return `[${ts}] [${level.toUpperCase()}] [${source}] ${msg}`;
}

// 写入一条日志
function log(level, source, ...args) {
  if (!initialized) init();
  const line = buildLine(level, source, ...args);
  // 内存 ring buffer
  ringBuffer.push(line);
  if (ringBuffer.length > MAX_RING_BUFFER) {
    ringBuffer.splice(0, ringBuffer.length - MAX_RING_BUFFER);
  }
  // 写文件
  try {
    const filePath = todayLogPath();
    // 文件过大则先归档
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      if (stat.size > MAX_FILE_BYTES) {
        rotateFile(filePath);
      }
    }
    fs.appendFileSync(filePath, line + '\n', 'utf-8');
  } catch (e) {
    // 写日志失败不能再抛，避免循环
    // eslint-disable-next-line no-console
    process.stderr.write('写入日志失败: ' + (e && e.message) + '\n');
  }
}

// 快捷方法
function info(source, ...args) {
  log('info', source, ...args);
}
function warn(source, ...args) {
  log('warn', source, ...args);
}
function error(source, ...args) {
  log('error', source, ...args);
}

// 仅写入内存 ring buffer（不落文件），用于修改日志文件本身的操作，避免自污染
function logMemoryOnly(level, source, ...args) {
  if (!initialized) init();
  const line = buildLine(level, source, ...args);
  ringBuffer.push(line);
  if (ringBuffer.length > MAX_RING_BUFFER) {
    ringBuffer.splice(0, ringBuffer.length - MAX_RING_BUFFER);
  }
  return line;
}

// ========== 文件轮转 ==========

function rotateFile(filePath) {
  try {
    const base = path.basename(filePath, LOG_FILE_SUFFIX);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archivePath = path.join(getArchiveDir(), `${base}.rotated-${stamp}${LOG_FILE_SUFFIX}`);
    fs.copyFileSync(filePath, archivePath);
    // 轮转后清空原文件
    fs.writeFileSync(filePath, '', 'utf-8');
    // 仅记录到内存，避免写回刚清空的文件造成污染
    logMemoryOnly('info', 'logger', `日志文件已轮转归档: ${path.basename(filePath)} -> ${path.basename(archivePath)}`);
  } catch (e) {
    // eslint-disable-next-line no-console
    process.stderr.write('轮转日志失败: ' + (e && e.message) + '\n');
  }
}

// ========== 接管 console ==========

function captureConsole() {
  if (consoleCaptured) return;
  consoleCaptured = true;
  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;

  console.log = (...args) => {
    try { log('info', 'console', ...args); } catch { /* noop */ }
    origLog.apply(console, args);
  };
  console.warn = (...args) => {
    try { log('warn', 'console', ...args); } catch { /* noop */ }
    origWarn.apply(console, args);
  };
  console.error = (...args) => {
    try { log('error', 'console', ...args); } catch { /* noop */ }
    origError.apply(console, args);
  };
  // 捕获未处理异常
  process.on('uncaughtException', (err) => {
    try { error('process', '未捕获异常:', err); } catch { /* noop */ }
  });
  process.on('unhandledRejection', (reason) => {
    try { error('process', '未处理的 Promise 拒绝:', reason); } catch { /* noop */ }
  });
}

// ========== 初始化 ==========

function init() {
  if (initialized) return;
  initialized = true; // 必须在 ensureDirs 之前，避免 getLogDir→ensureDirs→init 的递归
  ensureDirs();
  info('logger', '日志系统已初始化');
}

// ========== 读取操作 ==========

// 列出所有日志文件（含归档），按修改时间倒序
function listLogs() {
  if (!initialized) init();
  const result = [];
  const seen = new Set();

  const collect = (dir, isArchive) => {
    if (!fs.existsSync(dir)) return;
    let entries = [];
    try {
      entries = fs.readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      const full = path.join(dir, name);
      try {
        const stat = fs.statSync(full);
        if (!stat.isFile()) continue;
        if (!name.endsWith(LOG_FILE_SUFFIX)) continue;
        if (seen.has(full)) continue;
        seen.add(full);
        result.push({
          name,
          path: full,
          archive: isArchive,
          size: stat.size,
          mtime: stat.mtime.toISOString(),
        });
      } catch {
        // skip
      }
    }
  };

  collect(getLogDir(), false);
  collect(getArchiveDir(), true);

  result.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
  return result;
}

// 获取内存中最近的日志
function getRecentLogs(count = 200) {
  const n = Math.max(0, Math.min(count, ringBuffer.length));
  return ringBuffer.slice(ringBuffer.length - n);
}

const LEVEL_ORDER = { INFO: 1, WARN: 2, ERROR: 3 };

// 解析单行日志的级别
function parseLevel(line) {
  const m = line.match(/\[(INFO|WARN|ERROR)\]/i);
  return m ? m[1].toUpperCase() : null;
}

// 解析日志行的 source 标签（格式：[TS] [LEVEL] [source] msg）
function parseSource(line) {
  const m = line.match(/\[\d{4}-\d{2}-\d{2}[^\]]*\]\s*\[[^\]]+\]\s*\[([^\]]+)\]/);
  return m ? m[1] : null;
}

// 读取日志文件内容，支持过滤
function readLog(filePath, options = {}) {
  if (!initialized) init();
  const {
    lines = 1000,
    level = 'all',
    keyword = '',
    fromLine = 0,
    source = null, // 单个字符串或字符串数组
  } = options;

  if (!fs.existsSync(filePath)) {
    throw new Error('日志文件不存在: ' + filePath);
  }

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    throw new Error('读取日志文件失败: ' + (e && e.message));
  }

  let allLines = content.split(/\r?\n/);
  // 去掉末尾空行
  if (allLines.length && allLines[allLines.length - 1] === '') {
    allLines.pop();
  }

  // 关键字过滤
  if (keyword) {
    const kw = keyword.toLowerCase();
    allLines = allLines.filter((l) => l.toLowerCase().includes(kw));
  }
  // 级别过滤
  if (level && level !== 'all') {
    const target = level.toUpperCase();
    allLines = allLines.filter((l) => {
      const lv = parseLevel(l);
      // 无法识别级别的行：若是 target=ERROR/WARN 则按级别阈值过滤；否则保留
      if (!lv) return LEVEL_ORDER[target] ? false : true;
      return LEVEL_ORDER[lv] >= LEVEL_ORDER[target];
    });
  }
  // source 过滤
  if (source) {
    const sources = Array.isArray(source) ? source : [source];
    const sourceSet = new Set(sources.map((s) => String(s).toLowerCase()));
    allLines = allLines.filter((l) => {
      const s = parseSource(l);
      if (!s) return false;
      return sourceSet.has(s.toLowerCase());
    });
  }

  const total = allLines.length;
  // 取尾部 lines 行（最近的）
  const maxLines = Math.max(0, Math.min(lines, total));
  const start = Math.max(fromLine, total - maxLines);
  const sliced = allLines.slice(start);

  return {
    file: path.basename(filePath),
    path: filePath,
    totalLines: total,
    returnedLines: sliced.length,
    startLine: start,
    lines: sliced,
  };
}

// ========== 截断 ==========

// 截断日志：保留最近 keepLines 行，删除前面的
function truncateLog(filePath, keepLines = 200) {
  if (!initialized) init();
  if (!fs.existsSync(filePath)) {
    throw new Error('日志文件不存在: ' + filePath);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  let allLines = content.split(/\r?\n/);
  if (allLines.length && allLines[allLines.length - 1] === '') {
    allLines.pop();
  }
  const total = allLines.length;
  const keep = Math.max(0, Math.min(keepLines, total));
  const kept = allLines.slice(total - keep);
  // 写一个截断标记（header 本身即为审计信息）
  const header = `[${formatTimestamp()}] [INFO] [logger] 日志已截断，保留最近 ${keep}/${total} 行\n`;
  fs.writeFileSync(filePath, header + kept.join('\n') + '\n', 'utf-8');
  // 仅记录到内存 ring buffer，避免写回刚截断的文件造成自污染
  logMemoryOnly('info', 'logger', `日志已截断: ${path.basename(filePath)}，保留 ${keep}/${total} 行`);
  return {
    file: path.basename(filePath),
    path: filePath,
    originalLines: total,
    keptLines: keep,
  };
}

// ========== 归档 ==========

// 归档日志：复制到 archive 目录，文件名加时间戳
function archiveLog(filePath) {
  if (!initialized) init();
  if (!fs.existsSync(filePath)) {
    throw new Error('日志文件不存在: ' + filePath);
  }
  const base = path.basename(filePath, LOG_FILE_SUFFIX);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archivePath = path.join(getArchiveDir(), `${base}.archived-${stamp}${LOG_FILE_SUFFIX}`);
  fs.copyFileSync(filePath, archivePath);
  info('logger', `日志已归档: ${path.basename(filePath)} -> ${path.basename(archivePath)}`);
  return {
    source: path.basename(filePath),
    archivePath,
    archiveName: path.basename(archivePath),
    size: fs.statSync(archivePath).size,
  };
}

// 归档所有当前日志（非 archive 目录的）
function archiveAllLogs() {
  if (!initialized) init();
  const archived = [];
  const dir = getLogDir();
  if (!fs.existsSync(dir)) return archived;
  const entries = fs.readdirSync(dir);
  for (const name of entries) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (!stat.isFile() || !name.endsWith(LOG_FILE_SUFFIX)) continue;
    try {
      const r = archiveLog(full);
      archived.push(r.archiveName);
    } catch {
      // skip
    }
  }
  info('logger', `已归档全部日志，共 ${archived.length} 个文件`);
  return archived;
}

// ========== 提取/导出 ==========

// 导出日志到指定目标路径（复制）
function extractLog(filePath, targetPath) {
  if (!initialized) init();
  if (!fs.existsSync(filePath)) {
    throw new Error('日志文件不存在: ' + filePath);
  }
  let dest = targetPath;
  // 若目标是目录，则使用原文件名
  try {
    const stat = fs.statSync(dest);
    if (stat.isDirectory()) {
      dest = path.join(dest, path.basename(filePath));
    }
  } catch {
    // 目标不存在，视为文件路径
  }
  fs.copyFileSync(filePath, dest);
  info('logger', `日志已导出: ${path.basename(filePath)} -> ${dest}`);
  return {
    source: path.basename(filePath),
    targetPath: dest,
    size: fs.statSync(dest).size,
  };
}

// 导出多份日志为单个汇总文件
function extractLogsAsBundle(filePaths, targetPath) {
  if (!initialized) init();
  let dest = targetPath;
  try {
    const stat = fs.statSync(dest);
    if (stat.isDirectory()) {
      dest = path.join(dest, `wealthcare-logs-${Date.now()}.log`);
    }
  } catch {
    // noop
  }
  const parts = [];
  for (const fp of filePaths) {
    if (!fs.existsSync(fp)) continue;
    parts.push('========== ' + path.basename(fp) + ' ==========');
    parts.push(fs.readFileSync(fp, 'utf-8'));
    parts.push('');
  }
  fs.writeFileSync(dest, parts.join('\n'), 'utf-8');
  info('logger', `已导出日志包: ${filePaths.length} 个文件 -> ${dest}`);
  return {
    targetPath: dest,
    fileCount: filePaths.length,
    size: fs.statSync(dest).size,
  };
}

// ========== 路径管理 ==========

// 切换日志目录后重新初始化路径缓存
function reloadLogDir() {
  logDir = null;
  archiveDir = null;
  ensureDirs();
  logMemoryOnly('info', 'logger', `日志目录已切换至: ${getLogDir()}`);
}

module.exports = {
  init,
  captureConsole,
  info,
  warn,
  error,
  log,
  getLogDir,
  getArchiveDir,
  todayLogPath,
  listLogs,
  getRecentLogs,
  readLog,
  truncateLog,
  archiveLog,
  archiveAllLogs,
  extractLog,
  extractLogsAsBundle,
  reloadLogDir,
};
