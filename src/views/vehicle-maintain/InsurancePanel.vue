<template>
  <div class="panel-root">
    <div class="header-actions">
      <el-button type="primary" class="mac-button-blue" @click="openAdd">
        <el-icon><Plus /></el-icon>
        新增保险
      </el-button>
      <div class="search-group">
        <el-input
          v-model="query.policyNo"
          placeholder="保险单号"
          clearable
          class="search-input"
          @keyup.enter="loadList"
        />
        <el-select v-model="query.vehicleId" placeholder="车辆" clearable filterable class="search-select">
          <el-option v-for="item in vehicleOptions" :key="`i-v-${item.id}`" :label="item.label" :value="item.id" />
        </el-select>
        <el-select v-model="query.status" placeholder="状态" clearable class="search-select">
          <el-option v-for="item in statusOptions" :key="`i-s-${item.value}`" :label="item.label" :value="item.value" />
        </el-select>
        <el-button class="mac-button-gray" @click="loadList">搜索</el-button>
      </div>
    </div>

    <el-table :data="list" v-loading="loading" height="100%">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="policyNo" label="保险单号" min-width="140" />
      <el-table-column prop="company" label="保险公司" min-width="130" />
      <el-table-column label="保险车辆" min-width="160">
        <template #default="{ row }">{{ getVehicleText(row.vehicleId) }}</template>
      </el-table-column>
      <el-table-column label="保险类型" min-width="110" align="center">
        <template #default="{ row }">{{ getInsuranceTypeText(row.insuranceType) }}</template>
      </el-table-column>
      <el-table-column label="状态" min-width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="isRiskStatus(row.status) ? 'danger' : 'success'" size="small" effect="light">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="fee" label="费用(元)" min-width="95" align="center" />
      <el-table-column prop="insuredTime" label="投保时间" min-width="160" align="center" />
      <el-table-column prop="endTime" label="保险期限至" min-width="160" align="center" />
      <el-table-column label="操作" width="130" fixed="right" align="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="780px" class="mac-dialog" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-row :gutter="14">
          <el-col :span="12">
            <el-form-item label="保险单号" prop="policyNo"><el-input v-model="form.policyNo" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="保险公司" prop="company"><el-input v-model="form.company" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="保险车辆" prop="vehicleId">
              <el-select v-model="form.vehicleId" filterable style="width: 100%">
                <el-option
                  v-for="item in vehicleOptions"
                  :key="`fd-v-${item.id}`"
                  :label="item.label"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="保险类型" prop="insuranceType">
              <el-select v-model="form.insuranceType" style="width: 100%">
                <el-option
                  v-for="item in insuranceTypeOptions"
                  :key="`fd-t-${item.value}`"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="投保时间" prop="insuredTime">
              <el-date-picker
                v-model="form.insuredTime"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="保险费用(元)" prop="fee">
              <el-input-number v-model="form.fee" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="保险开始时间">
              <el-date-picker
                v-model="form.startTime"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="保险截止时间" prop="endTime">
              <el-date-picker
                v-model="form.endTime"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="投保人" prop="applicant"><el-input v-model="form.applicant" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="被保险人" prop="insuredPerson">
              <el-input v-model="form.insuredPerson" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="保险联系人"><el-input v-model="form.contact" /></el-form-item>
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
import {
  selectVehicleInsurance,
  saveVehicleInsurance,
  deleteVehicleInsurance,
} from '@/api/vehicleInsurance'
import {
  toDictValue,
  buildDictLabelMap,
  findDictLabel,
  loadDictOptionBundle,
} from '@/utils/dict'

const toKey = toDictValue

const DICT_FALLBACK = {
  insuranceType: [
    { label: '交强险', value: '10', sort: 10 },
    { label: '商业险', value: '20', sort: 20 },
  ],
  insuranceStatus: [
    { label: '未到期', value: '10', sort: 10 },
    { label: '到期', value: '20', sort: 20 },
  ],
}

const query = reactive({ policyNo: '', vehicleId: null, status: '' })
const list = ref([])
const loading = ref(false)

const dialogVisible = ref(false)
const dialogTitle = ref('新增保险')
const submitting = ref(false)
const formRef = ref(null)
const form = reactive({
  id: null,
  policyNo: '',
  company: '',
  fee: 0,
  insuredTime: '',
  startTime: '',
  endTime: '',
  applicant: '',
  insuredPerson: '',
  contact: '',
  vehicleId: null,
  insuranceType: '',
  status: '10',
  remark: '',
})

const rules = {
  policyNo: [{ required: true, message: '保险单号不能为空', trigger: 'blur' }],
  company: [{ required: true, message: '保险公司不能为空', trigger: 'blur' }],
  fee: [{ required: true, message: '保险费用不能为空', trigger: 'change' }],
  insuredTime: [{ required: true, message: '投保时间不能为空', trigger: 'change' }],
  endTime: [{ required: true, message: '保险截止时间不能为空', trigger: 'change' }],
  applicant: [{ required: true, message: '投保人不能为空', trigger: 'blur' }],
  insuredPerson: [{ required: true, message: '被保险人不能为空', trigger: 'blur' }],
  vehicleId: [{ required: true, message: '请选择保险车辆', trigger: 'change' }],
  insuranceType: [{ required: true, message: '请选择保险类型', trigger: 'change' }],
}

const vehicleOptions = ref([])
const insuranceTypeOptions = ref([])
const statusOptions = ref([])

const vehicleMap = computed(() => {
  const map = {}
  ;(vehicleOptions.value || []).forEach((item) => {
    map[String(item.id)] = item
  })
  return map
})
const insuranceTypeMap = computed(() => buildDictLabelMap(insuranceTypeOptions.value))
const statusMap = computed(() => buildDictLabelMap(statusOptions.value))

const getVehicleText = (vehicleId) => {
  const item = vehicleMap.value[String(vehicleId)]
  if (!item) return `车辆ID:${vehicleId || '--'}`
  return `${item.license}（${item.brand || '--'}）`
}

const getInsuranceTypeText = (value) =>
  insuranceTypeMap.value[toKey(value)] || findDictLabel(insuranceTypeOptions.value, value, toKey(value) || '--')

const getStatusText = (value) =>
  statusMap.value[toKey(value)] || findDictLabel(statusOptions.value, value, toKey(value) || '--')

const isRiskStatus = (value) => {
  const label = getStatusText(value)
  return ['到期', '失效', '异常', '驳回', '拒绝', '未通过'].some((text) => label.includes(text))
}

const getDefaultStatus = () => statusOptions.value[0]?.value || '10'

const getDefaultInsuranceType = () => insuranceTypeOptions.value[0]?.value || ''

const resetForm = () => {
  Object.assign(form, {
    id: null,
    policyNo: '',
    company: '',
    fee: 0,
    insuredTime: '',
    startTime: '',
    endTime: '',
    applicant: '',
    insuredPerson: '',
    contact: '',
    vehicleId: null,
    insuranceType: getDefaultInsuranceType(),
    status: getDefaultStatus(),
    remark: '',
  })
}

const normalizeEditForm = (row) => {
  Object.assign(form, {
    ...row,
    fee: Number(row?.fee || 0),
    insuranceType: toKey(row?.insuranceType),
    status: toKey(row?.status),
  })

  if (!insuranceTypeOptions.value.some((item) => item.value === toKey(form.insuranceType))) {
    form.insuranceType = getDefaultInsuranceType()
  }
  if (!statusOptions.value.some((item) => item.value === toKey(form.status))) {
    form.status = getDefaultStatus()
  }
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

const loadDictOptions = async () => {
  const dictOptions = await loadDictOptionBundle({
    insuranceType: { code: '111', fallback: DICT_FALLBACK.insuranceType },
    insuranceStatus: { code: '109', fallback: DICT_FALLBACK.insuranceStatus },
  })

  insuranceTypeOptions.value = dictOptions.insuranceType || DICT_FALLBACK.insuranceType
  statusOptions.value = dictOptions.insuranceStatus || DICT_FALLBACK.insuranceStatus

  if (!insuranceTypeOptions.value.some((item) => item.value === toKey(form.insuranceType))) {
    form.insuranceType = getDefaultInsuranceType()
  }
  if (!statusOptions.value.some((item) => item.value === toKey(form.status))) {
    form.status = getDefaultStatus()
  }
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await selectVehicleInsurance(query)
    list.value = res?.data || []
  } finally {
    loading.value = false
  }
}

const openAdd = () => {
  dialogTitle.value = '新增保险'
  resetForm()
  dialogVisible.value = true
  if (formRef.value) formRef.value.clearValidate()
}

const openEdit = (row) => {
  dialogTitle.value = '编辑保险'
  normalizeEditForm(row)
  dialogVisible.value = true
  if (formRef.value) formRef.value.clearValidate()
}

const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await saveVehicleInsurance({ ...form })
      ElMessage.success(form.id ? '保险更新成功' : '保险新增成功')
      dialogVisible.value = false
      await loadList()
    } finally {
      submitting.value = false
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除保险单【${row.policyNo}】吗？`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
    center: true,
  })
    .then(async () => {
      await deleteVehicleInsurance(row.id)
      ElMessage.success('保险记录已删除')
      await loadList()
    })
    .catch(() => {})
}

onMounted(async () => {
  await Promise.all([loadVehicleOptions(), loadDictOptions()])
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
