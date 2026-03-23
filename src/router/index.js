import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Layout from '../views/Layout.vue'
import VehicleList from '../views/VehicleList.vue'
import Dashboard from '../views/Dashboard.vue'
import GeofenceMap from '@/views/GeofenceMap.vue'
import UserList from '@/views/UserList.vue'
import ApplicationList from '@/views/ApplicationList.vue'
import AuditList from '@/views/AuditList.vue'
import DictCenter from '@/views/DictCenter.vue'
import VehicleMaintain from '@/views/VehicleMaintain.vue'
import OrgList from '@/views/OrgList.vue'
import RoleList from '@/views/RoleList.vue'
import ReportCenter from '@/views/ReportCenter.vue'

const getCurrentUserInfo = () => {
  try {
    return JSON.parse(sessionStorage.getItem('userInfo') || localStorage.getItem('userInfo') || '{}')
  } catch {
    return {}
  }
}

const getCurrentUserLevel = () => String(getCurrentUserInfo().level || '').trim()

const getCurrentMenuPerms = () => {
  const userInfo = getCurrentUserInfo()
  if (Array.isArray(userInfo.menuPermList)) {
    return userInfo.menuPermList.map((item) => String(item || '').trim()).filter((item) => !!item)
  }
  const rawPerms = String(userInfo.menuPerms || '').trim()
  if (!rawPerms) return []
  return rawPerms.split(',').map((item) => String(item || '').trim()).filter((item) => !!item)
}

const hasMenuPerm = (permCode) => {
  if (!permCode) return true
  const level = getCurrentUserLevel()
  if (level === '99') return true
  const perms = getCurrentMenuPerms()
  if (!perms.length) {
    const fallbackPermMap = {
      10: ['application:view'],
      20: ['application:view', 'audit:view', 'report:view'],
      30: ['application:view', 'audit:view', 'report:view'],
      40: ['application:view', 'audit:view', 'report:view'],
      50: ['application:view', 'audit:view', 'report:view'],
    }
    const fallbackPerms = fallbackPermMap[level] || []
    return fallbackPerms.includes(permCode)
  }
  return perms.includes('*') || perms.includes(permCode)
}

const getDefaultLayoutPath = () => {
  const candidates = [
    { path: '/layout/dashboard', perm: 'dashboard:view' },
    { path: '/layout/application', perm: 'application:view' },
    { path: '/layout/audit', perm: 'audit:view' },
    { path: '/layout/report', perm: 'report:view' },
    { path: '/layout/vehicle', perm: 'vehicle:view' },
  ]
  for (const item of candidates) {
    if (hasMenuPerm(item.perm)) return item.path
  }
  return '/layout/application'
}

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
      redirect: () => getDefaultLayoutPath(),
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: Dashboard,
          meta: { perm: 'dashboard:view' },
        },
        {
          path: 'vehicle',
          name: 'vehicle',
          component: VehicleList,
          meta: { perm: 'vehicle:view' },
        },
        {
          path: 'geofence',
          name: 'GeofenceMap',
          component: GeofenceMap,
          meta: { perm: 'geofence:view' },
        },
        {
          path: 'user',
          name: 'UserList',
          component: UserList,
          meta: { perm: 'user:manage' },
        },
        {
          path: 'org',
          name: 'OrgList',
          component: OrgList,
          meta: { perm: 'org:manage' },
        },
        {
          path: 'role',
          name: 'RoleList',
          component: RoleList,
          meta: { perm: 'role:manage' },
        },
        {
          path: 'application',
          name: 'ApplicationList',
          component: ApplicationList,
          meta: { perm: 'application:view' },
        },
        {
          path: 'audit',
          name: 'AuditList',
          component: AuditList,
          meta: { perm: 'audit:view' },
        },
        {
          path: 'dict-center',
          name: 'DictCenter',
          component: DictCenter,
          meta: { perm: 'dict:manage' },
        },
        {
          path: 'report',
          name: 'ReportCenter',
          component: ReportCenter,
          meta: { perm: 'report:view' },
        },
        {
          path: 'vehicle-maintain',
          name: 'VehicleMaintain',
          component: VehicleMaintain,
          meta: { perm: 'vehicle:maintain:view' },
        },
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  const token = String(sessionStorage.getItem('token') || localStorage.getItem('token') || '').trim()

  if (!token && to.path !== '/login') {
    next('/login')
    return
  }

  if (token && to.path === '/login') {
    next(getDefaultLayoutPath())
    return
  }

  if (to.meta?.perm && !hasMenuPerm(to.meta.perm)) {
    next(getDefaultLayoutPath())
    return
  }

  next()
})

export default router
