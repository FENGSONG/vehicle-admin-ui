import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Layout from '../views/Layout.vue'
import VehicleList from '../views/VehicleList.vue'
import Dashboard from '../views/Dashboard.vue' 
import GeofenceMap from '@/views/GeofenceMap.vue'// 引入刚建好的看板页面

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/layout',
      name: 'layout',
      component: Layout,
      redirect: '/layout/dashboard', // 访问 /layout 时，默认重定向到数据大盘
      children: [ //  子路由配置
        {
          path: 'dashboard', 
          name: 'dashboard',
          component: Dashboard
        },
        {
          path: 'vehicle', 
          name: 'vehicle',
          component: VehicleList
        },
        {
        path: 'geofence', 
        name: 'GeofenceMap',
        component: GeofenceMap 
      }
      ]
    }
  ]
})

export default router