import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import AppWrapper from './AppWrapper.vue'
import router from './router'

const app = createApp(AppWrapper)

app.use(ElementPlus)
app.use(router)
app.mount('#app')
