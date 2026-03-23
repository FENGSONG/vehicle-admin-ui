<template>
  <el-config-provider :locale="locale">
    <div class="mac-page-container">
      <div class="page-header-container">
        <h1 class="mac-page-title">北华智行 · 用车中心</h1>
      </div>

      <div class="mac-divider"></div>

      <div class="mac-table-card">
        <div class="table-header-actions">
          <div class="header-left">
            <el-radio-group
              v-model="panelMode"
              class="mac-segmented-control"
              @change="handlePanelChange"
            >
              <el-radio-button label="hall">车辆大厅</el-radio-button>
              <el-radio-button label="orders">订单管理</el-radio-button>
            </el-radio-group>

            <el-radio-group
              v-if="panelMode === 'orders' && isAdmin"
              v-model="activeTab"
              class="mac-segmented-control"
              @change="handleTabChange"
            >
              <el-radio-button label="mine">我的订单</el-radio-button>
              <el-radio-button label="all">全公司订单 (调度中心)</el-radio-button>
            </el-radio-group>
          </div>

          <div v-if="panelMode === 'orders'" class="search-box">
            <el-input
              v-model="queryParams.keyword"
              :placeholder="activeTab === 'mine' ? '搜索我的订单...' : '搜索全公司订单...'"
              prefix-icon="Search"
              clearable
              class="mac-search-input"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />
            <el-button class="mac-button-gray" @click="handleSearch">搜索</el-button>
          </div>

          <div v-else class="search-box">
            <el-input
              v-model="hallKeyword"
              placeholder="搜索车牌号 / 品牌 / 车辆ID..."
              prefix-icon="Search"
              clearable
              class="mac-search-input"
              @keyup.enter="handleHallSearch"
              @clear="handleHallSearch"
            />
            <el-button class="mac-button-gray" @click="handleHallSearch">搜索</el-button>
          </div>
        </div>

        <template v-if="panelMode === 'hall'">
          <div class="hall-toolbar">
            <el-radio-group v-model="hallTypeFilter" class="mac-segmented-control hall-type-switch">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button v-for="item in typeOptions" :key="`hall-${item.value}`" :label="item.value">
                {{ item.label }}
              </el-radio-button>
            </el-radio-group>
            <div class="hall-summary">可申请 {{ availableHallCount }} / {{ filteredHallVehicles.length }}</div>
          </div>

          <div class="hall-grid" v-loading="hallLoading">
            <template v-if="filteredHallVehicles.length > 0">
              <div
                v-for="item in filteredHallVehicles"
                :key="item.id"
                class="hall-vehicle-card"
                :class="{ unavailable: !isVehicleIdle(item) }"
              >
                <div class="hall-card-top">
                  <div class="hall-license">{{ item.license || `车辆-${item.id}` }}</div>
                  <el-tag :type="isVehicleIdle(item) ? 'success' : 'info'" effect="light" round size="small">
                    {{ getHallStatusText(item) }}
                  </el-tag>
                </div>
                <div class="hall-meta">
                  {{ item.brand || '未知品牌' }} · {{ getVehicleTypeText(item.type) }} · {{ getVehicleColorText(item.color) }}
                </div>
                <div class="hall-meta light">车辆ID：{{ item.id }}</div>
                <el-button
                  class="hall-apply-btn"
                  type="primary"
                  :disabled="!isVehicleIdle(item)"
                  @click="openApplyByVehicle(item)"
                >
                  {{ isVehicleIdle(item) ? '立即申请' : '不可申请' }}
                </el-button>
              </div>
            </template>
            <el-empty v-else-if="!hallLoading" class="hall-empty" description="暂无可展示车辆" :image-size="90" />
          </div>
        </template>

        <template v-else>
          <el-table
            :data="tableList"
            v-loading="loading"
            style="width: 100%; flex: 1"
            height="100%"
            :row-style="{ height: '64px' }"
          >
            <el-table-column type="index" label="编号" width="60" align="center" />

            <el-table-column
              v-if="activeTab === 'all'"
              prop="username"
              label="申请人"
              min-width="90"
              align="center"
            />

            <el-table-column
              prop="destinationAddr"
              label="目的地"
              min-width="130"
              show-overflow-tooltip
              align="center"
            />
            <el-table-column
              prop="reason"
              label="用车原因"
              min-width="130"
              show-overflow-tooltip
              align="center"
            />
            <el-table-column prop="startTime" label="开始时间" min-width="155" align="center" />
            <el-table-column prop="endTime" label="结束时间" min-width="155" align="center" />

            <el-table-column label="当前状态" min-width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="getAppStatusTagType(row.status)" size="small" effect="light">
                  {{ getAppStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column
              label="操作"
              :min-width="activeTab === 'all' ? 220 : 130"
              align="right"
              header-align="right"
            >
              <template #default="{ row }">
                <div class="action-btn-group">
                  <template v-if="activeTab === 'mine' && row.status == '10'">
                    <el-button link type="danger" @click="handleCancel(row)">撤销</el-button>
                  </template>
                  <template v-if="activeTab === 'mine' && row.status == '60'">
                    <el-button link type="warning" @click="handleBack(row)">还车</el-button>
                  </template>

                  <template v-if="activeTab === 'all'">
                    <el-button
                      v-if="row.status == '50'"
                      link
                      type="success"
                      @click="openDistributeDialog(row)"
                      >分配</el-button
                    >
                  </template>

                  <el-button link type="primary" @click="openOrderDetails(row)">
                    <el-icon><Document /></el-icon> 订单详情
                  </el-button>
                </div>
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
        </template>
      </div>

      <el-dialog
        v-model="dialogVisible"
        title="用车申请"
        width="800px"
        destroy-on-close
        class="mac-dialog"
      >
        <el-form
          :model="appForm"
          label-position="top"
          :rules="rules"
          ref="formRef"
          class="custom-form"
        >
          <el-row :gutter="40">
            <el-col :span="24">
              <el-form-item label="意向车辆">
                <el-input :model-value="preferredVehicleDisplay" disabled />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="40">
            <el-col :span="12">
              <el-form-item label="用车人" prop="username">
                <el-input
                  v-model="appForm.username"
                  disabled
                  placeholder="自动获取当前登录账号..."
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="使用时间" prop="timeRange">
                <el-date-picker
                  v-model="appForm.timeRange"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="40">
            <el-col :span="12">
              <el-form-item label="车辆出发地" prop="departureAddr">
                <el-input v-model="appForm.departureAddr" placeholder="请输入" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="车辆目的地" prop="destinationAddr">
                <el-input v-model="appForm.destinationAddr" placeholder="请输入" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="40">
            <el-col :span="12">
              <el-form-item label="驾照" prop="imgUrl">
                <div class="upload-container">
                  <el-upload
                    class="avatar-uploader"
                    action="#"
                    :show-file-list="false"
                    :auto-upload="false"
                    :on-change="handleAvatarChange"
                  >
                    <img v-if="licensePreviewUrl" :src="licensePreviewUrl" class="avatar" />
                    <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
                  </el-upload>
                  <div class="upload-tip">只能上传jpg/png文件，且不超过500kb</div>
                  <div v-if="uploadingLicense" class="upload-status status-uploading">
                    驾照上传中，请稍候...
                  </div>
                  <div v-else-if="licenseUploadMessage" class="upload-status" :class="licenseUploadClass">
                    {{ licenseUploadMessage }}
                  </div>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="用车事由" prop="reason">
                <el-input
                  v-model="appForm.reason"
                  type="textarea"
                  :rows="5"
                  placeholder="请输入"
                  resize="none"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="24">
              <el-form-item label="备注" prop="remark">
                <el-input v-model="appForm.remark" type="textarea" :rows="3" placeholder="请输入" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button
              type="primary"
              class="mac-button-blue"
              @click="submitForm"
              :loading="submitLoading"
              >确定</el-button
            >
          </span>
        </template>
      </el-dialog>

      <el-dialog v-model="distributeVisible" title="调度发车" width="400px" destroy-on-close>
        <el-form label-position="top">
          <el-form-item label="请选择要分配的车辆 ID">
            <el-input v-model="selectedVehicleId" placeholder="请输入空闲车辆的ID" />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="distributeVisible = false">取消</el-button>
            <el-button
              type="primary"
              class="mac-button-blue"
              @click="submitDistribute"
              :loading="submitLoading"
              >确认发车</el-button
            >
          </span>
        </template>
      </el-dialog>

      <el-drawer
        v-model="drawerVisible"
        title="行程订单详情"
        size="450px"
        class="mac-drawer"
        destroy-on-close
      >
        <div class="order-detail-container" v-loading="drawerLoading">
          <div class="order-header-card">
            <div class="header-top">
              <span class="order-no"
                >NO.{{ formatOrderNo(currentOrder.id, currentOrder.createTime) }}</span
              >
              <el-tag :type="getAppStatusTagType(currentOrder.status)" effect="dark" round>
                {{ getAppStatusText(currentOrder.status) }}
              </el-tag>
            </div>
            <div class="header-user">
              <el-icon><User /></el-icon> 用车人：{{ currentOrder.username || '当前用户' }}
            </div>
          </div>

          <div class="info-card">
            <div class="card-title">行程路线</div>
            <div class="route-box">
              <div class="route-item">
                <div class="dot start-dot"></div>
                <div class="route-text">{{ currentOrder.departureAddr || '起点' }}</div>
              </div>
              <div class="route-line"></div>
              <div class="route-item">
                <div class="dot end-dot"></div>
                <div class="route-text">{{ currentOrder.destinationAddr }}</div>
              </div>
            </div>
            <div class="time-box">
              <el-icon><Clock /></el-icon
              ><span>{{ currentOrder.startTime }} &nbsp;至&nbsp; {{ currentOrder.endTime }}</span>
            </div>
            <div class="reason-box"><strong>事由：</strong>{{ currentOrder.reason }}</div>
          </div>

          <div class="info-card vehicle-section">
            <div class="card-title">{{ Number(currentOrder.status || 0) >= 60 ? '已分配车辆信息' : '意向车辆信息' }}</div>
            <div v-if="vehicleInfo" class="vehicle-card">
              <div class="plate-number">{{ vehicleInfo.license || '--' }}</div>
              <div class="vehicle-specs">
                <span><el-icon><Van /></el-icon> ID：{{ vehicleInfo.id || currentOrder.vehicleId || '--' }}</span>
                <span class="divider">|</span>
                <span>品牌：{{ vehicleInfo.brand || '--' }}</span>
              </div>
              <div class="vehicle-specs">
                <span>颜色：{{ getVehicleColorText(vehicleInfo.color) }}</span>
                <span class="divider">|</span>
                <span>车型：{{ getVehicleTypeText(vehicleInfo.type) }}</span>
              </div>
            </div>
            <div
              v-else-if="currentOrder.vehicleId && Number(currentOrder.status || 0) < 60"
              class="vehicle-placeholder"
            >
              <el-icon><Clock /></el-icon>
              <span>已记录意向车辆ID：{{ currentOrder.vehicleId }}，最终分配以审批后调度结果为准</span>
            </div>
            <div v-else-if="Number(currentOrder.status || 0) < 60" class="vehicle-placeholder">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>尚未选择意向车辆</span>
            </div>
            <div v-else class="vehicle-placeholder error">已分配车辆信息暂未同步，请稍后重试</div>
          </div>

          <div class="info-card">
            <div class="card-title">审批流转记录</div>
            <div class="timeline-box">
              <el-timeline v-if="auditProcessList.length > 0">
                <el-timeline-item type="primary" :timestamp="currentOrder.createTime"
                  >您发起了用车申请</el-timeline-item
                >
                <el-timeline-item
                  v-for="(step, index) in auditProcessList"
                  :key="index"
                  :type="getTimelineNodeType(step.auditStatus)"
                  :color="getTimelineNodeColor(step.auditStatus)"
                  :timestamp="step.updateTime || step.createTime"
                >
                  <div class="timeline-content">
                    <h4>
                      第 {{ step.auditSort + 1 }} 级审批
                      <span :class="['status-text', `status-${step.auditStatus}`]"
                        >({{ getAuditStatusText(step.auditStatus) }})</span
                      >
                    </h4>
                    <p v-if="step.auditStatus == '40'" class="reject-reason">
                      驳回原因: {{ currentOrder.rejectReason || '无' }}
                    </p>
                  </div>
                </el-timeline-item>
                <el-timeline-item
                  v-if="currentOrder.status == '60' || currentOrder.status == '70'"
                  type="success"
                  icon="Check"
                  size="large"
                  >系统已分配车辆并完结</el-timeline-item
                >
              </el-timeline>
              <el-empty v-else description="暂无流转记录" :image-size="60" />
            </div>
          </div>
        </div>
      </el-drawer>
    </div>
  </el-config-provider>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Document,
  User,
  Clock,
  Van,
  Loading,
  Plus,
} from '@element-plus/icons-vue'
import {
  selectApplication,
  saveApplication,
  uploadLicense,
  cancelApplication,
  distributeVehicle,
  backVehicle,
} from '@/api/application'
import { selectAuditList } from '@/api/audit'
import { selectVehicle } from '@/api/vehicle'
import { selectDictOptionByCode } from '@/api/dictoption'
import { ElMessage, ElMessageBox } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

const locale = zhCn

const loading = ref(false)
const allData = ref([])
const tableList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(8)

const isAdmin = ref(false)
const activeTab = ref('mine')
const currentUserId = ref(null)

const queryParams = reactive({
  keyword: '',
  userId: null,
})

const panelMode = ref('hall')
const hallLoading = ref(false)
const hallKeyword = ref('')
const hallTypeFilter = ref('all')
const hallVehicleList = ref([])

const typeOptions = ref([])
const colorOptions = ref([])
const selectedApplyVehicle = ref(null)

const DICT_FALLBACK = Object.freeze({
  color: [
    { label: '白', value: '10' },
    { label: '灰', value: '20' },
    { label: '黑', value: '30' },
    { label: '银', value: '40' },
    { label: '红', value: '50' },
    { label: '绿', value: '60' },
  ],
  type: [
    { label: '轿车', value: '10' },
    { label: '客车', value: '20' },
    { label: '货车', value: '30' },
    { label: '挂车', value: '40' },
  ],
})

const toKey = (value) => String(value == null ? '' : value).trim()
const toOptionList = (list, fallback) => {
  const normalized = Array.isArray(list)
    ? list
        .map((item) => ({
          label: String(item?.label || '').trim(),
          value: toKey(item?.value),
          sort: Number(item?.sort || 0),
        }))
        .filter((item) => item.label && item.value)
        .sort((a, b) => a.sort - b.sort)
    : []
  return normalized.length ? normalized : fallback
}

const buildLabelMap = (list) => {
  const map = {}
  ;(list || []).forEach((item) => {
    const key = toKey(item?.value)
    if (!key) return
    map[key] = String(item?.label || '').trim()
  })
  return map
}

const typeLabelMap = computed(() => buildLabelMap(typeOptions.value))
const colorLabelMap = computed(() => buildLabelMap(colorOptions.value))

const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)
const appForm = reactive({
  id: null,
  userId: null,
  username: '',
  timeRange: [],
  startTime: '',
  endTime: '',
  departureAddr: '',
  destinationAddr: '',
  imgUrl: '',
  reason: '',
  remark: '',
  vehicleId: null,
})

const licensePreviewUrl = ref('')
const uploadingLicense = ref(false)
const licenseUploadMessage = ref('')
const licenseUploadClass = ref('')

const rules = {
  timeRange: [{ required: true, message: '请选择使用时间', trigger: 'change' }],
  departureAddr: [{ required: true, message: '请填写出发地', trigger: 'blur' }],
  destinationAddr: [{ required: true, message: '请填写目的地', trigger: 'blur' }],
  imgUrl: [{ required: true, message: '请上传驾照照片', trigger: 'change' }],
  reason: [{ required: true, message: '请填写用车事由', trigger: 'blur' }],
}

const distributeVisible = ref(false)
const currentApplicationId = ref(null)
const selectedVehicleId = ref('')

const drawerVisible = ref(false)
const drawerLoading = ref(false)
const currentOrder = ref({})
const vehicleInfo = ref(null)
const auditProcessList = ref([])

const getVehicleTypeText = (value) => {
  const key = toKey(value)
  return typeLabelMap.value[key] || key || '--'
}

const getVehicleColorText = (value) => {
  const key = toKey(value)
  return colorLabelMap.value[key] || key || '--'
}

const isVehicleIdle = (item) => toKey(item?.status) === '1'
const getHallStatusText = (item) => (isVehicleIdle(item) ? '空闲中' : '占用中')

const filteredHallVehicles = computed(() => {
  const keyword = String(hallKeyword.value || '').trim().toLowerCase()
  const selectedType = toKey(hallTypeFilter.value)

  return (hallVehicleList.value || []).filter((item) => {
    if (selectedType !== 'all' && toKey(item?.type) !== selectedType) {
      return false
    }
    if (!keyword) {
      return true
    }
    const text = [
      item?.id,
      item?.license,
      item?.brand,
      getVehicleTypeText(item?.type),
      getVehicleColorText(item?.color),
      getHallStatusText(item),
    ]
      .map((v) => String(v || '').toLowerCase())
      .join(' ')
    return text.includes(keyword)
  })
})

const availableHallCount = computed(
  () => filteredHallVehicles.value.filter((item) => isVehicleIdle(item)).length,
)

const preferredVehicleDisplay = computed(() => {
  if (!appForm.vehicleId) {
    return '请先在车辆大厅选择车辆'
  }
  const matched =
    selectedApplyVehicle.value && Number(selectedApplyVehicle.value.id) === Number(appForm.vehicleId)
      ? selectedApplyVehicle.value
      : null
  if (!matched) {
    return `车辆ID：${appForm.vehicleId}`
  }
  const license = matched.license || `车辆-${matched.id}`
  const brand = matched.brand || '未知品牌'
  const color = getVehicleColorText(matched.color)
  return `${license}（ID:${matched.id}，${brand}，${color}）`
})

const loadVehicleDictOptions = async () => {
  const [colorRes, typeRes] = await Promise.allSettled([
    selectDictOptionByCode('101'),
    selectDictOptionByCode('103'),
  ])

  colorOptions.value =
    colorRes.status === 'fulfilled'
      ? toOptionList(colorRes.value?.data, DICT_FALLBACK.color)
      : DICT_FALLBACK.color
  typeOptions.value =
    typeRes.status === 'fulfilled'
      ? toOptionList(typeRes.value?.data, DICT_FALLBACK.type)
      : DICT_FALLBACK.type
}

const fetchVehicleHall = async () => {
  hallLoading.value = true
  try {
    const res = await selectVehicle({})
    const list = (res?.data || []).map((item) => ({
      ...item,
      id: item?.id,
      status: toKey(item?.status),
      type: toKey(item?.type),
      color: toKey(item?.color),
    }))
    hallVehicleList.value = list.sort((a, b) => {
      const aIdle = isVehicleIdle(a) ? 1 : 0
      const bIdle = isVehicleIdle(b) ? 1 : 0
      if (aIdle !== bIdle) {
        return bIdle - aIdle
      }
      return Number(a?.id || 0) - Number(b?.id || 0)
    })
  } catch (error) {
    console.error('获取车辆大厅失败', error)
    hallVehicleList.value = []
  } finally {
    hallLoading.value = false
  }
}

onMounted(async () => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    try {
      const userInfo = JSON.parse(userInfoStr)
      currentUserId.value = userInfo.id
      appForm.username = userInfo.username
      if (String(userInfo.level) === '99') {
        isAdmin.value = true
      }
      queryParams.userId = userInfo.id
    } catch (e) {
      console.error('解析用户信息失败', e)
    }
  }

  await loadVehicleDictOptions()
  await fetchVehicleHall()
  fetchList()
})

const handlePanelChange = (mode) => {
  if (mode === 'orders') {
    currentPage.value = 1
    fetchList()
    return
  }
  fetchVehicleHall()
}

const handleTabChange = (tabName) => {
  currentPage.value = 1
  if (tabName === 'mine') {
    queryParams.userId = currentUserId.value
  } else {
    queryParams.userId = null
  }
  fetchList()
}

const handleSearch = () => {
  if (panelMode.value !== 'orders') return
  currentPage.value = 1
  fetchList()
}

const handleHallSearch = () => {
  if (panelMode.value !== 'hall') return
  hallKeyword.value = String(hallKeyword.value || '').trim()
}

const fetchList = async () => {
  loading.value = true
  try {
    const requestParams = {}
    if (queryParams.userId !== null && queryParams.userId !== undefined) {
      requestParams.userId = queryParams.userId
    }
    const res = await selectApplication(requestParams)
    let rawData = res.data || []

    if (activeTab.value === 'mine') {
      rawData = rawData.filter((item) => Number(item.userId) === Number(currentUserId.value))
    }

    const keyword = String(queryParams.keyword || '').trim().toLowerCase()
    if (keyword) {
      rawData = rawData.filter((item) => {
        const text = [
          item.id,
          item.username,
          item.reason,
          item.departureAddr,
          item.destinationAddr,
          item.startTime,
          item.endTime,
        ]
          .map((v) => String(v || '').toLowerCase())
          .join(' ')
        return text.includes(keyword)
      })
    }

    allData.value = rawData.map((item) => ({
      ...item,
      status: toKey(item?.status),
      type: toKey(item?.type),
      color: toKey(item?.color),
    }))
    total.value = allData.value.length
    updatePageData()
  } catch (error) {
    console.error('获取申请列表失败', error)
  } finally {
    loading.value = false
  }
}

const updatePageData = () => {
  const maxPage = Math.ceil(total.value / pageSize.value) || 1
  if (currentPage.value > maxPage) currentPage.value = maxPage
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  tableList.value = allData.value.slice(start, end)
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  updatePageData()
}

const resetLicenseUploadState = () => {
  if (licensePreviewUrl.value && licensePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(licensePreviewUrl.value)
  }
  licensePreviewUrl.value = ''
  uploadingLicense.value = false
  licenseUploadMessage.value = ''
  licenseUploadClass.value = ''
}

const validateLicenseFile = (file) => {
  const fileName = String(file?.name || '').toLowerCase()
  const isImage = ['image/jpeg', 'image/png'].includes(file?.type) || /\.(jpg|jpeg|png)$/.test(fileName)
  if (!isImage) {
    ElMessage.warning('仅支持 jpg/png 格式图片')
    return false
  }
  const maxSize = 500 * 1024
  if (file.size > maxSize) {
    ElMessage.warning('图片大小不能超过 500KB')
    return false
  }
  return true
}

const handleAvatarChange = async (uploadFile) => {
  const rawFile = uploadFile?.raw
  if (!rawFile) {
    ElMessage.warning('未获取到图片文件，请重试')
    return
  }
  if (!validateLicenseFile(rawFile)) {
    return
  }

  if (licensePreviewUrl.value && licensePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(licensePreviewUrl.value)
  }
  licensePreviewUrl.value = URL.createObjectURL(rawFile)
  appForm.imgUrl = ''
  licenseUploadClass.value = ''
  licenseUploadMessage.value = ''
  uploadingLicense.value = true

  const formData = new FormData()
  formData.append('file', rawFile)

  try {
    const res = await uploadLicense(formData)
    const savedPath = String(res?.data || '').trim()
    if (!savedPath) {
      throw new Error('服务器未返回图片路径')
    }
    appForm.imgUrl = savedPath
    licenseUploadClass.value = 'status-success'
    licenseUploadMessage.value = `上传成功：${rawFile.name}`
    ElMessage.success('驾照上传成功')
    if (formRef.value) {
      formRef.value.validateField('imgUrl', () => {})
    }
  } catch (error) {
    appForm.imgUrl = ''
    licenseUploadClass.value = 'status-error'
    licenseUploadMessage.value = '上传失败，请重新选择图片'
    ElMessage.error(error?.message || '驾照上传失败')
  } finally {
    uploadingLicense.value = false
  }
}

const openApplyByVehicle = (item) => {
  if (!isVehicleIdle(item)) {
    ElMessage.warning('当前车辆处于占用状态，暂不可申请')
    return
  }
  handleAdd(item)
}

const handleAdd = (vehicle = null) => {
  const usernameCache = appForm.username
  const selected = vehicle
    ? {
        ...vehicle,
        status: toKey(vehicle.status),
        type: toKey(vehicle.type),
        color: toKey(vehicle.color),
      }
    : null
  selectedApplyVehicle.value = selected
  resetLicenseUploadState()
  Object.assign(appForm, {
    id: null,
    userId: currentUserId.value,
    username: usernameCache,
    timeRange: [],
    startTime: '',
    endTime: '',
    departureAddr: '',
    destinationAddr: '',
    imgUrl: '',
    reason: '',
    remark: '',
    vehicleId: selected?.id || null,
  })
  dialogVisible.value = true
  if (formRef.value) formRef.value.clearValidate()
}

const submitForm = () => {
  if (!formRef.value) return
  if (uploadingLicense.value) {
    ElMessage.warning('驾照仍在上传中，请稍候再提交')
    return
  }
  if (!appForm.vehicleId) {
    ElMessage.warning('请先在车辆大厅选择车辆后再提交申请')
    return
  }
  formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (appForm.timeRange && appForm.timeRange.length === 2) {
          appForm.startTime = appForm.timeRange[0]
          appForm.endTime = appForm.timeRange[1]
        }
        const submitData = { ...appForm }

        await saveApplication(submitData)
        ElMessage.success('申请提交成功！审批流已启动。')
        dialogVisible.value = false
        resetLicenseUploadState()
        selectedApplyVehicle.value = null
        fetchVehicleHall()
        if (activeTab.value === 'all') {
          activeTab.value = 'mine'
          handleTabChange('mine')
        } else {
          fetchList()
        }
      } catch (error) {
        console.error('保存失败:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleCancel = (row) => {
  ElMessageBox.confirm(`确定要撤销此申请单吗？`, '确认撤销', {
    confirmButtonText: '确定撤销',
    cancelButtonText: '取消',
    type: 'warning',
    center: true,
  })
    .then(async () => {
      await cancelApplication(row.id || row.user_id)
      ElMessage.success('撤销成功！')
      fetchList()
      fetchVehicleHall()
    })
    .catch(() => {})
}

const openDistributeDialog = (row) => {
  currentApplicationId.value = row.id || row.user_id
  selectedVehicleId.value = ''
  distributeVisible.value = true
}

const submitDistribute = async () => {
  if (!selectedVehicleId.value) return ElMessage.warning('请输入车辆ID')
  submitLoading.value = true
  try {
    await distributeVehicle(currentApplicationId.value, selectedVehicleId.value)
    ElMessage.success('调度发车成功！')
    distributeVisible.value = false
    fetchList()
    fetchVehicleHall()
  } catch (error) {
    console.error('分配失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleBack = (row) => {
  if (!row.vehicleId) return ElMessage.error('该申请单未绑定车辆，无法还车')
  ElMessageBox.confirm(`确认归还车辆【ID: ${row.vehicleId}】并完结此单据吗？`, '确认还车', {
    confirmButtonText: '确认归还',
    cancelButtonText: '取消',
    type: 'success',
    center: true,
  })
    .then(async () => {
      await backVehicle(row.id || row.user_id, row.vehicleId)
      ElMessage.success('还车成功，流程完结！')
      fetchList()
      fetchVehicleHall()
    })
    .catch(() => {})
}

const formatOrderNo = (id, dateStr) => {
  if (!id) return ''
  let prefix = 'BH-'
  if (dateStr) prefix += dateStr.substring(0, 10).replace(/-/g, '') + '-'
  return prefix + String(id).padStart(3, '0')
}

const openOrderDetails = async (row) => {
  currentOrder.value = row
  drawerVisible.value = true
  drawerLoading.value = true
  vehicleInfo.value = null
  auditProcessList.value = []

  try {
    const requests = [selectAuditList({ applicationId: row.id || row.user_id })]
    if (row.vehicleId) requests.push(selectVehicle({ id: row.vehicleId }))

    const results = await Promise.all(requests)

    const auditRes = results[0]
    let audits = auditRes.data || []
    audits.sort((a, b) => a.auditSort - b.auditSort)
    auditProcessList.value = audits

    if (row.vehicleId && results[1]) {
      const vehicleRes = results[1]
      if (vehicleRes.data && vehicleRes.data.length > 0) vehicleInfo.value = vehicleRes.data[0]
    }
  } catch (error) {
    console.error('获取订单明细失败', error)
  } finally {
    drawerLoading.value = false
  }
}

const getAppStatusText = (status) => {
  const map = {
    10: '已发起',
    20: '已撤销',
    30: '审核中',
    40: '已驳回',
    50: '已审核',
    60: '已分配用车',
    70: '工单结束',
  }
  return map[status] || '未知'
}
const getAppStatusTagType = (status) => {
  const map = {
    10: 'info',
    20: 'info',
    30: 'warning',
    40: 'danger',
    50: 'primary',
    60: 'success',
    70: 'info',
  }
  return map[status] || ''
}
const getAuditStatusText = (status) => {
  const map = { 10: '正在审批', 20: '排队中', 30: '已同意', 40: '已驳回' }
  return map[status] || '未知'
}
const getTimelineNodeType = (status) => {
  if (status == '30') return 'success'
  if (status == '40') return 'danger'
  if (status == '10') return 'primary'
  return 'info'
}
const getTimelineNodeColor = (status) => {
  if (status == '10') return '#409EFF'
  return ''
}
</script>

<style scoped>
.mac-page-container {
  height: calc(100vh - 100px) !important;
  display: flex;
  flex-direction: column;
  overflow: hidden !important;
  box-sizing: border-box;
  animation: fadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.page-header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.mac-page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1d1d1f;
  margin: 0;
}

:deep(.mac-segmented-control) {
  background-color: rgba(118, 118, 128, 0.12);
  border-radius: 8px;
  padding: 2px;
}
:deep(.mac-segmented-control .el-radio-button__inner) {
  border: none !important;
  background: transparent !important;
  color: #1d1d1f;
  font-weight: 500;
  border-radius: 6px !important;
  box-shadow: none !important;
  padding: 6px 16px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
:deep(.mac-segmented-control .el-radio-button.is-active .el-radio-button__inner) {
  background-color: #ffffff !important;
  color: #1d1d1f !important;
  box-shadow:
    0 3px 8px rgba(0, 0, 0, 0.12),
    0 3px 1px rgba(0, 0, 0, 0.04) !important;
}

.mac-divider {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.08);
  margin-bottom: 12px;
}
.mac-table-card {
  flex: 1;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.table-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}
.header-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.search-box {
  display: flex;
  gap: 12px;
}
.mac-search-input {
  width: 280px;
}
.mac-button-blue {
  background-color: #409eff !important;
  border: none !important;
  border-radius: 6px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: white;
}
.mac-button-gray {
  background-color: #e5e5ea;
  border-color: transparent;
  color: #1d1d1f;
  border-radius: 8px;
}

.hall-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.hall-type-switch {
  max-width: 100%;
}

.hall-summary {
  font-size: 13px;
  color: #606266;
  background-color: #f5f5f7;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  padding: 6px 12px;
}

.hall-grid {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  align-content: start;
  padding-right: 4px;
}

.hall-vehicle-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 170px;
  background: linear-gradient(160deg, #f5fbff 0%, #f2fcf7 100%);
  transition: all 0.2s ease;
}

.hall-vehicle-card:hover {
  box-shadow: 0 8px 18px rgba(0, 122, 255, 0.08);
  border-color: rgba(0, 122, 255, 0.28);
}

.hall-vehicle-card.unavailable {
  background: #f5f5f7;
  opacity: 0.72;
}

.hall-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.hall-license {
  font-size: 22px;
  font-weight: 700;
  color: #1d1d1f;
  letter-spacing: 0.4px;
}

.hall-meta {
  font-size: 14px;
  color: #1d1d1f;
  line-height: 1.4;
}

.hall-meta.light {
  color: #86868b;
}

.hall-apply-btn {
  margin-top: auto;
  height: 38px;
  border-radius: 10px;
  font-weight: 600;
}

.hall-empty {
  grid-column: 1 / -1;
  align-self: center;
}

.upload-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

:deep(.avatar-uploader .el-upload) {
  width: 140px;
  height: 140px;
  border: 1px dashed #dcdfe6;
  border-radius: 10px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  transition: border-color 0.2s ease;
}

:deep(.avatar-uploader .el-upload:hover) {
  border-color: #409eff;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.upload-tip {
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
}

.upload-status {
  font-size: 12px;
  line-height: 1.4;
}

.status-uploading {
  color: #e6a23c;
}

.status-success {
  color: #67c23a;
}

.status-error {
  color: #f56c6c;
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

/* 操作列靠右对齐样式 */
.action-btn-group {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-right: 12px;
}
:deep(.action-btn-group .el-button) {
  margin-left: 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed rgba(0, 0, 0, 0.05);
}

/* 订单详情抽屉(Drawer) 专属高级感样式 */
:deep(.mac-drawer .el-drawer__header) {
  margin-bottom: 0;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  font-weight: 600;
  color: #1d1d1f;
}
.order-detail-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: #f5f5f7;
  min-height: 100%;
}
.order-header-card {
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.order-no {
  font-size: 18px;
  font-weight: 700;
  color: #1d1d1f;
  letter-spacing: 0.5px;
}
.header-user {
  font-size: 14px;
  color: #86868b;
  display: flex;
  align-items: center;
  gap: 6px;
}
.info-card {
  background: white;
  padding: 18px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 16px;
  padding-left: 10px;
  border-left: 4px solid #007aff;
  line-height: 1;
}
.route-box {
  margin-bottom: 16px;
  padding: 12px;
  background: #fdfdfd;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}
.route-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.start-dot {
  background-color: #34c759;
}
.end-dot {
  background-color: #ff3b30;
}
.route-line {
  width: 2px;
  height: 14px;
  background-color: #e5e5ea;
  margin: 4px 0 4px 3px;
}
.route-text {
  font-size: 15px;
  color: #1d1d1f;
  font-weight: 500;
}
.time-box,
.reason-box {
  font-size: 14px;
  color: #606266;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 10px;
}
.vehicle-section {
  margin-top: 4px;
}
.vehicle-card {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  border-radius: 10px;
  padding: 16px;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(30, 60, 114, 0.2);
}
.plate-number {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 2px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}
.vehicle-specs {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.9;
}
.divider {
  opacity: 0.5;
}
.vehicle-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  background: #f5f5f7;
  border-radius: 8px;
  color: #86868b;
  font-size: 14px;
}
.timeline-box {
  padding-top: 10px;
}
.timeline-content h4 {
  margin: 0 0 6px 0;
  font-size: 14px;
  color: #1d1d1f;
}
.status-text {
  font-size: 12px;
  font-weight: bold;
}
.status-30 {
  color: #67c23a;
}
.status-10 {
  color: #409eff;
}
.status-20 {
  color: #909399;
}
.status-40 {
  color: #f56c6c;
}
.reject-reason {
  margin: 0;
  font-size: 12px;
  color: #f56c6c;
  background-color: #fef0f0;
  padding: 6px 10px;
  border-radius: 6px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
