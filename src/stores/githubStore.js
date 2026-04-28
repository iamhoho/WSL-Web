import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

const client = axios.create({ baseURL: '/api' });

export const useGitHubStore = defineStore('github', () => {
  const user = ref(null);
  const isAuthenticated = ref(false);
  const repos = ref([]);
  const stagedFiles = ref([]);

  async function checkAuth() {
    try {
      const response = await client.get('/auth/github/user');
      user.value = response.data;
      isAuthenticated.value = true;
    } catch {
      user.value = null;
      isAuthenticated.value = false;
    }
  }

  function login() {
    window.location.href = '/api/auth/github';
  }

  async function logout() {
    try {
      await client.post('/auth/github/logout');
      user.value = null;
      isAuthenticated.value = false;
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  async function initRepo(repoPath) {
    try {
      await client.post('/github/init', { repoPath });
      return true;
    } catch (error) {
      console.error('Failed to init repo:', error);
      return false;
    }
  }

  async function commit(repoPath, message) {
    try {
      const response = await client.post('/github/commit', { repoPath, message });
      return response.data.sha;
    } catch (error) {
      console.error('Failed to commit:', error);
      return null;
    }
  }

  async function getStatus(repoPath) {
    try {
      const response = await client.get('/github/status', { params: { repoPath } });
      stagedFiles.value = response.data.files;
      return response.data.files;
    } catch (error) {
      console.error('Failed to get status:', error);
      return [];
    }
  }

  return {
    user,
    isAuthenticated,
    repos,
    stagedFiles,
    checkAuth,
    login,
    logout,
    initRepo,
    commit,
    getStatus,
  };
});
