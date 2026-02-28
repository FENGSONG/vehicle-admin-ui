<template>
  <div class="mac-login-container">
    <div class="liquid-bg-container">
      <div class="liquid-blob blob-blue"></div>
      <div class="liquid-blob blob-white"></div> 
      <div class="liquid-blob blob-skyblue"></div> 
    </div>

    <div class="mac-login-card">
      <div class="mac-header">
        <div class="mac-icon-box">
          <img src="../assets/logo.png" alt="北华大学校徽" class="mac-logo-img" />
        </div>
        <h1 class="mac-title">北华智行</h1>
        <p class="mac-subtitle">北华大学车辆智能调度与管理平台</p>
      </div>
      
      <el-form :model="loginForm" @keyup.enter="handleLogin" class="mac-form">
        <el-form-item>
          <el-input 
            v-model="loginForm.username" 
            placeholder="管理员账号" 
            class="mac-input"
          />
        </el-form-item>
        
        <el-form-item>
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="密码" 
            show-password 
            class="mac-input"
          />
        </el-form-item>
        
        <el-button type="primary" class="mac-button" @click="handleLogin" :loading="loading" round>
          <span v-if="!loading">登录系统</span>
          <span v-else>正在验证...</span>
        </el-button>
      </el-form>

      <div class="mac-footer">
        遇到问题？ <a href="#">联系技术支持 ↗</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage({
      message: '请填写完整的登录信息',
      type: 'warning',
      customClass: 'mac-message'
    })
    return
  }
  
  loading.value = true
  
  try {
    const response = await axios.post('http://localhost:8080/v1/user/login', {
      username: loginForm.username,
      password: loginForm.password
    })

    if (response.data.code === 2000) {
      ElMessage({
        message: `欢迎回来，${loginForm.username}`,
        type: 'success',
        customClass: 'mac-message'
      })
      router.push('/layout')
    } else {
      ElMessage({
        message: response.data.message || '账号或密码错误',
        type: 'error',
        customClass: 'mac-message'
      })
    }
  } catch (error) {
    ElMessage({
      message: '服务器连接失败，请稍后再试',
      type: 'error',
      customClass: 'mac-message'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/*  整体容器与字体 */
.mac-login-container {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  height: 100vh;
  width: 100vw;
  margin: -8px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #e6f0fa;
  position: relative;
  overflow: hidden;
}

/* 🌊 动态蓝白液体背景容器 */
.liquid-bg-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  filter: blur(120px); 
  will-change: transform, filter;
  opacity: 0.9;
}

/* 液体光斑的基础样式 */
.liquid-blob {
  position: absolute;
  border-radius: 50%;
  mix-blend-mode: normal; 
  animation-timing-function: cubic-bezier(0.45, 0.05, 0.55, 0.95);
  animation-iteration-count: infinite;
}

.blob-blue {
  top: -20%; left: -20%; width: 70vw; height: 70vw;
  background: rgba(0, 122, 255, 0.4); 
  animation-name: moveBlue; animation-duration: 25s;
}

.blob-white {
  bottom: -30%; right: -30%; width: 85vw; height: 85vw;
  background: rgba(255, 255, 255, 0.9); 
  animation-name: moveWhite; animation-duration: 30s; animation-delay: -5s;
}

.blob-skyblue {
  top: 30%; left: 40%; width: 60vw; height: 60vw;
  background: rgba(90, 200, 250, 0.5); 
  animation-name: moveSkyblue; animation-duration: 35s; animation-delay: -10s;
}

@keyframes moveBlue {
  0% { transform: translate(0, 0) rotate(0deg) scale(1); }
  33% { transform: translate(30vw, 20vh) rotate(120deg) scale(1.1); }
  66% { transform: translate(-10vw, 40vh) rotate(240deg) scale(0.9); }
  100% { transform: translate(0, 0) rotate(360deg) scale(1); }
}

@keyframes moveWhite {
  0% { transform: translate(0, 0) rotate(0deg) scale(1); }
  33% { transform: translate(-30vw, -30vh) rotate(-90deg) scale(1.15); }
  66% { transform: translate(20vw, -10vh) rotate(-180deg) scale(0.95); }
  100% { transform: translate(0, 0) rotate(-360deg) scale(1); }
}

@keyframes moveSkyblue {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-20vw, 20vh) scale(1.2); }
  100% { transform: translate(0, 0) scale(1); }
}

/* ---------------------------------- */
/*  登录卡片样式 */
/* ---------------------------------- */
.mac-login-card {
  z-index: 10;
  width: 380px;
  padding: 45px 40px;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 30px 60px rgba(0, 122, 255, 0.1);
  text-align: center;
  animation: cardPopup 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes cardPopup {
  from { opacity: 0; transform: scale(0.95) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.mac-header { margin-bottom: 30px; }

/* 🎓 校徽图片容器专门优化 */
/* 🎓 校徽毛玻璃盒子（放大两倍） */
.mac-icon-box {
  width: 136px; /* 原来是 68px */
  height: 136px; /* 原来是 68px */
  background: rgba(255, 255, 255, 0.5);
  border-radius: 32px; /* 圆角也要跟着放大，保持苹果的Squircle曲线 */
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px; /* 底部间距稍微加大一点 */
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08); /* 阴影也跟着等比增强 */
  border: 1px solid rgba(255, 255, 255, 0.9);
}

/* 🎓 校徽图片本身（放大两倍） */
.mac-logo-img { 
  width: 100px; /* 原来是 50px */
  height: 100px; /* 原来是 50px */
  object-fit: contain; 
}

.mac-title {
  font-size: 26px; font-weight: 700; color: #1d1d1f; margin: 0 0 6px; letter-spacing: 1px;
}
.mac-subtitle {
  font-size: 14px; color: #86868b; margin: 0; font-weight: 500;
}

/* 输入框微调 */
:deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.7) !important;
  border-radius: 14px !important;
  box-shadow: none !important;
  padding: 6px 15px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}
:deep(.el-input__wrapper.is-focus) {
  background-color: #ffffff !important;
  border-color: #007aff !important;
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.15) !important;
}
:deep(.el-input__inner) {
  height: 36px; font-size: 16px; color: #1d1d1f; text-align: center;
}

/* 按钮微调 */
.mac-button {
  width: 100%; height: 52px; font-size: 17px; font-weight: 600; margin-top: 15px;
  background: linear-gradient(to right, #007aff, #5ac8fa) !important;
  border: none !important;
  box-shadow: 0 8px 20px rgba(0, 122, 255, 0.25);
  transition: all 0.3s ease;
}
.mac-button:hover {
  transform: scale(1.02);
  box-shadow: 0 12px 25px rgba(0, 122, 255, 0.35);
}

.mac-footer {
  margin-top: 30px; font-size: 13px; color: #86868b;
}
.mac-footer a {
  color: #007aff; text-decoration: none;
}
</style>