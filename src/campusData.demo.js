/**
 * campusData.js —— 数据层
 * 校园的静态业务数据全部集中在这里:坐标系原点、楼栋、道路、绿化、监控、巡逻路线。
 * 答辩时可以直接讲:改这一份 JSON 式配置,场景随之变化,数据和渲染是解耦的。
 */

// 校园原点(经纬度)。demo 用北京附近一个虚拟位置
export const CAMPUS = {
  lon: 116.397,
  lat: 39.908,
  name: '未来科技实验学校',
};

const M_PER_DEG_LAT = 111320; // 一纬度≈111.32km

/**
 * 把"以校园原点为基准的局部米制坐标 (dx向东, dy向北)"转成经纬度
 * 所有场景数据都用局部米制表达,直观且方便调整布局
 */
export function offsetLL(dx, dy) {
  const lon = CAMPUS.lon + dx / (M_PER_DEG_LAT * Math.cos((CAMPUS.lat * Math.PI) / 180));
  const lat = CAMPUS.lat + dy / M_PER_DEG_LAT;
  return [lon, lat];
}

/** 楼层高度(米) */
export const FLOOR_H = 3.2;

/**
 * 楼栋数据
 * dx/dy: 楼中心偏移(米)  w/d: 底面尺寸(米)  rot: 旋转角(度)
 * color: 主体材质  roof: 屋顶颜色  usage: 业务描述  capacity: 容纳人数  powerBase: 基准功率kW
 */
export const BUILDINGS = [
  { id: 'lib',     name: '图书馆',   type: '教学', dx: 0,    dy: 58,   w: 64, d: 36, rot: 0, floors: 8, color: '#3fbdf2', roof: '#9be1ff', usage: '藏书120万册 · 全楼智能照明', capacity: 1200, powerBase: 210 },
  { id: 'tA',      name: '教学楼A',  type: '教学', dx: -95,  dy: 0,    w: 52, d: 22, rot: 0, floors: 6, color: '#3fbdf2', roof: '#7fd8ff', usage: '40间智慧教室 · 空调集控',     capacity: 1800, powerBase: 150 },
  { id: 'tB',      name: '教学楼B',  type: '教学', dx: 95,   dy: 0,    w: 52, d: 22, rot: 0, floors: 6, color: '#3fbdf2', roof: '#7fd8ff', usage: '40间智慧教室 · 空调集控',     capacity: 1800, powerBase: 150 },
  { id: 'lab',     name: '实验楼',   type: '实验', dx: -115, dy: 82,   w: 46, d: 26, rot: 0, floors: 7, color: '#26c6da', roof: '#84ffff', usage: '重点实验室 · 高精度机房',       capacity: 900,  powerBase: 180 },
  { id: 'admin',   name: '行政楼',   type: '办公', dx: 115,  dy: 82,   w: 34, d: 22, rot: 0, floors: 5, color: '#80cbc4', roof: '#b2dfdb', usage: '校务管理中心 · 视频会议',       capacity: 300,  powerBase: 90 },
  { id: 'gym',     name: '体育馆',   type: '体育', dx: -115, dy: -82,  w: 56, d: 34, rot: 0, floors: 2, color: '#9575cd', roof: '#d1c4e9', usage: '篮球馆 · 游泳馆 · 体测中心',    capacity: 2000, powerBase: 120 },
  { id: 'canteen', name: '食堂',     type: '生活', dx: 115,  dy: -82,  w: 34, d: 26, rot: 0, floors: 2, color: '#ffb74d', roof: '#ffe0b2', usage: '三层餐厅 · 明厨亮灶监控',       capacity: 1500, powerBase: 95 },
  { id: 'd1',      name: '学生公寓1', type: '生活', dx: -42,  dy: -112, w: 40, d: 16, rot: 0, floors: 6, color: '#66bb6a', roof: '#c8e6c9', usage: '智慧门禁 · 水电远程抄表',       capacity: 1200, powerBase: 80 },
  { id: 'd2',      name: '学生公寓2', type: '生活', dx: 8,    dy: -112, w: 40, d: 16, rot: 0, floors: 6, color: '#66bb6a', roof: '#c8e6c9', usage: '智慧门禁 · 水电远程抄表',       capacity: 1200, powerBase: 80 },
  { id: 'd3',      name: '学生公寓3', type: '生活', dx: 58,   dy: -112, w: 40, d: 16, rot: 0, floors: 6, color: '#66bb6a', roof: '#c8e6c9', usage: '智慧门禁 · 水电远程抄表',       capacity: 1200, powerBase: 80 },
  { id: 'gate',    name: '校大门',   type: '出入口', dx: 0,   dy: -124, w: 18, d: 6,  rot: 0, floors: 1, color: '#ffca28', roof: '#ffecb3', usage: '人脸闸机×6 · 车辆道闸',         capacity: 0,    powerBase: 15 },
];

/** 运动场(椭圆跑道):中心 / 半径(米) */
export const TRACK = { dx: 145, dy: 40, rx: 28, ry: 22 };

/** 人工湖 */
export const POND = { dx: -30, dy: 108, rx: 20, ry: 15 };

/** 校区地面范围(半宽,米) */
export const GROUND = { hx: 190, hy: 138 };

/**
 * 道路:用 corridor(有实际米制宽度)画,主环线 + 支路
 * pts: 局部坐标 [dx,dy] 序列
 */
export const ROADS = [
  { width: 11, pts: [[-180, -130], [180, -130], [180, 130], [-180, 130], [-180, -130]] },
  { width: 9,  pts: [[0, -125], [0, 38]] },
  { width: 9,  pts: [[-180, -25], [180, -25]] },
  { width: 5,  pts: [[-95, -25], [-95, -120]] },
  { width: 5,  pts: [[95, -25], [95, -120]] },
  { width: 5,  pts: [[0, 38], [-115, 82]] },
  { width: 5,  pts: [[0, 38], [115, 82]] },
];

/** 绿化地块(多边形,局部坐标) */
export const GREENS = [
  [[-175, 20], [-135, 20], [-135, 120], [-175, 120]],
  [[140, 78], [175, 78], [175, 125], [140, 125]],
  [[-175, -120], [-135, -120], [-135, -42], [-175, -42]],
  [[140, -120], [175, -120], [175, -40], [140, -40]],
];

/**
 * 监控摄像头
 * dx/dy: 杆位  az: 朝向(度,0=北,顺时针)  fov/range: 视场角/视距
 */
export const CAMERAS = [
  { id: 'C1', name: '南门枪机', dx: 0,    dy: -130, az: 0,    fov: 60, range: 100 },
  { id: 'C2', name: '东南角球机', dx: 172, dy: 122,  az: -135, fov: 70, range: 110 },
  { id: 'C3', name: '西北角枪机', dx: -172, dy: -122, az: 45,  fov: 60, range: 100 },
  { id: 'C4', name: '图书馆高点', dx: 0,   dy: 58,   az: 180,  fov: 55, range: 120, elevated: true },
  { id: 'C5', name: '西道路口',  dx: -172, dy: -25,  az: 90,   fov: 55, range: 90 },
  { id: 'C6', name: '宿舍区高点', dx: 8,   dy: -112, az: 180,  fov: 60, range: 90, elevated: true },
];

/** 巡逻路线(闭合,局部坐标) */
export const PATROLS = [
  {
    id: 'car1', name: '巡逻车 01', kind: 'vehicle', speed: 9,
    pts: [[-168, -118], [168, -118], [168, 118], [-168, 118]],
  },
  {
    id: 'guard1', name: '安保巡逻', kind: 'guard', speed: 1.8,
    pts: [[-60, -25], [60, -25], [60, -80], [-60, -80]],
  },
];

/** 告警模板:随机抽取位置和类型,模拟 IoT 事件流 */
export const ALARM_TEMPLATES = [
  { type: '消防', level: '高', desc: '烟感探测器报警,联动排烟启动' },
  { type: '电气', level: '中', desc: '配电柜温度过高,建议现场巡检' },
  { type: '安防', level: '高', desc: '周界红外触发,疑似翻越入侵' },
  { type: '设备', level: '低', desc: '二次供水泵振动值偏高' },
  { type: '环境', level: '中', desc: '楼内 PM2.5 超标预警' },
];
