/**
 * campusData.js —— 数据层（真实校园数字化版）
 *
 * 坐标来源:用户提供的校园卫星图(约 1150m 宽),以图片中心为原点建立
 * 局部米制坐标系:dx 向东,dy 向北。所有位置均从卫星图量取换算。
 * 对照布局:左上"蔡子下"宿舍群、左侧"庄前"宿舍区、中部教学实验建筑群、
 * 右侧蓝跑道大运动场、左上红跑道运动场、中下人工湖+红顶生活区、
 * 右下"国家冷链工程技术研究中心"建筑群+圆形广场。
 */

// 校园原点经纬度(演示用;如需放到学校真实位置,改这里即可)
export const CAMPUS = {
  lon: 114.30,
  lat: 30.50,
  name: '山地校园数字孪生',
};

const M_PER_DEG_LAT = 111320; // 一纬度≈111.32km

/**
 * 把"以校园原点为基准的局部米制坐标 (dx向东, dy向北)"转成经纬度
 */
export function offsetLL(dx, dy) {
  const lon = CAMPUS.lon + dx / (M_PER_DEG_LAT * Math.cos((CAMPUS.lat * Math.PI) / 180));
  const lat = CAMPUS.lat + dy / M_PER_DEG_LAT;
  return [lon, lat];
}

/** 楼层高度(米) */
export const FLOOR_H = 3.2;

/* ============ 楼栋数据(卫星图数字化) ============ */

// 宿舍通用配色
const DORM = { color: '#66bb6a', roof: '#c8e6c9', type: '生活' };
const DORM_USE = '学生公寓 · 智慧门禁/水电抄表';

export const BUILDINGS = [
  /* ---- 蔡子下宿舍群(左上,长条板楼,走向约北东 30°) ---- */
  { id: 'z1',  name: '蔡子下1号楼',  dx: -322, dy: 481, w: 48, d: 11, rot: 30, floors: 6, capacity: 600, powerBase: 55, usage: DORM_USE, ...DORM },
  { id: 'z2',  name: '蔡子下2号楼',  dx: -281, dy: 464, w: 48, d: 11, rot: 30, floors: 6, capacity: 600, powerBase: 55, usage: DORM_USE, ...DORM },
  { id: 'z3',  name: '蔡子下3号楼',  dx: -234, dy: 405, w: 52, d: 11, rot: 30, floors: 6, capacity: 650, powerBase: 58, usage: DORM_USE, ...DORM },
  { id: 'z4',  name: '蔡子下4号楼',  dx: -295, dy: 391, w: 48, d: 11, rot: 30, floors: 6, capacity: 600, powerBase: 55, usage: DORM_USE, ...DORM },
  { id: 'z5',  name: '蔡子下5号楼',  dx: -254, dy: 359, w: 52, d: 11, rot: 30, floors: 6, capacity: 650, powerBase: 58, usage: DORM_USE, ...DORM },
  { id: 'z6',  name: '蔡子下6号楼',  dx: -295, dy: 324, w: 48, d: 11, rot: 30, floors: 6, capacity: 600, powerBase: 55, usage: DORM_USE, ...DORM },
  { id: 'z7',  name: '蔡子下7号楼',  dx: -227, dy: 313, w: 52, d: 11, rot: 30, floors: 6, capacity: 650, powerBase: 58, usage: DORM_USE, ...DORM },
  { id: 'z8',  name: '蔡子下8号楼',  dx: -200, dy: 259, w: 48, d: 11, rot: 30, floors: 6, capacity: 600, powerBase: 55, usage: DORM_USE, ...DORM },
  { id: 'z9',  name: '蔡子下9号楼',  dx: -159, dy: 236, w: 48, d: 11, rot: 30, floors: 6, capacity: 600, powerBase: 55, usage: DORM_USE, ...DORM },
  { id: 'z10', name: '蔡子下10号楼', dx: -227, dy: 222, w: 44, d: 11, rot: 30, floors: 6, capacity: 550, powerBase: 52, usage: DORM_USE, ...DORM },
  { id: 'z11', name: '蔡子下11号楼', dx: -125, dy: 334, w: 46, d: 11, rot: 20, floors: 6, capacity: 580, powerBase: 54, usage: DORM_USE, ...DORM },
  { id: 'z12', name: '蔡子下12号楼', dx: -97,  dy: 300, w: 46, d: 11, rot: 20, floors: 6, capacity: 580, powerBase: 54, usage: DORM_USE, ...DORM },

  /* ---- 庄前宿舍区(左侧中部,竖向板楼) ---- */
  { id: 'v1', name: '庄前1号楼', dx: -346, dy: -150, w: 34, d: 11, rot: 90, floors: 6, capacity: 450, powerBase: 45, usage: DORM_USE, ...DORM },
  { id: 'v2', name: '庄前2号楼', dx: -307, dy: -171, w: 34, d: 11, rot: 90, floors: 6, capacity: 450, powerBase: 45, usage: DORM_USE, ...DORM },
  { id: 'v3', name: '庄前3号楼', dx: -272, dy: -212, w: 34, d: 11, rot: 90, floors: 6, capacity: 450, powerBase: 45, usage: DORM_USE, ...DORM },
  { id: 'v4', name: '庄前4号楼', dx: -234, dy: -245, w: 34, d: 11, rot: 90, floors: 6, capacity: 450, powerBase: 45, usage: DORM_USE, ...DORM },

  /* ---- 中部教学实验建筑群(沿山路散布) ---- */
  { id: 't1',  name: '教学楼C',       dx: -125, dy: 239,  w: 38, d: 24, rot: 25,  floors: 5, color: '#3fbdf2', roof: '#7fd8ff', type: '教学', usage: '智慧教室 · 空调集控', capacity: 1200, powerBase: 110 },
  { id: 't2',  name: '教学楼D',       dx: -77,  dy: 218,  w: 40, d: 24, rot: 25,  floors: 5, color: '#3fbdf2', roof: '#7fd8ff', type: '教学', usage: '智慧教室 · 空调集控', capacity: 1200, powerBase: 115 },
  { id: 't3',  name: '实验南楼',       dx: -166, dy: 184,  w: 36, d: 22, rot: 25,  floors: 6, color: '#26c6da', roof: '#84ffff', type: '实验', usage: '专业基础实验室',       capacity: 600,  powerBase: 120 },
  { id: 't4',  name: '教学楼E',       dx: -2,   dy: 253,  w: 35, d: 22, rot: 20,  floors: 5, color: '#3fbdf2', roof: '#7fd8ff', type: '教学', usage: '智慧教室 · 空调集控', capacity: 1100, powerBase: 105 },
  { id: 't5',  name: '教学楼A',       dx: 12,   dy: 184,  w: 42, d: 26, rot: 30,  floors: 5, color: '#3fbdf2', roof: '#7fd8ff', type: '教学', usage: '主要教学楼 · 多媒体教室', capacity: 1500, powerBase: 130 },
  { id: 't6',  name: '教学楼B',       dx: 46,   dy: 164,  w: 36, d: 22, rot: 30,  floors: 5, color: '#3fbdf2', roof: '#7fd8ff', type: '教学', usage: '智慧教室 · 空调集控', capacity: 1100, powerBase: 105 },
  { id: 'lib', name: '图书馆',        dx: -43,  dy: 143,  w: 48, d: 28, rot: 30,  floors: 5, color: '#3fbdf2', roof: '#9be1ff', type: '教学', usage: '藏书80万册 · 自习中心',   capacity: 1000, powerBase: 150 },
  { id: 't8',  name: '实验北楼',      dx: 66,   dy: 109,  w: 38, d: 24, rot: 30,  floors: 6, color: '#26c6da', roof: '#84ffff', type: '实验', usage: '专业实验室 · 机房',     capacity: 700,  powerBase: 130 },
  { id: 't9',  name: '实验西楼',      dx: 134,  dy: 61,   w: 42, d: 26, rot: 35,  floors: 6, color: '#26c6da', roof: '#84ffff', type: '实验', usage: '重点实验室 · 恒温机房', capacity: 800,  powerBase: 160 },
  { id: 't10', name: '行政楼',        dx: -70,  dy: 20,   w: 40, d: 25, rot: 35,  floors: 4, color: '#80cbc4', roof: '#b2dfdb', type: '办公', usage: '校务管理 · 视频会议',   capacity: 300,  powerBase: 80 },
  { id: 't11', name: '学术交流中心',   dx: 12,   dy: -20,  w: 46, d: 30, rot: 35,  floors: 4, color: '#80cbc4', roof: '#b2dfdb', type: '办公', usage: '报告厅 · 会议接待',     capacity: 500,  powerBase: 95 },
  { id: 't12', name: '教学楼F',       dx: -57,  dy: -89,  w: 42, d: 26, rot: 40,  floors: 5, color: '#3fbdf2', roof: '#7fd8ff', type: '教学', usage: '智慧教室 · 空调集控', capacity: 1200, powerBase: 110 },
  { id: 't13', name: '大学生活动中心', dx: 39,   dy: -157, w: 55, d: 18, rot: 10,  floors: 2, color: '#ffb74d', roof: '#ffe0b2', type: '生活', usage: '社团活动 · 文体中心',   capacity: 800,  powerBase: 70 },
  { id: 't14', name: '工程训练中心',   dx: 107,  dy: -184, w: 40, d: 26, rot: 35,  floors: 4, color: '#26c6da', roof: '#84ffff', type: '实验', usage: '金工/电子实训车间',     capacity: 400,  powerBase: 140 },
  { id: 't15', name: '教学楼G',       dx: -111, dy: -239, w: 45, d: 28, rot: 35,  floors: 5, color: '#3fbdf2', roof: '#7fd8ff', type: '教学', usage: '智慧教室 · 空调集控', capacity: 1200, powerBase: 110 },
  { id: 't16', name: '教学楼H',       dx: -166, dy: -280, w: 40, d: 25, rot: 30,  floors: 5, color: '#3fbdf2', roof: '#7fd8ff', type: '教学', usage: '智慧教室 · 空调集控', capacity: 1000, powerBase: 100 },
  { id: 't17', name: '实验楼D',       dx: 32,   dy: -239, w: 40, d: 24, rot: 30,  floors: 6, color: '#26c6da', roof: '#84ffff', type: '实验', usage: '专业实验室',           capacity: 600,  powerBase: 125 },
  { id: 't18', name: '教学楼I',       dx: -227, dy: -198, w: 35, d: 22, rot: 50,  floors: 5, color: '#3fbdf2', roof: '#7fd8ff', type: '教学', usage: '小班教室',             capacity: 700,  powerBase: 85 },

  /* ---- 右侧运动场馆区(白顶大空间) ---- */
  { id: 'g1', name: '体育馆',  dx: 322, dy: -90,  w: 80, d: 40, rot: -12, floors: 3, color: '#b0bec5', roof: '#eceff1', type: '体育', usage: '篮球馆 · 体测中心', capacity: 2500, powerBase: 110 },
  { id: 'g2', name: '游泳馆',  dx: 345, dy: -118, w: 55, d: 28, rot: -12, floors: 2, color: '#b0bec5', roof: '#eceff1', type: '体育', usage: '恒温泳池',           capacity: 600,  powerBase: 130 },

  /* ---- 湖畔红顶生活后勤区(中下) ---- */
  { id: 'c1', name: '第一食堂',     dx: -131, dy: -344, w: 40, d: 26, rot: 25, floors: 3, color: '#ef9a9a', roof: '#ffcdd2', type: '生活', usage: '三层餐厅 · 明厨亮灶',   capacity: 1500, powerBase: 90 },
  { id: 'c2', name: '后勤服务中心', dx: -160, dy: -402, w: 36, d: 24, rot: 25, floors: 3, color: '#ef9a9a', roof: '#ffcdd2', type: '后勤', usage: '物业/维修/仓储',         capacity: 100,  powerBase: 50 },
  { id: 'c3', name: '校医院',       dx: -105, dy: -434, w: 30, d: 22, rot: 20, floors: 3, color: '#ef9a9a', roof: '#ffcdd2', type: '后勤', usage: '校医院 · 24h 值班',     capacity: 80,   powerBase: 45 },

  /* ---- 国家冷链工程技术研究中心建筑群(右下) ---- */
  { id: 'lab', name: '国家冷链工程技术研究中心', dx: 434, dy: -259, w: 85, d: 55, rot: -15, floors: 4, color: '#cfd8dc', roof: '#ffffff', type: '科研', usage: '国家级科研平台 · 冷链中试', capacity: 300, powerBase: 260 },
  { id: 'cc2', name: '冷链中试车间',             dx: 325, dy: -375, w: 90, d: 32, rot: -20, floors: 2, color: '#eceff1', roof: '#ffffff', type: '科研', usage: '中试产线 · 冷库机房',       capacity: 120, powerBase: 220 },
  { id: 'cc3', name: '冷链测试大厅',             dx: 395, dy: -420, w: 60, d: 30, rot: -20, floors: 2, color: '#cfd8dc', roof: '#ffffff', type: '科研', usage: '性能测试 · 环境舱',         capacity: 80,  powerBase: 180 },
  { id: 'cc4', name: '学术报告厅',               dx: 305, dy: -268, w: 30, d: 24, rot: -15, floors: 2, color: '#ef9a9a', roof: '#ffcdd2', type: '科研', usage: '学术报告 · 展示厅',         capacity: 400, powerBase: 60 },
];

/* ============ 运动场(两个) ============ */
export const TRACKS = [
  // 右侧大运动场:蓝跑道 + 足球场
  { dx: 309, dy: 37, rx: 62, ry: 76, track: '#3d6db5', field: '#2e7d32' },
  // 左上红跑道运动场
  { dx: -175, dy: 386, rx: 55, ry: 68, track: '#b74a3d', field: '#8d6e63' },
];

/* 球场(绿色硬地) */
export const COURTS = [
  { dx: -95, dy: 382, w: 30, d: 70, rot: 0 },   // 上运动场东侧球场
  { dx: 350, dy: -64, w: 64, d: 48, rot: 0 },   // 大运动场东南球场
];

/* ============ 水系 ============ */
export const PONDS = [
  { dx: -63, dy: -402, rx: 78, ry: 71 },   // 中下人工湖
  { dx: 167, dy: 382,  rx: 22, ry: 23 },   // 北部小池塘
];

/* ============ 广场 ============ */
export const PLAZAS = [
  { dx: 213, dy: -345, r: 30 },  // 冷链中心圆形广场
];

/* ============ 校区范围(半宽,米) ============ */
export const GROUND = { hx: 460, hy: 530 };

/* ============ 道路(主环线 + 支路,局部坐标) ============ */
export const ROADS = [
  { width: 10, pts: [
    [-84, 464], [93, 430], [189, 253], [230, 75], [189, -116], [243, -239],
    [134, -348], [-29, -307], [-166, -253], [-288, -116], [-370, 20],
    [-343, 184], [-261, 348], [-166, 444],
  ] },
  { width: 7,  pts: [[230, 75], [311, 48], [380, -48]] },   // 大运动场支路
  { width: 7,  pts: [[-261, 348], [-240, 436], [-166, 470]] }, // 蔡子下支路
  { width: 7,  pts: [[243, -239], [339, -293], [441, -273]] }, // 冷链中心支路
  { width: 7,  pts: [[-29, -307], [-77, -361]] },           // 湖畔支路
  { width: 6,  pts: [[-288, -116], [-234, -245]] },          // 庄前支路
];

/* ============ 绿化/林地地块(多边形,同时也是程序化树林的种子区域) ============ */
export const GREENS = [
  // 中部核心林地
  [[-138, 293], [134, 266], [189, 130], [134, -34], [-29, -48], [-138, 75], [-166, 239]],
  // 西侧林地
  [[-383, 184], [-261, 184], [-234, -61], [-356, -89], [-410, 75]],
  // 湖畔林地
  [[-193, -253], [-2, -253], [53, -361], [-166, -361]],
  // 东北林地(宿舍区与大运动场之间)
  [[-84, 511], [189, 457], [161, 293], [-57, 320]],
  // 西南林地
  [[-370, -143], [-193, -143], [-166, -307], [-356, -307]],
  // 冷链中心周边绿地
  [[189, -225], [352, -225], [352, -334], [189, -334]],
];

/* ============ 监控摄像头 ============ */
export const CAMERAS = [
  { id: 'C1', name: '南大门枪机',   dx: -29,  dy: -320, az: 180,  fov: 60, range: 110 },
  { id: 'C2', name: '东北角球机',   dx: 93,   dy: 430,  az: -135, fov: 70, range: 120 },
  { id: 'C3', name: '西门枪机',     dx: -370, dy: 20,   az: 90,   fov: 60, range: 100 },
  { id: 'C4', name: '图书馆高点',   dx: -43,  dy: 143,  az: 180,  fov: 55, range: 130, elevated: true },
  { id: 'C5', name: '冷链中心高点', dx: 434,  dy: -259, az: -90,  fov: 60, range: 140, elevated: true },
  { id: 'C6', name: '宿舍区高点',   dx: -261, dy: 348,  az: 135,  fov: 60, range: 110 },
];

/* ============ 巡逻路线(闭合,局部坐标) ============ */
export const PATROLS = [
  {
    id: 'car1', name: '巡逻车 01', kind: 'vehicle', speed: 11,
    pts: [[-84, 464], [93, 430], [189, 253], [230, 75], [189, -116], [243, -239],
      [134, -348], [-29, -307], [-166, -253], [-288, -116], [-370, 20],
      [-343, 184], [-261, 348], [-166, 444]],
  },
  {
    id: 'guard1', name: '安保巡逻', kind: 'guard', speed: 1.8,
    pts: [[0, 200], [140, 60], [140, -100], [0, -230], [-140, -160], [-140, 60]],
  },
];

/* ============ 告警模板 ============ */
export const ALARM_TEMPLATES = [
  { type: '消防', level: '高', desc: '烟感探测器报警,联动排烟启动' },
  { type: '电气', level: '中', desc: '配电柜温度过高,建议现场巡检' },
  { type: '安防', level: '高', desc: '周界红外触发,疑似翻越入侵' },
  { type: '设备', level: '低', desc: '冷库压缩机组振动值偏高' },
  { type: '环境', level: '中', desc: '楼内 PM2.5 超标预警' },
];
