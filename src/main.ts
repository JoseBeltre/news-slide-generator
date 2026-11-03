import { createApp } from 'vue'
import './ui/styles.css'
import './ui/fonts'
import './slides/fonts'
import App from './app/App.vue'
import { createAppRouter } from './app/router'
import { createDb } from './data/local/db'
import { dbPlugin } from './data/useDb'
import { applySavedTheme } from './ui/useTheme'

applySavedTheme()
createApp(App).use(dbPlugin(createDb())).use(createAppRouter()).mount('#app')
