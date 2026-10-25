/**
 * alarmManager.js —— 告警业务层
 * 模拟 IoT 事件流:随机产生告警 → 地图上出现扩散波纹 + 楼栋变红 →
 * 点"定位"飞行过去 → 点"处理"消警并恢复楼栋颜色。
 * 这一整个闭环就是数字孪生"感知→定位→处置"的最小演示。
 */
import { offsetLL, BUILDINGS, ALARM_TEMPLATES } from './campusData.js';
import { addPulseRings } from './effects.js';

export function createAlarmManager(viewer, buildingEnts) {
  const list = [];
  let seq = 1;
  let visible = true;
  let onRender = () => {};

  function restoreBuilding(alarm) {
    const ent = buildingEnts[alarm.buildingId];
    const b = BUILDINGS.find((x) => x.id === alarm.buildingId);
    if (ent && b) {
      ent.polygon.material = new Cesium.ColorMaterialProperty(
        Cesium.Color.fromCssColorString(b.color).withAlpha(0.82)
      );
      b.status = '正常';
    }
  }

  function render() { onRender(list); }

  function spawn(building, tpl) {
    const alarm = {
      id: seq++,
      ...tpl,
      buildingId: building.id,
      buildingName: building.name,
      time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      resolved: false,
    };
    const [lon, lat] = offsetLL(building.dx, building.dy);
    alarm.pulse = addPulseRings(viewer, lon, lat, alarm.level === '高' ? '#ff5252' : '#ffa726');
    alarm.pulse.setVisible(visible);

    // 告警楼栋染红(处理后恢复)
    const ent = buildingEnts[building.id];
    if (ent) {
      ent.polygon.material = new Cesium.ColorMaterialProperty(
        Cesium.Color.fromCssColorString(alarm.level === '高' ? '#ef5350' : '#ffb74d').withAlpha(0.85)
      );
    }
    building.status = '告警';

    list.unshift(alarm);
    if (list.length > 12) {
      const old = list.pop();
      if (!old.resolved) { old.pulse.remove(); restoreBuilding(old); }
    }
    render();
    return alarm;
  }

  function resolve(id) {
    const a = list.find((x) => x.id === id);
    if (!a || a.resolved) return;
    a.resolved = true;
    a.pulse.remove();
    restoreBuilding(a);
    render();
  }

  function setVisible(v) {
    visible = v;
    list.forEach((a) => a.pulse.setVisible(v));
  }

  function randomSpawn() {
    const pool = BUILDINGS.filter((b) => b.id !== 'gate');
    const building = pool[Math.floor(Math.random() * pool.length)];
    const tpl = ALARM_TEMPLATES[Math.floor(Math.random() * ALARM_TEMPLATES.length)];
    return spawn(building, tpl);
  }

  return {
    list,
    resolve,
    setVisible,
    randomSpawn,
    spawn,
    set onRender(fn) { onRender = fn; },
  };
}
