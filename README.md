# 摆烂导师 - PWA 网页应用

一个将摆烂行为艺术化的移动端网页应用，支持离线使用和添加到主屏幕。

## 在线体验

直接访问部署后的 URL 即可使用，无需安装任何依赖。

## 本地运行

### 方法一：Python 快速启动（推荐）

```bash
# 进入项目目录
cd bailan-pwa

# 启动本地服务器
python -m http.server 3000

# 访问 http://localhost:3000
```

### 方法二：Node.js serve

```bash
# 安装 serve（如未安装）
npm install -g serve

# 启动服务器
serve -l 3000 .

# 访问 http://localhost:3000
```

### 方法三：VS Code Live Server

1. 安装 VS Code 扩展 "Live Server"
2. 右键点击 `index.html`，选择 "Open with Live Server"

## 功能特性

### 核心功能
- **记一笔**：记录摆烂类型、内容和心情
- **摆烂史**：查看所有历史记录，支持删除
- **位格**：生成摆烂证书，展示当前位格和进度
- **排行**：查看位格体系和晋升条件
- **问答**：AI 生成离谱问题，生成学术研究答案

### 位格体系
1. 摸鱼学徒（0次）
2. 拖延者（2次）
3. 卧龙（5次）
4. 咸鱼（9次）
5. 摆烂大师（14次）
6. 怠惰主教（20次）
7. 隐于市（28次）
8. 查无此人（38次）
9. 观棋者（50次）
10. 烂柯人（65次）

## AI 功能配置

问答、证书生成和论文撰写功能需要 DeepSeek API Key：

**如何设置：**
1. 在首页右上角找到并点击 **"API 设置"** 按钮
2. 在弹出的面板中输入你的 DeepSeek API Key
3. 点击 **"保存"** 按钮

**获取 API Key：**
- 访问 [DeepSeek 官网](https://platform.deepseek.com/) 注册并获取 API Key
- 新用户通常有免费额度可用

**隐私说明：**
- API Key 仅保存在浏览器 localStorage 中
- 不会上传到任何服务器
- 清除浏览器数据会删除 API Key，需重新设置

## PWA 特性

- **离线可用**：首次加载后，后续访问无需网络
- **添加到主屏幕**：支持 iOS/Android 添加到桌面
- **独立窗口**：以独立应用窗口运行，无浏览器地址栏

### 添加到主屏幕

**iOS Safari**：
1. 点击分享按钮
2. 选择 "添加到主屏幕"

**Android Chrome**：
1. 点击菜单（⋮）
2. 选择 "添加到主屏幕" 或 "安装应用"

## 技术栈

- 纯 HTML/CSS/JavaScript（无框架）
- localStorage 本地存储
- Canvas API 证书生成
- Service Worker 离线缓存
- DeepSeek API AI 功能

## 项目结构

```
bailan-pwa/
├── index.html          # 入口文件
├── app.css             # 样式表
├── app.js              # 主应用逻辑
── manifest.json       # PWA 清单
├── sw.js               # Service Worker
├── utils/
│   ├── storage.js      # 本地存储工具
│   └── ai.js           # AI 功能封装
└── images/             # 图标资源
```

## 浏览器兼容性

- Chrome 80+
- Safari 13+
- Firefox 75+
- Edge 80+

## 许可证

MIT License
