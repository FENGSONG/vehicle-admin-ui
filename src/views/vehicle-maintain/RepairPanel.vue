<template>
  <div class="panel-root">
    <div class="header-actions">
      <el-button type="primary" class="mac-button-blue" @click="openAdd">
        <el-icon><Plus /></el-icon>
        新增维修
      </el-button>
      <div class="search-group">
        <el-input
          v-model="query.repairItem"
          placeholder="维修项目"
          clearable
          class="search-input"
          @keyup.enter="loadList"
        />
        <el-select v-model="query.vehicleId" placeholder="车辆" clearable filterable class="search-select">
          <el-option v-for="item in vehicleOptions" :key="`r-v-${item.id}`" :label="item.label" :value="item.id" />
        </el-select>
        <el-button class="mac-button-gray" @click="loadList">搜索</el-button>
      </div>
    </div>

    <el-table :data="list" v-loading="loading" height="100%">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="repairItem" label="维修项目" min-width="140" />
      <el-table-column label="维修车辆" min-width="160">
        <template #default="{ row }">{{ getVehicleText(row.vehicleId) }}</template>
      </el-table-column>
      <el-table-column prop="repairPerson" label="维修人员" min-width="100" />
      <el-table-column prop="location" label="维修地点" min-width="140" />
      <el-table-column prop="repairTime" label="维修时间" min-width="160" align="center" />
      <el-table-column prop="fee" label="费用(元)" min-width="95" align="center" />
      <el-table-column prop="sender" label="送修人员" min-width="100" />
      <el-table-column label="操作" width="130" fixed="right" align="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="760px" class="mac-dialog" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-row :gutter="14">
          <el-col :span="12">
            <el-form-item label="维修项目" prop="repairItem"><el-input v-model="form.repairItem" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="维修车辆" prop="vehicleId">
              <el-select v-model="form.vehicleId" filterable style="width: 100%">
                <el-option
                  v-for="item in vehicleOptions"
                  :key="`rp-v-${item.id}`"
                  :label="item.label"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="维修人员" prop="repairPerson"><el-input v-model="form.repairPerson" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="维修地点" prop="location"><el-input v-model="form.location" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="维修时间" prop="repairTime">
              <el-date-picker
                v-model="form.repairTime"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="维修费用(元)" prop="fee">
              <el-input-number v-model="form.fee" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="维修情况"><el-input v-model="form.conditionDesc" type="textarea" :rows="2" /></el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="维修材料"><el-input v-model="form.materialDesc" type="textarea" :rows="2" /></el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="送修人员"><el-input v-model="form.sender" /></el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button class="mac-button-gray" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" class="mac-button-blue" :loading="submitting" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { selectVehicle } from '@/api/vehicle'
import { selectVehicleRepair, saveVehicleRepair, deleteVehicleRepair } from '@/api/vehicleRepair'

const query = reactive({ repairItem: '', vehicleId: null })
const list = ref([])
const loading = ref(false)

const dialogVisible = ref(false)
const dialogTitle = ref('新增维修')
const submitting = ref(false)
const formRef = ref(null)
const form = reactive({
  id: null,
  repairItem: '',
  vehicleId: null,
  repairPerson: '',
  location: '',
  repairTime: '',
  fee: 0,
  conditionDesc: '',
  materialDesc: '',
  sender: '',
  remark: '',
})

const rules = {
  repairItem: [{ required: true, message: '维修项目不能为空', trigger: 'blur' }],
  vehicleId: [{ required: true, message: '请选择维修车辆', trigger: 'change' }],
  repairPerson: [{ required: true, message: '维修人员不能为空', trigger: 'blur' }],
  location: [{ required: true, message: '维修地点不能为空', trigger: 'blur' }],
  repairTime: [{ required: true, message: '维修时间不能为空', trigger: 'change' }],
  fee: [{ required: true, message: '维修费用不能为空', trigger: 'change' }],
}

const vehicleOptions = ref([])

const vehicleMap = computed(() => {
  const map = {}
  ;(vehicleOptions.value || []).forEach((item) => {
    map[String(item.id)] = item
  })
  return map
})

const getVehicleText = (vehicleId) => {
  const item = vehicleMap.value[String(vehicleId)]
  if (!item) return `车辆ID:${vehicleId || '--'}`
  return `${item.license}（${item.brand || '--'}）`
}

const loadVehicleOptions = async () => {
  const res = await selectVehicle({})
  vehicleOptions.value = (res?.data || []).map((item) => ({
    id: item.id,
    license: item.license || `车辆-${item.id}`,
    brand: item.brand || '',
    label: `${item.license || `车辆-${item.id}`}（ID:${item.id}）`,
  }))
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await selectVehicleRepair(query)
    list.value = res?.data || []
  } finally {
    loading.value = false
  }
}

const openAdd = () => {
  dialogTitle.value = '新增维修'
  Object.assign(form, {
    id: null,
    repairItem: '',
    vehicleId: null,
    repairPerson: '',
    location: '',
    repairTime: '',
    fee: 0,
    conditionDesc: '',
    materialDesc: '',
    sender: '',
    remark: '',
  })
  dialogVisible.value = true
  if (formRef.value) formRef.value.clearValidate()
}

const openEdit = (row) => {
  dialogTitle.value = '编辑维修'
  Object.assign(form, { ...row, fee: Number(row?.fee || 0) })
  dialogVisible.value = true
  if (formRef.value) formRef.value.clearValidate()
}

const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await saveVehicleRepair({ ...form })
      ElMessage.success(form.id ? '维修更新成功' : '维修新增成功')
      dialogVisible.value = false
      await loadList()
    } finally {
      submitting.value = false
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除维修记录【${row.repairItem}】吗？`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
    center: true,
  })
    .then(async () => {
      await deleteVehicleRepair(row.id)
      ElMessage.success('维修记录已删除')
      await loadList()
    })
    .catch(() => {})
}

onMounted(async () => {
  await loadVehicleOptions()
  await loadList()
})
</script>

<style scoped>
.panel-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.search-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-input {
  width: 180px;
}

.search-select {
  width: 150px;
}

.mac-button-blue {
  background-color: #007aff !important;
  border-color: #007aff !important;
  border-radius: 8px !important;
  color: #fff;
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
  overflow: hidden;
}

:deep(.el-table th.el-table__cell) {
  font-weight: 600;
  font-size: 13px;
}
</style>
