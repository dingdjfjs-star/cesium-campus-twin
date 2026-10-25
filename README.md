# 智慧校园数字孪生平台 · CesiumJS Demo

一个面向课程设计/竞赛答辩的三维数字孪生小场景：深色科技风的**真实校园数字化重建**，
带实时数据面板、告警闭环、监控视域、巡逻动画和昼夜切换。**纯前端、离线可跑、无需任何 token。**

![tech](https://img.shields.io/badge/CesiumJS-1.144-blue) ![tech](https://img.shields.io/badge/Vite-5-purple) ![tech](https://img.shields.io/badge/ECharts-5-orange)

---

## 〇、当前版本：卫星图数字化校园

本版校园**按真实卫星图数字化重建**（约 1150m × 1060m 山地校园），包含：

- 左上"蔡子下"宿舍群（12 栋长条板楼）、左侧"庄前"宿舍区（4 栋）
- 中部沿山路的教学/实验建筑群（图书馆、教学楼 A~I、实验楼、行政楼、学术交流中心…共 18 栋）
- 右侧蓝跑道大运动场 + 体育馆/游泳馆；左上红跑道运动场 + 球场
- 中下人工湖 + 红顶生活后勤区（食堂/后勤/校医院）
- 右下**国家冷链工程技术研究中心**建筑群 + 圆形广场（演示告警默认在此楼）
- 六大片林地（程序化播种 300+ 棵树，位置固定可复现）

改楼栋/增删建筑只需编辑 `src/campusData.js`（像素→米的换算方法写在文件头注释）。
旧版虚拟小校园备份在 `src/campusData.demo.js`。

> 放到学校真实位置：把 `campusData.js` 顶部 `CAMPUS.lon/lat` 改成学校真实经纬度即可。

## 一、快速运行

```bash
npm install          # 首次安装依赖
npm run dev          # 启动开发服务器,默认 http://localhost:5173
npm run build        # 生产构建(dist/,可静态部署)
```

> 首次安装后需要执行一次 `node scripts/copy-cesium.mjs`，把 Cesium 运行时拷进 `public/cesium`（仓库已包含则跳过）。

## 二、功能清单（答辩演示点）

| 模块 | 演示效果 | 代码位置 |
| --- | --- | --- |
| 三维校园 | 程序化生成 11 栋楼 + 道路/绿化/湖/跑道，发光边界 | `campusData.js` → `sceneObjects.js` |
| 开场动画 | 远景 → 3.2s 飞入校园斜视角 | `main.js` 开场动画段 |
| 数据面板 | 在校人数/功率/设备/温度随机游走 + ECharts 实时能耗曲线 | `ui.js` |
| 单体化交互 | 悬停楼栋变琥珀色；点击弹信息卡（面积/人数/功率 + 24h 能耗柱图）并飞行聚焦 | `main.js` 鼠标交互 |
| 告警闭环 | IoT 事件流 → 扩散波纹 + 楼栋染红 → 「定位」飞行 → 「处理」消警还原 | `alarmManager.js` + `effects.js` |
| 视频监控 | 6 路摄像头图标 + 地面视域楔形，点击看"设备信息" | `sceneObjects.js` |
| 巡逻动画 | 巡逻车/安保沿路线匀速移动，跟随标注 + 发光路线 | `patrol.js` |
| 雷达扫掠 | 校园中心旋转扫描扇形 | `effects.js` |
| 昼夜切换 | 白天太阳光照 ⇄ 夜间星空 + 霓虹泛光(bloom) | `main.js` setNight |
| 图层控制 | 建筑/道路绿化/监控/告警/巡逻/标注 六类开关 | `main.js` |
| 自动巡航 | 空闲 30s 后环绕校园"转台式"飞行，任何操作自动让位 | `main.js` orbit 段 |

**URL 调试开关**（答辩答疑时很好用）：
- `?debug=1`：屏幕顶部 HUD 显示实体数/图元数/相机高度/错误汇总 + FPS
- `?skip=alarm,orbit,...`：跳过指定模块，用于分阶段排障
- `public/smoketest.html`、`public/bisect.html`：最小渲染对照页（排障过程的产物，也是很好的"兼容性问题定位"答辩素材）

## 三、60 秒演示脚本

1. **开场（0-10s）**：页面加载 → 镜头从太空飞入校园。左面板数字滚动、能耗曲线开始走。
2. **单体化（10-25s）**：鼠标悬停任意楼栋（变琥珀色）→ 点击图书馆 → 信息卡弹出 + 镜头聚焦 + 24h 能耗柱图。
3. **告警闭环（25-40s）**：开场 3 秒时实验楼已染红并出现扩散波纹。点告警列表「定位」→ 飞到现场 → 点「处理」→ 波纹消失、楼栋还原。
4. **巡逻与监控（40-50s）**：指出巡逻车沿环线移动、安保在内区步行；指一下摄像头视域楔形。
5. **昼夜 + 巡航（50-60s）**：点「夜间模式」→ 星空霓虹 + 泛光；点「自动巡航」放下鼠标，转台环绕。

## 四、技术要点（预答辩问题）

- **为什么不用 3D Tiles / 倾斜摄影？** 场景重点是"孪生逻辑闭环"（数据→告警→处置）。程序化建筑零资产依赖、离线可跑；架构上 `sceneObjects.js` 与数据解耦，换成 glTF/3D Tiles 只需替换加载函数。
- **坐标怎么组织？** 所有数据用"校园原点 + 局部米制坐标 (dx向东, dy向北)"表达（`offsetLL` 转经纬度），布局调整直观，不用手写经纬度。
- **数据是真的吗？** 前端模拟（随机游走 + 定时告警）。接口层已收敛在 `alarmManager`/`stats`，接 WebSocket/IoT 平台只需替换数据源。
- **动画怎么做的？** 逐帧矩阵/属性更新：巡逻车每帧只改 `Primitive.modelMatrix`，波纹/扫掠只改 Billboard 的 `scale/rotation/color`，都不触发几何重建。
- **性能？** 全场景约 100 个实体 + 10 个图元，1080p 下 120+ FPS（见 ?debug=1 的 FPS 角标）。

## 五、重要：本机 Cesium 1.144 渲染缺陷与规避（踩坑记录）

在部分 GPU/驱动 + Cesium 1.144 组合下实测发现三类**会让整个场景停摆**的用法，
本项目已全部规避（`public/bisect.html` 可逐项复现）：

1. **`CallbackProperty` 驱动的动态实体**（位置/朝向/半径/层次结构逐帧变化）
   → 改为：静态几何 + 每帧更新 `Primitive.modelMatrix`、Billboard/Label/Point 属性。
2. **`CircleGeometry` / `PolygonGeometry` 裸图元**（无论 flat 还是 lit、透明还是不透明）
   → 改为：Billboard 贴图（`sizeInMeters`，注意 scale 单位是"米/像素"）。
3. **`preRender` 阶段调用 `camera.rotateRight` 逐帧旋转**
   → 改为：空闲时"转台式" `camera.flyTo`（同样破坏渲染的还有逐帧 `rotateRight` 本身，与阶段无关）。

其余路径（静态 Entity、Entity 材质整体替换做高亮、Billboard/Label/Point 逐帧属性、
BoxGeometry 图元 + modelMatrix）均实测正常。

## 六、目录结构

```
cesium-campus-twin/
├─ index.html              # 页面骨架(面板/信息卡/加载层)
├─ vite.config.js
├─ scripts/copy-cesium.mjs # 拷贝 Cesium 运行时到 public
├─ public/
│  ├─ cesium/              # Cesium 静态资源(离线可用)
│  ├─ smoketest.html       # 最小渲染对照页(排障用)
│  └─ bisect.html          # 特性开关排障页(排障用,?radar/?pulse/?bbfx...)
└─ src/
   ├─ main.js              # 组装:交互/按钮/数据模拟/开场动画
   ├─ campusData.js        # 数据层:楼栋/道路/监控/巡逻/告警模板
   ├─ createScene.js       # Viewer 初始化 + 昼夜风格
   ├─ sceneObjects.js      # 数据 → 三维实体(建筑/道路/树/监控)
   ├─ effects.js           # 告警波纹 + 雷达扫掠
   ├─ patrol.js            # 巡逻动画
   ├─ alarmManager.js      # 告警业务闭环
   ├─ ui.js                # 面板/信息卡/ECharts/图层开关
   └─ style.css            # 深色科技风样式
```
