<template>
  <div class="mac-page-container">
    <div class="page-header-container">
      <h1 class="mac-page-title">地理围栏调度中心</h1>
    </div>

    <div class="mac-divider"></div>

    <el-tabs v-model="activeTab" class="mac-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="🗺️ 围栏绘制区" name="draw">
        <div class="geofence-layout">
          <div class="map-wrapper">
            <div id="map-container" class="mac-map"></div>

            <div class="mac-floating-panel">
              <div class="panel-header">围栏绘制工具</div>
              <p class="panel-tip">当前中心：北华大学北校区</p>

              <div class="draw-modes" style="margin-bottom: 12px">
                <el-radio-group v-model="drawMode" size="small" @change="clearDraw">
                  <el-radio-button label="rectangle">画矩形</el-radio-button>
                  <el-radio-button label="circle">画圆形</el-radio-button>
                </el-radio-group>
              </div>

              <div class="panel-actions">
                <el-button type="primary" class="mac-button-blue" @click="startDraw">
                  <el-icon><EditPen /></el-icon>开始绘制
                </el-button>
                <el-button class="mac-button-gray" @click="clearDraw">
                  <el-icon><Delete /></el-icon>清除
                </el-button>
              </div>
            </div>
          </div>

          <div class="mac-form-sidebar">
            <h2 class="sidebar-title">围栏属性设置</h2>
            <el-form :model="fenceForm" label-position="top">
              <el-form-item label="围栏名称 (name)">
                <el-input v-model="fenceForm.name" placeholder="例如：北校区核心调度区" />
              </el-form-item>

              <el-form-item label="启用状态 (status)">
                <el-switch
                  v-model="fenceForm.status"
                  :active-value="1"
                  :inactive-value="0"
                  active-text="启用"
                  inactive-text="停用"
                  style="--el-switch-on-color: #34c759"
                />
              </el-form-item>

              <el-form-item label="已捕获坐标数据">
                <div class="coordinate-badge">
                  <span v-if="!geoData" class="text-gray">暂未绘制区域</span>
                  <span v-else class="text-green">
                    已生成 {{ geoData.type === 'circle' ? '圆形' : '矩形' }} 坐标数据
                  </span>
                </div>
              </el-form-item>

              <el-button
                type="primary"
                class="mac-button-blue submit-btn"
                :disabled="!geoData || !fenceForm.name"
                @click="submitGeofence"
              >
                保存至数据库
              </el-button>
            </el-form>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="📋 已存围栏大盘" name="list">
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
        </div>
      </el-tab-pane>
    </el-tabs>

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
import { saveGeofence, getGeofenceList, deleteGeofence, updateGeofenceStatus } from '@/api/geofence'
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { EditPen, Delete, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AMapLoader from '@amap/amap-jsapi-loader'

const activeTab = ref('draw')

const fenceForm = reactive({ name: '', status: 1 })
const drawMode = ref('rectangle')
const geoData = ref(null)

const loading = ref(false)
const allData = ref([])
const tableList = ref([])
const queryParams = reactive({ name: '' })

const currentPage = ref(1)
const pageSize = ref(8)
const total = ref(0)

const editDialogVisible = ref(false)
const editForm = reactive({ id: null, name: '' })

let map = null
let mouseTool = null
let currentShape = null

const AMAP_KEY = '5176121da43ca550766462286060b1a0'
const AMAP_SECURITY_CODE = '769b1cfb4849a287c6171243d16f0902'

onMounted(() => {
  initMap()
  fetchList()
})

onUnmounted(() => {
  if (map) map.destroy()
})

const initMap = () => {
  window._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE }
  AMapLoader.load({
    key: AMAP_KEY,
    version: '2.0',
    plugins: ['AMap.MouseTool'],
  })
    .then((AMap) => {
      map = new AMap.Map('map-container', {
        viewMode: '2D',
        zoom: 15,
        center: [126.568856, 43.924441],
      })
      mouseTool = new AMap.MouseTool(map)
      mouseTool.on('draw', (event) => {
        currentShape = event.obj
        if (drawMode.value === 'rectangle') {
          const bounds = currentShape.getBounds()
          geoData.value = {
            type: 'rectangle',
            recPoints: `${bounds.getSouthWest().lng},${bounds.getSouthWest().lat};${bounds.getNorthEast().lng},${bounds.getNorthEast().lat}`,
          }
        } else if (drawMode.value === 'circle') {
          const center = currentShape.getCenter()
          const radius = currentShape.getRadius()
          geoData.value = {
            type: 'circle',
            longitude: center.lng.toString(),
            latitude: center.lat.toString(),
            radius: radius.toString(),
          }
        }
        ElMessage.success('区域绘制完成！')
        mouseTool.close(false)
      })
    })
    .catch((e) => console.error('高德地图加载失败:', e))
}

const handleTabChange = (tabName) => {
  if (tabName === 'draw' && map) {
    nextTick(() => {
      setTimeout(() => {
        map.resize()
      }, 100)
    })
  }
}

const startDraw = () => {
  if (!mouseTool) return
  if (currentShape) {
    ElMessage.warning('当前已有绘制的围栏，请先清除后再重新绘制。')
    return
  }
  ElMessage.info(`请在地图上拖拽绘制${drawMode.value === 'circle' ? '圆形' : '矩形'}`)
  const styleOptions = {
    fillColor: '#007aff',
    fillOpacity: 0.2,
    strokeColor: '#007aff',
    strokeWeight: 2,
    strokeOpacity: 0.9,
  }
  if (drawMode.value === 'rectangle') mouseTool.rectangle(styleOptions)
  else mouseTool.circle(styleOptions)
}

const clearDraw = () => {
  if (map) {
    map.clearMap()
    currentShape = null
    geoData.value = null
    if (mouseTool) mouseTool.close(false)
  }
}

const submitGeofence = async () => {
  const payload = {
    name: fenceForm.name,
    status: fenceForm.status,
    position: JSON.stringify(geoData.value),
  }
  try {
    await saveGeofence(payload)
    ElMessage.success('保存成功！新的地理围栏已入库')
    clearDraw()
    fenceForm.name = ''
    activeTab.value = 'list'
    fetchList()
  } catch (error) {
    console.error('保存地理围栏失败:', error)
  }
}

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
/*  1. 根容器占满全部空间，杜绝外部滚动 */
.mac-page-container {
  animation: fadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  height: 100%; /* 紧紧贴合你的系统外层布局 */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 绝对锁死外层滚动 */
  box-sizing: border-box;
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

/*  2. 彻底打通 Tabs 的多层内部结构为 Flex 布局，传递高度 */
:deep(.mac-tabs) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}
:deep(.mac-tabs .el-tabs__header) {
  margin-bottom: 0; /* 删掉自带的底部空白，方便我们自己控制间距 */
  flex-shrink: 0;
}
:deep(.mac-tabs .el-tabs__content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}
:deep(.mac-tabs .el-tab-pane) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  height: 100%; /* 兼容不同浏览器的解析，强行撑满 */
}

/* Tabs 表头美化 */
:deep(.mac-tabs .el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.05);
}
:deep(.mac-tabs .el-tabs__item) {
  font-size: 16px;
  font-weight: 500;
  color: #86868b;
  transition: all 0.3s;
  padding: 0 24px;
  height: 50px;
  line-height: 50px;
}
:deep(.mac-tabs .el-tabs__item.is-active) {
  color: #007aff;
  font-weight: 600;
}
:deep(.mac-tabs .el-tabs__active-bar) {
  background-color: #007aff;
  height: 3px;
  border-radius: 3px;
}

/*  3. 绘制区：完美撑满，不留白，不溢出 */
.geofence-layout {
  display: flex;
  gap: 24px;
  flex: 1; /* 用 flex:1 替代 height:100% */
  min-height: 0;
  padding-top: 16px; /* 用 padding 替代 margin，因为 padding 不会引发外部溢出 */
  padding-bottom: 16px;
}

.map-wrapper {
  flex: 1;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  display: flex;
}
.mac-map {
  flex: 1;
  width: 100%;
  height: 100%;
}

.mac-floating-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.4);
}
.panel-header {
  font-weight: 600;
  font-size: 15px;
  color: #1d1d1f;
  margin-bottom: 4px;
}
.panel-tip {
  font-size: 12px;
  color: #86868b;
  margin-bottom: 12px;
}
.panel-actions {
  display: flex;
  gap: 10px;
}

/* 右侧表单区 */
.mac-form-sidebar {
  width: 320px;
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
}
:deep(.el-form-item__label) {
  font-weight: 500;
  color: #1d1d1f;
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
.coordinate-badge {
  background: #f5f5f7;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
}
.text-gray {
  color: #86868b;
}
.text-green {
  color: #34c759;
}
.submit-btn {
  width: 100%;
  margin-top: auto;
  height: 40px !important;
  font-size: 15px;
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

/*  4. 列表区：完美自适应，绝对不溢出屏幕 */
.mac-table-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 24px;
  padding-bottom: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  margin-top: 16px;
  margin-bottom: 16px; /* 底部预留舒适的间距 */
  display: flex;
  flex-direction: column;
  flex: 1; /* 重点：让盒子自己计算高度，绝不使用 height: 100% */
  min-height: 0;
}

.table-header-actions {
  display: flex;
  justify-content: space-between;
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

/* 表格占满剩余空间，超出部分内部滚动 */
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

/* 分页器紧紧贴在最下面 */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px; /* 这里固定距离即可，上面的表格会把这部分空间挤到底部 */
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
