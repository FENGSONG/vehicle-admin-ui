<template>
  <div class="mac-page-container">
    <h1 class="mac-page-title">组织管理</h1>
    <div class="mac-divider"></div>

    <div class="mac-table-card">
      <div class="table-header-actions">
        <el-button type="primary" class="mac-button-blue" @click="openAdd">
          <el-icon><Plus /></el-icon>新增组织
        </el-button>
        <div class="search-box">
          <el-input
            v-model="query.orgName"
            placeholder="搜索组织名称"
            clearable
            class="mac-search-input"
            @keyup.enter="loadList"
          />
          <el-button class="mac-button-gray" @click="loadList">搜索</el-button>
        </div>
      </div>

      <el-table :data="list" v-loading="loading" height="100%">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="orgName" label="组织名称" min-width="160" />
        <el-table-column label="组织类型" width="120" align="center">
          <template #default="{ row }">{{ getOrgTypeText(row.orgType) }}</template>
        </el-table-column>
        <el-table-column prop="orgLevel" label="层级" width="80" align="center" />
        <el-table-column prop="parentId" label="父级ID" width="100" align="center" />
        <el-table-column prop="leaderUsername" label="负责人" width="120" align="center" />
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '1' ? 'success' : 'info'" size="small">
              {{ row.status === '1' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right" align="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="640px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-row :gutter="14">
          <el-col :span="12">
            <el-form-item label="组织名称" prop="orgName">
              <el-input v-model="form.orgName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="组织类型" prop="orgType">
              <el-select v-model="form.orgType" style="width: 100%">
                <el-option label="总部" value="HQ" />
                <el-option label="子公司" value="COMPANY" />
                <el-option label="部门" value="DEPT" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="父级组织" prop="parentId">
              <el-select v-model="form.parentId" style="width: 100%" filterable>
                <el-option label="一级组织（无父级）" :value="0" />
                <el-option
                  v-for="item in parentOptions"
                  :key="item.id"
                  :label="`${item.orgName}（${getOrgTypeText(item.orgType)}）`"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人">
              <el-select v-model="form.leaderUserId" style="width: 100%" clearable filterable>
                <el-option
                  v-for="item in leaderOptions"
                  :key="item.id"
                  :label="`${item.username}（${item.phone || '--'}）`"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="form.sort" :min="1" :max="999" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio label="1">启用</el-radio>
                <el-radio label="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button class="mac-button-gray" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" class="mac-button-blue" :loading="submitting" @click="submit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { selectOrg, saveOrg, deleteOrg } from '@/api/org'
import { selectUser } from '@/api/user'

const loading = ref(false)
const list = ref([])
const parentOptions = ref([])
const leaderOptions = ref([])

const query = reactive({
  orgName: '',
})

const dialogVisible = ref(false)
const dialogTitle = ref('新增组织')
const submitting = ref(false)
const formRef = ref(null)
const form = reactive({
  id: null,
  orgName: '',
  orgType: 'HQ',
  parentId: 0,
  leaderUserId: null,
  sort: 10,
  status: '1',
})

const rules = {
  orgName: [{ required: true, message: '组织名称不能为空', trigger: 'blur' }],
  orgType: [{ required: true, message: '组织类型不能为空', trigger: 'change' }],
  parentId: [{ required: true, message: '父级组织不能为空', trigger: 'change' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
}

const getOrgTypeText = (type) => {
  if (type === 'HQ') return '总部'
  if (type === 'COMPANY') return '子公司'
  if (type === 'DEPT') return '部门'
  return type || '--'
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await selectOrg(query)
    list.value = res?.data || []
    parentOptions.value = list.value
  } finally {
    loading.value = false
  }
}

const loadLeaders = async () => {
  const res = await selectUser({ status: '1' })
  leaderOptions.value = res?.data || []
}

const resetForm = () => {
  Object.assign(form, {
    id: null,
    orgName: '',
    orgType: 'HQ',
    parentId: 0,
    leaderUserId: null,
    sort: 10,
    status: '1',
  })
}

const openAdd = () => {
  dialogTitle.value = '新增组织'
  resetForm()
  dialogVisible.value = true
  if (formRef.value) formRef.value.clearValidate()
}

const openEdit = (row) => {
  dialogTitle.value = '编辑组织'
  Object.assign(form, {
    id: row.id,
    orgName: row.orgName,
    orgType: row.orgType,
    parentId: row.parentId ?? 0,
    leaderUserId: row.leaderUserId,
    sort: Number(row.sort || 10),
    status: String(row.status || '1'),
  })
  dialogVisible.value = true
  if (formRef.value) formRef.value.clearValidate()
}

const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await saveOrg({ ...form })
      ElMessage.success(form.id ? '组织更新成功' : '组织新增成功')
      dialogVisible.value = false
      await loadList()
    } finally {
      submitting.value = false
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除组织【${row.orgName}】吗？`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
    center: true,
  })
    .then(async () => {
      await deleteOrg(row.id)
      ElMessage.success('组织删除成功')
      await loadList()
    })
    .catch(() => {})
}

onMounted(async () => {
  await Promise.all([loadList(), loadLeaders()])
})
</script>

<style scoped>
.mac-page-container {
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
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
  margin: 15px 0 12px;
}

.mac-table-card {
  flex: 1;
  min-height: 0;
  background: #fff;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.table-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mac-search-input {
  width: 260px;
}

.mac-button-blue {
  background-color: #007aff !important;
  border-color: #007aff !important;
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
}
</style>
