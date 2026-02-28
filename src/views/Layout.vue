<template>
  <div class="mac-layout">
    <div class="mac-sidebar" :class="{ 'sidebar-hidden': isMobileMenuHidden }">
      <div class="mac-search-box">
        <el-input
          v-model="searchQuery"
          placeholder="搜索"
          prefix-icon="Search"
          class="mac-input"
        />
      </div>

      <div class="sidebar-title">探索</div>
      <div 
        v-for="item in menuItems" 
        :key="item.index"
        class="mac-menu-item"
        :class="{ active: activeMenu === item.index }"
        @click="handleMenuClick(item.index)"
      >
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ item.title }}</span>
      </div>

      <div class="spacer"></div> 
      <div class="mac-user-profile" @click="handleLogout">
        <img src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" class="mac-avatar" />
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

        <h1 class="mac-page-title">
          {{ menuItems.find(item => item.index === activeMenu)?.title }}
        </h1>
        <div class="mac-divider"></div>

        <div class="mac-hero-card">
          <div class="hero-text">
            <div class="hero-subtitle">今日重磅推荐</div>
            <div class="hero-title">全新车辆调度引擎上线</div>
            <div class="hero-desc">体验前所未有的管理效率与丝滑交互。</div>
          </div>
          <div class="hero-button">获取</div>
        </div>

        <h2 class="mac-section-title">数据速览</h2>
        <div class="mac-grid">
          <div class="mac-data-card">
            <div class="card-icon blue"><el-icon><Van /></el-icon></div>
            <div class="card-info">
              <h3>活跃车辆</h3>
              <p class="number">128</p>
            </div>
          </div>
          <div class="mac-data-card">
            <div class="card-icon purple"><el-icon><User /></el-icon></div>
            <div class="card-info">
              <h3>在线用户</h3>
              <p class="number">32</p>
            </div>
          </div>
          <div class="mac-data-card">
            <div class="card-icon green"><el-icon><DataLine /></el-icon></div>
            <div class="card-info">
              <h3>今日单量</h3>
              <p class="number">1,024</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, DataLine, Van, User, SwitchButton, Expand, Fold } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const searchQuery = ref('')
const activeMenu = ref('1')
const isMobileMenuHidden = ref(false)

// 响应式处理：初始化检查屏幕宽度
const checkWidth = () => {
  isMobileMenuHidden.ref = window.innerWidth < 1024
}

onMounted(() => {
  checkWidth()
  window.addEventListener('resize', checkWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkWidth)
})

const handleMenuClick = (index) => {
  activeMenu.value = index
  if (window.innerWidth < 1024) {
    isMobileMenuHidden.value = true
  }
}

const closeSidebarOnMobile = () => {
  if (window.innerWidth < 1024 && !isMobileMenuHidden.value) {
    isMobileMenuHidden.value = true
  }
}

const menuItems = [
  { index: '1', title: '数据大盘', icon: DataLine },
  { index: '2', title: '车辆管理', icon: Van },
  { index: '3', title: '用户管理', icon: User }
]

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出当前账号吗？', '退出登录', {
    confirmButtonText: '退出',
    cancelButtonText: '取消',
    type: 'warning',
    center: true
  }).then(() => {
    ElMessage.success('已安全退出')
    router.push('/login')
  }).catch(() => {})
}
</script>

<style scoped>
.mac-layout {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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

/* 移动端菜单切换按钮 */
.mobile-menu-toggle {
  display: none;
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1001;
  background: white;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  cursor: pointer;
}

/* --- 主内容区 --- */
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

/* --- 学校 Logo 响应式 (放大二倍基础) --- */
.mac-school-branding {
  position: absolute;
  top: 40px;
  right: 60px;
  z-index: 100;
  transition: all 0.3s ease;
}

.school-logo {
  width: 240px; /* 默认放大二倍 */
  height: auto;
  border-radius: 12px;
  background: white;
  padding: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

/* --- 栅格布局响应式 --- */
.mac-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 默认三列 */
  gap: 20px;
}

/* =============================================
    响应式断点设置
   ============================================= */

/* 1. 窄屏笔记本/平板 (小于 1200px) */
@media (max-width: 1200px) {
  .mac-content {
    padding: 40px 30px;
  }
  .school-logo {
    width: 180px; /* 稍微缩小 Logo */
  }
  .mac-grid {
    grid-template-columns: repeat(2, 1fr); /* 变为两列 */
  }
}

/* 2. 平板模式 (小于 1024px) */
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
    transform: translateX(-100%); /* 隐藏侧边栏 */
  }
  .mac-school-branding {
    right: 30px;
  }
}

/* 3. 手机模式 (小于 768px) */
@media (max-width: 768px) {
  .mac-content {
    padding: 80px 20px 40px; /* 顶部留出切换按钮空间 */
  }
  .mac-page-title {
    font-size: 26px;
  }
  .mac-school-branding {
    position: relative; /* 手机端改为流式布局，避免挡住文字 */
    top: 0;
    right: 0;
    margin-bottom: 20px;
    display: flex;
    justify-content: center;
  }
  .school-logo {
    width: 160px; /* 手机端再次缩小 */
  }
  .mac-grid {
    grid-template-columns: 1fr; /* 变为一列 */
  }
  .mac-hero-card {
    height: 240px;
    padding: 20px;
  }
  .hero-title {
    font-size: 20px;
  }
}

/* 其他基础样式保持不变 */
.mac-search-box { margin-bottom: 20px; padding: 0 10px; }
:deep(.el-input__wrapper) { border-radius: 8px; background-color: rgba(0, 0, 0, 0.05); box-shadow: none !important; }
.sidebar-title { font-size: 11px; font-weight: 600; color: #86868b; margin: 10px 15px; text-transform: uppercase; }
.mac-menu-item { display: flex; align-items: center; padding: 8px 12px; margin-bottom: 4px; border-radius: 6px; color: #1d1d1f; cursor: pointer; font-size: 14px; transition: all 0.2s; }
.mac-menu-item.active { background-color: #007aff; color: white; }
.mac-menu-item .el-icon { margin-right: 10px; font-size: 18px; }
.spacer { flex: 1; }
.mac-user-profile { display: flex; align-items: center; padding: 10px; border-radius: 8px; cursor: pointer; }
.mac-avatar { width: 32px; height: 32px; border-radius: 50%; margin-right: 10px; }
.mac-username { font-size: 14px; font-weight: 500; flex: 1; }
.logout-icon { color: #ff3b30; }
.mac-divider { height: 1px; background-color: rgba(0, 0, 0, 0.08); margin-bottom: 30px; }
.mac-hero-card { position: relative; border-radius: 18px; background: linear-gradient(135deg, #007aff 0%, #00c6ff 100%); color: white; display: flex; flex-direction: column; justify-content: flex-end; box-shadow: 0 10px 30px rgba(0, 122, 255, 0.3); margin-bottom: 40px; overflow: hidden; height: 320px; padding: 30px;}
.hero-subtitle { font-size: 11px; font-weight: 600; opacity: 0.8; }
.hero-desc { font-size: 14px; opacity: 0.9; }
.hero-button { position: absolute; right: 20px; bottom: 20px; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); padding: 6px 15px; border-radius: 20px; font-size: 12px; }
.mac-section-title { font-size: 20px; font-weight: 600; margin-bottom: 15px; }
.mac-data-card { background: #ffffff; border-radius: 16px; border: 1px solid rgba(0, 0, 0, 0.06); padding: 20px; display: flex; align-items: center; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); }
.card-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; justify-content: center; align-items: center; font-size: 20px; margin-right: 12px; color: white; }
.card-icon.blue { background-color: #007aff; }
.card-icon.purple { background-color: #5856d6; }
.card-icon.green { background-color: #34c759; }
.card-info h3 { font-size: 12px; color: #86868b; margin-bottom: 2px; }
.card-info .number { font-size: 20px; font-weight: 700; }
</style>