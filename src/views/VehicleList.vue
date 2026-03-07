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
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-button class="mac-button-gray" @click="handleSearch">搜索</el-button>
      </div>
    </div>

    <div class="mac-table-card">
      <el-table
        :data="vehicleList"
        v-loading="loading"
        style="width: 100%; flex: 1"
        height="100%"
        :row-style="{ height: '60px' }"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="license" label="车牌号" min-width="120" />
        <el-table-column prop="brand" label="车辆品牌" min-width="100" />
        <el-table-column prop="model" label="车辆型号" min-width="120" />
        <el-table-column prop="color" label="颜色" min-width="80" align="center" />

        <el-table-column label="当前状态" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '1' ? 'success' : 'danger'" size="small" effect="light">
              {{ row.status === '1' ? '空闲中' : '使用中' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="地理围栏状态" min-width="240">
          <template #default="{ row }">
            <div v-if="row.geofenceId" class="mac-fence-status bound">
              <el-icon><Location /></el-icon>
              <span>已绑定围栏 ID: {{ row.geofenceId }}</span>
              <el-button link type="danger" class="unbind-btn" @click="handleUnbind(row)"
                >解绑</el-button
              >
            </div>
            <div v-else class="mac-fence-status unbound">
              <el-icon><LocationInformation /></el-icon>
              <span class="text-gray">未进入围栏</span>
              <el-button link type="primary" class="bind-btn" @click="openBindDialog(row)"
                >去分配围栏</el-button
              >
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
      :title="dialogTitle"
      width="720px"
      class="mac-dialog"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-position="top"
        class="custom-form"
      >
        <el-row :gutter="40">
          <el-col :span="12">
            <el-form-item label="车牌号码" prop="license">
              <el-input v-model="formData.license" placeholder="例: 吉B·12345" />
            </el-form-item>
            <el-form-item label="车辆品牌" prop="brand">
              <el-input v-model="formData.brand" placeholder="例: 丰田 / 比亚迪" />
            </el-form-item>
            <el-form-item label="车辆型号" prop="model">
              <el-input v-model="formData.model" placeholder="例: 凯美瑞 / 汉DM-i" />
            </el-form-item>
            <el-form-item label="车架号 (VIN)" prop="code">
              <el-input v-model="formData.code" placeholder="请输入17位车辆识别代码" />
            </el-form-item>
            <el-form-item label="车辆颜色" prop="color">
              <el-input v-model="formData.color" placeholder="例: 珍珠白 / 幻彩黑" />
            </el-form-item>
            <el-form-item label="当前里程数 (km)" prop="kilometers">
              <el-input v-model="formData.kilometers" placeholder="请输入行驶里程" type="number" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="车辆类型" prop="type">
              <el-select v-model="formData.type" placeholder="请选择车辆类型" style="width: 100%">
                <el-option label="轿车" value="10" />
                <el-option label="SUV" value="20" />
                <el-option label="商务MPV" value="30" />
                <el-option label="客车" value="40" />
              </el-select>
            </el-form-item>
            <el-form-item label="电池/动力类型" prop="batteryType">
              <el-select
                v-model="formData.batteryType"
                placeholder="请选择动力类型"
                style="width: 100%"
              >
                <el-option label="燃油车" value="10" />
                <el-option label="纯电动 (三元锂)" value="20" />
                <el-option label="纯电动 (磷酸铁锂)" value="30" />
                <el-option label="插电混动" value="40" />
              </el-select>
            </el-form-item>
            <el-form-item label="排量/功率" prop="displacement">
              <el-input v-model="formData.displacement" placeholder="例: 2.0L / 150kW" />
            </el-form-item>
            <el-form-item label="购买价格 (元)" prop="price">
              <el-input v-model="formData.price" placeholder="请输入购买金额" type="number" />
            </el-form-item>
            <el-form-item label="购买时间" prop="buyTime">
              <el-date-picker
                v-model="formData.buyTime"
                type="date"
                placeholder="选择购买日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="上牌时间" prop="regTime">
              <el-date-picker
                v-model="formData.regTime"
                type="date"
                placeholder="选择上牌日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button class="mac-button-gray" @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" class="mac-button-blue" @click="submitSave">确认保存</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="bindVisible" title="分配地理围栏" width="400px" class="mac-dialog">
      <div class="bind-dialog-content">
        <p class="bind-tip">
          请为车牌号 <strong>{{ currentVehicleLicense }}</strong> 选择要绑定的地理围栏区域：
        </p>
        <el-select
          v-model="selectedFenceId"
          placeholder="请选择地理围栏"
          class="mac-select"
          style="width: 100%"
        >
          <el-option label="杭州市西湖区总区" :value="1" />
          <el-option label="杭州市余杭区调度点" :value="2" />
          <el-option label="滨江研发中心测试区" :value="3" />
        </el-select>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button class="mac-button-gray" @click="bindVisible = false">取消</el-button>
          <el-button
            type="primary"
            class="mac-button-blue"
            :disabled="!selectedFenceId"
            @click="submitBind"
            >确认绑定</el-button
          >
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Location, LocationInformation, Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  selectVehicle,
  saveVehicle,
  deleteVehicle,
  bindVehicle,
  unbindVehicle,
} from '@/api/vehicle'

const loading = ref(false)
const allVehicleData = ref([])
const vehicleList = ref([])

const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(8)

const queryParams = reactive({ license: '' })

const dialogVisible = ref(false)
const dialogTitle = ref('新增车辆')
const formRef = ref(null)

const formData = reactive({
  id: null,
  license: '',
  brand: '',
  model: '',
  code: '',
  color: '',
  kilometers: '',
  type: '',
  batteryType: '',
  displacement: '',
  price: '',
  buyTime: '',
  regTime: '',
  status: '1',
})

const rules = {
  license: [{ required: true, message: '车牌号不能为空', trigger: 'blur' }],
  brand: [{ required: true, message: '车辆品牌不能为空', trigger: 'blur' }],
  model: [{ required: true, message: '车辆型号不能为空', trigger: 'blur' }],
  code: [{ required: true, message: '车辆识别码(VIN)不能为空', trigger: 'blur' }],
  color: [{ required: true, message: '车辆颜色不能为空', trigger: 'blur' }],
  kilometers: [{ required: true, message: '车辆里程数不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '请选择车辆类型', trigger: 'change' }],
  batteryType: [{ required: true, message: '请选择动力类型', trigger: 'change' }],
  displacement: [{ required: true, message: '车辆排量不能为空', trigger: 'blur' }],
  price: [{ required: true, message: '购买价格不能为空', trigger: 'blur' }],
  buyTime: [{ required: true, message: '请选择购买时间', trigger: 'change' }],
  regTime: [{ required: true, message: '请选择上牌时间', trigger: 'change' }],
}

const bindVisible = ref(false)
const currentVehicleId = ref(null)
const currentVehicleLicense = ref('')
const selectedFenceId = ref(null)

const handleSearch = () => {
  currentPage.value = 1
  getList()
}

const getList = async () => {
  loading.value = true
  try {
    const res = await selectVehicle(queryParams)
    allVehicleData.value = res.data || []
    total.value = allVehicleData.value.length
    updatePageData()
  } catch (error) {
    console.error('请求出错了:', error)
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
  vehicleList.value = allVehicleData.value.slice(start, end)
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  updatePageData()
}

const handleAdd = () => {
  dialogTitle.value = '新增车辆'
  Object.assign(formData, {
    id: null,
    license: '',
    brand: '',
    model: '',
    code: '',
    color: '',
    kilometers: '',
    type: '',
    batteryType: '',
    displacement: '',
    price: '',
    buyTime: '',
    regTime: '',
    status: '1',
  })
  dialogVisible.value = true
  if (formRef.value) formRef.value.clearValidate()
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑车辆档案'
  Object.assign(formData, row)
  dialogVisible.value = true
  if (formRef.value) formRef.value.clearValidate()
}

const submitSave = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      await saveVehicle(formData)
      ElMessage.success(formData.id ? '修改档案成功！' : '新增车辆成功！')
      dialogVisible.value = false
      getList()
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要永久注销车辆【${row.license}】的档案吗？`, '危险操作', {
    confirmButtonText: '强制注销',
    cancelButtonText: '取消',
    type: 'error',
    center: true,
  })
    .then(async () => {
      await deleteVehicle(row.id)
      ElMessage.success('注销成功！')
      getList()
    })
    .catch(() => {})
}

const handleUnbind = (row) => {
  ElMessageBox.confirm(`确定将车辆【${row.license}】移出当前围栏吗？`, '解绑确认', {
    confirmButtonText: '确定解绑',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await unbindVehicle(row.id)
      ElMessage.success('解绑成功！')
      getList()
    })
    .catch(() => {})
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
/* 🍎 核心修改点：加入高度锁死属性，彻底消灭外层滚动条 */
.mac-page-container {
  height: calc(100vh - 100px) !important;
  display: flex;
  flex-direction: column;
  overflow: hidden !important;
  box-sizing: border-box;
  animation: fadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.mac-page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 15px;
  flex-shrink: 0;
}
.mac-divider {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
  flex-shrink: 0;
}
.mac-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-shrink: 0;
}
.mac-search-wrapper {
  display: flex;
  gap: 12px;
}
.mac-search-bar {
  width: 280px;
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
  border-color: #007aff;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2) !important;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #1d1d1f;
  padding-bottom: 4px !important;
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
  color: white;
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

/* 🍎 核心修改点：加入 box-sizing，完美限制高度 */
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

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
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
.unbind-btn {
  margin-left: auto;
  font-size: 12px;
}
.bind-btn {
  margin-left: 8px;
  font-size: 12px;
  font-weight: 600;
}

.custom-form {
  padding: 10px 10px 0;
}
:deep(.mac-dialog) {
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15) !important;
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
