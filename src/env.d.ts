/// <reference types="vite/client" />

// Nube (§8.5): públicas por diseño, la protección está en RLS. Sin ellas no se sincroniza.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
}
