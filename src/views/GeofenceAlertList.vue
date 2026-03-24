<template>
  <div class="mac-table-card">
    <div class="table-header-actions">
      <h2 class="sidebar-title" style="margin-bottom: 0">告警记录</h2>
      <div class="search-box">
        <el-select v-model="queryParams.geofenceId" clearable placeholder="全部围栏" class="mini-select">
          <el-option v-for="item in geofenceOptions" :key="`gf-${item.id}`" :label="item.name" :value="item.id" />
        </el-select>
        <el-select v-model="queryParams.vehicleId" clearable filterable placeholder="全部车辆" class="mini-select">
          <el-option v-for="item in vehicleOptions" :key="`vh-${item.id}`" :label="item.label" :value="item.id" />
        </el-select>
        <el-select v-model="queryParams.alertType" clearable placeholder="全部类型" class="mini-select">
          <el-option v-for="item in alertTypeOptions" :key="`tp-${item.value}`" :label="item.label" :value="item.value" />
        </el-select>
        <el-date-picker
          v-model="queryParams.timeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          class="time-range"
        />
        <el-input
          v-model="queryParams.keyword"
          placeholder="围栏/车牌/告警文案"
          clearable
          class="keyword-input"
          @keyup.enter="fetchList"
        />
        <el-button class="mac-button-gray" @click="fetchList">搜索</el-button>
        <el-button class="mac-button-gray" @click="resetQuery">重置</el-button>
        <el-button class="mac-button-blue" @click="openReportDialog">模拟上报</el-button>
      </div>
    </div>

    <el-table
      :data="tableList"
      v-loading="loading"
      style="width: 100%; flex: 1"
      height="100%"
      :row-style="{ height: '62px' }"
    >
      <el-table-column prop="reportTime" label="告警时间" width="170" align="center" />
      <el-table-column prop="geofenceName" label="电子围栏" min-width="130" show-overflow-tooltip />
      <el-table-column label="车辆" min-width="130">
        <template #default="{ row }">
          {{ row.vehicleLicense || `车辆ID:${row.vehicleId || '--'}` }}
        </template>
      </el-table-column>
      <el-table-column label="告警类型" width="130" align="center">
        <template #default="{ row }">
          <el-tag :type="getAlertTypeTagType(row.alertType)" effect="light" round size="small">
            {{ getAlertTypeText(row.alertType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="等级" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.alertLevel === 'WARNING' ? 'danger' : 'info'" effect="dark" size="small">
            {{ row.alertLevel === 'WARNING' ? '预警' : '提示' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="alertMessage" label="告警文案" min-width="220" show-overflow-tooltip />
      <el-table-column label="定位坐标" min-width="180" align="center">
        <template #default="{ row }">
          {{ row.longitude || '--' }}, {{ row.latitude || '--' }}
        </template>
      </el-table-column>
      <el-table-column label="偏离距离(米)" width="120" align="right">
        <template #default="{ row }">
          {{ row.distanceMeters == null ? '--' : row.distanceMeters }}
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        background
        layout="total, prev, pager, next, jumper"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog v-model="reportDialogVisible" title="模拟车辆位置上报" width="520px" destroy-on-close>
      <el-form :model="reportForm" label-position="top" :rules="reportRules" ref="reportFormRef">
        <el-form-item label="车辆" prop="vehicleId">
          <el-select v-model="reportForm.vehicleId" filterable placeholder="请选择车辆" style="width: 100%">
            <el-option v-for="item in vehicleOptions" :key="`report-v-${item.id}`" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="电子围栏（可选）">
          <el-select v-model="reportForm.geofenceId" clearable placeholder="默认使用车辆绑定围栏" style="width: 100%">
            <el-option v-for="item in geofenceOptions" :key="`report-g-${item.id}`" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="经度" prop="longitude">
              <el-input v-model="reportForm.longitude" placeholder="例：126.568856" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="纬度" prop="latitude">
              <el-input v-model="reportForm.latitude" placeholder="例：43.924441" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="上报时间（可选）">
          <el-date-picker
            v-model="reportForm.reportTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="默认当前时间"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reportDialogVisible = false">取消</el-button>
        <el-button type="primary" class="mac-button-blue" :loading="reportLoading" @click="submitReport">
          提交上报
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getGeofenceAlarmList, getGeofenceList, reportGeofencePosition } from '@/api/geofence'
import { selectVehicle } from '@/api/vehicle'

const loading = ref(false)
const allData = ref([])
const tableList = ref([])

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const geofenceOptions = ref([])
const vehicleOptions = ref([])

const queryParams = reactive({
  geofenceId: null,
  vehicleId: null,
  alertType: '',
  keyword: '',
  timeRange: [],
})

const alertTypeOptions = [
  { label: '进入围栏', value: 'ENTER' },
  { label: '驶出围栏', value: 'EXIT' },
  { label: '路线偏离', value: 'ROUTE_DEVIATION' },
  { label: '路线恢复', value: 'ROUTE_RECOVER' },
]

const reportDialogVisible = ref(false)
const reportLoading = ref(false)
const reportFormRef = ref(null)
const reportForm = reactive({
  vehicleId: null,
  geofenceId: null,
  longitude: '',
  latitude: '',
  reportTime: '',
})

const reportRules = {
  vehicleId: [{ required: true, message: '请选择车辆', trigger: 'change' }],
  longitude: [{ required: true, message: '请输入经度', trigger: 'blur' }],
  latitude: [{ required: true, message: '请输入纬度', trigger: 'blur' }],
}

const getAlertTypeText = (type) => {
  const map = {
    ENTER: '进入围栏',
    EXIT: '驶出围栏',
    ROUTE_DEVIATION: '路线偏离',
    ROUTE_RECOVER: '路线恢复',
  }
  return map[String(type || '').trim()] || '未知类型'
}

const getAlertTypeTagType = (type) => {
  const map = {
    ENTER: 'success',
    EXIT: 'warning',
    ROUTE_DEVIATION: 'danger',
    ROUTE_RECOVER: 'info',
  }
  return map[String(type || '').trim()] || 'info'
}

const loadFilterOptions = async () => {
  const [geofenceRes, vehicleRes] = await Promise.all([getGeofenceList({}), selectVehicle({})])
  geofenceOptions.value = (geofenceRes?.data || [])
    .filter((item) => item && item.id != null)
    .map((item) => ({ id: item.id, name: item.name || `电子围栏-${item.id}` }))
  vehicleOptions.value = (vehicleRes?.data || [])
    .filter((item) => item && item.id != null)
    .map((item) => ({ id: item.id, label: `${item.license || `车辆-${item.id}`}（${item.brand || '--'}）` }))
}

const buildQuery = () => {
  const params = {}
  if (queryParams.geofenceId) params.geofenceId = queryParams.geofenceId
  if (queryParams.vehicleId) params.vehicleId = queryParams.vehicleId
  if (queryParams.alertType) params.alertType = queryParams.alertType
  if (queryParams.keyword) params.keyword = String(queryParams.keyword).trim()
  if (Array.isArray(queryParams.timeRange) && queryParams.timeRange.length === 2) {
    params.startTime = queryParams.timeRange[0]
    params.endTime = queryParams.timeRange[1]
  }
  return params
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getGeofenceAlarmList(buildQuery())
    allData.value = res?.data || []
    total.value = allData.value.length
    currentPage.value = 1
    updatePageData()
  } catch (error) {
    console.error('查询电子围栏告警失败', error)
  } finally {
    loading.value = false
  }
}

const updatePageData = () => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  tableList.value = allData.value.slice(start, end)
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  updatePageData()
}

const resetQuery = () => {
  queryParams.geofenceId = null
  queryParams.vehicleId = null
  queryParams.alertType = ''
  queryParams.keyword = ''
  queryParams.timeRange = []
  fetchList()
}

const openReportDialog = () => {
  reportForm.vehicleId = null
  reportForm.geofenceId = null
  reportForm.longitude = ''
  reportForm.latitude = ''
  reportForm.reportTime = ''
  reportDialogVisible.value = true
}

const submitReport = () => {
  if (!reportFormRef.value) return
  reportFormRef.value.validate(async (valid) => {
    if (!valid) return
    reportLoading.value = true
    try {
      const payload = {
        vehicleId: reportForm.vehicleId,
        geofenceId: reportForm.geofenceId || null,
        longitude: Number(reportForm.longitude),
        latitude: Number(reportForm.latitude),
        reportTime: reportForm.reportTime || null,
      }
      const res = await reportGeofencePosition(payload)
      const data = res?.data || {}
      if (data.alarmTriggered) {
        ElMessage.warning(data.message || '已触发电子围栏告警')
      } else {
        ElMessage.success(data.message || '上报成功，当前未触发告警')
      }
      reportDialogVisible.value = false
      fetchList()
    } catch (error) {
      console.error('上报车辆位置失败', error)
    } finally {
      reportLoading.value = false
    }
  })
}

defineExpose({ fetchList })

onMounted(async () => {
  await loadFilterOptions()
  await fetchList()
})
</script>

<style scoped>
.mac-table-card {
  height: 100%;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 24px 24px 16px 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.table-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 600;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.mini-select {
  width: 140px;
}

.time-range {
  width: 320px;
}

.keyword-input {
  width: 190px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.mac-button-blue {
  background-color: #007aff !important;
  border-color: #007aff !important;
  color: #fff;
  border-radius: 8px !important;
}

.mac-button-gray {
  background-color: #e5e5ea;
  border-color: transparent;
  color: #1d1d1f;
  border-radius: 8px;
}

:deep(.el-table) {
  --el-table-border-color: transparent;
  --el-table-header-bg-color: transparent;
  --el-table-header-text-color: #86868b;
  flex: 1;
  overflow: hidden;
}

:deep(.el-table th.el-table__cell) {
  font-weight: 600;
  font-size: 13px;
}
</style>
