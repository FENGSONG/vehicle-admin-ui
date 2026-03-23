<template>
  <div class="mac-page-container" v-loading="loading">
    <div class="page-header">
      <h1 class="mac-page-title">调度数据大盘</h1>
      <div class="header-actions">
        <span class="update-time">最近刷新：{{ lastUpdatedAt || '--' }}</span>
        <el-button class="mac-button-gray" @click="loadDashboardData" :loading="loading"
          >刷新数据</el-button
        >
      </div>
    </div>
    <div class="mac-divider"></div>

    <div class="mac-hero-card">
      <div>
        <div class="hero-subtitle">调度中心实时视图</div>
        <div class="hero-title">车辆、审批、订单同屏监控</div>
        <div class="hero-desc">仅调度员可见，数据来自车辆/申请/审批接口实时汇总</div>
      </div>
      <div class="hero-right">
        <div class="hero-pill">空闲率 {{ metrics.idleRate }}</div>
        <div class="hero-pill">待调度 {{ metrics.waitDispatchOrderCount }}</div>
        <div class="hero-pill">待审批 {{ metrics.pendingAuditNodeCount }}</div>
      </div>
    </div>

    <div class="mac-grid">
      <div class="mac-data-card">
        <div class="card-icon blue"><el-icon><Van /></el-icon></div>
        <div class="card-info">
          <h3>车辆总数</h3>
          <p class="number">{{ metrics.totalVehicleCount }}</p>
        </div>
      </div>

      <div class="mac-data-card">
        <div class="card-icon green"><el-icon><MapLocation /></el-icon></div>
        <div class="card-info">
          <h3>空闲车辆</h3>
          <p class="number">{{ metrics.idleVehicleCount }}</p>
        </div>
      </div>

      <div class="mac-data-card">
        <div class="card-icon orange"><el-icon><DataLine /></el-icon></div>
        <div class="card-info">
          <h3>占用车辆</h3>
          <p class="number">{{ metrics.occupiedVehicleCount }}</p>
        </div>
      </div>

      <div class="mac-data-card">
        <div class="card-icon cyan"><el-icon><Document /></el-icon></div>
        <div class="card-info">
          <h3>今日申请</h3>
          <p class="number">{{ metrics.todayOrderCount }}</p>
        </div>
      </div>

      <div class="mac-data-card">
        <div class="card-icon indigo"><el-icon><User /></el-icon></div>
        <div class="card-info">
          <h3>已审核待分配</h3>
          <p class="number">{{ metrics.waitDispatchOrderCount }}</p>
        </div>
      </div>

      <div class="mac-data-card">
        <div class="card-icon red"><el-icon><Stamp /></el-icon></div>
        <div class="card-info">
          <h3>待处理审批</h3>
          <p class="number">{{ metrics.pendingAuditNodeCount }}</p>
        </div>
      </div>
    </div>

    <div class="analytics-grid">
      <div class="panel-card">
        <div class="panel-header">
          <h2 class="panel-title">申请单状态分布</h2>
          <span class="panel-meta">总数 {{ metrics.totalOrderCount }}</span>
        </div>
        <div class="status-grid">
          <div class="status-chip" v-for="item in orderStatusSummary" :key="item.label">
            <span class="chip-label">{{ item.label }}</span>
            <span class="chip-value">{{ item.value }}</span>
          </div>
        </div>
      </div>

      <div class="panel-card">
        <div class="panel-header">
          <h2 class="panel-title">近7天申请折线图</h2>
          <span class="panel-meta">7天总量 {{ weeklyTotal }}</span>
        </div>
        <div class="line-chart-wrap">
          <svg
            v-if="chartModel.points.length"
            :viewBox="`0 0 ${chartModel.width} ${chartModel.height}`"
            preserveAspectRatio="xMidYMid meet"
            class="line-chart"
          >
            <defs>
              <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#2f8cff" />
                <stop offset="100%" stop-color="#27d8b4" />
              </linearGradient>
              <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#2f8cff" stop-opacity="0.28" />
                <stop offset="100%" stop-color="#2f8cff" stop-opacity="0.04" />
              </linearGradient>
            </defs>

            <g>
              <line
                v-for="tick in chartModel.yTicks"
                :key="`y-${tick.value}`"
                :x1="chartModel.padding.left"
                :x2="chartModel.width - chartModel.padding.right"
                :y1="tick.y"
                :y2="tick.y"
                stroke="#edf1f5"
                stroke-width="1"
              />
              <text
                v-for="tick in chartModel.yTicks"
                :key="`yt-${tick.value}`"
                :x="chartModel.padding.left - 8"
                :y="tick.y + 4"
                text-anchor="end"
                class="axis-text"
              >
                {{ tick.value }}
              </text>
            </g>

            <path :d="chartModel.areaPath" fill="url(#areaColor)" />
            <path
              :d="chartModel.linePath"
              fill="none"
              stroke="url(#lineColor)"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <g v-for="point in chartModel.points" :key="point.date">
              <circle :cx="point.x" :cy="point.y" r="4.2" fill="#ffffff" stroke="#2f8cff" stroke-width="2.5" />
              <text :x="point.x" :y="point.y - 10" text-anchor="middle" class="point-value">
                {{ point.count }}
              </text>
              <text
                :x="point.x"
                :y="chartModel.height - 10"
                text-anchor="middle"
                class="axis-text"
              >
                {{ point.label }}
              </text>
            </g>
          </svg>
          <div v-else class="chart-empty">暂无近7天数据</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { DataLine, Van, User, MapLocation, Document, Stamp } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { selectVehicle } from '@/api/vehicle'
import { selectApplication } from '@/api/application'
import { selectAuditList } from '@/api/audit'

defineOptions({
  name: 'DispatchDashboard',
})

const CHART_WIDTH = 760
const CHART_HEIGHT = 280
const CHART_PADDING = Object.freeze({
  top: 18,
  right: 18,
  bottom: 42,
  left: 36,
})

const loading = ref(false)
const lastUpdatedAt = ref('')
const weeklyTrend = ref([])

const metrics = reactive({
  totalVehicleCount: 0,
  idleVehicleCount: 0,
  occupiedVehicleCount: 0,
  idleRate: '0%',
  totalOrderCount: 0,
  todayOrderCount: 0,
  pendingOrderCount: 0,
  auditingOrderCount: 0,
  waitDispatchOrderCount: 0,
  inUseOrderCount: 0,
  endedOrderCount: 0,
  rejectOrderCount: 0,
  cancelOrderCount: 0,
  pendingAuditNodeCount: 0,
})

const toKey = (value) => String(value == null ? '' : value).trim()
const pad2 = (num) => String(num).padStart(2, '0')

const parseDate = (value) => {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  const text = String(value).trim()
  if (!text) return null
  const normalized = text.replace('T', ' ').replace(/\.\d+$/, '').replace(/-/g, '/')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDateKey = (date) => {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

const formatDateTime = (date) => {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

const isToday = (value) => {
  const date = parseDate(value)
  if (!date) return false
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

const buildRecent7DayTrend = (orders) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dayList = []
  const counter = {}
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(today)
    day.setDate(today.getDate() - i)
    const key = formatDateKey(day)
    dayList.push({
      date: key,
      label: `${pad2(day.getMonth() + 1)}-${pad2(day.getDate())}`,
    })
    counter[key] = 0
  }

  ;(orders || []).forEach((item) => {
    const date = parseDate(item?.createTime)
    if (!date) return
    const key = formatDateKey(date)
    if (Object.prototype.hasOwnProperty.call(counter, key)) {
      counter[key] += 1
    }
  })

  weeklyTrend.value = dayList.map((item) => ({
    ...item,
    count: counter[item.date] || 0,
  }))
}

const weeklyTotal = computed(() => {
  return weeklyTrend.value.reduce((sum, item) => sum + Number(item.count || 0), 0)
})

const calcYAxisMax = (rawMax) => {
  if (rawMax <= 0) return 5
  if (rawMax <= 5) return 5
  if (rawMax <= 10) return 10
  return Math.ceil(rawMax / 5) * 5
}

const buildYTicks = (axisMax, tickCount = 5) => {
  const ticks = []
  const step = axisMax / tickCount
  for (let i = 0; i <= tickCount; i += 1) {
    ticks.push(axisMax - step * i)
  }
  return ticks
}

const chartModel = computed(() => {
  const pointsData = weeklyTrend.value
  if (!pointsData.length) {
    return {
      width: CHART_WIDTH,
      height: CHART_HEIGHT,
      padding: CHART_PADDING,
      points: [],
      yTicks: [],
      linePath: '',
      areaPath: '',
    }
  }

  const maxValueRaw = Math.max(...pointsData.map((item) => Number(item.count || 0)), 0)
  const axisMax = calcYAxisMax(maxValueRaw)
  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom
  const bottomY = CHART_HEIGHT - CHART_PADDING.bottom

  const points = pointsData.map((item, index) => {
    const x =
      pointsData.length === 1
        ? CHART_PADDING.left + plotWidth / 2
        : CHART_PADDING.left + (plotWidth * index) / (pointsData.length - 1)
    const ratio = Math.min(Math.max(Number(item.count || 0) / axisMax, 0), 1)
    const y = CHART_PADDING.top + (1 - ratio) * plotHeight
    return {
      ...item,
      x,
      y,
    }
  })

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`

  const yTickValues = buildYTicks(axisMax, 5)
  const yTicks = yTickValues.map((value) => ({
    value,
    y: CHART_PADDING.top + (1 - value / axisMax) * plotHeight,
  }))

  return {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    padding: CHART_PADDING,
    points,
    yTicks,
    linePath,
    areaPath,
  }
})

const orderStatusSummary = computed(() => [
  { label: '已发起', value: metrics.pendingOrderCount },
  { label: '审核中', value: metrics.auditingOrderCount },
  { label: '已审核', value: metrics.waitDispatchOrderCount },
  { label: '已分配', value: metrics.inUseOrderCount },
  { label: '工单结束', value: metrics.endedOrderCount },
  { label: '已驳回', value: metrics.rejectOrderCount },
  { label: '已撤销', value: metrics.cancelOrderCount },
])

const applyMetrics = (vehicles, orders, audits) => {
  metrics.totalVehicleCount = vehicles.length
  metrics.idleVehicleCount = vehicles.filter((item) => toKey(item?.status) === '1').length
  metrics.occupiedVehicleCount = vehicles.filter((item) => toKey(item?.status) === '2').length
  metrics.idleRate = metrics.totalVehicleCount
    ? `${((metrics.idleVehicleCount / metrics.totalVehicleCount) * 100).toFixed(1)}%`
    : '0%'

  const orderStatusCount = {
    10: 0,
    20: 0,
    30: 0,
    40: 0,
    50: 0,
    60: 0,
    70: 0,
  }
  let todayOrderCount = 0

  ;(orders || []).forEach((item) => {
    const status = toKey(item?.status)
    if (Object.prototype.hasOwnProperty.call(orderStatusCount, status)) {
      orderStatusCount[status] += 1
    }
    if (isToday(item?.createTime)) {
      todayOrderCount += 1
    }
  })

  metrics.totalOrderCount = orders.length
  metrics.todayOrderCount = todayOrderCount
  metrics.pendingOrderCount = orderStatusCount['10']
  metrics.cancelOrderCount = orderStatusCount['20']
  metrics.auditingOrderCount = orderStatusCount['30']
  metrics.rejectOrderCount = orderStatusCount['40']
  metrics.waitDispatchOrderCount = orderStatusCount['50']
  metrics.inUseOrderCount = orderStatusCount['60']
  metrics.endedOrderCount = orderStatusCount['70']
  metrics.pendingAuditNodeCount = audits.filter((item) => toKey(item?.auditStatus) === '10').length

  buildRecent7DayTrend(orders)
}

const loadDashboardData = async () => {
  loading.value = true
  try {
    const [vehicleRes, orderRes, auditRes] = await Promise.all([
      selectVehicle({}),
      selectApplication({}),
      selectAuditList({}),
    ])

    const vehicles = Array.isArray(vehicleRes?.data) ? vehicleRes.data : []
    const orders = Array.isArray(orderRes?.data) ? orderRes.data : []
    const audits = Array.isArray(auditRes?.data) ? auditRes.data : []

    applyMetrics(vehicles, orders, audits)
    lastUpdatedAt.value = formatDateTime(new Date())
  } catch (error) {
    console.error('加载调度大盘数据失败', error)
    ElMessage.error('加载数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.mac-page-container {
  animation: fadeIn 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
  height: calc(100vh - 100px) !important;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.mac-page-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #1d1d1f;
}

.header-actions {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.update-time {
  font-size: 12px;
  color: #8e8e93;
}

.mac-divider {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.mac-hero-card {
  border-radius: 16px;
  background: linear-gradient(135deg, #0a6cff 0%, #0ba6ff 100%);
  color: #fff;
  padding: 16px 18px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  box-shadow: 0 10px 26px rgba(10, 108, 255, 0.22);
  flex-shrink: 0;
}

.hero-subtitle {
  font-size: 12px;
  opacity: 0.9;
}

.hero-title {
  font-size: 20px;
  font-weight: 700;
  margin-top: 4px;
}

.hero-desc {
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.9;
}

.hero-right {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.hero-pill {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 600;
}

.mac-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  flex-shrink: 0;
}

.mac-data-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 72px;
}

.card-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  flex-shrink: 0;
}

.card-icon.blue {
  background: #0066ff;
}

.card-icon.green {
  background: #17b26a;
}

.card-icon.orange {
  background: #ff8a00;
}

.card-icon.cyan {
  background: #00a8b5;
}

.card-icon.indigo {
  background: #4f46e5;
}

.card-icon.red {
  background: #ef4444;
}

.card-info h3 {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  color: #8e8e93;
}

.card-info .number {
  margin: 4px 0 0;
  font-size: 20px;
  font-weight: 700;
  color: #1d1d1f;
}

.analytics-grid {
  display: grid;
  grid-template-columns: 1fr 1.35fr;
  gap: 10px;
  min-height: 0;
  flex: 1;
}

.panel-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 10px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  color: #1d1d1f;
}

.panel-meta {
  font-size: 12px;
  color: #8e8e93;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: minmax(44px, 1fr);
  gap: 8px;
  min-height: 0;
  flex: 1;
}

.status-chip {
  border-radius: 10px;
  background: #f7f8fa;
  border: 1px solid #edf1f5;
  padding: 8px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 0;
}

.chip-label {
  font-size: 12px;
  color: #6e6e73;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chip-value {
  font-size: 18px;
  font-weight: 700;
  color: #1d1d1f;
  margin-left: 8px;
  flex-shrink: 0;
}

.line-chart-wrap {
  height: 100%;
  min-height: 180px;
  border-radius: 10px;
  background: #fafbfc;
  border: 1px solid #edf1f5;
  padding: 6px;
  box-sizing: border-box;
  min-height: 0;
  flex: 1;
}

.line-chart {
  width: 100%;
  height: 100%;
}

.axis-text {
  fill: #8e8e93;
  font-size: 11px;
}

.point-value {
  fill: #0f172a;
  font-size: 11px;
  font-weight: 600;
}

.chart-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8e8e93;
  font-size: 13px;
}

.mac-button-gray {
  background-color: #e5e5ea;
  border-color: transparent;
  color: #1d1d1f;
  border-radius: 8px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1180px) {
  .mac-page-container {
    overflow-y: auto;
  }

  .mac-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .analytics-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .mac-hero-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .mac-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .status-grid {
    grid-template-columns: 1fr;
  }
}
</style>
