import axios from 'axios'
import { ElMessage } from 'element-plus'

// 1. 创建 axios 实例
const request = axios.create({
  // baseURL 设置为 '/api'，这样所有的请求都会自动带上前缀
  // 后面如果你遇到跨域问题，我们可以在 vite.config.js 里用这个前缀做代理映射
  baseURL: '/api', 
  timeout: 10000 // 请求超时时间设置为 10 秒
})

const getStoredUserInfo = () => {
  const raw = sessionStorage.getItem('userInfo') || localStorage.getItem('userInfo') || '{}'
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

const getStoredToken = () => {
  const token = String(sessionStorage.getItem('token') || localStorage.getItem('token') || '').trim()
  if (token) return token
  const userInfo = getStoredUserInfo()
  return String(userInfo.token || '').trim()
}

const clearLoginStorage = () => {
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('userInfo')
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
}

// 2. 请求拦截器 (Request Interceptor)
request.interceptors.request.use(
  config => {
    const token = getStoredToken()
    if (token) {
      config.headers['Authorization'] = token
    }
    return config
  },
  error => {
    console.error('请求发送失败:', error)
    return Promise.reject(error)
  }
)

// 3. 响应拦截器 (Response Interceptor)
request.interceptors.response.use(
  response => {
    // response.data 就是你后端 JsonResult 返回的完整 JSON 对象
    const res = response.data
    const ignoreBusinessCodes = Array.isArray(response?.config?.ignoreBusinessCodes)
      ? response.config.ignoreBusinessCodes.map(item => Number(item))
      : []
    
    // 根据你后端的 JsonResult 规范，通常 code 为 200 代表成功
    if (res.code && res.code !== 2000) {
      if (res.code === 3008 || res.code === 401) {
        clearLoginStorage()
        ElMessage.error('登录状态无效，请重新登录')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(new Error(res.message || '登录状态无效'))
      }
      // 如果后端返回的 code 不是 200，说明业务报错了（比如密码错误），直接弹出提示
      const shouldIgnoreMessage = ignoreBusinessCodes.includes(Number(res.code))
      if (!shouldIgnoreMessage) {
        ElMessage.error(res.message || res.msg || '后端接口返回错误')
      }
      return Promise.reject(new Error(res.message || res.msg || 'Error'))
    } else {
      // 如果成功，直接把数据放行
      return res
    }
  },
  error => {
    // 这里的 error 是指 HTTP 状态码错误，比如 404找不到接口，或者 500后端代码崩了
    console.error('接口响应异常:', error)
    ElMessage.error(error.message || '网络或接口异常，请检查后端服务是否启动')
    return Promise.reject(error)
  }
)

export default request
