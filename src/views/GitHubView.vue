<template>
  <div class="github-view">
    <h2>GitHub SSH 使用指南</h2>

    <div class="section">
      <h3>1. 检查 SSH 密钥</h3>
      <pre class="code-block">ls -la ~/.ssh</pre>
    </div>

    <div class="section">
      <h3>2. 生成 SSH 密钥（如果没有）</h3>
      <pre class="code-block">ssh-keygen -t ed25519 -C "your_email@example.com"</pre>
    </div>

    <div class="section">
      <h3>3. 查看公钥</h3>
      <pre class="code-block">cat ~/.ssh/id_ed25519.pub</pre>
      <p class="hint">复制公钥，添加到 GitHub → Settings → SSH Keys</p>
    </div>

    <div class="section">
      <h3>4. 测试连接</h3>
      <pre class="code-block">ssh -T git@github.com</pre>
    </div>

    <div class="section">
      <h3>5. 常用 Git 命令</h3>
      <pre class="code-block"># 初始化仓库
git init

# 添加远程仓库
git remote add origin git@github.com:username/repo.git

# 添加文件
git add .

# 提交
git commit -m "Initial commit"

# 推送
git push -u origin main</pre>
    </div>

    <div class="section">
      <h3>6. 克隆仓库</h3>
      <pre class="code-block">git clone git@github.com:username/repo.git</pre>
    </div>
  </div>
</template>

<style scoped>
.github-view {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  color: #ccc;
}
h2 {
  color: #fff;
  margin-bottom: 24px;
}
.section {
  background: #1e1e1e;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}
.section h3 {
  color: #fff;
  font-size: 16px;
  margin: 0 0 12px 0;
}
.code-block {
  background: #2d2d2d;
  padding: 12px;
  border-radius: 4px;
  font-family: 'Consolas', monospace;
  font-size: 13px;
  overflow-x: auto;
  margin: 0;
}
.hint {
  font-size: 13px;
  color: #888;
  margin-top: 8px;
}
</style>
