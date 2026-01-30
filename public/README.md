# 静态资源 (Static Assets)

此目录下的文件在构建后会原样复制到站点根目录，可直接用**以 `/` 开头的绝对路径**引用。

- 例如将 `welcome-bg.jpg` 放在 `public/images/` 下，在代码中使用：`src="/images/welcome-bg.jpg"` 或 `url('/images/welcome-bg.jpg')`。
- 不要使用 `/assets/` 等未放在 public 下的路径，否则生产环境会 404。
