<template>
  <div class="mac-page-container">
    <h1 class="mac-page-title">字典中心</h1>
    <div class="mac-divider"></div>

    <div class="dict-center-card">
      <el-row :gutter="16" class="dict-center-layout">
        <el-col :span="9" class="layout-col">
          <div class="panel-box">
            <div class="panel-title-row">
              <div class="panel-title">字典类型</div>
              <div class="panel-actions">
                <el-button class="mac-button-gray" @click="loadDictList">
                  <el-icon><RefreshRight /></el-icon>
                </el-button>
                <el-button type="primary" class="mac-button-blue" @click="handleAddDict">
                  <el-icon><Plus /></el-icon>新增字典
                </el-button>
              </div>
            </div>

            <div class="panel-search">
              <el-input
                v-model="dictKeyword"
                clearable
                placeholder="搜索字典名称/编码"
                prefix-icon="Search"
                @keyup.enter="handleDictSearch"
                @clear="handleDictSearch"
              />
            </div>

            <el-table
              :data="filteredDictList"
              v-loading="dictLoading"
              height="100%"
              highlight-current-row
              @current-change="handleDictCurrentChange"
            >
              <el-table-column prop="name" label="字典名称" min-width="120" show-overflow-tooltip />
              <el-table-column prop="code" label="编码" width="80" align="center" />
              <el-table-column label="操作" width="120" align="center">
                <template #default="{ row }">
                  <el-button link type="primary" @click.stop="handleEditDict(row)">编辑</el-button>
                  <el-button link type="danger" @click.stop="handleDeleteDict(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-col>

        <el-col :span="15" class="layout-col">
          <div class="panel-box">
            <div class="panel-title-row">
              <div class="panel-title">
                字典项管理
                <span v-if="selectedDict" class="current-dict-tag">
                  {{ selectedDict.name }}（{{ selectedDict.code }}）
                </span>
              </div>
              <div class="panel-actions">
                <el-button class="mac-button-gray" :disabled="!selectedDict" @click="reloadCurrentDictOptions">
                  <el-icon><RefreshRight /></el-icon>
                </el-button>
                <el-button
                  type="primary"
                  class="mac-button-blue"
                  :disabled="!selectedDict"
                  @click="handleAddOption"
                >
                  <el-icon><Plus /></el-icon>新增字典项
                </el-button>
              </div>
            </div>

            <div class="panel-search">
              <el-input
                v-model="optionKeyword"
                clearable
                :disabled="!selectedDict"
                placeholder="搜索字典项名称/值"
                prefix-icon="Search"
                @keyup.enter="handleOptionSearch"
                @clear="handleOptionSearch"
              />
            </div>

            <el-table :data="filteredOptionList" v-loading="optionLoading" height="100%">
              <el-table-column prop="label" label="名称" min-width="110" show-overflow-tooltip />
              <el-table-column prop="value" label="值" width="90" align="center" />
              <el-table-column prop="sort" label="排序" width="70" align="center" />
              <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
              <el-table-column prop="createTime" label="创建时间" min-width="160" align="center" />
              <el-table-column label="操作" width="130" align="center">
                <template #default="{ row }">
                  <el-button link type="primary" @click="handleEditOption(row)">编辑</el-button>
                  <el-button link type="danger" @click="handleDeleteOption(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-dialog
      v-model="dictDialogVisible"
      :title="dictDialogTitle"
      width="520px"
      class="mac-dialog"
      destroy-on-close
    >
      <el-form ref="dictFormRef" :model="dictForm" :rules="dictRules" label-position="top">
        <el-form-item label="字典名称" prop="name">
          <el-input v-model="dictForm.name" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="字典编码" prop="code">
          <el-input v-model="dictForm.code" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="字典备注" prop="remark">
          <el-input v-model="dictForm.remark" type="textarea" :rows="3" maxlength="50" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button class="mac-button-gray" @click="dictDialogVisible = false">取消</el-button>
          <el-button type="primary" class="mac-button-blue" :loading="dictSubmitLoading" @click="submitDict">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="optionDialogVisible"
      :title="optionDialogTitle"
      width="560px"
      class="mac-dialog"
      destroy-on-close
    >
      <el-form ref="optionFormRef" :model="optionForm" :rules="optionRules" label-position="top">
        <el-row :gutter="14">
          <el-col :span="12">
            <el-form-item label="字典项名称" prop="label">
              <el-input v-model="optionForm.label" maxlength="20" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="字典项值" prop="value">
              <el-input v-model="optionForm.value" maxlength="20" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="optionForm.sort" :min="1" :max="999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="optionForm.remark"
            type="textarea"
            :rows="3"
            maxlength="80"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button class="mac-button-gray" @click="optionDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            class="mac-button-blue"
            :loading="optionSubmitLoading"
            @click="submitOption"
          >
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { selectDict, saveDict, deleteDict } from '@/api/dict'
import { selectDictOption, saveDictOption, deleteDictOption } from '@/api/dictoption'

defineOptions({
  name: 'DictCenterPage',
})

const router = useRouter()

const dictLoading = ref(false)
const dictKeyword = ref('')
const dictList = ref([])
const selectedDictId = ref(null)

const optionLoading = ref(false)
const optionKeyword = ref('')
const optionList = ref([])

const dictDialogVisible = ref(false)
const dictDialogTitle = ref('新增字典')
const dictSubmitLoading = ref(false)
const dictFormRef = ref(null)
const dictForm = reactive({
  id: null,
  name: '',
  code: '',
  remark: '',
})

const optionDialogVisible = ref(false)
const optionDialogTitle = ref('新增字典项')
const optionSubmitLoading = ref(false)
const optionFormRef = ref(null)
const optionForm = reactive({
  id: null,
  dictId: null,
  label: '',
  value: '',
  sort: 10,
  remark: '',
})

const dictRules = {
  name: [{ required: true, message: '字典名称不能为空', trigger: 'blur' }],
  code: [
    { required: true, message: '字典编码不能为空', trigger: 'blur' },
    { pattern: /^\d{2,10}$/, message: '字典编码建议使用2-10位数字', trigger: 'blur' },
  ],
  remark: [{ required: true, message: '字典备注不能为空', trigger: 'blur' }],
}

const optionRules = {
  label: [{ required: true, message: '字典项名称不能为空', trigger: 'blur' }],
  value: [{ required: true, message: '字典项值不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '排序不能为空', trigger: 'change' }],
  remark: [{ required: true, message: '备注不能为空', trigger: 'blur' }],
}

const selectedDict = computed(() =>
  dictList.value.find((item) => Number(item.id) === Number(selectedDictId.value)) || null,
)

const filteredDictList = computed(() => {
  const keyword = String(dictKeyword.value || '').trim().toLowerCase()
  if (!keyword) return dictList.value
  return dictList.value.filter((item) => {
    const text = [item?.name, item?.code, item?.remark]
      .map((value) => String(value || '').toLowerCase())
      .join(' ')
    return text.includes(keyword)
  })
})

const filteredOptionList = computed(() => {
  const keyword = String(optionKeyword.value || '').trim().toLowerCase()
  if (!keyword) return optionList.value
  return optionList.value.filter((item) => {
    const text = [item?.label, item?.value, item?.remark]
      .map((value) => String(value || '').toLowerCase())
      .join(' ')
    return text.includes(keyword)
  })
})

const sortDictList = (list) => {
  return [...list].sort((a, b) => Number(a?.id || 0) - Number(b?.id || 0))
}

const sortOptionList = (list) => {
  return [...list].sort((a, b) => {
    const sortDiff = Number(a?.sort || 0) - Number(b?.sort || 0)
    if (sortDiff !== 0) return sortDiff
    return Number(a?.id || 0) - Number(b?.id || 0)
  })
}

const loadDictList = async () => {
  dictLoading.value = true
  try {
    const res = await selectDict({})
    dictList.value = sortDictList(res?.data || [])

    if (!dictList.value.length) {
      selectedDictId.value = null
      optionList.value = []
      return
    }

    const targetId =
      selectedDictId.value && dictList.value.some((item) => Number(item.id) === Number(selectedDictId.value))
        ? selectedDictId.value
        : dictList.value[0].id

    selectedDictId.value = targetId
    await loadOptionList(targetId)
  } catch (error) {
    console.error('获取字典列表失败', error)
    dictList.value = []
    optionList.value = []
  } finally {
    dictLoading.value = false
  }
}

const loadOptionList = async (dictId) => {
  if (!dictId) {
    optionList.value = []
    return
  }
  optionLoading.value = true
  try {
    const res = await selectDictOption({ dictId })
    optionList.value = sortOptionList(res?.data || [])
  } catch (error) {
    console.error('获取字典项失败', error)
    optionList.value = []
  } finally {
    optionLoading.value = false
  }
}

const reloadCurrentDictOptions = async () => {
  if (!selectedDictId.value) return
  await loadOptionList(selectedDictId.value)
}

const handleDictCurrentChange = async (row) => {
  if (!row?.id) return
  selectedDictId.value = row.id
  optionKeyword.value = ''
  await loadOptionList(row.id)
}

const handleDictSearch = () => {
  dictKeyword.value = String(dictKeyword.value || '').trim()
}

const handleOptionSearch = () => {
  optionKeyword.value = String(optionKeyword.value || '').trim()
}

const handleAddDict = () => {
  dictDialogTitle.value = '新增字典'
  Object.assign(dictForm, {
    id: null,
    name: '',
    code: '',
    remark: '',
  })
  dictDialogVisible.value = true
  if (dictFormRef.value) dictFormRef.value.clearValidate()
}

const handleEditDict = (row) => {
  dictDialogTitle.value = '编辑字典'
  Object.assign(dictForm, {
    id: row.id,
    name: row.name,
    code: row.code,
    remark: row.remark,
  })
  dictDialogVisible.value = true
  if (dictFormRef.value) dictFormRef.value.clearValidate()
}

const submitDict = async () => {
  if (!dictFormRef.value) return
  await dictFormRef.value.validate(async (valid) => {
    if (!valid) return
    dictSubmitLoading.value = true
    try {
      await saveDict({ ...dictForm })
      ElMessage.success(dictForm.id ? '字典更新成功' : '字典新增成功')
      dictDialogVisible.value = false
      await loadDictList()
    } catch (error) {
      console.error('保存字典失败', error)
    } finally {
      dictSubmitLoading.value = false
    }
  })
}

const handleDeleteDict = async (row) => {
  try {
    const optionRes = await selectDictOption({ dictId: row.id })
    const currentOptions = optionRes?.data || []
    if (currentOptions.length > 0) {
      ElMessage.warning('该字典下仍存在字典项，请先删除字典项后再删除字典')
      return
    }
  } catch (error) {
    console.error('删除前校验字典项失败', error)
    return
  }

  ElMessageBox.confirm(`确定删除字典【${row.name}】吗？`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
    center: true,
  })
    .then(async () => {
      await deleteDict(row.id)
      ElMessage.success('字典删除成功')
      await loadDictList()
    })
    .catch(() => {})
}

const handleAddOption = () => {
  if (!selectedDict.value) {
    ElMessage.warning('请先选择左侧字典')
    return
  }
  optionDialogTitle.value = '新增字典项'
  Object.assign(optionForm, {
    id: null,
    dictId: selectedDict.value.id,
    label: '',
    value: '',
    sort: 10,
    remark: '',
  })
  optionDialogVisible.value = true
  if (optionFormRef.value) optionFormRef.value.clearValidate()
}

const handleEditOption = (row) => {
  optionDialogTitle.value = '编辑字典项'
  Object.assign(optionForm, {
    id: row.id,
    dictId: row.dictId || selectedDict.value?.id || null,
    label: row.label,
    value: row.value,
    sort: Number(row.sort || 10),
    remark: row.remark,
  })
  optionDialogVisible.value = true
  if (optionFormRef.value) optionFormRef.value.clearValidate()
}

const hasDuplicateOptionValue = () => {
  const currentValue = String(optionForm.value || '').trim()
  if (!currentValue) return false
  return optionList.value.some(
    (item) =>
      String(item?.value || '').trim() === currentValue && Number(item?.id || 0) !== Number(optionForm.id || 0),
  )
}

const submitOption = async () => {
  if (!optionFormRef.value || !selectedDict.value) return
  await optionFormRef.value.validate(async (valid) => {
    if (!valid) return
    if (hasDuplicateOptionValue()) {
      ElMessage.warning('同一字典下，字典项值不能重复')
      return
    }
    optionSubmitLoading.value = true
    try {
      await saveDictOption({
        ...optionForm,
        dictId: selectedDict.value.id,
      })
      ElMessage.success(optionForm.id ? '字典项更新成功' : '字典项新增成功')
      optionDialogVisible.value = false
      await loadOptionList(selectedDict.value.id)
    } catch (error) {
      console.error('保存字典项失败', error)
    } finally {
      optionSubmitLoading.value = false
    }
  })
}

const handleDeleteOption = (row) => {
  ElMessageBox.confirm(`确定删除字典项【${row.label}】吗？`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
    center: true,
  })
    .then(async () => {
      await deleteDictOption(row.id)
      ElMessage.success('字典项删除成功')
      if (selectedDict.value) {
        await loadOptionList(selectedDict.value.id)
      }
    })
    .catch(() => {})
}

onMounted(async () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    if (String(userInfo?.level || '') !== '99') {
      ElMessage.warning('仅车管调度员可访问字典中心')
      router.replace('/layout/application')
      return
    }
  } catch {
    router.replace('/login')
    return
  }
  await loadDictList()
})
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

.dict-center-card {
  flex: 1;
  min-height: 0;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.dict-center-layout {
  height: 100%;
}

.layout-col {
  height: 100%;
}

.panel-box {
  height: 100%;
  min-height: 0;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  background: #fdfdfd;
}

.panel-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-dict-tag {
  font-size: 12px;
  color: #606266;
  background: #f3f7ff;
  border: 1px solid rgba(64, 158, 255, 0.2);
  border-radius: 999px;
  padding: 3px 10px;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-search {
  margin: 12px 0;
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
