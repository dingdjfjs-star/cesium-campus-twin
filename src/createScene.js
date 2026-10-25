/**
 * createScene.js —— 场景层:Viewer 初始化与全局环境风格
 *
 * 关键点(答辩可讲):
 * 1. baseLayer: false —— 不加载任何在线影像/不依赖 Cesium ion token,
 *    用纯色深蓝地球 + 星空,做出"科技感数字孪生"底座,离线可运行。
 * 2. 光照/雾/后处理 —— 白天开太阳光照,夜间切霓虹 + 泛光(bloom)。
 */
import { CAMPUS } from './campusData.js';

export function createScene(container) {
  const viewer = new Cesium.Viewer(container, {
    baseLayer: false, // 不用影像图层,纯色地球(离线、无 token)
    animation: false,
    timeline: false,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
    creditContainer: document.getElementById('credits'),
  });

  const scene = viewer.scene;
  const globe = scene.globe;

  // 深蓝科技底座
  globe.baseColor = Cesium.Color.fromCssColorString('#071a30');
  globe.enableLighting = true; // 太阳光照(配合场景时间)
  scene.skyAtmosphere.show = true;

  // 薄雾:远处微微发灰,层次感更好
  scene.fog.enabled = true;
  scene.fog.density = 0.0004;

  // 场景时间固定在上午 10:30(光照角度好看);不随系统时钟流动
  viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date(2026, 7, 29, 10, 30));
  viewer.clock.shouldAnimate = false;

  // 相机范围约束,避免用户拉太远/钻太深
  const ctrl = scene.screenSpaceCameraController;
  ctrl.minimumZoomDistance = 25;
  ctrl.maximumZoomDistance = 9000;

  // 关闭 Cesium 默认的双击追踪实体行为(和自定义点击逻辑冲突)
  viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
    Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
  );

  return viewer;
}

/** 首页镜头:远景 → 飞入校园斜视角(开场动画) */
export function flyOverview(viewer, instant = false) {
  const dest = Cesium.Cartesian3.fromDegrees(CAMPUS.lon, CAMPUS.lat - 0.006, 1600);
  const orientation = {
    heading: Cesium.Math.toRadians(0),
    pitch: Cesium.Math.toRadians(-62),
    roll: 0,
  };
  if (instant) {
    viewer.camera.setView({ destination: dest, orientation });
  } else {
    viewer.camera.flyTo({ destination: dest, orientation, duration: 3.2 });
  }
}
