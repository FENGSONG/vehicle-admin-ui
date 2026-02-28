import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  //  核心配置：配置本地开发服务器代理
  server: {
    port: 5173, // 前端运行端口
    proxy: {
      '/api': {
        // 这里的 8080 是你后端 Spring Boot 默认启动的端口
        // 如果你的后端改了端口（比如 8081），请把这里也改成 8081
        target: 'http://localhost:8080', 
        changeOrigin: true, // 允许跨域
        // 重写路径：把请求里的 '/api' 自动去掉，再发给后端
        // 这样前端请求 /api/v1/vehicle/select 就会变成 http://localhost:8080/v1/vehicle/select
        rewrite: (path) => path.replace(/^\/api/, '') 
      }
    }
  }
})