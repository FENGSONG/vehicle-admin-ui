<template>
  <div class="mac-page-container">
    <div class="page-header-container">
      <h1 class="mac-page-title">地理围栏调度中心</h1>
    </div>

    <div class="mac-divider"></div>

    <el-tabs v-model="activeTab" class="mac-tabs">
      <el-tab-pane label="🗺️ 围栏绘制区" name="draw">
        <GeofenceDraw v-if="activeTab === 'draw'" @save-success="handleSaveSuccess" />
      </el-tab-pane>

      <el-tab-pane label="📋 已存围栏大盘" name="list">
        <GeofenceList ref="listRef" v-if="activeTab === 'list'" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
// 导入我们拆分好的两个子组件
import GeofenceDraw from './GeofenceDraw.vue'
import GeofenceList from './GeofenceList.vue'

const activeTab = ref('draw')
const listRef = ref(null)

// 接收绘制组件发来的 "保存成功" 事件
const handleSaveSuccess = () => {
  activeTab.value = 'list' // 自动切换到数据大盘

  // 等待 DOM 更新后，调用列表组件里的 fetchList() 刷新数据
  nextTick(() => {
    if (listRef.value) {
      listRef.value.fetchList()
    }
  })
}
</script>

<style scoped>
/* 这个父容器彻底锁死高度，只在这个文件里写 100vh 强制生效 */
.mac-page-container {
  height: calc(100vh - 100px) !important;
  display: flex;
  flex-direction: column;
  overflow: hidden !important;
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

/* 保证 Tabs 能够安全传递高度给子组件 */
:deep(.mac-tabs) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
:deep(.mac-tabs .el-tabs__header) {
  margin-bottom: 0;
  flex-shrink: 0;
}
:deep(.mac-tabs .el-tabs__content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
:deep(.mac-tabs .el-tab-pane) {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
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
</style>
