// Entrar con un código de 6 dígitos por correo y gestionar el equipo (§8.5). Los errores llegan a la
// interfaz como mensajes en español, sin jerga.
import type { SupabaseClient } from '@supabase/supabase-js'
import { readonly, ref, type Ref } from 'vue'

export interface Session {
  email: string
}

export interface Auth {
  session: Readonly<Ref<Session | null>>
  /** La sesión inicial ya se leyó del navegador. */
  ready: Promise<void>
  canSignIn(email: string): Promise<boolean>
  sendCode(email: string): Promise<void>
  verifyCode(email: string, code: string): Promise<void>
  signOut(): Promise<void>
  /** Solo el rol admin añade o quita personas; ante cualquier error, no. */
  isTeamAdmin(): Promise<boolean>
  listEditors(): Promise<string[]>
  addEditor(email: string): Promise<void>
  removeEditor(email: string): Promise<void>
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase()
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const NO_CONNECTION = 'No hay conexión con la nube. Revisa el internet e intenta de nuevo.'

export function createAuth(client: SupabaseClient): Auth {
  const session = ref<Session | null>(null)
  const toSession = (s: { user?: { email?: string } } | null): Session | null => (s?.user?.email ? { email: s.user.email } : null)
  const ready = client.auth.getSession().then(({ data }) => void (session.value = toSession(data.session)))
  client.auth.onAuthStateChange((_event, s) => void (session.value = toSession(s)))

  return {
    session: readonly(session),
    ready,
    async canSignIn(email) {
      const { data, error } = await client.rpc('can_sign_in', { p_email: normalizeEmail(email) })
      if (error) throw new Error(NO_CONNECTION)
      return data === true
    },
    async sendCode(email) {
      const { error } = await client.auth.signInWithOtp({ email: normalizeEmail(email), options: { shouldCreateUser: true } })
      if (error) throw new Error('No se pudo enviar el código. Espera un minuto e intenta de nuevo.')
    },
    async verifyCode(email, code) {
      const { error } = await client.auth.verifyOtp({ email: normalizeEmail(email), token: code.trim(), type: 'email' })
      if (error) throw new Error('El código no es correcto o ya caducó.')
    },
    async signOut() {
      // Solo este equipo; los datos locales se quedan para poder seguir presentando.
      await client.auth.signOut({ scope: 'local' })
      session.value = null
    },
    async isTeamAdmin() {
      const { data, error } = await client.rpc('is_team_admin')
      return !error && data === true
    },
    async listEditors() {
      const { data, error } = await client.from('editors').select('email').order('email', { ascending: true })
      if (error) throw new Error(NO_CONNECTION)
      return (data as { email: string }[]).map((r) => r.email)
    },
    async addEditor(raw) {
      const email = normalizeEmail(raw)
      if (!EMAIL.test(email)) throw new Error('Escribe un correo válido.')
      const { error } = await client.from('editors').insert({ email })
      if (error?.code === '23505') throw new Error('Ese correo ya está en el equipo.')
      if (error?.code === '42501') throw new Error('Solo un administrador puede añadir personas al equipo.')
      if (error) throw new Error(NO_CONNECTION)
    },
    async removeEditor(email) {
      const { error } = await client.from('editors').delete().eq('email', normalizeEmail(email))
      if (error) throw new Error(NO_CONNECTION)
    },
  }
}
