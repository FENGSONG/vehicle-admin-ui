<template>
  <div class="mac-page-container">
    <div class="page-header-container">
      <h1 class="mac-page-title">用车申请调度中心</h1>
    </div>

    <div class="mac-divider"></div>

    <div class="mac-table-card">
      <div class="table-header-actions">
        <div class="header-left">
          <el-button type="primary" class="mac-button-blue" @click="handleAdd">
            <el-icon><Plus /></el-icon>提交用车申请
          </el-button>
        </div>

        <div class="search-box">
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索申请单..."
            prefix-icon="Search"
            clearable
            class="mac-search-input"
            @keyup.enter="fetchList"
            @clear="fetchList"
          />
          <el-button class="mac-button-gray" @click="fetchList">搜索</el-button>
        </div>
      </div>

      <el-table
        :data="tableList"
        v-loading="loading"
        style="width: 100%; flex: 1"
        height="100%"
        :row-style="{ height: '64px' }"
      >
        <el-table-column type="index" label="编号" width="80" align="center" />

        <el-table-column prop="username" label="申请人" width="120" align="center" />

        <el-table-column prop="destinationAddr" label="目的地" min-width="150" align="center" />

        <el-table-column
          prop="reason"
          label="用车原因"
          min-width="150"
          show-overflow-tooltip
          align="center"
        />

        <el-table-column prop="startTime" label="使用开始时间" width="160" align="center" />

        <el-table-column prop="endTime" label="使用结束时间" width="160" align="center" />

        <el-table-column label="申请单状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small" effect="light">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="handleCancel(row)">撤销</el-button>

            <el-button
              v-if="row.status == '10'"
              link
              type="success"
              @click="openDistributeDialog(row)"
              >分配</el-button
            >

            <el-button v-if="row.status == '30'" link type="warning" @click="handleBack(row)"
              >还车</el-button
            >
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
    </div>

    <el-dialog v-model="dialogVisible" title="用车申请" width="500px" destroy-on-close>
      <el-form :model="appForm" label-position="top" :rules="rules" ref="formRef">
        <el-form-item label="用车事由" prop="reason">
          <el-input v-model="appForm.reason" type="textarea" placeholder="请详细描述用车原因" />
        </el-form-item>
        <el-form-item label="目的地" prop="destinationAddr">
          <el-input v-model="appForm.destinationAddr" placeholder="请输入目的地" />
        </el-form-item>
        <el-form-item label="使用开始时间" prop="startTime">
          <el-date-picker
            v-model="appForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="使用结束时间" prop="endTime">
          <el-date-picker
            v-model="appForm.endTime"
            type="datetime"
            placeholder="选择结束时间"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            class="mac-button-blue"
            @click="submitForm"
            :loading="submitLoading"
            >保存申请</el-button
          >
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="distributeVisible" title="调度车辆" width="400px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="请选择要分配的车辆 ID">
          <el-input v-model="selectedVehicleId" placeholder="请输入车辆ID" />
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  selectApplication,
  saveApplication,
  cancelApplication,
  distributeVehicle,
  backVehicle,
} from '@/api/application'

const loading = ref(false)
const allData = ref([])
const tableList = ref([])

const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(8)

const queryParams = reactive({ keyword: '' })

// 表单相关
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)

// 结构全改为驼峰
const appForm = reactive({
  id: null,
  reason: '',
  destinationAddr: '',
  startTime: '',
  endTime: '',
})

// 校验规则也改为驼峰
const rules = {
  reason: [{ required: true, message: '请填写用车事由', trigger: 'blur' }],
  destinationAddr: [{ required: true, message: '请填写目的地', trigger: 'blur' }],
}

// 分配车辆弹窗相关
const distributeVisible = ref(false)
const currentApplicationId = ref(null)
const selectedVehicleId = ref('')

const getStatusText = (status) => {
  if (status === null || status === undefined) return '未知'
  const val = String(status).trim()
  const map = {
    10: '审核中',
    20: '分配用车',
    30: '使用中',
    40: '已完结',
    50: '撤销',
  }
  return map[val] || val
}

const getStatusTagType = (status) => {
  if (status === null || status === undefined) return ''
  const val = String(status).trim()
  const map = {
    10: 'warning', // 橙色
    20: 'primary', // 蓝色
    30: 'success', // 绿色
    40: 'info', // 灰色
    50: 'danger', // 红色
  }
  return map[val] || ''
}

onMounted(() => {
  fetchList()
})

const fetchList = async () => {
  loading.value = true
  try {
    const res = await selectApplication(queryParams)
    const dataList = res.data || []

    allData.value = dataList.map((item) => {
      item.status = item.status !== null ? item.status.toString() : '10'
      return item
    })

    total.value = allData.value.length
    currentPage.value = 1
    updatePageData()
  } catch (error) {
    console.error('获取申请列表失败', error)
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

// 新增申请，重置也改为驼峰
const handleAdd = () => {
  Object.assign(appForm, {
    id: null,
    reason: '',
    destinationAddr: '',
    startTime: '',
    endTime: '',
  })
  dialogVisible.value = true
  if (formRef.value) formRef.value.clearValidate()
}

// 编辑申请
const handleEdit = (row) => {
  Object.assign(appForm, JSON.parse(JSON.stringify(row)))
  dialogVisible.value = true
  if (formRef.value) formRef.value.clearValidate()
}

const submitForm = () => {
  if (!formRef.value) return
  formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        await saveApplication(appForm)
        ElMessage.success(appForm.id ? '修改成功！' : '申请提交成功！')
        dialogVisible.value = false
        fetchList()
      } catch (error) {
        console.error('保存失败:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 撤销申请
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
    })
    .catch(() => {})
}

// 打开分配车辆弹窗
const openDistributeDialog = (row) => {
  currentApplicationId.value = row.id || row.user_id
  selectedVehicleId.value = ''
  distributeVisible.value = true
}

// 提交分配车辆
const submitDistribute = async () => {
  if (!selectedVehicleId.value) {
    ElMessage.warning('请输入车辆ID')
    return
  }
  submitLoading.value = true
  try {
    await distributeVehicle(currentApplicationId.value, selectedVehicleId.value)
    ElMessage.success('调度发车成功！')
    distributeVisible.value = false
    fetchList()
  } catch (error) {
    console.error('分配失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// 还车
const handleBack = (row) => {
  if (!row.vehicleId) {
    ElMessage.error('该申请单未绑定车辆，无法还车')
    return
  }
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
    })
    .catch(() => {})
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
  flex-shrink: 0;
}
.mac-page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1d1d1f;
  margin: 0;
}
.mac-divider {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.08);
  margin-bottom: 12px;
  flex-shrink: 0;
}

.mac-table-card {
  flex: 1;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 24px 24px 16px 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  margin-bottom: 16px;
  min-height: 0;
}

.table-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-shrink: 0;
}
.header-left {
  display: flex;
  gap: 12px;
}
.search-box {
  display: flex;
  gap: 12px;
}
.mac-search-input {
  width: 280px;
}

.mac-button-blue {
  background-color: #007aff !important;
  border: none !important;
  border-radius: 8px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}
.mac-button-gray {
  background-color: #e5e5ea;
  border-color: transparent;
  color: #1d1d1f;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
:deep(.el-button .el-icon) {
  margin-right: 4px;
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

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #1d1d1f;
  padding-bottom: 4px !important;
}
:deep(.el-input__wrapper),
:deep(.el-select__wrapper),
:deep(.el-textarea__inner) {
  border-radius: 8px;
  background-color: #f5f5f7;
  box-shadow: none !important;
  border: 1px solid transparent;
  transition: all 0.2s;
}
:deep(.el-input__wrapper.is-focus),
:deep(.el-select__wrapper.is-focused),
:deep(.el-textarea__inner:focus) {
  background-color: #ffffff;
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2) !important;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
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
