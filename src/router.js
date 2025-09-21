import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import LogViewer from './components/LogViewer.vue';

const routes = [
  { path: '/', component: App },
  { path: '/logs', component: LogViewer },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;