// Rutas de la app (SRS §6). Inicio se carga con la app; el resto, al entrar.
import { createRouter, createWebHistory, type RouteRecordRaw, type RouterHistory } from 'vue-router'
import { supabaseConfig } from '../data/sync/supabase'
import HomePage from '../features/home/HomePage.vue'
import { ANNOUNCEMENT_TYPES } from '../slides/types/definitions'

const isKnownType = (id: unknown) => ANNOUNCEMENT_TYPES.some((t) => t.id === id)
/** Entrar y Equipo solo existen si este build tiene nube (P8). */
const needsCloud = () => (supabaseConfig() ? true : { name: 'inicio' })

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
  { path: '/presentaciones/:id/presentar', name: 'presentar', component: () => import('../features/presenting/presenter/PresenterPage.vue'), meta: { bare: true } },
  { path: '/presentaciones/:id/una-ventana', name: 'una-ventana', component: () => import('../features/presenting/single/SingleWindowPage.vue'), meta: { bare: true } },
  { path: '/publica/:id', name: 'publica', component: () => import('../features/presenting/public/PublicPage.vue'), meta: { bare: true } },
  // Sincronización (P8).
  { path: '/entrar', name: 'entrar', component: () => import('../features/sync/signin/SignInPage.vue'), beforeEnter: needsCloud, meta: { bare: true } },
  { path: '/equipo', name: 'equipo', component: () => import('../features/sync/team/TeamPage.vue'), beforeEnter: needsCloud },
  { path: '/:pathMatch(.*)*', redirect: { name: 'inicio' } },
]

export function createAppRouter(history: RouterHistory = createWebHistory()) {
  return createRouter({ history, routes })
}
