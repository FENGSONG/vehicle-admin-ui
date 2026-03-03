import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Layout from '../views/Layout.vue'
import VehicleList from '../views/VehicleList.vue'
import Dashboard from '../views/Dashboard.vue'
import GeofenceMap from '@/views/GeofenceMap.vue'
import UserList from '@/views/UserList.vue'
import ApplicationList from '@/views/ApplicationList.vue'
// 🍎 新增：引入审批待办页面 (请确保 views 目录下有这个文件)
import AuditList from '@/views/AuditList.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/layout',
      name: 'layout',
      component: Layout,
      redirect: '/layout/dashboard', // 访问 /layout 时，默认重定向到数据大盘
      children: [
        //  子路由配置
        {
          path: 'dashboard',
          name: 'dashboard',
          component: Dashboard,
        },
        {
          path: 'vehicle',
          name: 'vehicle',
          component: VehicleList,
        },
        {
          path: 'geofence',
          name: 'GeofenceMap',
          component: GeofenceMap,
        },
        // 🍎 用户模块路由配置
        {
          path: 'user',
          name: 'UserList',
          component: UserList,
        },
        {
          path: 'application',
          name: 'ApplicationList',
          component: ApplicationList,
        },
        // 🍎 新增：审批待办路由配置
        // 访问路径将是：/layout/audit
        {
          path: 'audit',
          name: 'AuditList',
          component: AuditList,
        },
      ],
    },
  ],
})

export default router
