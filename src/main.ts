import { createApp, shallowRef } from 'vue'
import './ui/styles.css'
import './ui/fonts'
import './slides/fonts'
import App from './app/App.vue'
import { createAppRouter } from './app/router'
import { createDb } from './data/local/db'
import { dbPlugin } from './data/useDb'
import { createSyncContext, syncPlugin, type SyncContext } from './data/sync/useSync'
import { applySavedTheme } from './ui/useTheme'

applySavedTheme()
const db = createDb()
// La nube llega después de montar: abrir y presentar sin internet nunca la esperan (C-03).
const sync = shallowRef<SyncContext | null>(null)
createApp(App).use(dbPlugin(db)).use(syncPlugin(sync)).use(createAppRouter()).mount('#app')
void createSyncContext(db)
  .then((context) => void (sync.value = context))
  .catch((e) => console.error('No se pudo iniciar la sincronización', e))
