<template>
  <div class="file-manager">
    <div class="file-tree">
      <div class="tree-header">
        <span class="header-title">
          <FolderTree :size="16" />
          文件浏览器
        </span>
        <div class="header-actions">
          <button @click="loadDirectory(currentPath)" class="icon-btn" title="刷新">
            <RefreshCw :size="16" :class="{ spinning: isLoading }" />
          </button>
          <button @click="showNewItemModal = true" class="icon-btn" title="新建">
            <FolderPlus :size="16" />
          </button>
        </div>
      </div>

      <div class="search-bar">
        <Search :size="14" class="search-icon" />
        <input
          v-model="searchQuery"
          placeholder="搜索文件..."
          class="search-input"
        />
      </div>

      <div class="tree-content">
        <div v-if="isLoading" class="loading">
          <Loader2 :size="24" class="spinning" />
          <span>加载中...</span>
        </div>

        <div v-else-if="filteredItems.length === 0" class="empty">
          <FolderOpen :size="32" />
          <span>{{ searchQuery ? '没有找到文件' : '空目录' }}</span>
        </div>

        <div
          v-else
          v-for="item in filteredItems"
          :key="item.name"
          class="tree-item"
          :class="{ directory: item.type === 'directory', selected: selectedItem?.name === item.name }"
          @click="handleItemClick(item)"
          @dblclick="handleItemDoubleClick(item)"
          @contextmenu.prevent="showContextMenu($event, item)"
        >
          <component :is="getFileIcon(item)" :size="16" class="item-icon" />
          <span class="item-name">{{ item.name }}</span>
          <span class="item-size">{{ formatSize(item.size) }}</span>
        </div>
      </div>

      <div class="path-bar">
        <button @click="navigateUp" class="path-btn" :disabled="currentPath === '/home'">
          <ChevronUp :size="14" />
        </button>
        <input
          v-model="currentPath"
          @keyup.enter="navigateToPath"
          class="path-input"
        />
        <button @click="loadDirectory(currentPath)" class="path-btn">
          <ArrowRight :size="14" />
        </button>
      </div>
    </div>

    <div class="file-editor">
      <div v-if="selectedFile" class="editor-header">
        <div class="file-info">
          <FileCode :size="16" />
          <span class="file-name">{{ selectedFile.split('/').pop() }}</span>
          <span v-if="unsavedChanges[selectedFile]" class="unsaved-dot" title="未保存"></span>
        </div>
        <div class="editor-actions">
          <button @click="saveFile" class="action-btn primary" :disabled="!unsavedChanges[selectedFile]">
            <Save :size="14" />
            保存
          </button>
        </div>
      </div>

      <textarea
        v-if="selectedFile"
        v-model="fileContent"
        class="editor-textarea"
        @input="markUnsaved"
        spellcheck="false"
      ></textarea>

      <div v-else class="no-file">
        <FileQuestion :size="48" />
        <p>选择一个文件查看或编辑</p>
      </div>
    </div>

    <div v-if="contextMenuVisible" class="context-menu" :style="contextMenuStyle">
      <button @click="handleRename" class="context-item">
        <Pencil :size="14" />
        重命名
      </button>
      <button @click="handleDelete" class="context-item danger">
        <Trash2 :size="14" />
        删除
      </button>
    </div>

    <Teleport to="body">
      <div v-if="showNewItemModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <FolderPlus :size="20" />
            <h3>新建{{ newItemType === 'file' ? '文件' : '文件夹' }}</h3>
          </div>
          <div class="modal-body">
            <select v-model="newItemType" class="modal-select">
              <option value="file">文件</option>
              <option value="directory">文件夹</option>
            </select>
            <input
              v-model="newItemName"
              placeholder="输入名称"
              class="modal-input"
              @keyup.enter="createNewItem"
            />
          </div>
          <div class="modal-footer">
            <button @click="closeModal" class="btn secondary">取消</button>
            <button @click="createNewItem" class="btn primary" :disabled="!newItemName">创建</button>
          </div>
        </div>
      </div>

      <div v-if="showRenameModal" class="modal-overlay" @click.self="showRenameModal = false">
        <div class="modal">
          <div class="modal-header">
            <Pencil :size="20" />
            <h3>重命名</h3>
          </div>
          <div class="modal-body">
            <input
              v-model="renameTarget"
              placeholder="新名称"
              class="modal-input"
              @keyup.enter="confirmRename"
            />
          </div>
          <div class="modal-footer">
            <button @click="showRenameModal = false" class="btn secondary">取消</button>
            <button @click="confirmRename" class="btn primary" :disabled="!renameTarget">确定</button>
          </div>
        </div>
      </div>

      <div v-if="notification" class="notification" :class="notification.type">
        <CheckCircle v-if="notification.type === 'success'" :size="18" />
        <AlertCircle v-else :size="18" />
        <span>{{ notification.message }}</span>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  FolderTree, FolderOpen, FolderPlus, Search, RefreshCw, Loader2,
  ChevronUp, ArrowRight, FileCode, FileQuestion, Pencil, Trash2,
  Save, CheckCircle, AlertCircle, File, FolderClosed
} from 'lucide-vue-next';
import { useFileStore } from '../stores/fileStore';

const store = useFileStore();
const items = ref([]);
const currentPath = ref('/home');
const selectedFile = ref(null);
const fileContent = ref('');
const isLoading = ref(false);
const searchQuery = ref('');
const unsavedChanges = ref({});
const contextMenuVisible = ref(false);
const contextMenuStyle = ref({});
const selectedItem = ref(null);

const showNewItemModal = ref(false);
const showRenameModal = ref(false);
const newItemType = ref('file');
const newItemName = ref('');
const renameTarget = ref('');
const renameOldPath = ref('');

const notification = ref(null);

const filteredItems = computed(() => {
  if (!searchQuery.value) return items.value;
  const query = searchQuery.value.toLowerCase();
  return items.value.filter(item => item.name.toLowerCase().includes(query));
});

function getFileIcon(item) {
  if (item.type === 'directory') return FolderClosed;
  return File;
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
}

function showNotification(message, type = 'success') {
  notification.value = { message, type };
  setTimeout(() => { notification.value = null; }, 3000);
}

async function loadDirectory(path) {
  isLoading.value = true;
  try {
    await store.fetchDirectory(path);
    items.value = store.items;
    currentPath.value = store.currentPath;
  } catch (error) {
    showNotification('加载目录失败', 'error');
  } finally {
    isLoading.value = false;
  }
}

function handleItemClick(item) {
  selectedItem.value = item;
  if (item.type === 'file') {
    openFile(item);
  }
}

async function openFile(item) {
  const fullPath = `${currentPath.value}/${item.name}`.replace(/\/+/g, '/');
  selectedFile.value = fullPath;
  fileContent.value = await store.readFileContent(fullPath);
  store.openFile(fullPath);
}

function handleItemDoubleClick(item) {
  if (item.type === 'directory') {
    const newPath = `${currentPath.value}/${item.name}`.replace(/\/+/g, '/');
    loadDirectory(newPath);
  }
}

function showContextMenu(event, item) {
  selectedItem.value = item;
  contextMenuStyle.value = {
    top: event.clientY + 'px',
    left: event.clientX + 'px'
  };
  contextMenuVisible.value = true;
}

function closeContextMenu() {
  contextMenuVisible.value = false;
}

function handleRename() {
  if (selectedItem.value) {
    renameOldPath.value = `${currentPath.value}/${selectedItem.value.name}`.replace(/\/+/g, '/');
    renameTarget.value = selectedItem.value.name;
    showRenameModal.value = true;
  }
  closeContextMenu();
}

async function confirmRename() {
  if (!renameTarget.value || !renameOldPath.value) return;
  const newPath = `${currentPath.value}/${renameTarget.value}`.replace(/\/+/g, '/');
  const success = await store.rename(renameOldPath.value, newPath);
  if (success) {
    showNotification('重命名成功');
    await loadDirectory(currentPath.value);
  } else {
    showNotification('重命名失败', 'error');
  }
  showRenameModal.value = false;
}

async function handleDelete() {
  if (!selectedItem.value) return;
  if (!confirm(`确定删除 "${selectedItem.value.name}"？`)) return;

  const fullPath = `${currentPath.value}/${selectedItem.value.name}`.replace(/\/+/g, '/');
  const success = await store.deleteItem(fullPath);
  if (success) {
    showNotification('删除成功');
    await loadDirectory(currentPath.value);
  } else {
    showNotification('删除失败', 'error');
  }
  closeContextMenu();
}

function navigateUp() {
  const parts = currentPath.value.split('/').filter(Boolean);
  if (parts.length > 1) {
    parts.pop();
    loadDirectory('/' + parts.join('/'));
  }
}

function navigateToPath() {
  loadDirectory(currentPath.value);
}

async function saveFile() {
  if (!selectedFile.value) return;
  const success = await store.writeFile(selectedFile.value, fileContent.value);
  if (success) {
    unsavedChanges.value[selectedFile.value] = false;
    showNotification('保存成功');
  } else {
    showNotification('保存失败', 'error');
  }
}

function markUnsaved() {
  if (selectedFile.value) {
    unsavedChanges.value[selectedFile.value] = true;
  }
}

async function createNewItem() {
  if (!newItemName.value) return;
  const fullPath = `${currentPath.value}/${newItemName.value}`.replace(/\/+/g, '/');

  let success;
  if (newItemType.value === 'file') {
    success = await store.createFile(fullPath);
  } else {
    success = await store.createDirectory(fullPath);
  }

  if (success) {
    showNotification(`${newItemType.value === 'file' ? '文件' : '文件夹'}创建成功`);
    await loadDirectory(currentPath.value);
  } else {
    showNotification('创建失败', 'error');
  }
  closeModal();
}

function closeModal() {
  showNewItemModal.value = false;
  newItemName.value = '';
}

onMounted(() => {
  loadDirectory('/home');
  document.addEventListener('click', closeContextMenu);
});

onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu);
});
</script>

<style scoped>
.file-manager {
  display: flex;
  height: 100%;
  background: #0d1117;
}

.file-tree {
  width: 280px;
  background: #161b22;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.tree-header {
  padding: 12px 16px;
  background: #1c2128;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #e0e0e0;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  background: transparent;
  border: none;
  color: #8b949e;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
}

.search-bar {
  padding: 8px 12px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 22px;
  top: 50%;
  transform: translateY(-50%);
  color: #8b949e;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 32px;
  background: #0d1117;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #e0e0e0;
  font-size: 13px;
}

.search-input:focus {
  outline: none;
  border-color: #00d9ff;
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.loading, .empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px;
  color: #8b949e;
  font-size: 13px;
}

.tree-item {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.15s;
}

.tree-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.tree-item.selected {
  background: rgba(0, 217, 255, 0.15);
}

.item-icon {
  flex-shrink: 0;
  color: #8b949e;
}

.tree-item.directory .item-icon {
  color: #00d9ff;
}

.item-name {
  flex: 1;
  font-size: 13px;
  color: #e0e0e0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-size {
  font-size: 11px;
  color: #6e7681;
}

.path-bar {
  padding: 8px 12px;
  background: #1c2128;
  display: flex;
  gap: 6px;
  align-items: center;
}

.path-btn {
  background: #21262d;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #8b949e;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.path-btn:hover:not(:disabled) {
  background: #30363d;
  color: #e0e0e0;
}

.path-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.path-input {
  flex: 1;
  padding: 6px 10px;
  background: #0d1117;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: #e0e0e0;
  font-size: 12px;
}

.path-input:focus {
  outline: none;
  border-color: #00d9ff;
}

.file-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #0d1117;
}

.editor-header {
  padding: 12px 16px;
  background: #161b22;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8b949e;
  font-size: 13px;
}

.file-name {
  color: #e0e0e0;
}

.unsaved-dot {
  width: 8px;
  height: 8px;
  background: #f0883e;
  border-radius: 50%;
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background: #238636;
  color: #fff;
}

.action-btn.primary:hover:not(:disabled) {
  background: #2ea043;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.editor-textarea {
  flex: 1;
  background: #0d1117;
  color: #c9d1d9;
  border: none;
  padding: 16px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
}

.no-file {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #6e7681;
}

.no-file p {
  font-size: 14px;
}

.context-menu {
  position: fixed;
  background: #21262d;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 4px;
  min-width: 120px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 1000;
}

.context-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: #e0e0e0;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  text-align: left;
}

.context-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.context-item.danger {
  color: #f85149;
}

.context-item.danger:hover {
  background: rgba(248, 81, 73, 0.15);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #21262d;
  border-radius: 12px;
  width: 360px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: #1c2128;
  color: #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 15px;
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-select, .modal-input {
  padding: 10px 12px;
  background: #0d1117;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #e0e0e0;
  font-size: 14px;
}

.modal-select:focus, .modal-input:focus {
  outline: none;
  border-color: #00d9ff;
}

.modal-footer {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  background: #1c2128;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn.secondary {
  background: #30363d;
  color: #e0e0e0;
}

.btn.primary {
  background: #238636;
  color: #fff;
}

.btn.primary:hover:not(:disabled) {
  background: #2ea043;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: #21262d;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1001;
  animation: slideIn 0.3s ease;
}

.notification.success {
  border-left: 3px solid #238636;
}

.notification.error {
  border-left: 3px solid #f85149;
  color: #f85149;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
