<template>
  <div class="mac-table-card">
    <div class="table-header-actions">
      <h2 class="sidebar-title" style="margin-bottom: 0">数据列表</h2>
      <div class="search-box">
        <el-input
          v-model="queryParams.name"
          placeholder="搜索围栏名称..."
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
      <el-table-column prop="id" label="ID" width="70" align="center" />
      <el-table-column prop="name" label="围栏名称" width="200" show-overflow-tooltip />

      <el-table-column label="围栏形状与范围" min-width="200">
        <template #default="{ row }">
          <div style="display: flex; align-items: center; gap: 8px">
            <el-tag :type="getShapeInfo(row.position).type" effect="light" round size="small">
              {{ getShapeInfo(row.position).name }}
            </el-tag>
            <span style="font-size: 13px; color: #1d1d1f; font-weight: 500">
              {{ getShapeInfo(row.position).range }}
            </span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="启用状态" width="120">
        <template #default="{ row }">
          <el-switch
            v-model="row.status"
            :active-value="1"
            :inactive-value="0"
            style="--el-switch-on-color: #34c759"
            @change="handleStatusChange(row)"
          />
        </template>
      </el-table-column>

      <el-table-column prop="createTime" label="创建时间" width="180">
        <template #default="{ row }">
          <span style="color: #86868b; font-size: 13px">{{ row.createTime || '--' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="140" fixed="right" align="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="editDialogVisible" title="编辑地理围栏" width="400px" destroy-on-close>
      <div style="margin-bottom: 20px; font-size: 13px; color: #86868b">
        注意：此处仅支持修改围栏名称。若需修改范围，请删除后重新绘制。
      </div>
      <el-form :model="editForm" label-position="top">
        <el-form-item label="围栏名称">
          <el-input v-model="editForm.name" placeholder="请输入新的围栏名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" class="mac-button-blue" @click="submitEdit">保存修改</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getGeofenceList, deleteGeofence, updateGeofenceStatus, saveGeofence } from '@/api/geofence'

const loading = ref(false)
const allData = ref([])
const tableList = ref([])
const queryParams = reactive({ name: '' })

const currentPage = ref(1)
const pageSize = ref(8)
const total = ref(0)

const editDialogVisible = ref(false)
const editForm = reactive({ id: null, name: '' })

onMounted(() => {
  fetchList()
})

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getGeofenceList(queryParams)
    allData.value = (res.data || []).map((row) => {
      row.status = Number(row.status)
      return row
    })
    total.value = allData.value.length
    currentPage.value = 1
    updatePageData()
  } catch (error) {
    console.error('获取围栏列表失败', error)
  } finally {
    loading.value = false
  }
}

// 暴露 fetchList 方法给父组件，以便绘制成功后可以自动刷新列表
defineExpose({ fetchList })

const updatePageData = () => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  tableList.value = allData.value.slice(start, end)
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  updatePageData()
}

const getShapeInfo = (posStr) => {
  if (!posStr) return { name: '未知', type: 'info', range: '--' }
  try {
    const data = JSON.parse(posStr)
    if (data.type === 'circle') {
      const radiusKm = (parseFloat(data.radius) / 1000).toFixed(2)
      return { name: '圆形', type: 'success', range: `覆盖半径 ${radiusKm} 公里` }
    } else if (data.type === 'rectangle') {
      return { name: '方形', type: 'primary', range: `矩形覆盖区域` }
    }
  } catch (e) {
    return { name: '解析异常', type: 'danger', range: '--' }
  }
}

const handleStatusChange = async (row) => {
  try {
    await updateGeofenceStatus(row.id, row.status)
    ElMessage.success(`围栏【${row.name}】状态已更新！`)
    const itemInAllData = allData.value.find((item) => item.id === row.id)
    if (itemInAllData) itemInAllData.status = row.status
  } catch (error) {
    row.status = row.status === 1 ? 0 : 1
  }
}

const openEditDialog = (row) => {
  editForm.id = row.id
  editForm.name = row.name
  editDialogVisible.value = true
}

const submitEdit = async () => {
  if (!editForm.name) {
    ElMessage.warning('名称不能为空！')
    return
  }
  try {
    const originalRow = allData.value.find((item) => item.id === editForm.id)
    const payload = {
      id: editForm.id,
      name: editForm.name,
      status: originalRow.status,
      position: originalRow.position,
    }
    await saveGeofence(payload)
    ElMessage.success('修改成功！')
    editDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('修改失败:', error)
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要永久删除围栏【${row.name}】吗？`, '危险操作', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'error',
    center: true,
  })
    .then(async () => {
      await deleteGeofence(row.id)
      ElMessage.success('删除成功！')
      if (tableList.value.length === 1 && currentPage.value > 1) {
        currentPage.value -= 1
      }
      fetchList()
    })
    .catch(() => {})
}
</script>

<style scoped>
.mac-table-card {
  /* 自动占满 Tabs 里的高度，没有多余的 margin */
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
  flex-shrink: 0;
}
.sidebar-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
}
.search-box {
  display: flex;
  gap: 12px;
}
.mac-search-input {
  width: 280px;
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

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  background-color: #f5f5f7;
  box-shadow: none !important;
  border: 1px solid transparent;
  transition: all 0.2s;
}
:deep(.el-input__wrapper.is-focus) {
  background-color: #ffffff;
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2) !important;
}

.mac-button-blue {
  background-color: #007aff !important;
  border: none !important;
  border-radius: 8px !important;
}
.mac-button-gray {
  background-color: #e5e5ea;
  border-color: transparent;
  color: #1d1d1f;
  border-radius: 8px;
}
</style>
