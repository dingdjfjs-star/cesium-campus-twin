/**
 * sceneObjects.js —— 场景层:把 campusData 的数据"画"成三维实体
 * 地面 / 道路 / 绿化 / 湖 / 跑道 / 楼栋 / 监控,每类返回实体句柄,供图层开关使用。
 */
import {
  offsetLL, FLOOR_H, BUILDINGS, ROADS, GREENS, TRACKS, PONDS, PLAZAS, COURTS, GROUND, CAMERAS,
} from './campusData.js';

const C = Cesium;

/** 局部矩形(可旋转)的四个角 → 经纬度点数组 */
function rectCorners(dx, dy, w, d, rotDeg) {
  const rot = (rotDeg * Math.PI) / 180;
  const cos = Math.cos(rot), sin = Math.sin(rot);
  const half = [
    [-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2],
  ];
  return half.map(([x, y]) => {
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;
    return offsetLL(dx + rx, dy + ry);
  });
}

function hierarchy(llPoints, h = 0) {
  return new C.PolygonHierarchy(llPoints.map(([lon, lat]) => C.Cartesian3.fromDegrees(lon, lat, h)));
}

/** 程序化画一个"监控摄像头"小图标(canvas → billboard,无需外部图片) */
function cameraIconCanvas() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 48;
  const g = cv.getContext('2d');
  g.fillStyle = 'rgba(0,229,255,0.95)';
  g.beginPath(); g.roundRect(6, 16, 28, 18, 4); g.fill();
  g.beginPath(); g.moveTo(34, 20); g.lineTo(44, 14); g.lineTo(44, 36); g.lineTo(34, 30); g.closePath(); g.fill();
  g.fillStyle = '#04222e';
  g.beginPath(); g.arc(16, 25, 5, 0, Math.PI * 2); g.fill();
  return cv;
}

/**
 * 创建整个校园的所有静态实体
 * @returns groups 各类别实体集合(供图层开关 / 拾取交互使用)
 */
export function createCampus(viewer) {
  const groups = { buildings: [], roofs: [], roads: [], greens: [], trees: [], cameras: [], boundary: [] };

  /* ---------- 校区地面 + 发光边界 ---------- */
  const ground = viewer.entities.add({
    polygon: {
      hierarchy: hierarchy([
        offsetLL(-GROUND.hx, -GROUND.hy), offsetLL(GROUND.hx, -GROUND.hy),
        offsetLL(GROUND.hx, GROUND.hy), offsetLL(-GROUND.hx, GROUND.hy),
      ], 0.8),
      material: new C.ColorMaterialProperty(C.Color.fromCssColorString('#0c2136').withAlpha(0.92)),
      outline: false,
    },
  });
  groups.boundary.push(ground);

  const boundLL = [
    offsetLL(-GROUND.hx, -GROUND.hy), offsetLL(GROUND.hx, -GROUND.hy),
    offsetLL(GROUND.hx, GROUND.hy), offsetLL(-GROUND.hx, GROUND.hy),
    offsetLL(-GROUND.hx, -GROUND.hy),
  ];
  groups.boundary.push(viewer.entities.add({
    polyline: {
      positions: boundLL.map(([lon, lat]) => C.Cartesian3.fromDegrees(lon, lat, 1.6)),
      width: 3,
      material: new C.PolylineGlowMaterialProperty({
        glowPower: 0.25,
        color: C.Color.fromCssColorString('#00e5ff').withAlpha(0.8),
      }),
    },
  }));

  /* ---------- 道路 ---------- */
  for (const r of ROADS) {
    groups.roads.push(viewer.entities.add({
      corridor: {
        positions: r.pts.map(([dx, dy]) => {
          const [lon, lat] = offsetLL(dx, dy);
          return C.Cartesian3.fromDegrees(lon, lat, 1.2);
        }),
        width: r.width,
        height: 1.2,
        material: new C.ColorMaterialProperty(C.Color.fromCssColorString('#3b5364').withAlpha(0.95)),
      },
    }));
  }

  /* ---------- 绿化 + 湖 + 跑道 ---------- */
  for (const poly of GREENS) {
    groups.greens.push(viewer.entities.add({
      polygon: {
        hierarchy: hierarchy(poly.map(([dx, dy]) => offsetLL(dx, dy)), 1.0),
        material: new C.ColorMaterialProperty(C.Color.fromCssColorString('#156531').withAlpha(0.85)),
        outline: false,
      },
    }));
  }

  // 湖:外圈绿化带 + 水面
  for (const p of PONDS) {
    groups.greens.push(viewer.entities.add({
      position: C.Cartesian3.fromDegrees(...offsetLL(p.dx + 8, p.dy + 8), 1.0),
      ellipse: {
        semiMajorAxis: p.rx + 8, semiMinorAxis: p.ry + 8, height: 1.0,
        material: new C.ColorMaterialProperty(C.Color.fromCssColorString('#156531').withAlpha(0.85)),
      },
    }));
    groups.greens.push(viewer.entities.add({
      position: C.Cartesian3.fromDegrees(...offsetLL(p.dx, p.dy), 1.05),
      ellipse: {
        semiMajorAxis: p.rx, semiMinorAxis: p.ry, height: 1.05,
        material: new C.ColorMaterialProperty(C.Color.fromCssColorString('#0277bd').withAlpha(0.75)),
        outline: true, outlineColor: C.Color.fromCssColorString('#4fc3f7').withAlpha(0.5),
      },
    }));
  }

  /* ---- 运动场:跑道 + 内场草坪(数据里有几个画几个) ---- */
  for (const t of TRACKS) {
    groups.greens.push(viewer.entities.add({
      position: C.Cartesian3.fromDegrees(...offsetLL(t.dx, t.dy), 1.0),
      ellipse: {
        semiMajorAxis: t.rx, semiMinorAxis: t.ry, height: 1.0,
        material: new C.ColorMaterialProperty(C.Color.fromCssColorString(t.track).withAlpha(0.7)),
        outline: true, outlineColor: C.Color.fromCssColorString('#ffffff').withAlpha(0.5),
      },
    }));
    groups.greens.push(viewer.entities.add({
      position: C.Cartesian3.fromDegrees(...offsetLL(t.dx, t.dy), 1.06),
      ellipse: {
        semiMajorAxis: t.rx - 14, semiMinorAxis: t.ry - 14, height: 1.06,
        material: new C.ColorMaterialProperty(C.Color.fromCssColorString(t.field).withAlpha(0.9)),
      },
    }));
  }

  /* ---- 球场(绿色硬地) ---- */
  for (const ct of COURTS) {
    const corners = rectCorners(ct.dx, ct.dy, ct.w, ct.d, ct.rot);
    groups.greens.push(viewer.entities.add({
      polygon: {
        hierarchy: hierarchy(corners, 1.02),
        material: new C.ColorMaterialProperty(C.Color.fromCssColorString('#33691e').withAlpha(0.85)),
        outline: true, outlineColor: C.Color.fromCssColorString('#aed581').withAlpha(0.6),
      },
    }));
  }

  /* ---- 广场(浅灰圆形) ---- */
  for (const pl of PLAZAS) {
    groups.greens.push(viewer.entities.add({
      position: C.Cartesian3.fromDegrees(...offsetLL(pl.dx, pl.dy), 1.04),
      ellipse: {
        semiMajorAxis: pl.r, semiMinorAxis: pl.r, height: 1.04,
        material: new C.ColorMaterialProperty(C.Color.fromCssColorString('#78909c').withAlpha(0.75)),
        outline: true, outlineColor: C.Color.fromCssColorString('#cfd8dc').withAlpha(0.7),
      },
    }));
  }

  /* ---------- 林地树木(在绿化地块内程序化播种,避让楼栋) ---------- */
  const treeColor = C.Color.fromCssColorString('#2e9e5b').withAlpha(0.95);
  // 固定随机种子,每次刷新树林一致,便于对照卫星图校准
  let seed = 20260831;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

  function pointInPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  for (const poly of GREENS) {
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const count = Math.min(70, Math.max(14, Math.round((maxX - minX) * (maxY - minY) / 700)));
    let placed = 0, tries = 0;
    while (placed < count && tries < count * 10) {
      tries++;
      const x = minX + rnd() * (maxX - minX);
      const y = minY + rnd() * (maxY - minY);
      if (!pointInPoly(x, y, poly)) continue;
      // 避让楼栋(粗略:离楼中心足够远)
      const nearBuilding = BUILDINGS.some((b) =>
        Math.hypot(b.dx - x, b.dy - y) < Math.max(b.w, b.d) / 2 + 9);
      if (nearBuilding) continue;
      const [lon, lat] = offsetLL(x + (rnd() - 0.5) * 3, y + (rnd() - 0.5) * 3);
      groups.trees.push(viewer.entities.add({
        position: C.Cartesian3.fromDegrees(lon, lat, 2.5 + rnd() * 1.5),
        cylinder: {
          length: 5 + rnd() * 4, topRadius: 2.2 + rnd() * 1.2, bottomRadius: 2.8 + rnd() * 1.4,
          material: new C.ColorMaterialProperty(treeColor),
        },
      }));
      placed++;
    }
  }

  /* ---------- 楼栋:主体拉伸体 + 发光屋顶 + 标注 ---------- */
  for (const b of BUILDINGS) {
    const h = b.floors * FLOOR_H;
    const corners = rectCorners(b.dx, b.dy, b.w, b.d, b.rot);
    const [clon, clat] = offsetLL(b.dx, b.dy);

    const ent = viewer.entities.add({
      name: b.name,
      position: C.Cartesian3.fromDegrees(clon, clat, h + 12),
      polygon: {
        hierarchy: hierarchy(corners, 1.0),
        height: 1.0,
        extrudedHeight: h,
        material: new C.ColorMaterialProperty(C.Color.fromCssColorString(b.color).withAlpha(0.82)),
        outline: true,
        outlineColor: C.Color.fromCssColorString('#e1f5fe').withAlpha(0.55),
      },
      label: {
        text: b.name,
        font: '13px "Microsoft YaHei", sans-serif',
        fillColor: C.Color.fromCssColorString('#d9f6ff'),
        showBackground: true,
        backgroundColor: C.Color.fromCssColorString('#0a2a44').withAlpha(0.72),
        backgroundPadding: new C.Cartesian2(7, 4),
        style: C.LabelStyle.FILL,
        verticalOrigin: C.VerticalOrigin.BOTTOM,
        pixelOffset: new C.Cartesian2(0, -6),
        disableDepthTestDistance: 3000,
      },
    });
    ent.kind = 'building';
    ent.buildingData = b;
    groups.buildings.push(ent);

    // 屋顶盖板:亮色,远看有"发光楼顶"效果
    const roof = viewer.entities.add({
      polygon: {
        hierarchy: hierarchy(corners, h),
        material: new C.ColorMaterialProperty(C.Color.fromCssColorString(b.roof).withAlpha(0.95)),
        outline: true,
        outlineColor: C.Color.fromCssColorString('#ffffff').withAlpha(0.35),
      },
    });
    roof.kind = 'roof';
    groups.roofs.push(roof);
  }

  /* ---------- 监控摄像头:立杆 + 图标 + 视域楔形 ---------- */
  const icon = cameraIconCanvas();
  for (const cam of CAMERAS) {
    const [lon, lat] = offsetLL(cam.dx, cam.dy);
    const elevated = !!cam.elevated;
    const apexH = elevated ? 30 : 6; // 高点摄像头架在楼顶
    const wedgeLLs = [];
    const rad = (cam.az * Math.PI) / 180;
    const half = (cam.fov / 2) * (Math.PI / 180);
    wedgeLLs.push([lon, lat]); // 视域顶点(投影到地面附近)
    for (const off of [-half, 0, half]) {
      const a = rad + off;
      const [glon, glat] = offsetLL(cam.dx + cam.range * Math.sin(a), cam.dy + cam.range * Math.cos(a));
      wedgeLLs.push([glon, glat]);
    }

    if (!elevated) {
      groups.cameras.push(viewer.entities.add({ // 立杆
        position: C.Cartesian3.fromDegrees(lon, lat, 3),
        cylinder: {
          length: 6, topRadius: 0.15, bottomRadius: 0.22,
          material: new C.ColorMaterialProperty(C.Color.fromCssColorString('#90a4ae').withAlpha(0.9)),
        },
      }));
    }

    // 视域楔形(近似视锥在地面的投影)
    groups.cameras.push(viewer.entities.add({
      polygon: {
        hierarchy: new C.PolygonHierarchy(wedgeLLs.map(([plo, pla], i) =>
          C.Cartesian3.fromDegrees(plo, pla, i === 0 ? apexH : 0.9))),
        perPositionHeight: true,
        material: new C.ColorMaterialProperty(C.Color.fromCssColorString('#00e5ff').withAlpha(0.13)),
        outline: false,
      },
    }));

    // 图标 + 编号
    const bill = viewer.entities.add({
      name: cam.name,
      position: C.Cartesian3.fromDegrees(lon, lat, apexH + 2),
      billboard: {
        image: icon,
        scale: 0.55,
        verticalOrigin: C.VerticalOrigin.BOTTOM,
        disableDepthTestDistance: 3000,
      },
      label: {
        text: cam.id,
        font: '11px "Microsoft YaHei", sans-serif',
        fillColor: C.Color.fromCssColorString('#8ff3ff'),
        pixelOffset: new C.Cartesian2(0, 20),
        disableDepthTestDistance: 3000,
      },
    });
    bill.kind = 'camera';
    bill.cameraData = cam;
    groups.cameras.push(bill);
  }

  return groups;
}
