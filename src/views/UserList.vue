<template>
  <div class="mac-page-container">
    <div class="page-header-container">
      <h1 class="mac-page-title">用户管理大盘</h1>
    </div>

    <div class="mac-divider"></div>

    <div class="mac-table-card">
      <div class="table-header-actions">
        <div class="header-left">
          <el-button type="primary" class="mac-button-blue" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增用户
          </el-button>
        </div>

        <div class="search-box">
          <el-input
            v-model="queryParams.username"
            placeholder="搜索用户名..."
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
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="phone" label="联系电话" min-width="130" />
        <el-table-column prop="email" label="邮箱" min-width="160" show-overflow-tooltip />

        <el-table-column label="职级" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelTagType(row.level)" size="small" effect="light">
              {{ getLevelText(row.level) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="性别" width="80">
          <template #default="{ row }">
            <el-tag :type="row.gender == '1' ? '' : 'danger'" size="small">
              {{ row.gender == '1' ? '男' : row.gender == '0' ? '女' : '未知' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="账号状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="1"
              inactive-value="0"
              style="--el-switch-on-color: #34c759"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right" align="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="warning" @click="handleResetPwd(row)">重置密码</el-button>
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
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增用户' : '编辑用户'"
      width="650px"
      destroy-on-close
    >
      <el-form :model="userForm" label-position="top" :rules="rules" ref="formRef">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="用户名 (username)" prop="username">
              <el-input v-model="userForm.username" placeholder="请输入系统登录名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号 (phone)" prop="phone">
              <el-input v-model="userForm.phone" placeholder="请输入11位手机号" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="邮箱 (email)" prop="email">
              <el-input v-model="userForm.email" placeholder="请输入邮箱地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年龄 (age)" prop="age">
              <el-input-number
                v-model="userForm.age"
                :min="0"
                :max="200"
                placeholder="年龄"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="职级 (level)" prop="level">
              <el-select v-model="userForm.level" placeholder="请选择职级" style="width: 100%">
                <el-option label="实习生" value="0" />
                <el-option label="普通员工" value="1" />
                <el-option label="主管" value="2" />
                <el-option label="经理" value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="直属领导 (parentId)" prop="parentId">
              <el-select
                v-model="userForm.parentId"
                placeholder="请选择直属领导"
                style="width: 100%"
              >
                <el-option label="无直属领导" :value="0" />
                <el-option
                  v-for="user in leaderOptions"
                  :key="user.id"
                  :label="user.username"
                  :value="user.id"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="性别 (gender)" prop="gender">
              <el-radio-group v-model="userForm.gender">
                <el-radio label="1">男</el-radio>
                <el-radio label="0">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态 (status)" prop="status">
              <el-radio-group v-model="userForm.status">
                <el-radio label="1">启用</el-radio>
                <el-radio label="0">停用</el-radio>
              </el-radio-group>
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
          >
            确认保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { selectUser, saveUser, deleteUser, updateStatus, resetPassword } from '@/api/user'

const loading = ref(false)
const allData = ref([])
const tableList = ref([])

const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const queryParams = reactive({
  username: '',
})

const dialogVisible = ref(false)
const dialogType = ref('add')
const submitLoading = ref(false)
const formRef = ref(null)

const leaderOptions = ref([])

const userForm = reactive({
  id: null,
  username: '',
  phone: '',
  email: '',
  age: null,
  level: '',
  parentId: null,
  gender: '1',
  status: '1',
})

const rules = {
  username: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
  phone: [
    { required: true, message: '手机号不能为空', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '邮箱不能为空', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  age: [
    { required: true, message: '年龄不能为空', trigger: 'blur' },
    { type: 'number', min: 0, max: 200, message: '年龄范围0-200', trigger: 'blur' },
  ],
  level: [{ required: true, message: '职级不能为空', trigger: 'change' }],
  parentId: [{ required: true, message: '直属领导不能为空', trigger: 'change' }],
  gender: [{ required: true, message: '性别不能为空', trigger: 'change' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
}

// 🍎 职级字典映射方法 (增强了健壮性，无论后端返回数字还是字符串都能匹配)
const getLevelText = (level) => {
  if (level === null || level === undefined) return '未知'

  // 强制转换为字符串进行比对
  const val = String(level).trim()
  const map = {
    10: '实习生',
    20: '普通员工',
    30: '主管',
    40: '经理',
  }
  // 如果字典里有，就显示字典对应的汉字；如果没有，则原样显示数字
  return map[val] || val
}

// 🍎 职级标签颜色映射
const getLevelTagType = (level) => {
  if (level === null || level === undefined) return ''
  const val = String(level).trim()
  const map = {
    10: 'info', // 灰色
    20: '', // 默认蓝色
    30: 'warning', // 橙色
    40: 'success', // 绿色
  }
  return map[val] || ''
}

onMounted(() => {
  fetchList()
  loadLeaders()
})

const fetchList = async () => {
  loading.value = true
  try {
    const res = await selectUser(queryParams)
    const dataList = res.data || []

    allData.value = dataList.map((item) => {
      item.status = item.status ? item.status.toString() : '1'
      item.gender = item.gender ? item.gender.toString() : '1'
      // 保证 level 回显时是字符串类型
      item.level = item.level !== null ? item.level.toString() : ''
      return item
    })

    total.value = allData.value.length
    currentPage.value = 1
    updatePageData()
  } catch (error) {
    console.error('获取用户列表失败', error)
  } finally {
    loading.value = false
  }
}

const updatePageData = () => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  tableList.value = allData.value.slice(start, end)
}

const loadLeaders = async () => {
  try {
    const res = await selectUser({})
    leaderOptions.value = res.data || []
  } catch (error) {
    console.warn('获取领导列表失败')
  }
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  updatePageData()
}

const handleStatusChange = async (row) => {
  try {
    await updateStatus(row.id, row.status)
    ElMessage.success(`用户【${row.username}】状态已更新！`)
    const itemInAllData = allData.value.find((item) => item.id === row.id)
    if (itemInAllData) itemInAllData.status = row.status
  } catch (error) {
    row.status = row.status === '1' ? '0' : '1'
  }
}

const handleAdd = () => {
  dialogType.value = 'add'
  Object.assign(userForm, {
    id: null,
    username: '',
    phone: '',
    email: '',
    age: null,
    level: '',
    parentId: null,
    gender: '1',
    status: '1',
  })
  dialogVisible.value = true
  if (formRef.value) formRef.value.clearValidate()
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  Object.assign(userForm, {
    id: row.id,
    username: row.username,
    phone: row.phone,
    email: row.email,
    age: row.age,
    level: row.level,
    parentId: row.parentId,
    gender: row.gender,
    status: row.status,
  })
  dialogVisible.value = true
}

const submitForm = () => {
  if (!formRef.value) return
  formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        await saveUser(userForm)
        ElMessage.success(dialogType.value === 'add' ? '新增成功！' : '修改成功！')
        dialogVisible.value = false
        fetchList()
        loadLeaders()
      } catch (error) {
        console.error('保存失败:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleResetPwd = (row) => {
  ElMessageBox.confirm(`确定要将用户【${row.username}】的密码重置为默认吗？`, '安全警告', {
    confirmButtonText: '确定重置',
    cancelButtonText: '取消',
    type: 'warning',
    center: true,
  })
    .then(async () => {
      await resetPassword(row.id)
      ElMessage.success('密码重置成功！')
    })
    .catch(() => {})
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要永久删除用户【${row.username}】吗？`, '危险操作', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'error',
    center: true,
  })
    .then(async () => {
      await deleteUser(row.id)
      ElMessage.success('删除成功！')

      if (tableList.value.length === 1 && currentPage.value > 1) {
        currentPage.value -= 1
      }
      fetchList()
      loadLeaders()
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
:deep(.el-select__wrapper) {
  border-radius: 8px;
  background-color: #f5f5f7;
  box-shadow: none !important;
  border: 1px solid transparent;
  transition: all 0.2s;
}
:deep(.el-input__wrapper.is-focus),
:deep(.el-select__wrapper.is-focused) {
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
