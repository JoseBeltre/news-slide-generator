import { createApp } from 'vue'
import './ui/styles.css'
import './ui/fonts'
import './slides/fonts'
import App from './app/App.vue'
import { createAppRouter } from './app/router'

createApp(App).use(createAppRouter()).mount('#app')
