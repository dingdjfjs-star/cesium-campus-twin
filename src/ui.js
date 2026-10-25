/**
 * ui.js —— 交互层:面板 DOM、图层开关、信息卡、ECharts 图表、告警列表
 * 全部原生 DOM,不依赖前端框架;图表用 echarts。
 */
import * as echarts from 'echarts';

const $ = (id) => document.getElementById(id);

export function initUI({ toggles = [], alarmHandlers = {} }) {
  /* ---------- 图层开关 ---------- */
  const layerBox = $('layerToggles');
  for (const t of toggles) {
    const chip = document.createElement('label');
    chip.className = 'layer-chip';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = t.checked !== false;
    cb.addEventListener('change', () => t.apply(cb.checked));
    const txt = document.createElement('span');
    txt.textContent = t.label;
    chip.append(cb, txt);
    layerBox.appendChild(chip);
  }

  /* ---------- 告警列表(事件委托) ---------- */
  const alarmUl = $('alarmList');
  alarmUl.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-id]');
    if (!li) return;
    const id = Number(li.dataset.id);
    const btn = e.target.closest('button[data-act]');
    if (btn && btn.dataset.act === 'resolve') alarmHandlers.onResolve?.(id);
    else alarmHandlers.onFocus?.(id);
  });

  /* ---------- 信息卡关闭 ---------- */
  $('infoClose').addEventListener('click', () => hideInfo());

  /* ---------- 左侧能耗趋势图 ---------- */
  const energyChart = echarts.init($('energyChart'));
  const energyData = { labels: [], values: [] };
  energyChart.setOption({
    grid: { left: 44, right: 14, top: 14, bottom: 24 },
    xAxis: {
      type: 'category', data: energyData.labels,
      axisLine: { lineStyle: { color: '#1e4a66' } },
      axisLabel: { color: '#7fb8d4', fontSize: 10, interval: 9 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(30,74,102,.45)' } },
      axisLabel: { color: '#7fb8d4', fontSize: 10 },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(8,26,43,.92)', borderColor: '#0e5a7a',
      textStyle: { color: '#cfefff', fontSize: 11 },
    },
    series: [{
      type: 'line', data: energyData.values, smooth: true, symbol: 'none',
      lineStyle: { color: '#00e5ff', width: 2 },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(0,229,255,.35)' },
            { offset: 1, color: 'rgba(0,229,255,0)' },
          ],
        },
      },
    }],
  });

  /* ---------- 信息卡图表(懒加载) ---------- */
  let infoChart = null;

  function renderInfoChart(building) {
    const el = $('infoChart');
    el.style.display = 'block';
    if (!infoChart) infoChart = echarts.init(el);
    // 按 24 小时生成该楼的能耗曲线(白天双峰:午间 + 晚自习)
    let seed = [...building.id].reduce((a, c) => a + c.charCodeAt(0), 0);
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const vals = Array.from({ length: 24 }, (_, h) => {
      const curve = 0.3
        + 0.7 * Math.exp(-Math.pow((h - 14) / 5, 2))
        + 0.35 * Math.exp(-Math.pow((h - 19) / 2.5, 2));
      return +(building.powerBase * curve * (0.85 + 0.3 * rnd())).toFixed(1);
    });
    infoChart.setOption({
      grid: { left: 40, right: 10, top: 24, bottom: 22 },
      title: { text: '24h 能耗 (kWh)', left: 4, top: 0, textStyle: { color: '#7fb8d4', fontSize: 11 } },
      xAxis: {
        type: 'category',
        data: vals.map((_, h) => `${h}`),
        axisLine: { lineStyle: { color: '#1e4a66' } },
        axisLabel: { color: '#7fb8d4', fontSize: 9, interval: 3 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(30,74,102,.45)' } },
        axisLabel: { color: '#7fb8d4', fontSize: 9 },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(8,26,43,.92)', borderColor: '#0e5a7a',
        textStyle: { color: '#cfefff', fontSize: 11 },
      },
      series: [{
        type: 'bar', data: vals, barWidth: 7,
        itemStyle: { color: '#38bdf8', borderRadius: [2, 2, 0, 0] },
      }],
    });
    infoChart.resize();
  }

  /* ---------- 对外 API ---------- */
  function updateStats({ people, power, devices, temp }) {
    setFlash($('statPeople'), Math.round(people).toLocaleString());
    setFlash($('statPower'), power.toFixed(1));
    setFlash($('statDevices'), `${Math.round(devices)} / 132`);
    setFlash($('statTemp'), temp.toFixed(1));
  }

  function setFlash(el, text) {
    if (el.textContent !== String(text)) {
      el.textContent = text;
      el.classList.remove('flash');
      void el.offsetWidth; // 重启动画
      el.classList.add('flash');
    }
  }

  function pushEnergy(label, value) {
    energyData.labels.push(label);
    energyData.values.push(value);
    if (energyData.labels.length > 40) { energyData.labels.shift(); energyData.values.shift(); }
    energyChart.setOption({
      xAxis: { data: energyData.labels },
      series: [{ data: energyData.values }],
    });
  }

  function showBuilding(b) {
    const status = b.status === '告警'
      ? '<span class="badge alarm">告警</span>'
      : '<span class="badge ok">运行正常</span>';
    const area = b.w * b.d;
    const occupancy = Math.round(b.capacity * (0.55 + Math.random() * 0.3));
    const power = b.powerBase * (0.75 + Math.random() * 0.5);
    const temp = (23.5 + Math.random() * 4).toFixed(1);
    $('infoBody').innerHTML = `
      <h3>${b.name} ${status}</h3>
      <p class="sub">${b.type} · ${b.usage}</p>
      <div class="info-rows">
        <div><i>建筑面积</i><b>${area} m²</b></div>
        <div><i>楼层</i><b>${b.floors} 层</b></div>
        <div><i>在楼人数</i><b>${occupancy} 人</b></div>
        <div><i>当前功率</i><b>${power.toFixed(1)} kW</b></div>
        <div><i>室内温度</i><b>${temp} ℃</b></div>
        <div><i>今日用电</i><b>${Math.round(b.powerBase * 24 * 0.62)} kWh</b></div>
      </div>`;
    renderInfoChart(b);
    $('infoCard').classList.remove('hidden');
  }

  function showCamera(cam) {
    $('infoBody').innerHTML = `
      <h3>摄像头 ${cam.id} <span class="badge ok">在线</span></h3>
      <p class="sub">${cam.name} · 视距 ${cam.range}m · 视场角 ${cam.fov}°</p>
      <div class="info-rows">
        <div><i>码流</i><b>1080P @ 25fps</b></div>
        <div><i>码率</i><b>4.2 Mbps</b></div>
        <div><i>录像保留</i><b>30 天</b></div>
        <div><i>智能分析</i><b>周界 / 人形检测</b></div>
      </div>
      <p class="note">演示环境未接真实视频流,实际项目通过 GB28181 / RTSP 拉流嵌入。</p>`;
    $('infoChart').style.display = 'none';
    $('infoCard').classList.remove('hidden');
  }

  function hideInfo() { $('infoCard').classList.add('hidden'); }

  function renderAlarms(list) {
    $('alarmCount').textContent = String(list.filter((a) => !a.resolved).length);
    if (!list.length) {
      alarmUl.innerHTML = '<li class="empty">暂无告警,校园运行正常 ✅</li>';
      return;
    }
    alarmUl.innerHTML = list.map((a) => `
      <li class="alarm-item lv-${a.level} ${a.resolved ? 'resolved' : ''}" data-id="${a.id}">
        <div class="alarm-head">
          <span class="lv">${a.level}</span><b>${a.type}</b>
          <span class="loc">${a.buildingName}</span>
          <time>${a.time}</time>
        </div>
        <p>${a.desc}</p>
        ${a.resolved
          ? '<div class="alarm-ops"><span class="done">✔ 已处理</span></div>'
          : '<div class="alarm-ops"><button data-act="focus">📍 定位</button><button data-act="resolve">✔ 处理</button></div>'}
      </li>`).join('');
  }

  function setClock(text) { $('sceneClock').textContent = text; }

  function hideLoading() { $('loading').classList.add('gone'); }

  window.addEventListener('resize', () => {
    energyChart.resize();
    infoChart?.resize();
  });

  return {
    updateStats, pushEnergy, showBuilding, showCamera, hideInfo,
    renderAlarms, setClock, hideLoading,
  };
}
