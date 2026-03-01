<template>
  <div class="mac-layout">
    <div class="mac-sidebar" :class="{ 'sidebar-hidden': isMobileMenuHidden }">
      <div class="mac-search-box">
        <el-input v-model="searchQuery" placeholder="搜索" prefix-icon="Search" class="mac-input" />
      </div>

      <div class="sidebar-title">探索</div>
      <div
        v-for="item in menuItems"
        :key="item.path"
        class="mac-menu-item"
        :class="{ active: currentPath === item.path }"
        @click="handleMenuClick(item)"
      >
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ item.title }}</span>
      </div>

      <div class="spacer"></div>
      <div class="mac-user-profile" @click="handleLogout">
        <img
          src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png"
          class="mac-avatar"
        />
        <span class="mac-username">管理员</span>
        <el-icon class="logout-icon"><SwitchButton /></el-icon>
      </div>
    </div>

    <div class="mobile-menu-toggle" @click="isMobileMenuHidden = !isMobileMenuHidden">
      <el-icon><Expand v-if="isMobileMenuHidden" /><Fold v-else /></el-icon>
    </div>

    <div class="mac-main" @click="closeSidebarOnMobile">
      <div class="mac-content">
        <div class="mac-school-branding">
          <img src="@/assets/school-logo.png" alt="学校Logo" class="school-logo" />
        </div>

        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
//  核心修改：把所有的 Element Plus 图标全部合并到这一行，去掉重复的 Van
import {
  Search,
  DataLine,
  Van,
  User,
  SwitchButton,
  Expand,
  Fold,
  Menu,
  MapLocation,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute() // 引入 route 来获取当前路径
const searchQuery = ref('')
const isMobileMenuHidden = ref(false)

//  计算属性：实时获取当前路由路径，解决刷新后高亮丢失的问题
const currentPath = computed(() => route.path)

const checkWidth = () => {
  isMobileMenuHidden.value = window.innerWidth < 1024
}

onMounted(() => {
  checkWidth()
  window.addEventListener('resize', checkWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkWidth)
})

// 菜单数据
const menuItems = [
  { title: '数据大盘', icon: DataLine, path: '/layout/dashboard' },
  { title: '车辆管理', icon: Van, path: '/layout/vehicle' },
  { title: '用户管理', icon: User, path: '/layout/user' },
  { title: '地理围栏', icon: User, path: '/layout/geofence' },
]

const handleMenuClick = (item) => {
  router.push(item.path)
  if (window.innerWidth < 1024) {
    isMobileMenuHidden.value = true
  }
}

const closeSidebarOnMobile = () => {
  if (window.innerWidth < 1024 && !isMobileMenuHidden.value) {
    isMobileMenuHidden.value = true
  }
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出当前账号吗？', '退出登录', {
    confirmButtonText: '退出',
    cancelButtonText: '取消',
    type: 'warning',
    center: true,
  })
    .then(() => {
      ElMessage.success('已安全退出')
      router.push('/login')
    })
    .catch(() => {})
}
</script>

<style scoped>
.mac-layout {
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial,
    sans-serif;
  display: flex;
  height: 100vh;
  margin: -8px;
  background-color: #f5f5f7;
  overflow: hidden;
}

/* --- 响应式侧边栏 --- */
.mac-sidebar {
  width: 260px;
  background-color: rgba(235, 235, 240, 0.75);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  padding: 20px 12px;
  z-index: 1000;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-menu-toggle {
  display: none;
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1001;
  background: white;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.mac-main {
  flex: 1;
  background-color: #ffffff;
  overflow-y: auto;
  position: relative;
  transition: all 0.3s ease;
}

.mac-content {
  padding: 40px 60px;
  max-width: 1200px;
  margin: 0 auto;
  transition: padding 0.3s ease;
}

.mac-school-branding {
  position: absolute;
  top: 25px;
  right: 60px;
  z-index: 100;
  transition: all 0.3s ease;
}

.school-logo {
  width: 240px;
  height: auto;
  border-radius: 12px;
  background: white;
  padding: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

/*  新增：路由切换时的淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 1200px) {
  .mac-content {
    padding: 40px 30px;
  }
  .school-logo {
    width: 180px;
  }
}

@media (max-width: 1024px) {
  .mobile-menu-toggle {
    display: flex;
  }
  .mac-sidebar {
    position: fixed;
    height: 100vh;
    left: 0;
  }
  .sidebar-hidden {
    transform: translateX(-100%);
  }
  .mac-school-branding {
    right: 30px;
  }
}

@media (max-width: 768px) {
  .mac-content {
    padding: 80px 20px 40px;
  }
  .mac-school-branding {
    position: relative;
    top: 0;
    right: 0;
    margin-bottom: 20px;
    display: flex;
    justify-content: center;
  }
  .school-logo {
    width: 160px;
  }
}

/* 基础样式保留 */
.mac-search-box {
  margin-bottom: 20px;
  padding: 0 10px;
}
:deep(.el-input__wrapper) {
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.05);
  box-shadow: none !important;
}
.sidebar-title {
  font-size: 11px;
  font-weight: 600;
  color: #86868b;
  margin: 10px 15px;
  text-transform: uppercase;
}
.mac-menu-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 6px;
  color: #1d1d1f;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}
.mac-menu-item.active {
  background-color: #007aff;
  color: white;
}
.mac-menu-item .el-icon {
  margin-right: 10px;
  font-size: 18px;
}
.spacer {
  flex: 1;
}
.mac-user-profile {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
}
.mac-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 10px;
}
.mac-username {
  font-size: 14px;
  font-weight: 500;
  flex: 1;
}
.logout-icon {
  color: #ff3b30;
}
</style>
