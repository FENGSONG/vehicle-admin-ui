<template>
  <div class="mac-page-container">
    <h1 class="mac-page-title">车务维护中心</h1>
    <div class="mac-divider"></div>

    <div class="mac-table-card">
      <el-tabs v-model="activeTab" class="maintain-tabs">
        <el-tab-pane label="保险信息" name="insurance">
          <InsurancePanel />
        </el-tab-pane>
        <el-tab-pane label="年检信息" name="inspection">
          <InspectionPanel />
        </el-tab-pane>
        <el-tab-pane label="维修信息" name="repair">
          <RepairPanel />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import InsurancePanel from '@/views/vehicle-maintain/InsurancePanel.vue'
import InspectionPanel from '@/views/vehicle-maintain/InspectionPanel.vue'
import RepairPanel from '@/views/vehicle-maintain/RepairPanel.vue'

defineOptions({
  name: 'VehicleMaintain',
})

const activeTab = ref('insurance')
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

.mac-table-card {
  flex: 1;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.maintain-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.maintain-tabs .el-tabs__content) {
  flex: 1;
  min-height: 0;
}

:deep(.maintain-tabs .el-tab-pane) {
  height: 100%;
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
