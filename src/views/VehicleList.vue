<template>
  <div class="mac-page-container">
    <h1 class="mac-page-title">车辆档案管理</h1>
    <div class="mac-divider"></div>

    <div class="mac-header-actions">
      <el-button type="primary" class="mac-button-blue" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        <span>新增车辆</span>
      </el-button>
      
      <div class="mac-search-wrapper">
        <el-input
          v-model="queryParams.license"
          placeholder="搜索车牌号..."
          prefix-icon="Search"
          class="mac-search-bar"
          clearable
          @keyup.enter="getList"
          @clear="getList"
        />
        <el-button class="mac-button-gray" @click="getList">搜索</el-button>
      </div>
    </div>

    <div class="mac-table-card">
      <el-table :data="vehicleList" v-loading="loading" style="width: 100%" :row-style="{ height: '60px' }">
        <el-table-column prop="license" label="车牌号" width="150" />
        <el-table-column prop="brand" label="车辆品牌" width="120" />
        <el-table-column prop="model" label="车辆型号" width="150" />
        
        <el-table-column label="地理围栏状态" min-width="200">
          <template #default="{ row }">
            <div v-if="row.geofenceId" class="mac-fence-status bound">
              <el-icon><Location /></el-icon>
              <span>已绑定围栏 ID: {{ row.geofenceId }}</span>
              <el-button link type="danger" class="unbind-btn" @click="handleUnbind(row)">解绑</el-button>
            </div>
            <div v-else class="mac-fence-status unbound">
              <el-icon><LocationInformation /></el-icon>
              <span class="text-gray">未进入围栏</span>
              <el-button link type="primary" class="bind-btn" @click="openBindDialog(row)">去分配围栏</el-button>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right" align="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="480px" 
      class="mac-dialog"
      destroy-on-close
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px" label-position="left">
        <el-form-item label="车牌号" prop="license">
          <el-input v-model="formData.license" placeholder="请输入车牌号 (例: 京A22323)" />
        </el-form-item>
        <el-form-item label="品牌" prop="brand">
          <el-input v-model="formData.brand" placeholder="请输入车辆品牌 (例: 理想)" />
        </el-form-item>
        <el-form-item label="型号" prop="model">
          <el-input v-model="formData.model" placeholder="请输入车辆型号 (例: L9)" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button class="mac-button-gray" @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" class="mac-button-blue" @click="submitSave">确认保存</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog 
      v-model="bindVisible" 
      title="分配地理围栏" 
      width="400px" 
      class="mac-dialog"
    >
      <div class="bind-dialog-content">
        <p class="bind-tip">请为车牌号 <strong>{{ currentVehicleLicense }}</strong> 选择要绑定的地理围栏区域：</p>
        <el-select v-model="selectedFenceId" placeholder="请选择地理围栏" class="mac-select" style="width: 100%">
          <el-option label="杭州市西湖区总区" :value="1" />
          <el-option label="杭州市余杭区调度点" :value="2" />
          <el-option label="滨江研发中心测试区" :value="3" />
        </el-select>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button class="mac-button-gray" @click="bindVisible = false">取消</el-button>
          <el-button type="primary" class="mac-button-blue" :disabled="!selectedFenceId" @click="submitBind">确认绑定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Location, LocationInformation, Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { selectVehicle, saveVehicle, deleteVehicle, bindVehicle, unbindVehicle } from '@/api/vehicle'

const loading = ref(false)
const vehicleList = ref([])
//  修改 5：查询参数改为 license
const queryParams = reactive({ license: '' })

const dialogVisible = ref(false)
const dialogTitle = ref('新增车辆')
const formRef = ref(null)
//  修改 6：表单数据初始化改为 license
const formData = reactive({
  id: null,
  license: '',
  brand: '',
  model: ''
})
//  修改 7：校验规则改为 license
const rules = {
  license: [{ required: true, message: '车牌号不能为空', trigger: 'blur' }],
  brand: [{ required: true, message: '品牌不能为空', trigger: 'blur' }]
}

const bindVisible = ref(false)
const currentVehicleId = ref(null)
const currentVehicleLicense = ref('')
const selectedFenceId = ref(null)

const getList = async () => {
  loading.value = true
  try {
    const res = await selectVehicle(queryParams)
    vehicleList.value = res.data || [] 
  } catch (error) {
    console.error("请求出错了:", error) 
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  dialogTitle.value = '新增车辆'
  Object.assign(formData, { id: null, license: '', brand: '', model: '' })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑车辆'
  Object.assign(formData, row) 
  dialogVisible.value = true
}

const submitSave = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      await saveVehicle(formData)
      ElMessage.success('保存成功！')
      dialogVisible.value = false
      getList()
    }
  })
}

const handleDelete = (row) => {
  //  修改 8：弹窗提示改为 row.license
  ElMessageBox.confirm(`确定要永久删除车辆【${row.license}】吗？`, '危险操作', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'error',
    center: true
  }).then(async () => {
    await deleteVehicle(row.id)
    ElMessage.success('删除成功！')
    getList()
  }).catch(() => {})
}

const handleUnbind = (row) => {
  //  修改 9：弹窗提示改为 row.license
  ElMessageBox.confirm(`确定将车辆【${row.license}】移出当前围栏吗？`, '解绑确认', {
    confirmButtonText: '确定解绑',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await unbindVehicle(row.id)
    ElMessage.success('解绑成功！')
    getList()
  }).catch(() => {})
}

const openBindDialog = (row) => {
  currentVehicleId.value = row.id
  currentVehicleLicense.value = row.license
  selectedFenceId.value = null
  bindVisible.value = true
}

const submitBind = async () => {
  await bindVehicle(selectedFenceId.value, currentVehicleId.value)
  ElMessage.success('分配围栏成功！')
  bindVisible.value = false
  getList()
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
/* 样式部分保持不变，直接沿用上一版的完美居中方案 */
.mac-page-container {
  animation: fadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  padding-bottom: 40px;
}

.mac-page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 15px;
}

.mac-divider {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
}

.mac-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.mac-search-wrapper {
  display: flex;
  gap: 12px;
}

.mac-search-bar {
  width: 280px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  background-color: #f5f5f7;
  box-shadow: none !important;
  border: 1px solid transparent;
  transition: all 0.2s;
}
:deep(.el-input__wrapper.is-focus) {
  border-color: #007aff;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2) !important;
}

.mac-button-blue {
  background-color: #007aff !important;
  border-color: #007aff !important;
  border-radius: 8px !important;
  font-weight: 500 !important;
  height: 36px !important;
  padding: 0 16px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.2s;
}
.mac-button-blue:hover {
  background-color: #005bb5 !important;
  transform: scale(0.98);
}

:deep(.mac-button-blue > span) {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  line-height: 1 !important;
}

:deep(.mac-button-blue .el-icon) {
  margin-right: 0 !important; 
  font-size: 16px !important;
  vertical-align: middle !important;
}

.mac-button-gray {
  background-color: #e5e5ea;
  border-color: transparent;
  color: #1d1d1f;
  border-radius: 8px;
  font-weight: 500;
}
.mac-button-gray:hover {
  background-color: #d1d1d6;
}

.mac-table-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}
:deep(.el-table) {
  --el-table-border-color: transparent;
  --el-table-header-bg-color: transparent;
  --el-table-header-text-color: #86868b;
}
:deep(.el-table th.el-table__cell) {
  font-weight: 600;
  font-size: 13px;
}

.mac-fence-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
}
.mac-fence-status.bound {
  color: #34c759;
  background: rgba(52, 199, 89, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
  display: inline-flex;
}
.mac-fence-status.unbound {
  color: #86868b;
}
.unbind-btn { margin-left: auto; font-size: 12px; }
.bind-btn { margin-left: 8px; font-size: 12px; font-weight: 600; }

:deep(.mac-dialog) {
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,0.15) !important;
}
:deep(.mac-dialog .el-dialog__header) {
  background: #f5f5f7;
  margin-right: 0;
  padding: 15px 20px;
  border-bottom: 1px solid #e5e5ea;
}
:deep(.mac-dialog .el-dialog__title) {
  font-weight: 600;
  font-size: 16px;
}
.bind-tip {
  margin-bottom: 20px;
  font-size: 14px;
  color: #1d1d1f;
  line-height: 1.5;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>