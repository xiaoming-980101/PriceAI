<p align="center">
  <img src="src/app/icon.svg" width="112" height="112" alt="PriceAI logo" />
</p>

<h1 align="center">PriceAI</h1>

<p align="center">
  <strong>AI 订阅渠道比价工具，把分散卡网报价整理成可比较的标准商品。</strong><br/>
  搜索商品，看有货最低价，对比来源，跳转原站购买。
</p>

<p align="center">
  <a href="https://priceai.cc">在线访问</a> ·
  <a href="#快速开始">快速开始</a> ·
  <a href="#文档">文档</a> ·
  <a href="#贡献">贡献</a>
</p>

---

<p align="center">
  <img src="docs/assets/image.png" alt="PriceAI product screenshot" width="100%" />
</p>

## 为什么做

AI 订阅价格长期存在信息差：官网正价、地区价、代订、学生资格、成品号、卡密、低价渠道和临时权益混在一起。普通用户想买 ChatGPT、Claude、Gemini、Grok 或 Gmail 账号时，经常要同时打开多个卡网、Telegram 群、闲鱼页面和聚合站，手动比较价格、库存、更新时间和购买链接。

PriceAI 的目标是把这件事变成一个清楚的购买前参考工具：

- 只看有货报价里的最低价，缺货不参与最低价。
- 保留原始渠道、原始标题、价格、状态、更新时间和购买链接。
- 把混乱标题归到稳定的标准商品，例如 `ChatGPT Plus`、`Gemini Pro`、`Super Grok`。
- 尽量自动从原站采集，不把人工补录当长期方案。

PriceAI 不卖货、不收款、不担保渠道售后。它更像一个价格雷达：帮用户少开几个网页，少踩一点信息差。

## 功能

- **标准商品比价**：按 ChatGPT、Claude、Gemini、Grok、API/CDK、邮箱、虚拟卡等平台整理报价。
- **有货 / 缺货**：前台只保留两个明确状态，缺货弱化展示。
- **全部报价视图**：可以直接查看某个平台下所有原始报价。
- **详情对比页**：展示渠道、原始标题、价格、更新时间和原站购买入口。
- **渠道提交**：用户可提交新渠道，后台通过试采集和采集器待办形成扩展闭环。
- **自动采集**：支持 Aibijia 导入、公开接口、Shop API、HTML 解析和浏览器兜底采集。
- **后台管理**：管理来源、试采集、批量采集、报价隐藏、分类重建和采集日志。
- **访问分析**：可选接入 Google Analytics 4，用于查看访问和推广效果。

## 快速开始

```bash
npm install
npm run dev
```

默认访问：

- 前台：`http://localhost:3000`
- 后台：`http://localhost:3000/admin`

未配置 Supabase 时，前台会使用内置演示数据。完整环境变量见 [配置说明](./docs/configuration.md)。

## 常用命令

```bash
npm run dev
npm run build
npm run lint
npm run import:aibijia -- --password your-admin-password
npm run collect:prices -- --all --post
npm run collect:prices -- --source aisou-pro --post
npm run collect:browser -- --url https://aisou.pro/ --password your-admin-password --post
```

## 文档

- [配置说明](./docs/configuration.md)
- [部署与定时采集](./docs/deployment.md)
- [采集器与来源扩展](./docs/collectors.md)
- [架构说明](./docs/architecture.md)
- [数据策略](./docs/data-policy.md)
- [分类重构草案](./docs/planning/data-classification-redesign.md)
- [产品原则](./PRODUCT.md)
- [设计系统](./DESIGN.md)
- [项目介绍](./docs/project-intro.md)
- [GA4 分析](./docs/analytics.md)

`PRODUCT.md` 和 `DESIGN.md` 保留在根目录，供设计与产品工作流直接读取。

## 贡献

欢迎通过 Issue 或 Pull Request 提交：

- 新渠道采集器
- 价格解析修复
- 商品分类规则优化
- UI/交互改进
- 文档补充

开始前建议先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。涉及验证码、登录墙、WAF 或敏感凭据的站点，不应通过绕过限制的方式采集。

## License

PriceAI 使用 [MIT License](./LICENSE)。
