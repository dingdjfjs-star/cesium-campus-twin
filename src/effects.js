/**
 * effects.js —— 特效层(最终版)
 *
 * 本机(Cesium 1.144 + 部分 GPU/驱动)存在渲染缺陷:
 * - 任何 CircleGeometry / PolygonGeometry 裸图元(flat 或 lit)都会让整个场景停摆;
 * - CallbackProperty 驱动的动态实体同样会停摆。
 * 因此特效全部改用"已验证可用"的积木:
 * - 波纹 / 雷达扫掠:Billboard(sizeInMeters) 贴图,逐帧改 scale / rotation / color
 *   (BillboardCollection 逐帧改属性是 Cesium 最成熟的实时目标路径);
 * - 中心闪烁点:PointPrimitive 逐帧改 pixelSize。
 */
import { offsetLL } from './campusData.js';

const C = Cesium;

/** 环形波纹贴图(canvas 生成,无需外部图片) */
function ringCanvas() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  g.strokeStyle = 'rgba(255,255,255,1)';
  g.lineWidth = 7;
  g.beginPath();
  g.arc(64, 64, 55, 0, Math.PI * 2);
  g.stroke();
  // 内圈淡填充,波纹更醒目
  g.fillStyle = 'rgba(255,255,255,0.18)';
  g.beginPath();
  g.arc(64, 64, 52, 0, Math.PI * 2);
  g.fill();
  return cv;
}

/** 雷达扫掠扇形贴图:顶点在画布中心,半径到画布边缘 */
function wedgeCanvas() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const g = cv.getContext('2d');
  g.translate(128, 128);
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, 128);
  grad.addColorStop(0, 'rgba(0,229,255,0.85)');
  grad.addColorStop(0.5, 'rgba(0,229,255,0.35)');
  grad.addColorStop(1, 'rgba(0,229,255,0)');
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(0, 0);
  g.arc(0, 0, 128, -0.55, 0);
  g.closePath();
  g.fill();
  // 前沿亮线
  g.strokeStyle = 'rgba(0,229,255,0.9)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(Math.cos(-0.55) * 126, Math.sin(-0.55) * 126);
  g.stroke();
  return cv;
}

/* ---------- 告警扩散波纹 ---------- */
export function addPulseRings(viewer, lon, lat, cssColor = '#ff5252') {
  const scene = viewer.scene;
  const tint = C.Color.fromCssColorString(cssColor);
  const center = C.Cartesian3.fromDegrees(lon, lat, 2.5);

  const billboards = scene.primitives.add(new C.BillboardCollection());
  const rings = [];
  const N = 3;
  // sizeInMeters 模式:世界宽度 = 贴图像素 × scale,128px 贴图 → scale = 目标米数 / 128
  for (let i = 0; i < N; i++) {
    rings.push(billboards.add({
      position: center,
      image: ringCanvas(),
      sizeInMeters: true,
      scale: 20 / 128,
      color: tint.withAlpha(0.6),
      heightReference: C.HeightReference.NONE,
    }));
  }

  const dots = scene.primitives.add(new C.PointPrimitiveCollection());
  const dot = dots.add({
    position: C.Cartesian3.fromDegrees(lon, lat, 4),
    pixelSize: 10,
    color: tint.withAlpha(0.95),
    disableDepthTestDistance: 3000,
  });

  const onFrame = () => {
    const now = Date.now();
    for (let i = 0; i < N; i++) {
      const f = ((now / 1600) + i / N) % 1;
      rings[i].scale = (20 + f * 240) / 128; // 世界直径 20m → 260m
      rings[i].color = tint.withAlpha(0.6 * (1 - f));
    }
    dot.pixelSize = 8 + 5 * Math.abs(Math.sin(now / 300));
  };
  scene.preUpdate.addEventListener(onFrame);

  return {
    setVisible(v) {
      billboards.show = v;
      dots.show = v;
    },
    remove() {
      scene.preUpdate.removeEventListener(onFrame);
      scene.primitives.remove(billboards);
      scene.primitives.remove(dots);
    },
  };
}

/* ---------- 雷达扫掠 ---------- */
export function addRadarSweep(viewer) {
  const scene = viewer.scene;
  const [clon, clat] = offsetLL(0, 0);
  const center = C.Cartesian3.fromDegrees(clon, clat, 2.0);

  const billboards = scene.primitives.add(new C.BillboardCollection());
  const sweep = billboards.add({
    position: center,
    image: wedgeCanvas(),
    sizeInMeters: true,
    scale: 640 / 256, // 256px 贴图 × 2.5 ≈ 直径 640m,覆盖校区
    rotation: 0,
    alignedAxis: C.Cartesian3.UNIT_Z, // 绕世界 Z 轴旋转(贴地旋转而非屏幕旋转)
  });

  const onFrame = () => {
    sweep.rotation = (Date.now() / 1000) * 0.9;
  };
  scene.preUpdate.addEventListener(onFrame);

  return {
    setVisible(v) { billboards.show = v; },
    remove() {
      scene.preUpdate.removeEventListener(onFrame);
      scene.primitives.remove(billboards);
    },
  };
}
