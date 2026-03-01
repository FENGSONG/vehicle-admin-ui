<template>
  <div class="mac-page-container">
    <h1 class="mac-page-title">地理围栏调度中心</h1>
    <div class="mac-divider"></div>

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
  </div>
</template>

<script setup>
import { saveGeofence } from '@/api/geofence'
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { EditPen, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import AMapLoader from '@amap/amap-jsapi-loader'

// --- 表单与地理数据 ---
const fenceForm = reactive({
  name: '',
  status: 1,
})
const drawMode = ref('rectangle') // 默认画矩形
const geoData = ref(null) // 存放符合数据库格式的 JSON 对象

// --- 地图核心对象 ---
let map = null
let mouseTool = null
let currentShape = null

//  你的专属高德地图 Key
const AMAP_KEY = '5176121da43ca550766462286060b1a0'
const AMAP_SECURITY_CODE = '769b1cfb4849a287c6171243d16f0902'

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (map) {
    map.destroy()
  }
})

// 1. 初始化高德地图
const initMap = () => {
  window._AMapSecurityConfig = {
    securityJsCode: AMAP_SECURITY_CODE,
  }

  AMapLoader.load({
    key: AMAP_KEY,
    version: '2.0',
    plugins: ['AMap.MouseTool'], // 只需要 MouseTool 插件即可
  })
    .then((AMap) => {
      map = new AMap.Map('map-container', {
        viewMode: '2D',
        zoom: 15,
        center: [126.568856, 43.924441], // 北华大学北校区
      })

      mouseTool = new AMap.MouseTool(map)

      // 监听绘制完成事件
      mouseTool.on('draw', (event) => {
        currentShape = event.obj

        //  核心：根据画图模式，提取数据库需要的特定格式并存入 geoData
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
    .catch((e) => {
      console.error('高德地图加载失败:', e)
    })
}

// 2. 开始绘制
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

  //  切换画笔工具
  if (drawMode.value === 'rectangle') {
    mouseTool.rectangle(styleOptions)
  } else {
    mouseTool.circle(styleOptions)
  }
}

// 3. 清除当前绘制
const clearDraw = () => {
  if (map) {
    map.clearMap()
    currentShape = null
    geoData.value = null // 清空数据
    if (mouseTool) mouseTool.close(false)
  }
}

// 4. 提交保存到后端
const submitGeofence = async () => {
  const payload = {
    name: fenceForm.name,
    status: fenceForm.status,
    position: JSON.stringify(geoData.value), // 这里终于有值了！
  }

  try {
    await saveGeofence(payload)
    ElMessage.success('保存成功！新的地理围栏已入库')
    clearDraw()
    fenceForm.name = ''
  } catch (error) {
    console.error('保存地理围栏失败:', error)
  }
}
</script>

<style scoped>
/* 样式保持不变 */
.mac-page-container {
  animation: fadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  height: 100%;
  display: flex;
  flex-direction: column;
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
.geofence-layout {
  display: flex;
  gap: 24px;
  flex: 1;
  min-height: 600px;
}
.map-wrapper {
  flex: 1;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}
.mac-map {
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
.mac-form-sidebar {
  width: 320px;
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
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
  margin-top: 20px;
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
