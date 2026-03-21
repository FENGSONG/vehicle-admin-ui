<template>
  <div class="mac-page-container">
    <div class="page-header-container">
      <h1 class="mac-page-title">
        {{ currentUserLevel === '99' ? '全局审批监控' : '我的审批待办' }}
      </h1>
    </div>

    <div class="mac-divider"></div>

    <div class="mac-table-card">
      <div class="table-header-actions">
        <div class="search-box">
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索申请事由..."
            prefix-icon="Search"
            clearable
            class="mac-search-input"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <el-button class="mac-button-gray" @click="handleSearch">搜索</el-button>
        </div>
      </div>

      <el-table
        :data="tableList"
        v-loading="loading"
        style="width: 100%; flex: 1"
        height="100%"
        :row-style="{ height: '64px' }"
      >
        <el-table-column type="index" label="序号" width="80" align="center" />

        <el-table-column prop="applicationId" label="申请单号" width="100" align="center" />
        <el-table-column
          prop="reason"
          label="用车原因"
          min-width="150"
          show-overflow-tooltip
          align="center"
        />
        <el-table-column prop="destinationAddr" label="目的地" min-width="150" align="center" />
        <el-table-column prop="startTime" label="预计开始时间" width="160" align="center" />
        <el-table-column prop="endTime" label="预计结束时间" width="160" align="center" />

        <el-table-column label="审批状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.auditStatus || row.status)"
              size="small"
              effect="light"
            >
              {{ getStatusText(row.auditStatus || row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="审批操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <template v-if="canOperate(row)">
              <el-button link type="success" @click="handlePass(row)">
                <el-icon><Check /></el-icon> 同意
              </el-button>
              <el-button link type="danger" @click="openRejectDialog(row)">
                <el-icon><Close /></el-icon> 驳回
              </el-button>
            </template>
            <span v-else style="color: #909399; font-size: 13px">{{ getOperateHint(row) }}</span>
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

    <el-dialog v-model="rejectDialogVisible" title="驳回申请" width="400px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="请输入驳回原因 (必填)">
          <el-input
            v-model="rejectReason"
            type="textarea"
            :rows="3"
            placeholder="例如：预算不足、事由不合理等"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="rejectDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="submitReject" :loading="submitLoading"
            >确认驳回</el-button
          >
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Check, Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { selectAuditList, updateAuditStatus } from '@/api/audit'

const loading = ref(false)
const allData = ref([])
const tableList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(8)

// 🍎 新增：用于记录当前登录人的职级，控制页面标题展示
const currentUserLevel = ref('')
const currentUserId = ref(0)

const queryParams = reactive({
  keyword: '',
  auditStatus: '10',
  auditUserId: null,
})

const rejectDialogVisible = ref(false)
const submitLoading = ref(false)
const currentAuditId = ref(null)
const currentApplicationId = ref(null)
const currentAuditSort = ref(null)
const rejectReason = ref('')

const getStatusText = (status) => {
  const val = String(status)
  if (val === '10') return '待我审核'
  if (val === '20') return '待他人审核'
  if (val === '30') return '已通过'
  if (val === '40') return '已驳回'
  return '未知'
}

const getStatusType = (status) => {
  const val = String(status)
  if (val === '10') return 'warning'
  if (val === '30') return 'success'
  if (val === '40') return 'danger'
  return 'info'
}

const getRowAuditStatus = (row) => String(row?.auditStatus || row?.status || '').trim()

const canOperate = (row) => {
  const auditStatus = getRowAuditStatus(row)
  const auditUserId = Number(row?.auditUserId || 0)
  return auditStatus === '10' && auditUserId > 0 && auditUserId === Number(currentUserId.value || 0)
}

const getOperateHint = (row) => {
  if (getRowAuditStatus(row) === '10') return '待他人处理'
  return '已处理'
}

onMounted(() => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    try {
      const userInfo = JSON.parse(userInfoStr)
      currentUserLevel.value = String(userInfo.level)
      currentUserId.value = Number(userInfo.id || 0)

      // 🍎 核心修改：如果是车管(99)，不传 auditUserId，让他看到所有人的待办；
      // 其他领导，只传自己的 ID，看自己的待办。
      if (currentUserLevel.value !== '99') {
        queryParams.auditUserId = userInfo.id
      }
    } catch (e) {
      console.error('解析用户信息失败', e)
    }
  }

  fetchList()
})

const handleSearch = () => {
  currentPage.value = 1
  fetchList()
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await selectAuditList(queryParams)
    let rawData = res.data || []

    // 前端安全兜底过滤！强制只显示状态为“10（待审核）”的数据
    allData.value = rawData.filter((item) => String(item.auditStatus || item.status) === '10')

    total.value = allData.value.length
    updatePageData()
  } catch (error) {
    console.error('获取审批列表失败', error)
  } finally {
    loading.value = false
  }
}

const updatePageData = () => {
  const maxPage = Math.ceil(total.value / pageSize.value) || 1
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage
  }
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  tableList.value = allData.value.slice(start, end)
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  updatePageData()
}

const handlePass = (row) => {
  ElMessageBox.confirm(`确认同意该用车申请吗？`, '审批确认', {
    confirmButtonText: '同意通过',
    cancelButtonText: '取消',
    type: 'success',
    center: true,
  })
    .then(async () => {
      try {
        await updateAuditStatus({
          id: row.id,
          applicationId: row.applicationId,
          auditStatus: '30',
          auditSort: row.auditSort,
        })
        ElMessage.success('审批通过！系统正在流转...')

        setTimeout(() => {
          fetchList()
        }, 300)
      } catch (error) {
        console.error('审批失败', error)
      }
    })
    .catch(() => {})
}

const openRejectDialog = (row) => {
  currentAuditId.value = row.id
  currentApplicationId.value = row.applicationId
  currentAuditSort.value = row.auditSort
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

const submitReject = async () => {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  submitLoading.value = true
  try {
    await updateAuditStatus({
      id: currentAuditId.value,
      applicationId: currentApplicationId.value,
      auditStatus: '40',
      auditSort: currentAuditSort.value,
      rejectReason: rejectReason.value,
    })
    ElMessage.success('已驳回该申请')
    rejectDialogVisible.value = false

    setTimeout(() => {
      fetchList()
    }, 300)
  } catch (error) {
    console.error('驳回失败', error)
  } finally {
    submitLoading.value = false
  }
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
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 20px;
  flex-shrink: 0;
}
.search-box {
  display: flex;
  gap: 12px;
}
.mac-search-input {
  width: 280px;
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
:deep(.el-textarea__inner) {
  border-radius: 8px;
  background-color: #f5f5f7;
  box-shadow: none !important;
  border: 1px solid transparent;
  transition: all 0.2s;
}
:deep(.el-input__wrapper.is-focus),
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
