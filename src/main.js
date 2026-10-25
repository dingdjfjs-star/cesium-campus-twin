/**
 * main.js —— 组装层:把 场景 / 实体 / 特效 / 巡逻 / 告警 / UI 全部接起来
 * 并负责:鼠标拾取交互、图层开关、昼夜切换、自动巡航、数据模拟。
 */
import { CAMPUS, BUILDINGS } from './campusData.js';
import './style.css';
import { createScene, flyOverview } from './createScene.js';
import { createCampus } from './sceneObjects.js';
import { addRadarSweep } from './effects.js';
import { createPatrols } from './patrol.js';
import { createAlarmManager } from './alarmManager.js';
import { initUI } from './ui.js';

/* ================= 场景初始化 ================= */
const viewer = createScene(document.getElementById('cesiumContainer'));
window.__viewer = viewer; // 便于控制台调试/演示时手动操作场景

/* ---- 调试开关:?debug=1 显示 HUD;?skip=patrol,radar,alarm,orbit 分阶段排障 ---- */
const SKIP = (new URLSearchParams(location.search).get('skip') ?? '').split(',').filter(Boolean);
const isSkipped = (k) => SKIP.includes(k);
if (new URLSearchParams(location.search).has('debug')) {
  viewer.scene.debugShowFramesPerSecond = true;
  const hud = document.createElement('div');
  hud.style.cssText = 'position:fixed;top:64px;left:50%;transform:translateX(-50%);z-index:99;font:12px monospace;color:#7fff7f;background:rgba(0,0,0,.65);padding:4px 10px;border-radius:6px;max-width:70%;white-space:nowrap;overflow:hidden';
  document.body.appendChild(hud);
  const errs = [];
  window.addEventListener('error', (e) => errs.push('E:' + e.message));
  window.addEventListener('unhandledrejection', (e) => errs.push('P:' + ((e.reason && e.reason.message) || e.reason)));
  const origCe = console.error;
  console.error = (...a) => { errs.push('C:' + a.map(String).join(' ').slice(0, 110)); origCe(...a); };
  setInterval(() => {
    let n = 0, prim = 0;
    try {
      n = viewer.entities.values.length;
      prim = viewer.scene.primitives.length;
    } catch { /* ignore */ }
    hud.textContent = `ent=${n} prim=${prim} h=${Math.round(viewer.camera.positionCartographic.height)} errs=[${errs.slice(0, 2).join(' | ') || 'none'}]`;
  }, 800);
}
const groups = createCampus(viewer);
const patrol = isSkipped('patrol') ? { setVisible() {} } : createPatrols(viewer);
if (!isSkipped('radar')) addRadarSweep(viewer);

// 楼栋实体索引:id → entity(roof 与 buildings 顺序一致,补上互相引用)
const buildingEnts = {};
groups.buildings.forEach((ent, i) => {
  buildingEnts[ent.buildingData.id] = ent;
  groups.roofs[i].buildingEnt = ent;
});

/* ================= UI ================= */
const ui = initUI({
  toggles: [
    { label: '建筑楼栋', apply: (v) => groups.buildings.concat(groups.roofs).forEach((e) => (e.show = v)) },
    { label: '道路绿化', apply: (v) => groups.roads.concat(groups.greens, groups.trees).forEach((e) => (e.show = v)) },
    { label: '视频监控', apply: (v) => groups.cameras.forEach((e) => (e.show = v)) },
    { label: '告警波纹', apply: (v) => alarmMgr.setVisible(v) },
    { label: '巡逻动态', apply: (v) => patrol.setVisible(v) },
    { label: '楼栋标注', apply: (v) => groups.buildings.forEach((e) => (e.label.show = v)) },
  ],
  alarmHandlers: {
    onFocus: (id) => {
      const a = alarmMgr.list.find((x) => x.id === id);
      if (a && buildingEnts[a.buildingId]) flyToBuilding(buildingEnts[a.buildingId]);
    },
    onResolve: (id) => alarmMgr.resolve(id),
  },
});

/* ================= 告警 ================= */
const alarmMgr = createAlarmManager(viewer, buildingEnts);
alarmMgr.onRender = (list) => ui.renderAlarms(list);
ui.renderAlarms([]);

// 开场 3 秒后来一发告警(保证第一眼就有"波纹+红色楼栋"效果),之后周期性随机产生
if (!isSkipped('alarm')) {
  setTimeout(() => {
    const lab = BUILDINGS.find((b) => b.id === 'lab');
    alarmMgr.spawn(lab, { type: '电气', level: '高', desc: '配电柜温度过高,建议现场巡检' });
  }, 3000);
  setInterval(() => {
    if (Math.random() < 0.5 && alarmMgr.list.filter((a) => !a.resolved).length < 4) {
      alarmMgr.randomSpawn();
    }
  }, 26000);
}

/* ================= 鼠标交互:点击 + 悬停 ================= */
const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

function pickEntity(windowPos) {
  const picked = viewer.scene.pick(windowPos);
  return picked && picked.id ? picked.id : null; // picked.id 即 Entity
}

function flyToBuilding(ent) {
  const b = ent.buildingData;
  viewer.flyTo(ent, {
    duration: 1.5,
    offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-55), Math.max(b.w, b.d) * 2.4 + 130),
  });
  ui.showBuilding(b);
}

handler.setInputAction((movement) => {
  const ent = pickEntity(movement.position);
  if (!ent) { ui.hideInfo(); return; }
  if (ent.kind === 'building') flyToBuilding(ent);
  else if (ent.kind === 'roof') flyToBuilding(ent.buildingEnt);
  else if (ent.kind === 'camera') { ui.showCamera(ent.cameraData); viewer.flyTo(ent, { duration: 1.2, offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-40), 180) }); }
  else if (ent.kind === 'patrol') { ui.hideInfo(); }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

// 悬停高亮:楼栋变琥珀色 + 鼠标指针变化
let hovered = null;
let lastHoverCheck = 0;
handler.setInputAction((movement) => {
  const now = Date.now();
  if (now - lastHoverCheck < 60) return;
  lastHoverCheck = now;
  const ent = pickEntity(movement.endPosition);
  const target = ent && (ent.kind === 'building' || ent.kind === 'roof') ? ent : null;

  if (hovered !== target) {
    if (hovered) { // 恢复
      const e = hovered.kind === 'roof' ? hovered.buildingEnt : hovered;
      if (e) e.polygon.material = new Cesium.ColorMaterialProperty(
        Cesium.Color.fromCssColorString(e.buildingData.color).withAlpha(0.82)
      );
    }
    hovered = target;
    if (hovered) {
      const e = hovered.kind === 'roof' ? hovered.buildingEnt : hovered;
      e.polygon.material = new Cesium.ColorMaterialProperty(
        Cesium.Color.fromCssColorString('#ffd54f').withAlpha(0.75)
      );
    }
    viewer.canvas.style.cursor = hovered ? 'pointer' : 'default';
  }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

/* ================= 顶栏按钮:昼夜 / 巡航 / 复位 ================= */
const btnNight = document.getElementById('btnNight');
btnNight.addEventListener('click', () => {
  const toNight = !btnNight.classList.contains('active');
  btnNight.classList.toggle('active', toNight);
  setNight(toNight);
});

function setNight(on) {
  const scene = viewer.scene;
  if (on) {
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date(2026, 7, 29, 19, 55));
    scene.globe.enableLighting = false; // 关掉太阳光照 → 建筑呈"自发光"霓虹感
    scene.skyAtmosphere.show = false;   // 露出星空
    scene.sun.show = false;
    scene.moon.show = true;
    scene.globe.baseColor = Cesium.Color.fromCssColorString('#040d1c');
    try {
      scene.postProcessStages.bloom.enabled = true;
      scene.postProcessStages.bloom.uniforms.brightness = 0.12;
      scene.postProcessStages.bloom.uniforms.glowStrength = 0.28;
    } catch { /* 低版本无 bloom 时忽略 */ }
    btnNight.textContent = '☀ 白天模式';
  } else {
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date(2026, 7, 29, 10, 30));
    scene.globe.enableLighting = true;
    scene.skyAtmosphere.show = true;
    scene.sun.show = true;
    scene.moon.show = true;
    scene.globe.baseColor = Cesium.Color.fromCssColorString('#071a30');
    try { scene.postProcessStages.bloom.enabled = false; } catch { /* ignore */ }
    btnNight.textContent = '🌙 夜间模式';
  }
}

// 自动巡航:绕屏幕中心缓慢旋转;用户操作后暂停 8 秒再恢复
let orbitOn = document.getElementById('btnOrbit').classList.contains('active');
let lastUserOp = 0;
document.getElementById('btnOrbit').addEventListener('click', function () {
  orbitOn = !orbitOn;
  this.classList.toggle('active', orbitOn);
});
const opHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
opHandler.setInputAction(() => (lastUserOp = Date.now()), Cesium.ScreenSpaceEventType.WHEEL);
opHandler.setInputAction(() => (lastUserOp = Date.now()), Cesium.ScreenSpaceEventType.LEFT_DOWN);

/* 自动巡航(转台模式):空闲 30 秒后,环绕校园缓慢转一个角度。
 * 刻意只用 camera.flyTo(已验证安全),不用逐帧相机旋转——
 * 本机 Cesium 1.144 上逐帧 rotateRight 会导致实体渲染停摆。 */
if (!isSkipped('orbit')) {
  let orbitHeading = 0;
  setInterval(() => {
    if (!orbitOn || viewer.camera.flying || Date.now() - lastUserOp < 30000) return;
    const h = viewer.camera.positionCartographic.height;
    if (h < 800 || h > 4000) return; // 只在概览高度附近转台
    orbitHeading = (orbitHeading + Math.PI / 6) % (Math.PI * 2);
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(CAMPUS.lon, CAMPUS.lat - 0.006, 1600),
      orientation: { heading: orbitHeading, pitch: Cesium.Math.toRadians(-62), roll: 0 },
      duration: 8,
    });
  }, 30000);
}

document.getElementById('btnReset').addEventListener('click', () => {
  ui.hideInfo();
  flyOverview(viewer);
});

/* ================= 数据模拟:概览指标 + 能耗曲线 ================= */
const stats = { people: 8634, power: 412.5, devices: 128, temp: 27.4 };
function walk(v, step, min, max) {
  v += (Math.random() - 0.5) * step;
  return Math.min(max, Math.max(min, v));
}
ui.updateStats(stats);
setInterval(() => {
  stats.people = walk(stats.people, 60, 8200, 9200);
  stats.power = walk(stats.power, 12, 350, 520);
  stats.devices = Math.round(walk(stats.devices, 1.2, 122, 132));
  stats.temp = walk(stats.temp, 0.15, 24, 31);
  ui.updateStats(stats);
}, 2000);

setInterval(() => {
  const now = new Date();
  const label = now.toLocaleTimeString('zh-CN', { hour12: false });
  ui.pushEnergy(label, +stats.power.toFixed(1));
}, 2000);

/* ================= 场景时钟显示 ================= */
function tickClock() {
  const d = Cesium.JulianDate.toDate(viewer.clock.currentTime);
  ui.setClock(`场景时间 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
}
tickClock();
setInterval(tickClock, 1000);

/* ================= 开场动画 ================= */
// 先摆到远景,再飞入校园
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(CAMPUS.lon, CAMPUS.lat - 0.09, 24000),
  orientation: { heading: 0, pitch: Cesium.Math.toRadians(-55), roll: 0 },
});
setTimeout(() => flyOverview(viewer), 400);
setTimeout(() => ui.hideLoading(), 2200);
