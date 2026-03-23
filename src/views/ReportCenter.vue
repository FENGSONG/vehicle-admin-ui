<template>
  <div class="mac-page-container" v-loading="loading">
    <h1 class="mac-page-title">统计报表中心</h1>
    <div class="mac-divider"></div>

    <div class="filter-card">
      <el-select v-model="query.periodType" class="filter-item" @change="loadReports">
        <el-option label="按日" value="DAY" />
        <el-option label="按月" value="MONTH" />
        <el-option label="按季度" value="QUARTER" />
        <el-option label="按年" value="YEAR" />
      </el-select>
      <el-date-picker
        v-model="query.dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        class="filter-item filter-range"
        @change="loadReports"
      />
      <el-select
        v-model="query.vehicleId"
        clearable
        filterable
        placeholder="全部车辆"
        class="filter-item"
        @change="loadReports"
      >
        <el-option v-for="item in vehicleOptions" :key="item.id" :label="item.label" :value="item.id" />
      </el-select>
      <el-button class="mac-button-gray" @click="loadReports">刷新报表</el-button>
      <el-button class="mac-button-blue" :disabled="loading" @click="exportCurrentReportExcel">
        导出Excel
      </el-button>
      <el-button class="mac-button-blue" :disabled="loading" @click="exportCurrentReportWord">
        导出Word
      </el-button>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-title">充电费用总额</div>
        <div class="summary-value">￥{{ toMoney(totalChargeFee) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-title">加油费用总额</div>
        <div class="summary-value">￥{{ toMoney(totalFuelFee) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-title">出车总里程</div>
        <div class="summary-value">{{ toDecimal(totalTripMileage) }} km</div>
      </div>
      <div class="summary-card">
        <div class="summary-title">违章总次数</div>
        <div class="summary-value">{{ totalViolationCount }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-title">维修费用总额</div>
        <div class="summary-value">￥{{ toMoney(totalRepairFee) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-title">年检+投保总额</div>
        <div class="summary-value">￥{{ toMoney(totalYearlyFee) }}</div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="report-tabs">
      <el-tab-pane label="充电费用报表" name="charge">
        <div class="dual-panel">
          <div class="panel-card">
            <div class="panel-title">车辆维度（{{ periodLabel }}）</div>
            <el-table :data="chargeByVehicle" height="300">
              <el-table-column prop="periodLabel" label="周期" width="120" align="center" />
              <el-table-column label="车辆" min-width="160">
                <template #default="{ row }">{{ row.license || '--' }} / {{ row.brand || '--' }}</template>
              </el-table-column>
              <el-table-column prop="chargeOrderCount" label="订单数" width="90" align="center" />
              <el-table-column prop="totalChargeKwh" label="充电度数(kWh)" width="130" align="right" />
              <el-table-column label="充电费用(元)" width="130" align="right">
                <template #default="{ row }">{{ toMoney(row.totalChargeFee) }}</template>
              </el-table-column>
            </el-table>
          </div>
          <div class="panel-card">
            <div class="panel-title">时间维度（全运营车辆）</div>
            <el-table :data="chargeByTime" height="300">
              <el-table-column prop="periodLabel" label="周期" width="120" align="center" />
              <el-table-column prop="chargeOrderCount" label="订单数" width="90" align="center" />
              <el-table-column prop="totalChargeKwh" label="充电度数(kWh)" width="130" align="right" />
              <el-table-column label="充电费用(元)" width="130" align="right">
                <template #default="{ row }">{{ toMoney(row.totalChargeFee) }}</template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="加油费用报表" name="fuel">
        <div class="dual-panel">
          <div class="panel-card">
            <div class="panel-title">车辆维度（{{ periodLabel }}）</div>
            <el-table :data="fuelByVehicle" height="300">
              <el-table-column prop="periodLabel" label="周期" width="120" align="center" />
              <el-table-column label="车辆" min-width="160">
                <template #default="{ row }">{{ row.license || '--' }} / {{ row.brand || '--' }}</template>
              </el-table-column>
              <el-table-column prop="fuelOrderCount" label="订单数" width="90" align="center" />
              <el-table-column prop="totalFuelLiter" label="加油量(L)" width="120" align="right" />
              <el-table-column label="加油费用(元)" width="130" align="right">
                <template #default="{ row }">{{ toMoney(row.totalFuelFee) }}</template>
              </el-table-column>
            </el-table>
          </div>
          <div class="panel-card">
            <div class="panel-title">时间维度（全运营车辆）</div>
            <el-table :data="fuelByTime" height="300">
              <el-table-column prop="periodLabel" label="周期" width="120" align="center" />
              <el-table-column prop="fuelOrderCount" label="订单数" width="90" align="center" />
              <el-table-column prop="totalFuelLiter" label="加油量(L)" width="120" align="right" />
              <el-table-column label="加油费用(元)" width="130" align="right">
                <template #default="{ row }">{{ toMoney(row.totalFuelFee) }}</template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="出车次数报表" name="trip">
        <div class="dual-panel">
          <div class="panel-card">
            <div class="panel-title">车辆维度（里程+出车次数）</div>
            <el-table :data="tripByVehicle" height="300">
              <el-table-column prop="periodLabel" label="周期" width="120" align="center" />
              <el-table-column label="车辆" min-width="160">
                <template #default="{ row }">{{ row.license || '--' }} / {{ row.brand || '--' }}</template>
              </el-table-column>
              <el-table-column prop="tripCount" label="出车次数" width="100" align="center" />
              <el-table-column label="运行里程(km)" width="130" align="right">
                <template #default="{ row }">{{ toDecimal(row.totalMileage) }}</template>
              </el-table-column>
            </el-table>
          </div>
          <div class="panel-card">
            <div class="panel-title">时间维度（全运营车辆）</div>
            <el-table :data="tripByTime" height="300">
              <el-table-column prop="periodLabel" label="周期" width="120" align="center" />
              <el-table-column prop="tripCount" label="出车次数" width="100" align="center" />
              <el-table-column label="运行里程(km)" width="130" align="right">
                <template #default="{ row }">{{ toDecimal(row.totalMileage) }}</template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="违章情况报表" name="violation">
        <div class="dual-panel">
          <div class="panel-card">
            <div class="panel-title">车主违章统计（次数+扣分）</div>
            <el-table :data="violationByOwner" height="300">
              <el-table-column prop="periodLabel" label="周期" width="120" align="center" />
              <el-table-column prop="ownerUsername" label="车主" min-width="120" />
              <el-table-column prop="violationCount" label="违章次数" width="100" align="center" />
              <el-table-column prop="totalDeductPoints" label="扣分" width="90" align="center" />
              <el-table-column label="罚款(元)" width="120" align="right">
                <template #default="{ row }">{{ toMoney(row.totalFineFee) }}</template>
              </el-table-column>
            </el-table>
          </div>
          <div class="panel-card">
            <div class="panel-title">运营车辆时间维度违章统计</div>
            <el-table :data="violationByTime" height="300">
              <el-table-column prop="periodLabel" label="周期" width="120" align="center" />
              <el-table-column prop="violationCount" label="违章次数" width="100" align="center" />
              <el-table-column prop="totalDeductPoints" label="扣分" width="90" align="center" />
              <el-table-column label="罚款(元)" width="120" align="right">
                <template #default="{ row }">{{ toMoney(row.totalFineFee) }}</template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="维修费用报表" name="repair">
        <div class="dual-panel">
          <div class="panel-card">
            <div class="panel-title">运营车辆维保费用统计</div>
            <el-table :data="repairByVehicle" height="300">
              <el-table-column prop="periodLabel" label="周期" width="120" align="center" />
              <el-table-column label="车辆" min-width="160">
                <template #default="{ row }">{{ row.license || '--' }} / {{ row.brand || '--' }}</template>
              </el-table-column>
              <el-table-column prop="repairCount" label="维保次数" width="100" align="center" />
              <el-table-column label="维保费用(元)" width="130" align="right">
                <template #default="{ row }">{{ toMoney(row.totalRepairFee) }}</template>
              </el-table-column>
            </el-table>
          </div>
          <div class="panel-card">
            <div class="panel-title">时间维度维保次数与费用</div>
            <el-table :data="repairByTime" height="300">
              <el-table-column prop="periodLabel" label="周期" width="120" align="center" />
              <el-table-column prop="repairCount" label="维保次数" width="100" align="center" />
              <el-table-column label="维保费用(元)" width="130" align="right">
                <template #default="{ row }">{{ toMoney(row.totalRepairFee) }}</template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="年检/投保费用报表" name="yearly">
        <div class="dual-panel">
          <div class="panel-card">
            <div class="panel-title">车辆年检费用/投保费用（按年）</div>
            <el-table :data="yearlyVehicleFee" height="300">
              <el-table-column prop="yearLabel" label="年份" width="90" align="center" />
              <el-table-column label="车辆" min-width="160">
                <template #default="{ row }">{{ row.license || '--' }} / {{ row.brand || '--' }}</template>
              </el-table-column>
              <el-table-column label="年检费用(元)" width="130" align="right">
                <template #default="{ row }">{{ toMoney(row.inspectionFee) }}</template>
              </el-table-column>
              <el-table-column label="投保费用(元)" width="130" align="right">
                <template #default="{ row }">{{ toMoney(row.insuranceFee) }}</template>
              </el-table-column>
            </el-table>
          </div>
          <div class="panel-card">
            <div class="panel-title">年度总计（全运营车辆）</div>
            <el-table :data="yearlyTotalFee" height="300">
              <el-table-column prop="yearLabel" label="年份" width="100" align="center" />
              <el-table-column label="年检总费用(元)" width="150" align="right">
                <template #default="{ row }">{{ toMoney(row.totalInspectionFee) }}</template>
              </el-table-column>
              <el-table-column label="投保总费用(元)" width="150" align="right">
                <template #default="{ row }">{{ toMoney(row.totalInsuranceFee) }}</template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { selectVehicle } from '@/api/vehicle'
import {
  selectChargeByVehicle,
  selectChargeByTime,
  selectFuelByVehicle,
  selectFuelByTime,
  selectTripByVehicle,
  selectTripByTime,
  selectViolationByOwner,
  selectViolationByTime,
  selectRepairByVehicle,
  selectRepairByTime,
  selectYearlyVehicleFee,
  selectYearlyTotalFee,
} from '@/api/report'

defineOptions({
  name: 'ReportCenterPage',
})

const loading = ref(false)
const activeTab = ref('charge')
const query = reactive({
  periodType: 'MONTH',
  dateRange: [],
  vehicleId: null,
})

const vehicleOptions = ref([])

const chargeByVehicle = ref([])
const chargeByTime = ref([])
const fuelByVehicle = ref([])
const fuelByTime = ref([])
const tripByVehicle = ref([])
const tripByTime = ref([])
const violationByOwner = ref([])
const violationByTime = ref([])
const repairByVehicle = ref([])
const repairByTime = ref([])
const yearlyVehicleFee = ref([])
const yearlyTotalFee = ref([])

const periodLabel = computed(() => {
  if (query.periodType === 'DAY') return '按日'
  if (query.periodType === 'QUARTER') return '按季度'
  if (query.periodType === 'YEAR') return '按年'
  return '按月'
})

const toNumber = (value) => Number(value || 0)
const toMoney = (value) => toNumber(value).toFixed(2)
const toDecimal = (value) => toNumber(value).toFixed(2)
const escapeHtml = (value) =>
  String(value ?? '--')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
const pad2 = (value) => String(value).padStart(2, '0')
const buildExportTime = () => {
  const now = new Date()
  return `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}_${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`
}

const totalChargeFee = computed(() =>
  chargeByTime.value.reduce((sum, item) => sum + toNumber(item.totalChargeFee), 0),
)
const totalFuelFee = computed(() =>
  fuelByTime.value.reduce((sum, item) => sum + toNumber(item.totalFuelFee), 0),
)
const totalTripMileage = computed(() =>
  tripByTime.value.reduce((sum, item) => sum + toNumber(item.totalMileage), 0),
)
const totalViolationCount = computed(() =>
  violationByTime.value.reduce((sum, item) => sum + toNumber(item.violationCount), 0),
)
const totalRepairFee = computed(() =>
  repairByTime.value.reduce((sum, item) => sum + toNumber(item.totalRepairFee), 0),
)
const totalYearlyFee = computed(() =>
  yearlyTotalFee.value.reduce(
    (sum, item) => sum + toNumber(item.totalInspectionFee) + toNumber(item.totalInsuranceFee),
    0,
  ),
)

const buildParams = () => {
  const params = {
    periodType: query.periodType,
  }
  if (query.vehicleId) params.vehicleId = query.vehicleId
  if (Array.isArray(query.dateRange) && query.dateRange.length === 2) {
    params.startDate = query.dateRange[0]
    params.endDate = query.dateRange[1]
  }
  return params
}

const loadVehicleOptions = async () => {
  const res = await selectVehicle({})
  vehicleOptions.value = (res?.data || []).map((item) => ({
    id: item.id,
    label: `${item.license || `车辆-${item.id}`}（${item.brand || '--'}）`,
  }))
}

const loadReports = async () => {
  loading.value = true
  try {
    const params = buildParams()
    const [
      chargeVehicleRes,
      chargeTimeRes,
      fuelVehicleRes,
      fuelTimeRes,
      tripVehicleRes,
      tripTimeRes,
      violationOwnerRes,
      violationTimeRes,
      repairVehicleRes,
      repairTimeRes,
      yearlyVehicleRes,
      yearlyTotalRes,
    ] = await Promise.all([
      selectChargeByVehicle(params),
      selectChargeByTime(params),
      selectFuelByVehicle(params),
      selectFuelByTime(params),
      selectTripByVehicle(params),
      selectTripByTime(params),
      selectViolationByOwner(params),
      selectViolationByTime(params),
      selectRepairByVehicle(params),
      selectRepairByTime(params),
      selectYearlyVehicleFee(params),
      selectYearlyTotalFee(params),
    ])

    chargeByVehicle.value = chargeVehicleRes?.data || []
    chargeByTime.value = chargeTimeRes?.data || []
    fuelByVehicle.value = fuelVehicleRes?.data || []
    fuelByTime.value = fuelTimeRes?.data || []
    tripByVehicle.value = tripVehicleRes?.data || []
    tripByTime.value = tripTimeRes?.data || []
    violationByOwner.value = violationOwnerRes?.data || []
    violationByTime.value = violationTimeRes?.data || []
    repairByVehicle.value = repairVehicleRes?.data || []
    repairByTime.value = repairTimeRes?.data || []
    yearlyVehicleFee.value = yearlyVehicleRes?.data || []
    yearlyTotalFee.value = yearlyTotalRes?.data || []
  } catch (error) {
    console.error('加载统计报表失败', error)
    ElMessage.error('加载统计报表失败，请检查后端报表接口或数据库报表数据')
  } finally {
    loading.value = false
  }
}

const getCurrentReportConfig = () => {
  const vehicleColumns = [
    { label: '周期', value: (row) => row.periodLabel || '--' },
    { label: '车辆', value: (row) => `${row.license || '--'} / ${row.brand || '--'}` },
  ]
  switch (activeTab.value) {
    case 'charge':
      return {
        title: '充电费用报表',
        sheets: [
          {
            name: '车辆维度',
            rows: chargeByVehicle.value,
            columns: [
              ...vehicleColumns,
              { label: '订单数', value: (row) => toNumber(row.chargeOrderCount) },
              { label: '充电度数(kWh)', value: (row) => toDecimal(row.totalChargeKwh) },
              { label: '充电费用(元)', value: (row) => toMoney(row.totalChargeFee) },
            ],
          },
          {
            name: '时间维度',
            rows: chargeByTime.value,
            columns: [
              { label: '周期', value: (row) => row.periodLabel || '--' },
              { label: '订单数', value: (row) => toNumber(row.chargeOrderCount) },
              { label: '充电度数(kWh)', value: (row) => toDecimal(row.totalChargeKwh) },
              { label: '充电费用(元)', value: (row) => toMoney(row.totalChargeFee) },
            ],
          },
        ],
      }
    case 'fuel':
      return {
        title: '加油费用报表',
        sheets: [
          {
            name: '车辆维度',
            rows: fuelByVehicle.value,
            columns: [
              ...vehicleColumns,
              { label: '订单数', value: (row) => toNumber(row.fuelOrderCount) },
              { label: '加油量(L)', value: (row) => toDecimal(row.totalFuelLiter) },
              { label: '加油费用(元)', value: (row) => toMoney(row.totalFuelFee) },
            ],
          },
          {
            name: '时间维度',
            rows: fuelByTime.value,
            columns: [
              { label: '周期', value: (row) => row.periodLabel || '--' },
              { label: '订单数', value: (row) => toNumber(row.fuelOrderCount) },
              { label: '加油量(L)', value: (row) => toDecimal(row.totalFuelLiter) },
              { label: '加油费用(元)', value: (row) => toMoney(row.totalFuelFee) },
            ],
          },
        ],
      }
    case 'trip':
      return {
        title: '出车次数报表',
        sheets: [
          {
            name: '车辆维度',
            rows: tripByVehicle.value,
            columns: [
              ...vehicleColumns,
              { label: '出车次数', value: (row) => toNumber(row.tripCount) },
              { label: '运行里程(km)', value: (row) => toDecimal(row.totalMileage) },
            ],
          },
          {
            name: '时间维度',
            rows: tripByTime.value,
            columns: [
              { label: '周期', value: (row) => row.periodLabel || '--' },
              { label: '出车次数', value: (row) => toNumber(row.tripCount) },
              { label: '运行里程(km)', value: (row) => toDecimal(row.totalMileage) },
            ],
          },
        ],
      }
    case 'violation':
      return {
        title: '违章情况报表',
        sheets: [
          {
            name: '车主违章统计',
            rows: violationByOwner.value,
            columns: [
              { label: '周期', value: (row) => row.periodLabel || '--' },
              { label: '车主', value: (row) => row.ownerUsername || '--' },
              { label: '违章次数', value: (row) => toNumber(row.violationCount) },
              { label: '扣分', value: (row) => toNumber(row.totalDeductPoints) },
              { label: '罚款(元)', value: (row) => toMoney(row.totalFineFee) },
            ],
          },
          {
            name: '时间维度',
            rows: violationByTime.value,
            columns: [
              { label: '周期', value: (row) => row.periodLabel || '--' },
              { label: '违章次数', value: (row) => toNumber(row.violationCount) },
              { label: '扣分', value: (row) => toNumber(row.totalDeductPoints) },
              { label: '罚款(元)', value: (row) => toMoney(row.totalFineFee) },
            ],
          },
        ],
      }
    case 'repair':
      return {
        title: '维修费用报表',
        sheets: [
          {
            name: '车辆维度',
            rows: repairByVehicle.value,
            columns: [
              ...vehicleColumns,
              { label: '维保次数', value: (row) => toNumber(row.repairCount) },
              { label: '维保费用(元)', value: (row) => toMoney(row.totalRepairFee) },
            ],
          },
          {
            name: '时间维度',
            rows: repairByTime.value,
            columns: [
              { label: '周期', value: (row) => row.periodLabel || '--' },
              { label: '维保次数', value: (row) => toNumber(row.repairCount) },
              { label: '维保费用(元)', value: (row) => toMoney(row.totalRepairFee) },
            ],
          },
        ],
      }
    case 'yearly':
      return {
        title: '年检投保费用报表',
        sheets: [
          {
            name: '车辆维度',
            rows: yearlyVehicleFee.value,
            columns: [
              { label: '年份', value: (row) => row.yearLabel || '--' },
              { label: '车辆', value: (row) => `${row.license || '--'} / ${row.brand || '--'}` },
              { label: '年检费用(元)', value: (row) => toMoney(row.inspectionFee) },
              { label: '投保费用(元)', value: (row) => toMoney(row.insuranceFee) },
            ],
          },
          {
            name: '年度总计',
            rows: yearlyTotalFee.value,
            columns: [
              { label: '年份', value: (row) => row.yearLabel || '--' },
              { label: '年检总费用(元)', value: (row) => toMoney(row.totalInspectionFee) },
              { label: '投保总费用(元)', value: (row) => toMoney(row.totalInsuranceFee) },
            ],
          },
        ],
      }
    default:
      return null
  }
}

const buildSheetRows = (sheet) => {
  const mappedRows = (sheet.rows || []).map((row) => {
    const mapped = {}
    sheet.columns.forEach((column) => {
      mapped[column.label] = column.value(row)
    })
    return mapped
  })
  return mappedRows.length ? mappedRows : [{ 提示: '暂无数据' }]
}

const downloadBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const exportCurrentReportExcel = async () => {
  try {
    const report = getCurrentReportConfig()
    if (!report) {
      ElMessage.warning('当前报表不支持导出')
      return
    }
    const XLSX = await import('xlsx')
    const workbook = XLSX.utils.book_new()
    report.sheets.forEach((sheet) => {
      const worksheet = XLSX.utils.json_to_sheet(buildSheetRows(sheet))
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31))
    })
    XLSX.writeFile(workbook, `${report.title}_${buildExportTime()}.xlsx`)
    ElMessage.success('Excel导出成功')
  } catch (error) {
    console.error('Excel导出失败', error)
    ElMessage.error('Excel导出失败，请重试')
  }
}

const buildWordTable = (sheet) => {
  const columnsHtml = sheet.columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')
  const rows = sheet.rows || []
  const rowsHtml = rows.length
    ? rows
        .map((row) => {
          const tds = sheet.columns
            .map((column) => `<td>${escapeHtml(column.value(row))}</td>`)
            .join('')
          return `<tr>${tds}</tr>`
        })
        .join('')
    : `<tr><td colspan="${sheet.columns.length}">暂无数据</td></tr>`
  return `
    <h3>${escapeHtml(sheet.name)}</h3>
    <table>
      <thead><tr>${columnsHtml}</tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `
}

const exportCurrentReportWord = () => {
  try {
    const report = getCurrentReportConfig()
    if (!report) {
      ElMessage.warning('当前报表不支持导出')
      return
    }
    const dateRangeText =
      Array.isArray(query.dateRange) && query.dateRange.length === 2
        ? `${query.dateRange[0]} 至 ${query.dateRange[1]}`
        : '全部时间'
    const currentVehicle = vehicleOptions.value.find((item) => item.id === query.vehicleId)
    const vehicleText = currentVehicle?.label || '全部车辆'
    const summaryHtml = `
      <div class="summary-line">充电费用总额：￥${toMoney(totalChargeFee.value)}</div>
      <div class="summary-line">加油费用总额：￥${toMoney(totalFuelFee.value)}</div>
      <div class="summary-line">出车总里程：${toDecimal(totalTripMileage.value)} km</div>
      <div class="summary-line">违章总次数：${totalViolationCount.value}</div>
      <div class="summary-line">维修费用总额：￥${toMoney(totalRepairFee.value)}</div>
      <div class="summary-line">年检+投保总额：￥${toMoney(totalYearlyFee.value)}</div>
    `
    const sheetsHtml = report.sheets.map((sheet) => buildWordTable(sheet)).join('')
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: "Microsoft YaHei", sans-serif; color: #111827; padding: 20px; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            h3 { margin-top: 24px; margin-bottom: 8px; font-size: 18px; }
            .meta { color: #374151; margin-bottom: 4px; }
            .summary { margin-top: 12px; margin-bottom: 16px; }
            .summary-line { margin-bottom: 4px; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 10px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 13px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(report.title)}</h1>
          <div class="meta">导出时间：${escapeHtml(new Date().toLocaleString())}</div>
          <div class="meta">统计周期：${escapeHtml(periodLabel.value)}</div>
          <div class="meta">时间范围：${escapeHtml(dateRangeText)}</div>
          <div class="meta">车辆筛选：${escapeHtml(vehicleText)}</div>
          <div class="summary">${summaryHtml}</div>
          ${sheetsHtml}
        </body>
      </html>
    `
    const blob = new Blob([`\ufeff${html}`], { type: 'application/msword' })
    downloadBlob(blob, `${report.title}_${buildExportTime()}.doc`)
    ElMessage.success('Word导出成功')
  } catch (error) {
    console.error('Word导出失败', error)
    ElMessage.error('Word导出失败，请重试')
  }
}

onMounted(async () => {
  await loadVehicleOptions()
  await loadReports()
})
</script>

<style scoped>
.mac-page-container {
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: fadeIn 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.mac-page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1d1d1f;
}

.mac-divider {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.08);
}

.filter-card {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-item {
  width: 180px;
}

.filter-range {
  width: 320px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.summary-card {
  background: linear-gradient(135deg, #f7fbff 0%, #f2fffb 100%);
  border: 1px solid #e6eef8;
  border-radius: 12px;
  padding: 12px;
}

.summary-title {
  font-size: 12px;
  color: #6b7280;
}

.summary-value {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.report-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

:deep(.report-tabs .el-tabs__content) {
  flex: 1;
  min-height: 0;
}

:deep(.report-tabs .el-tab-pane) {
  height: 100%;
}

.dual-panel {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.panel-card {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.mac-button-gray {
  background-color: #e5e5ea;
  border-color: transparent;
  color: #1d1d1f;
  border-radius: 8px;
}

.mac-button-blue {
  background: linear-gradient(135deg, #5ea7ff 0%, #4f46e5 100%);
  border-color: transparent;
  color: #fff;
  border-radius: 8px;
}

:deep(.el-table) {
  --el-table-border-color: transparent;
  --el-table-header-bg-color: transparent;
  --el-table-header-text-color: #86868b;
}

@media (max-width: 1280px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dual-panel {
    grid-template-columns: 1fr;
  }
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
</style>
