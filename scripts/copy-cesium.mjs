// 把 npm 安装的 CesiumJS 预编译产物拷贝到 public/cesium,
// 页面通过 <script> 直接加载,避免打包器处理 Cesium 的 Workers/Assets。
import { cpSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'node_modules', 'cesium', 'Build', 'Cesium');
const dest = path.join(root, 'public', 'cesium');

cpSync(src, dest, { recursive: true });
console.log('[copy-cesium] done ->', dest);
