// Rutas de la app (SRS §6). Inicio se carga con la app; el resto, al entrar.
import { createRouter, createWebHistory, type RouteRecordRaw, type RouterHistory } from 'vue-router'
import HomePage from '../features/home/HomePage.vue'
import { ANNOUNCEMENT_TYPES } from '../slides/types/definitions'

const isKnownType = (id: unknown) => ANNOUNCEMENT_TYPES.some((t) => t.id === id)

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'inicio', component: HomePage },
  { path: '/anuncios', name: 'anuncios', component: () => import('../features/announcements/list/AnnouncementsPage.vue') },
  { path: '/anuncios/nuevo', name: 'nuevo', component: () => import('../features/announcements/new/NewAnnouncementPage.vue') },
  {
    path: '/anuncios/nuevo/:typeId',
    name: 'nuevo-tipo',
    component: () => import('../features/announcements/editor/EditorPage.vue'),
    beforeEnter: (to) => (isKnownType(to.params.typeId) ? true : { name: 'nuevo' }),
  },
  { path: '/anuncios/:id', name: 'editar', component: () => import('../features/announcements/editor/EditorPage.vue') },
  { path: '/presentaciones', name: 'presentaciones', component: () => import('../features/presentations/list/PresentationsPage.vue') },
  { path: '/presentaciones/:id', name: 'presentacion', component: () => import('../features/presentations/detail/PresentationPage.vue') },
  // Presentar (P6): sin el marco de la app (meta.bare).
  { path: '/publica/:id', name: 'publica', component: () => import('../features/presenting/public/PublicPage.vue'), meta: { bare: true } },
  { path: '/:pathMatch(.*)*', redirect: { name: 'inicio' } },
]

export function createAppRouter(history: RouterHistory = createWebHistory()) {
  return createRouter({ history, routes })
}
