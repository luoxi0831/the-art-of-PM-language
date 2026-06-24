# 飞书工作语言润色器

产品经理专属的职场表达润色工具，支持多种语境（对领导/同事/业务方/开发/测试/直白）。

## 部署步骤（Vercel，免费）

### 第一步：推送代码到 GitHub

1. 在 GitHub 创建新仓库（如 `feishu-polish-plugin`）
2. 在本地项目目录执行：

```bash
git init
git add .
git commit -m "init: 飞书工作语言润色器"
git remote add origin https://github.com/你的用户名/feishu-polish-plugin.git
git branch -M main
git push -u origin main
```

### 第二步：部署到 Vercel

1. 打开 https://vercel.com ，用 GitHub 账号登录
2. 点击 "New Project" → 导入你的 `feishu-polish-plugin` 仓库
3. 在部署设置中添加环境变量：
   - `FEISHU_APP_ID` = `cli_aab24dc745b99bb5`
   - `FEISHU_APP_SECRET` = `8tvomPlrkaKISrSes8aTeeGsezY1EkoN`
   - `AI_URL` = `https://open.bigmodel.cn/api/paas/v4`
   - `AI_KEY` = `70fcf4d493464c86a4426323b9fd9c39.vuTEEqoUXobAtBUs`
   - `AI_MODEL` = `GLM-4.7-Flash`
4. 点击 Deploy，等待部署完成
5. 部署完成后会得到一个域名，如 `feishu-polish-plugin.vercel.app`

### 第三步：配置飞书应用

1. 打开 [飞书开放平台](https://open.feishu.cn/app)，进入你的应用
2. **配置事件回调地址**：
   - 进入 "事件与回调" → "事件配置"
   - 请求地址填：`https://你的vercel域名/api/feishu-event`
3. **配置聊天框"+"菜单**：
   - 进入 "应用功能" → "机器人" 或 "小程序"
   - 添加"网页链接"类型菜单项
   - 链接填：`https://你的vercel域名/`
   - 名称：工作语言润色器
4. **配置消息快捷操作**：
   - 进入 "应用功能" → "消息快捷操作"
   - 添加快捷操作，类型选"打开链接"
   - 链接填：`https://你的vercel域名/?text={content}`
5. 发布应用版本，申请上线

## 本地开发

```bash
npm install
npm run dev
# 访问 http://localhost:3000
```

## 项目结构

```
feishu-polish-plugin/
├── api/
│   ├── _utils.js          # 工具函数（AI调用、飞书token）
│   ├── polish.js          # 润色接口
│   ├── feishu-event.js    # 飞书事件回调
│   └── server.js          # 本地开发服务器
├── public/
│   └── index.html         # 前端页面
├── package.json
├── vercel.json            # Vercel部署配置
└── README.md
```
