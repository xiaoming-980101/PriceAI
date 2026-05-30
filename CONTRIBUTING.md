# 贡献指南

感谢你愿意改进 PriceAI。这个项目当前重点是让 AI 订阅报价更容易比较，并让采集器、分类规则和前台体验逐步稳定。

## 本地开发

```bash
npm install
npm run dev
```

常用检查：

```bash
npm run lint
npm run build
```

如果需要真实数据，请参考 [配置说明](./docs/configuration.md) 初始化 Supabase 和环境变量。

## 分支与 Pull Request

- 从 `main` 新建功能分支。
- 一个 PR 尽量只解决一个问题。
- 修改采集器时，请说明测试过的来源 URL 和命令。
- 修改分类规则时，请补充典型标题样例，说明预期归类。
- 修改 UI 时，请附截图或说明桌面端、移动端影响。
- 修改文档时，请确认 README 中的链接仍然有效。

## 采集器贡献

新增或修复采集器时，请遵守：

- 输出 `sourceTitle`、`price`、`status`、`url`，能拿到库存时输出 `stockCount`。
- 价格解析要限制在商品卡片或商品记录作用域内。
- 支持千分位价格，例如 `¥1,280.00`。
- 不把销量、库存、规格编号、套餐倍数当成价格。
- 不绕过验证码、登录墙、WAF 或平台风控。

示例验证命令：

```bash
npm run collect:prices -- --source source-id --post
```

## 分类规则贡献

分类规则以“够粗、稳定、可比较”为原则。交付方式不应轻易变成标准商品，例如成品号、卡密、直充、代充、CDK、激活码通常只是标签或交付方式。

新增规则前请先阅读：

- [数据策略](./docs/data-policy.md)
- [分类重构草案](./docs/planning/data-classification-redesign.md)

## 安全与隐私

不要提交：

- `.env.local`
- Supabase service role key
- 后台密码
- 真实用户隐私数据
- 需要绕过限制才能访问的页面内容

安全问题请参考 [SECURITY.md](./SECURITY.md)。
