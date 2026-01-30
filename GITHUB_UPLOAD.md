# 将项目推送到 GitHub

本地已完成：
- `git init`、`git remote add origin`、`git add -A`、`git commit`
- 当前分支：**main**，远程：**https://github.com/ritachen3656251-design/Danlink.git**

---

## 方式一：在终端里推送（推荐）

1. **打开 CMD（命令提示符）**  
   若 PowerShell 报「无法加载 npm.ps1 / 禁止运行脚本」，用 CMD 更稳：  
   - 按 `Win + R`，输入 `cmd`，回车。

2. **进入项目目录并推送：**
   ```bash
   cd /d "c:\Users\lenovo\Downloads\旦link-(danlink)"
   git push -u origin main
   ```

3. **若提示登录 GitHub：**
   - **用户名**：你的 GitHub 用户名（如 `ritachen3656251-design`）
   - **密码**：不要用账号密码，改用 **Personal Access Token (PAT)**  
     - 打开：https://github.com/settings/tokens  
     - 点 “Generate new token (classic)”  
     - 勾选 `repo`，生成后复制  
     - 在终端里把 Token 粘贴到「密码」处

4. **若报错 “Failed to connect” / “443” / “proxy”：**
   - 检查是否开了 VPN/代理，关掉或确保终端走代理后再试
   - 或临时取消代理：
     ```bash
     set HTTP_PROXY=
     set HTTPS_PROXY=
     git push -u origin main
     ```

---

## 方式二：用 GitHub Desktop

1. 下载安装 [GitHub Desktop](https://desktop.github.com/)
2. File → Add Local Repository → 选文件夹 `旦link-(danlink)`
3. 若提示 “This directory does not appear to be a Git repository”，说明路径不对，选到含 `.git` 的那一层
4. 登录 GitHub 账号后，点 **Publish repository**，仓库名填 `Danlink`，再 Publish

---

## 推送成功后

在浏览器打开：**https://github.com/ritachen3656251-design/Danlink** 即可看到代码。

`.gitignore` 已包含 `*.local`，`.env.local` 不会上传。
