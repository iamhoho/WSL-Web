import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

const client = axios.create({ baseURL: '/api/files' });

export const useFileStore = defineStore('files', () => {
  const currentPath = ref('/home');
  const items = ref([]);
  const selectedFile = ref(null);
  const openFiles = ref([]);
  const unsavedChanges = ref({});

  async function fetchDirectory(path) {
    try {
      const response = await client.get('/readdir', { params: { path } });
      items.value = response.data.items;
      currentPath.value = response.data.path;
    } catch (error) {
      console.error('Failed to fetch directory:', error);
    }
  }

  async function readFileContent(path) {
    try {
      const response = await client.get('/read', { params: { path } });
      return response.data.content;
    } catch (error) {
      console.error('Failed to read file:', error);
      return '';
    }
  }

  async function writeFile(path, content) {
    try {
      await client.post('/write', { path, content });
      unsavedChanges.value[path] = false;
      return true;
    } catch (error) {
      console.error('Failed to write file:', error);
      return false;
    }
  }

  async function createFile(path) {
    try {
      await client.post('/write', { path, content: '' });
      await fetchDirectory(currentPath.value);
      return true;
    } catch (error) {
      console.error('Failed to create file:', error);
      return false;
    }
  }

  async function createDirectory(path) {
    try {
      await client.post('/mkdir', { path });
      await fetchDirectory(currentPath.value);
      return true;
    } catch (error) {
      console.error('Failed to create directory:', error);
      return false;
    }
  }

  async function deleteItem(path) {
    try {
      await client.delete('/delete', { data: { path } });
      await fetchDirectory(currentPath.value);
      return true;
    } catch (error) {
      console.error('Failed to delete:', error);
      return false;
    }
  }

  async function rename(oldPath, newPath) {
    try {
      await client.post('/rename', { oldPath, newPath });
      await fetchDirectory(currentPath.value);
      return true;
    } catch (error) {
      console.error('Failed to rename:', error);
      return false;
    }
  }

  function openFile(path) {
    if (!openFiles.value.includes(path)) {
      openFiles.value.push(path);
    }
    selectedFile.value = path;
  }

  function closeFile(path) {
    const index = openFiles.value.indexOf(path);
    if (index > -1) {
      openFiles.value.splice(index, 1);
    }
    delete unsavedChanges.value[path];
    if (selectedFile.value === path) {
      selectedFile.value = openFiles.value[0] || null;
    }
  }

  function setUnsaved(path, changed) {
    unsavedChanges.value[path] = changed;
  }

  return {
    currentPath,
    items,
    selectedFile,
    openFiles,
    unsavedChanges,
    fetchDirectory,
    readFileContent,
    writeFile,
    createFile,
    createDirectory,
    deleteItem,
    rename,
    openFile,
    closeFile,
    setUnsaved,
  };
});
