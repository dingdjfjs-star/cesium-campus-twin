/**
 * patrol.js —— 巡逻动画层(最终版)
 * 用"已验证可用"的积木组合:
 * - 路线:静态 Entity 发光线(PolylineGlowMaterialProperty,场景边界同款,已验证)
 * - 移动体:BoxGeometry 裸图元,每帧只改 modelMatrix(已验证)
 * - 名称标注:LabelCollection,每帧只改 position(已验证)
 */
import { offsetLL, PATROLS } from './campusData.js';

const C = Cesium;

/** 预计算闭合折线,提供 posAt(s):按里程取位置与航向 */
function routeSampler(pts) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push({ a, b, len, start: total });
    total += len;
  }
  return {
    total,
    posAt(s) {
      s = ((s % total) + total) % total;
      for (const seg of segs) {
        if (s <= seg.start + seg.len || seg === segs[segs.length - 1]) {
          const t = seg.len === 0 ? 0 : (s - seg.start) / seg.len;
          return {
            x: seg.a[0] + (seg.b[0] - seg.a[0]) * t,
            y: seg.a[1] + (seg.b[1] - seg.a[1]) * t,
            heading: Math.atan2(seg.b[0] - seg.a[0], seg.b[1] - seg.a[1]), // 0=北
          };
        }
      }
    },
  };
}

export function createPatrols(viewer) {
  const scene = viewer.scene;
  const movers = [];
  const routeEntities = [];

  for (const p of PATROLS) {
    const sampler = routeSampler(p.pts);
    const isCar = p.kind === 'vehicle';
    const colorCss = isCar ? '#ffca28' : '#4dd0e1';
    const size = isCar
      ? new C.Cartesian3(4.6, 2.2, 1.8)
      : new C.Cartesian3(1.0, 1.0, 2.1);
    const hover = isCar ? 1.3 : 1.5;

    /* 路线发光线(静态 Entity,与边界同款材质) */
    routeEntities.push(viewer.entities.add({
      polyline: {
        positions: [...p.pts, p.pts[0]].map(([dx, dy]) => {
          const [lon, lat] = offsetLL(dx, dy);
          return C.Cartesian3.fromDegrees(lon, lat, 1.4);
        }),
        width: 3,
        material: new C.PolylineGlowMaterialProperty({
          glowPower: 0.3,
          color: C.Color.fromCssColorString(colorCss).withAlpha(0.7),
        }),
      },
    }));

    /* 移动体:盒子图元 + 每帧 modelMatrix */
    const box = scene.primitives.add(new C.Primitive({
      geometryInstances: new C.GeometryInstance({
        geometry: C.BoxGeometry.fromDimensions({
          dimensions: size,
          vertexFormat: C.PerInstanceColorAppearance.VERTEX_FORMAT,
        }),
        attribute: C.ColorGeometryInstanceAttribute.fromColor(
          C.Color.fromCssColorString(colorCss)
        ),
      }),
      appearance: new C.PerInstanceColorAppearance({ closed: true, translucent: false }),
      asynchronous: true,
    }));

    /* 名称标注:LabelCollection,逐帧改 position */
    const labels = scene.primitives.add(new C.LabelCollection());
    const label = labels.add({
      text: p.name,
      position: C.Cartesian3.fromDegrees(...offsetLL(p.pts[0][0], p.pts[0][1]), hover + 6),
      font: '12px "Microsoft YaHei", sans-serif',
      fillColor: C.Color.fromCssColorString(colorCss),
      showBackground: true,
      backgroundColor: C.Color.fromCssColorString('#0a2a44').withAlpha(0.7),
      backgroundPadding: new C.Cartesian2(6, 3),
      pixelOffset: new C.Cartesian2(0, -16),
      disableDepthTestDistance: 3000,
    });

    movers.push({ sampler, speed: p.speed, box, label, hover, hpr: new C.HeadingPitchRoll(0, 0, 0) });
  }

  const onFrame = () => {
    const now = Date.now();
    for (const m of movers) {
      if (!m.box.ready) continue;
      const pt = m.sampler.posAt((now / 1000) * m.speed);
      const [lon, lat] = offsetLL(pt.x, pt.y);
      const pos = C.Cartesian3.fromDegrees(lon, lat, m.hover);
      m.hpr.heading = pt.heading;
      m.box.modelMatrix = C.Transforms.headingPitchRollToFixedFrame(pos, m.hpr);
      m.label.position = C.Cartesian3.fromDegrees(lon, lat, m.hover + 5);
    }
  };
  scene.preUpdate.addEventListener(onFrame);

  return {
    setVisible(v) {
      movers.forEach((m) => { m.box.show = v; m.label.show = v; });
      routeEntities.forEach((e) => (e.show = v));
    },
  };
}
