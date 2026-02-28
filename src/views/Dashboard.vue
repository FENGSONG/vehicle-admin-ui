<template>
  <div class="mac-page-container">
    <h1 class="mac-page-title">数据大盘</h1>
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
</template>

<script setup>
import { DataLine, Van, User } from '@element-plus/icons-vue'
</script>

<style scoped>
.mac-page-container {
  animation: fadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/*  补回标题的 CSS */
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

/*  核心修复区：给蓝色卡片留出 Logo 避让空间 */
.mac-hero-card {
  position: relative;
  height: 320px;
  border-radius: 18px;
  background: linear-gradient(135deg, #007aff 0%, #00c6ff 100%); 
  color: white;
  padding: 30px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  box-shadow: 0 10px 30px rgba(0, 122, 255, 0.3);
  margin-bottom: 40px;
  overflow: hidden;
  transition: transform 0.3s;
  
  /* 关键句：宽度设定为 100% 减去 280px，右侧正好放下巨型 Logo */
  width: calc(100% - 280px); 
}

.mac-hero-card:hover { transform: scale(1.01); }
.hero-subtitle { font-size: 13px; font-weight: 600; opacity: 0.8; text-transform: uppercase; margin-bottom: 4px; }
.hero-title { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
.hero-desc { font-size: 15px; opacity: 0.9; }
.hero-button { position: absolute; right: 30px; bottom: 30px; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); padding: 8px 20px; border-radius: 20px; font-weight: 600; font-size: 14px; cursor: pointer; }

.mac-section-title { font-size: 22px; font-weight: 600; color: #1d1d1f; margin-bottom: 20px; }
.mac-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.mac-data-card { background: #ffffff; border-radius: 16px; border: 1px solid rgba(0, 0, 0, 0.06); padding: 24px; display: flex; align-items: center; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); transition: box-shadow 0.3s; }
.mac-data-card:hover { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); }
.card-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; justify-content: center; align-items: center; font-size: 24px; margin-right: 16px; color: white; }
.card-icon.blue { background-color: #007aff; }
.card-icon.purple { background-color: #5856d6; }
.card-icon.green { background-color: #34c759; }
.card-info h3 { font-size: 13px; color: #86868b; font-weight: 500; margin-bottom: 4px; }
.card-info .number { font-size: 24px; font-weight: 700; color: #1d1d1f; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

/*  响应式适配：当屏幕变窄时，取消宽度限制，改为全宽 */
@media (max-width: 1024px) {
  .mac-hero-card {
    width: 100%;
    margin-top: 60px; /* 屏幕窄时，Logo可能会变居中，我们用 top 顶开 */
  }
}
</style>