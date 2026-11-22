import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory
} from 'vue-router'
import routes from './routes'
import { useNovelCatalogStore } from '@/stores/novelCatalogStore'

export default function () {
  const createHistory = import.meta.env.SSR
    ? createMemoryHistory
    : import.meta.env.VITE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(import.meta.env.BASE_URL)
  })

  Router.beforeEach((to) => {
    const store = useNovelCatalogStore()
    const needsAuth = to.matched.some((record) => record.meta?.requiresAuth)

    if (needsAuth && !store.isAuthenticated) {
      return { path: '/login' }
    }

    if (to.path === '/login' && store.isAuthenticated) {
      return { path: '/' }
    }
  })

  return Router
}