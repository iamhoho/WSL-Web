import { createRouter, createWebHistory } from 'vue-router';
import FileManagerView from '../views/FileManagerView.vue';
import TerminalView from '../views/TerminalView.vue';
import GitHubView from '../views/GitHubView.vue';

const routes = [
  { path: '/', redirect: '/files' },
  { path: '/files', name: 'files', component: FileManagerView },
  { path: '/terminal', name: 'terminal', component: TerminalView },
  { path: '/github', name: 'github', component: GitHubView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
