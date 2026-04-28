<template>
  <div class="github-view">
    <div class="header">
      <Github :size="24" class="header-icon" />
      <h1>GitHub SSH 使用指南</h1>
    </div>

    <div class="content">
      <div class="section">
        <div class="section-header">
          <Key :size="18" />
          <h2>1. 检查 SSH 密钥</h2>
        </div>
        <pre class="code-block"><span class="prompt">$</span> ls -la ~/.ssh</pre>
        <p class="hint">如果看到 <code>id_ed25519</code> 或 <code>id_rsa</code> 文件，说明已有密钥</p>
      </div>

      <div class="section">
        <div class="section-header">
          <PlusCircle :size="18" />
          <h2>2. 生成 SSH 密钥（如果没有）</h2>
        </div>
        <pre class="code-block"><span class="prompt">$</span> ssh-keygen -t ed25519 -C "your_email@example.com"</pre>
        <p class="hint">按 Enter 使用默认路径，可选设置密码保护</p>
      </div>

      <div class="section">
        <div class="section-header">
          <Eye :size="18" />
          <h2>3. 查看并添加公钥到 GitHub</h2>
        </div>
        <pre class="code-block"><span class="prompt">$</span> cat ~/.ssh/id_ed25519.pub</pre>
        <p class="hint">
          复制输出的公钥，添加到 GitHub：
          Settings → SSH and GPG keys → New SSH key
        </p>
      </div>

      <div class="section">
        <div class="section-header">
          <Wifi :size="18" />
          <h2>4. 测试连接</h2>
        </div>
        <pre class="code-block"><span class="prompt">$</span> ssh -T git@github.com</pre>
        <p class="hint success">成功后显示: "Hi username! You've successfully authenticated"</p>
      </div>

      <div class="section">
        <div class="section-header">
          <GitBranch :size="18" />
          <h2>5. 常用 Git 命令</h2>
        </div>
        <pre class="code-block"><span class="prompt">$</span> git init</pre>
        <pre class="code-block"><span class="prompt">$</span> git remote add origin git@github.com:username/repo.git</pre>
        <pre class="code-block"><span class="prompt">$</span> git add .</pre>
        <pre class="code-block"><span class="prompt">$</span> git commit -m "Initial commit"</pre>
        <pre class="code-block"><span class="prompt">$</span> git push -u origin main</pre>
      </div>

      <div class="section">
        <div class="section-header">
          <Download :size="18" />
          <h2>6. 克隆仓库</h2>
        </div>
        <pre class="code-block"><span class="prompt">$</span> git clone git@github.com:username/repo.git</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Github, Key, PlusCircle, Eye, Wifi, GitBranch, Download } from 'lucide-vue-next';
</script>

<style scoped>
.github-view {
  padding: 32px;
  max-width: 800px;
  margin: 0 auto;
  background: #0d1117;
  min-height: 100%;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.header-icon {
  color: #00d9ff;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #e0e0e0;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section {
  background: #161b22;
  border-radius: 12px;
  padding: 20px 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  color: #00d9ff;
}

.section-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
}

.code-block {
  background: #0d1117;
  padding: 12px 16px;
  border-radius: 6px;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  color: #c9d1d9;
  margin: 8px 0;
  overflow-x: auto;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.prompt {
  color: #56d364;
  margin-right: 8px;
}

.hint {
  font-size: 13px;
  color: #8b949e;
  margin-top: 8px;
  line-height: 1.5;
}

.hint code {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #00d9ff;
}

.hint.success {
  color: #56d364;
}
</style>
