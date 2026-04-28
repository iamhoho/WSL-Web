<template>
  <div class="file-manager">
    <div class="file-tree">
      <div class="tree-header">
        <span>文件浏览器</span>
        <button @click="showNewItemModal = true" title="新建">+</button>
      </div>
      <div class="tree-content">
        <div
          v-for="item in items"
          :key="item.name"
          class="tree-item"
          :class="{ directory: item.type === 'directory' }"
          @click="handleItemClick(item)"
          @dblclick="handleItemDoubleClick(item)"
        >
          <span class="item-icon">{{ item.type === 'directory' ? '📁' : '📄' }}</span>
          <span class="item-name">{{ item.name }}</span>
        </div>
      </div>
      <div class="path-bar">
        <span @click="navigateUp" class="path-up">⬆️</span>
        <span class="current-path">{{ currentPath }}</span>
      </div>
    </div>
    <div class="file-editor">
      <div v-if="selectedFile" class="editor-header">
        <span>{{ selectedFile }}</span>
        <button @click="saveFile">保存</button>
      </div>
      <textarea
        v-if="selectedFile"
        v-model="fileContent"
        class="editor-textarea"
        @input="markUnsaved"
        placeholder="选择文件查看内容..."
      ></textarea>
      <div v-else class="no-file">
        <p>从左侧选择一个文件查看或编辑</p>
      </div>
    </div>

    <div v-if="showNewItemModal" class="modal-overlay" @click.self="showNewItemModal = false">
      <div class="modal">
        <h3>新建文件/文件夹</h3>
        <select v-model="newItemType">
          <option value="file">文件</option>
          <option value="directory">文件夹</option>
        </select>
        <input
          v-model="newItemName"
          placeholder="名称"
          @keyup.enter="createNewItem"
        />
        <div class="modal-buttons">
          <button @click="showNewItemModal = false">取消</button>
          <button @click="createNewItem">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useFileStore } from '../stores/fileStore';

const store = useFileStore();
const items = ref([]);
const currentPath = ref('/home');
const selectedFile = ref(null);
const fileContent = ref('');
const showNewItemModal = ref(false);
const newItemType = ref('file');
const newItemName = ref('');

async function loadDirectory(path) {
  await store.fetchDirectory(path);
  items.value = store.items;
  currentPath.value = store.currentPath;
}

async function handleItemClick(item) {
  if (item.type === 'file') {
    selectedFile.value = `${currentPath.value}/${item.name}`.replace(/\/+/g, '/');
    fileContent.value = await store.readFileContent(selectedFile.value);
    store.openFile(selectedFile.value);
  }
}

async function handleItemDoubleClick(item) {
  if (item.type === 'directory') {
    const newPath = `${currentPath.value}/${item.name}`.replace(/\/+/g, '/');
    await loadDirectory(newPath);
  }
}

function navigateUp() {
  const parts = currentPath.value.split('/').filter(Boolean);
  if (parts.length > 1) {
    parts.pop();
    loadDirectory('/' + parts.join('/'));
  }
}

async function saveFile() {
  if (selectedFile.value) {
    await store.writeFile(selectedFile.value, fileContent.value);
  }
}

function markUnsaved() {
  if (selectedFile.value) {
    store.setUnsaved(selectedFile.value, true);
  }
}

async function createNewItem() {
  if (!newItemName.value) return;
  const fullPath = `${currentPath.value}/${newItemName.value}`.replace(/\/+/g, '/');
  if (newItemType.value === 'file') {
    await store.createFile(fullPath);
  } else {
    await store.createDirectory(fullPath);
  }
  showNewItemModal.value = false;
  newItemName.value = '';
  await loadDirectory(currentPath.value);
}

onMounted(() => {
  loadDirectory('/home');
});
</script>

<style scoped>
.file-manager {
  display: flex;
  height: 100%;
}
.file-tree {
  width: 250px;
  background: #252526;
  color: #ccc;
  display: flex;
  flex-direction: column;
}
.tree-header {
  padding: 12px;
  background: #2d2d2d;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tree-header button {
  background: #0066cc;
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
}
.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.tree-item {
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.tree-item:hover {
  background: #2a2a2a;
}
.item-icon {
  font-size: 14px;
}
.item-name {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.path-bar {
  padding: 8px 12px;
  background: #2d2d2d;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.path-up {
  cursor: pointer;
  padding: 2px 6px;
  background: #3c3c3c;
  border-radius: 3px;
}
.current-path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
}
.editor-header {
  padding: 8px 12px;
  background: #2d2d2d;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #ccc;
}
.editor-header button {
  background: #0066cc;
  border: none;
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
}
.editor-textarea {
  flex: 1;
  background: #1e1e1e;
  color: #ccc;
  border: none;
  padding: 12px;
  font-family: 'Consolas', monospace;
  font-size: 14px;
  resize: none;
  outline: none;
}
.no-file {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal {
  background: #2d2d2d;
  padding: 24px;
  border-radius: 8px;
  width: 300px;
  color: #ccc;
}
.modal h3 {
  margin: 0 0 16px 0;
}
.modal select,
.modal input {
  width: 100%;
  padding: 8px;
  margin-bottom: 12px;
  background: #1e1e1e;
  border: 1px solid #3c3c3c;
  color: #ccc;
  border-radius: 4px;
}
.modal-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.modal-buttons button {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.modal-buttons button:first-child {
  background: #3c3c3c;
  color: #ccc;
}
.modal-buttons button:last-child {
  background: #0066cc;
  color: white;
}
</style>
