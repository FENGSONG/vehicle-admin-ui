<template>
  <div class="mac-page-container">
    <div class="page-header-container">
      <h1 class="mac-page-title">我的审批待办</h1>
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
          <template #default>
            <el-tag type="warning" size="small" effect="light">待我审核</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="审批操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="success" @click="handlePass(row)">
              <el-icon><Check /></el-icon> 同意
            </el-button>
            <el-button link type="danger" @click="openRejectDialog(row)">
              <el-icon><Close /></el-icon> 驳回
            </el-button>
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
import { Search, Check, Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// ⚠️ 你需要在 api/audit.js 中定义这两个接口请求
import { selectAuditList, updateAuditStatus } from '@/api/audit'

const loading = ref(false)
const tableList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(8)

// 查询参数，比如查状态为 "待我审核" 的数据（假设字典值是 10）
const queryParams = reactive({
  keyword: '',
  auditStatus: '10', // 替换为你后端 AuditStatusEnum.MY_PENDING 的真实数值
})

const rejectDialogVisible = ref(false)
const submitLoading = ref(false)
const currentAuditId = ref(null)
const currentApplicationId = ref(null)
const currentAuditSort = ref(null) // 🍎 新增：用于存储当前的层级排序
const rejectReason = ref('')

onMounted(() => {
  fetchList()
})

// 获取审批列表
const fetchList = async () => {
  loading.value = true
  try {
    const res = await selectAuditList(queryParams)
    tableList.value = res.data || []
    total.value = tableList.value.length // 如果后端分页了，这里要取 res.data.total
  } catch (error) {
    console.error('获取审批列表失败', error)
  } finally {
    loading.value = false
  }
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchList()
}

// ================= 核心操作：同意 =================
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
          auditStatus: '30', // 代表通过
          auditSort: row.auditSort, // 🍎 核心修复：把当前的审批层级传给后端
        })
        ElMessage.success('审批通过！系统正在流转...')
        fetchList() // 刷新列表，这条数据就会消失了
      } catch (error) {
        console.error('审批失败', error)
      }
    })
    .catch(() => {})
}

// ================= 核心操作：驳回 =================
const openRejectDialog = (row) => {
  currentAuditId.value = row.id
  currentApplicationId.value = row.applicationId
  currentAuditSort.value = row.auditSort // 🍎 新增：保存当前行的审批排序
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
      auditStatus: '40', // 代表驳回
      auditSort: currentAuditSort.value, // 🍎 核心修复：把当前的审批层级传给后端
      rejectReason: rejectReason.value,
    })
    ElMessage.success('已驳回该申请')
    rejectDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('驳回失败', error)
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped>
/* 这里复用你系统一贯的 Mac 风格 CSS */
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
  justify-content: flex-end; /* 审批页通常不需要新增按钮，搜索靠右 */
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
