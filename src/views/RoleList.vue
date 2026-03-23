<template>
  <div class="mac-page-container">
    <h1 class="mac-page-title">角色权限</h1>
    <div class="mac-divider"></div>

    <div class="mac-table-card">
      <div class="table-header-actions">
        <el-button type="primary" class="mac-button-blue" @click="openAdd">
          <el-icon><Plus /></el-icon>新增角色
        </el-button>
        <div class="search-box">
          <el-input
            v-model="query.roleName"
            placeholder="搜索角色名称"
            clearable
            class="mac-search-input"
            @keyup.enter="loadList"
          />
          <el-button class="mac-button-gray" @click="loadList">搜索</el-button>
        </div>
      </div>

      <el-table :data="list" v-loading="loading" height="100%">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="roleCode" label="角色编码" min-width="130" />
        <el-table-column prop="roleName" label="角色名称" min-width="130" />
        <el-table-column prop="dataScope" label="数据权限" width="120" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '1' ? 'success' : 'info'" size="small">
              {{ row.status === '1' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="menuPerms" label="功能权限" min-width="260" show-overflow-tooltip />
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="140" fixed="right" align="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-row :gutter="14">
          <el-col :span="12">
            <el-form-item label="角色编码" prop="roleCode">
              <el-input v-model="form.roleCode" placeholder="例如：ROLE_DISPATCHER" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色名称" prop="roleName">
              <el-input v-model="form.roleName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数据权限" prop="dataScope">
              <el-select v-model="form.dataScope" style="width: 100%">
                <el-option label="全量（ALL）" value="ALL" />
                <el-option label="企业（ENTERPRISE）" value="ENTERPRISE" />
                <el-option label="子公司（COMPANY）" value="COMPANY" />
                <el-option label="部门（DEPT）" value="DEPT" />
                <el-option label="本人（SELF）" value="SELF" />
              </el-select>
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
          <el-col :span="24">
            <el-form-item label="功能权限（逗号分隔）">
              <el-input
                v-model="form.menuPerms"
                type="textarea"
                :rows="3"
                placeholder="例如：dashboard:view,user:manage,org:manage"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" />
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
import { selectRole, saveRole, deleteRole } from '@/api/role'

const loading = ref(false)
const list = ref([])
const query = reactive({
  roleName: '',
})

const dialogVisible = ref(false)
const dialogTitle = ref('新增角色')
const submitting = ref(false)
const formRef = ref(null)
const form = reactive({
  id: null,
  roleCode: '',
  roleName: '',
  menuPerms: '',
  dataScope: 'SELF',
  status: '1',
  remark: '',
})

const rules = {
  roleCode: [{ required: true, message: '角色编码不能为空', trigger: 'blur' }],
  roleName: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
  dataScope: [{ required: true, message: '数据权限不能为空', trigger: 'change' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await selectRole(query)
    list.value = res?.data || []
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  Object.assign(form, {
    id: null,
    roleCode: '',
    roleName: '',
    menuPerms: '',
    dataScope: 'SELF',
    status: '1',
    remark: '',
  })
}

const openAdd = () => {
  dialogTitle.value = '新增角色'
  resetForm()
  dialogVisible.value = true
  if (formRef.value) formRef.value.clearValidate()
}

const openEdit = (row) => {
  dialogTitle.value = '编辑角色'
  Object.assign(form, {
    id: row.id,
    roleCode: row.roleCode,
    roleName: row.roleName,
    menuPerms: row.menuPerms || '',
    dataScope: row.dataScope || 'SELF',
    status: String(row.status || '1'),
    remark: row.remark || '',
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
      await saveRole({ ...form })
      ElMessage.success(form.id ? '角色更新成功' : '角色新增成功')
      dialogVisible.value = false
      await loadList()
    } finally {
      submitting.value = false
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除角色【${row.roleName}】吗？`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
    center: true,
  })
    .then(async () => {
      await deleteRole(row.id)
      ElMessage.success('角色删除成功')
      await loadList()
    })
    .catch(() => {})
}

onMounted(async () => {
  await loadList()
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
