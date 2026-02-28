<template>
  <div class="mac-layout">
    <div class="mac-sidebar">
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
        @click="activeMenu = item.index"
      >
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ item.title }}</span>
      </div>

      <div class="spacer"></div> <div class="mac-user-profile" @click="handleLogout">
        <img src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" class="mac-avatar" />
        <span class="mac-username">管理员</span>
        <el-icon class="logout-icon"><SwitchButton /></el-icon>
      </div>
    </div>

    <div class="mac-main">
      <div class="mac-content">
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search, DataLine, Van, User, SwitchButton } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const searchQuery = ref('')
const activeMenu = ref('1')

// 菜单数据
const menuItems = [
  { index: '1', title: '数据大盘', icon: DataLine },
  { index: '2', title: '车辆管理', icon: Van },
  { index: '3', title: '用户管理', icon: User }
]

// 退出登录带有苹果风格的确认框
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
/*  核心苹果字体与背景底色 */
.mac-layout {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  display: flex;
  height: 100vh;
  margin: -8px; /* 抵消浏览器默认边距 */
  background-color: #f5f5f7; /* Mac 经典的底层浅灰底色 */
  overflow: hidden;
}

/*  侧边栏：毛玻璃特效 */
.mac-sidebar {
  width: 260px;
  background-color: rgba(235, 235, 240, 0.75); /* 半透明背景 */
  backdrop-filter: blur(25px); /* 毛玻璃模糊参数 */
  -webkit-backdrop-filter: blur(25px);
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  padding: 20px 12px;
  z-index: 10;
}

.mac-search-box {
  margin-bottom: 20px;
  padding: 0 10px;
}
/* 深度修改 Element 输入框样式使其圆润 */
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
  letter-spacing: 0.5px;
}

/* 菜单项：选中时的高亮圆角蓝底 */
.mac-menu-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 6px;
  color: #1d1d1f;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}
.mac-menu-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
.mac-menu-item.active {
  background-color: #007aff; /* 苹果系统级蓝色 */
  color: white;
}
.mac-menu-item .el-icon {
  margin-right: 10px;
  font-size: 18px;
}

/* 侧边栏底部个人信息 */
.spacer {
  flex: 1;
}
.mac-user-profile {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.mac-user-profile:hover {
  background-color: rgba(0, 0, 0, 0.05);
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
  color: #1d1d1f;
  flex: 1;
}
.logout-icon {
  color: #ff3b30; /* 苹果系统级红色 */
  font-size: 16px;
}

/*  主内容区：纯白背景，大圆角 */
.mac-main {
  flex: 1;
  background-color: #ffffff;
  overflow-y: auto;
}

.mac-content {
  padding: 40px 60px;
  max-width: 1200px;
  margin: 0 auto;
}

.mac-page-title {
  font-size: 34px;
  font-weight: 700;
  color: #1d1d1f;
  letter-spacing: -0.5px;
  margin-bottom: 5px;
}
.mac-divider {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
}

/*  类似 App Store 推荐位的大卡片 */
.mac-hero-card {
  position: relative;
  height: 320px;
  border-radius: 18px;
  background: linear-gradient(135deg, #007aff 0%, #00c6ff 100%); /* 渐变色模拟海报 */
  color: white;
  padding: 30px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  box-shadow: 0 10px 30px rgba(0, 122, 255, 0.3);
  margin-bottom: 40px;
  overflow: hidden;
  transition: transform 0.3s;
}
.mac-hero-card:hover {
  transform: scale(1.01);
}
.hero-subtitle {
  font-size: 13px;
  font-weight: 600;
  opacity: 0.8;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.hero-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}
.hero-desc {
  font-size: 15px;
  opacity: 0.9;
}
.hero-button {
  position: absolute;
  right: 30px;
  bottom: 30px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 8px 20px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}
.hero-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

/*  数据展示小卡片 */
.mac-section-title {
  font-size: 22px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 20px;
}
.mac-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.mac-data-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 24px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.3s;
}
.mac-data-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
.card-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  margin-right: 16px;
  color: white;
}
.card-icon.blue { background-color: #007aff; }
.card-icon.purple { background-color: #5856d6; }
.card-icon.green { background-color: #34c759; }

.card-info h3 {
  font-size: 13px;
  color: #86868b;
  font-weight: 500;
  margin-bottom: 4px;
}
.card-info .number {
  font-size: 24px;
  font-weight: 700;
  color: #1d1d1f;
}
</style>