# NodeBits 公开渠道候选清单

> 文档类型：候选渠道线索清单
> 数据来源：NodeBits 公开接口 `/api/shops`、`/api/products`，以及 NodeBits 前端公开读取的店铺表字段 `shops.url`
> 更新日期：2026-06-03 16:31（Asia/Shanghai）
> 使用边界：只把公开出现的原站入口作为候选渠道线索，不导入 NodeBits 报价、排序、收藏数、浏览量或描述作为 PriceAI 数据。

## 1. 口径修正

之前版本只有 58 个渠道，是因为提取口径只看了商品记录里的 `raw_text.shopUrl`。这个字段只覆盖已经被 NodeBits 商品采集写入过的店铺，不等于 NodeBits 的完整店铺池。

本版改为以 NodeBits 店铺详情页公开读取的 `shops.url` 为主口径，再用 `/api/shops` 补充店铺标签，用 `/api/products` 仅做商品数量和样例辅助。因此这份清单更接近“公开原站入口候选渠道”，不是“NodeBits 已采到报价的渠道”。

## 2. 提取结果

- NodeBits 公开店铺接口返回：117 个店铺。
- 店铺表中 active 且带原站 URL：118 个。
- 规范化后唯一原站入口：113 个。
- 可作为公开候选渠道的唯一入口：112 个。
- 被剔除的测试/无效入口：1 个。
- 重复 URL 分组：5 组。
- 商品接口本次读取：1370 条，仅用于统计和样例，不作为 PriceAI 报价来源。

## 3. 去重后的候选渠道

| # | 原站入口 | NodeBits 店铺名/别名 | 标签线索 | 商品样例数 | 推荐采集器 | 样例商品 |
|---:|---|---|---|---:|---|---|
| 1 | [https://pay.ldxp.cn/shop/chenxiaochun](https://pay.ldxp.cn/shop/chenxiaochun) | 高质稳定号 | ChatGPT | 3 | ldxpShop | Chatgpt plus 日抛；ChatGPT Pro 5X 无保 |
| 2 | [https://pay.ldxp.cn/shop/1I2Y9GEC](https://pay.ldxp.cn/shop/1I2Y9GEC) | 靠谱AI | ChatGPT | 2 | ldxpShop | 28天质保-Gmail/iCloud邮箱plus成品账号；【包过，不过不收费】Chatgpt-cyber认证 |
| 3 | [https://catfk.com/shop/Antipro](https://catfk.com/shop/Antipro) | Antipro（源头低价AI会员） | ChatGPT, Gemini, 短信服务, Claude, Grok | 0 | catfk/待试采 | 无公开商品样例 |
| 4 | [https://storeacc.com/](https://storeacc.com/) | 号士多 HStore | Apple Id, ChatGPT, Telegram | 0 | genericShop/待试采 | 无公开商品样例 |
| 5 | [https://bei-bei.shop/](https://bei-bei.shop/) | 贝贝商店 | ChatGPT, Gemini, Claude, Grok | 15 | genericShop/待试采 | 库存测试；ChatGPT Pro 20X 月卡｜官方卡充｜1个月｜支持续费｜正规充值 |
| 6 | [https://xingbao-ai.shop/](https://xingbao-ai.shop/) | 星宝小店 | ChatGPT, Claude, Gemini | 9 | genericShop/待试采 | ChatGPT Pro 20X 月卡｜官方卡充｜1个月｜支持续费｜正规充值；ChatGPT Plus 月卡｜成品号｜ 质保首登【默认日抛，用多久看天】【自动发货】 |
| 7 | [https://pay.ldxp.cn/shop/J6F0Z1MF](https://pay.ldxp.cn/shop/J6F0Z1MF) | 恶小梦API | ChatGPT, 短信服务 | 5 | ldxpShop | 微软邮箱长效-outlook 长效oauth2令牌；Gpt Free（提供邮箱接码 已经接码）\| 注册地美国 \| outlook.com \| 家庭宽带注册 |
| 8 | [https://pay.ldxp.cn/shop/UW94LBON](https://pay.ldxp.cn/shop/UW94LBON) | yemao-ai源头 | ChatGPT | 5 | ldxpShop | GPT free sub2格式json带rt不带账密质保首登；【日抛--发货格式cpa，sub2】plus成品质保首登，，只能反代codex。 |
| 9 | [https://ouvg.top/](https://ouvg.top/) | 麦门商店 | Google, Gemini, 短信服务, 私人住宅IP, Claude | 0 | 待识别 | 无公开商品样例 |
| 10 | [http://mxshop.vip/](http://mxshop.vip/) | 小马解忧 | ChatGPT, Claude | 0 | genericShop/待试采 | 无公开商品样例 |
| 11 | [https://pay.ldxp.cn/shop/one](https://pay.ldxp.cn/shop/one) | 云边小铺 | ChatGPT, Gemini, Apple Id, Claude, Grok | 41 | ldxpShop | 微软hotmail；GROK【普号\|直登成品｜域名邮箱】只保首登 |
| 12 | [https://pay.ldxp.cn/shop/SB9T68JP](https://pay.ldxp.cn/shop/SB9T68JP) | ai账号乐园 | ChatGPT, Gemini, Apple Id, Claude, Cursor | 208 | ldxpShop | 长效hotmail邮箱 OAuth2令牌号【已注册一年以上】 支持imap pop；微软邮箱长效-outlook 长效oauth2令牌 |
| 13 | [https://11.id2323.top/](https://11.id2323.top/) | 账号小卖铺 | Gemini, Apple Id, Telegram | 0 | 待识别 | 无公开商品样例 |
| 14 | [https://fk.txspvip.xyz/](https://fk.txspvip.xyz/) | 星枢 AI（源头GPT) | ChatGPT | 0 | 待识别 | 无公开商品样例 |
| 15 | [https://ai666.id/](https://ai666.id/) | 会员权益在线 | ChatGPT, Gemini, Apple Id, Claude, Grok | 0 | 待识别 | 无公开商品样例 |
| 16 | [https://pay.ldxp.cn/shop/rgzn](https://pay.ldxp.cn/shop/rgzn) | AI小屋 | ChatGPT, Google, Outlook | 8 | ldxpShop | 微软邮箱长效-outlook 长效oauth2令牌；微软长效-outlook-【gr/o2双令牌号】-【英文随机+数字】Graph令牌号和OAuth2-IMAP-POP3 |
| 17 | [https://pay.ldxp.cn/shop/YGOV1U2Q](https://pay.ldxp.cn/shop/YGOV1U2Q) | 虚拟产品批发 | ChatGPT, Gemini, Outlook, Claude, 推特 | 38 | ldxpShop | 微软邮箱长效-outlook  oauth2令牌 refresh_token号  imap pop3；Cursor  美区 接码 业务自测 没问题在批量上（不售后） |
| 18 | [https://pay.ldxp.cn/shop/haifs](https://pay.ldxp.cn/shop/haifs) | 海飞丝 土区PLUS源头供应 | ChatGPT | 0 | ldxpShop | 无公开商品样例 |
| 19 | [https://pay.ldxp.cn/shop/VUOJQOHY](https://pay.ldxp.cn/shop/VUOJQOHY) | 小久会员店 | ChatGPT, Claude, Grok | 9 | ldxpShop | 🟨【19-24年老号】谷歌邮箱成品老号·Gmail带2fa链接·包登录【包GCP】🟡自动发货；Gmail邮箱  20-24年 Google老号 |
| 20 | [https://pay.ldxp.cn/shop/52ai](https://pay.ldxp.cn/shop/52ai) | 52AI店铺 | ChatGPT, Gemini, Claude, Grok, 推特 | 50 | ldxpShop | 【每人限1个】Codex官方中转API 1美元0.1x 倍率=10美元额度；微软长效-outlook-【双令牌号】-【英文随机+数字】Graph令牌号和OAuth2-IMAP-POP3 |
| 21 | [https://pay.ldxp.cn/shop/X273D51R](https://pay.ldxp.cn/shop/X273D51R) | 南乔ai | ChatGPT | 1 | ldxpShop | ChatGPT PLUS 一卡一绑 非常稳定 |
| 22 | [https://ldxp.cn/shop/UHZ7YO17](https://ldxp.cn/shop/UHZ7YO17) | 源头AI | ChatGPT, 短信服务 | 0 | genericShop/待试采 | 无公开商品样例 |
| 23 | [https://pay.ldxp.cn/shop/1DM0L7CR](https://pay.ldxp.cn/shop/1DM0L7CR) | 源头GPT | ChatGPT, Google, Gmail, Gemini, Google Voice | 31 | ldxpShop | 微软长效-outlook-API取件-Graph令牌号和OAuth2；微软长效-Hotmail-API取件-Graph令牌号和OAuth2 |
| 24 | [https://pay.ldxp.cn/shop/aiTeam](https://pay.ldxp.cn/shop/aiTeam) | Ai家族 | ChatGPT, Gmail, Claude | 15 | ldxpShop | 三水｜普号；画风｜普号 |
| 25 | [https://pay.ldxp.cn/shop/EXZMM8SQ](https://pay.ldxp.cn/shop/EXZMM8SQ) | GPTgemini都有 | ChatGPT, Gemini, Claude | 28 | ldxpShop | CHATGPT FREE号 （已经接过码）；[普号\|白号]  Grok AI 长效微软邮箱 |
| 26 | [https://pay.ldxp.cn/shop/ycyapi](https://pay.ldxp.cn/shop/ycyapi) | YCYAI | ChatGPT, Claude | 8 | ldxpShop | Google验证 美国手机号（两个月内可重复接码）（购买前务必看介绍）；质保一天/  ChatGPT Plus 成品号｜自助发货｜24小时发货 |
| 27 | [https://pay.ldxp.cn/shop/4YWWAAFM](https://pay.ldxp.cn/shop/4YWWAAFM) | 蜗的AI | Gmail, Hotmail, 短信服务, Claude, Grok | 22 | ldxpShop | OpenAI Codex 手机接码；ChatGPT 蜗的AI-中转-官方plus号池-100$ |
| 28 | [https://mamabt.top/](https://mamabt.top/) | MMBT源头批发 | ChatGPT, Gemini, Claude, Grok | 0 | 待识别 | 无公开商品样例 |
| 29 | [https://pay.ldxp.cn/shop/C7MLWX4N](https://pay.ldxp.cn/shop/C7MLWX4N) | MortyAi小铺 | ChatGPT, Claude | 17 | ldxpShop | Gopay GPT PLUS  CPA json格式卡密，带RT，已绑手机，outlook 邮箱。无质保；【美国+1 】高性价比新号 \| 基础权重 \| 必备小号备用号 |
| 30 | [https://pay.ldxp.cn/shop/yuanAi](https://pay.ldxp.cn/shop/yuanAi) | 元Ai | ChatGPT, Google, Gmail, Gemini, Claude | 131 | ldxpShop | grok普号(限时福利)；grok普号（free） |
| 31 | [https://pay.ldxp.cn/shop/AG7CVCOD](https://pay.ldxp.cn/shop/AG7CVCOD) | 喵喵AI小铺 | Apple Id, ChatGPT, Gemini | 3 | ldxpShop | 【限时福利】ChatGPT plus成品号（质保首登）；Plus网页号，剩余15-25天（质保首登） |
| 32 | [https://dimosky.com/](https://dimosky.com/) | Ai能量小店 | ChatGPT, Gemini | 0 | 待识别 | 无公开商品样例 |
| 33 | [https://pay.ldxp.cn/shop/gogo](https://pay.ldxp.cn/shop/gogo) | AI gogo渠道 | ChatGPT, Gemini, Claude | 25 | ldxpShop | Outlook.de微软德国邮箱（OAuth2令牌邮箱，已开通IMAP POP3）；【日区PP渠道】ChatGPT Plus 独享成品号（质保首登/拍下即发/注意账号格式） |
| 34 | [https://douyiner.cn/](https://douyiner.cn/) | Gemini账号批发, douyiner | ChatGPT, Gemini, Google, Grok | 0 | 待识别 | 无公开商品样例 |
| 35 | [https://www.woaimaihao.com/](https://www.woaimaihao.com/) | 我爱买号 | ChatGPT, Gmail, Gemini, Apple Id, Claude | 22 | 待识别 | 苹果礼品卡 联系客服购买；claude max 20X 充值 |
| 36 | [https://123456787kelie.top/](https://123456787kelie.top/) | TG飞机号源头机房 | Gmail, Outlook, 推特, Telegram, Tiktok | 0 | 待识别 | 无公开商品样例 |
| 37 | [https://pay.ldxp.cn/shop/9P102ZA3](https://pay.ldxp.cn/shop/9P102ZA3) | aili的gpt | ChatGPT, Apple Id | 2 | ldxpShop | Claude普通账号（雅虎邮箱，imap登录，网易邮箱大师接码）；🟨Apple ID【土耳其·原生非改区】土区苹果id·免税【带消费记录·双重号·未激活ic】可做GPT业务🟡自动发货 |
| 38 | [https://pay.ldxp.cn/shop/UHZ7YO18](https://pay.ldxp.cn/shop/UHZ7YO18) | GPT源头店铺 | ChatGPT, 短信服务 | 2 | ldxpShop | CHATGPT FREE号 （已经接过码）；chatgpt-plus（超长存活） |
| 39 | [https://ldxp.cn/shop/UHZ7YO18](https://ldxp.cn/shop/UHZ7YO18) | AI源头 | ChatGPT, 短信服务 | 0 | genericShop/待试采 | 无公开商品样例 |
| 40 | [https://pay.ldxp.cn/shop/Tora](https://pay.ldxp.cn/shop/Tora) | Tora-雪诺AI源头小铺 | ChatGPT, Claude, Discord, Gemini, Grok, Telegram | 90 | ldxpShop | 【点我点我，各种低价正规AI服务】免费GV接码网页号；Outlook-令牌长效-已绑辅邮(已授权oauth2，IMAP GRAPH) |
| 41 | [https://t.me/+M7VO4xxDa8pjYzhl](https://t.me/+M7VO4xxDa8pjYzhl) | Google Voice专卖 | Google Voice | 0 | 待识别 | 无公开商品样例 |
| 42 | [https://pay.ldxp.cn/shop/QLL06630](https://pay.ldxp.cn/shop/QLL06630) | Ai小店 | ChatGPT, Gemini | 16 | ldxpShop | Cursor  美区 接码 业务自测 没问题在批量上（不售后） 代理对接：u0fffzj6；OpenAI Codex 手机接码 |
| 43 | [https://pay.ldxp.cn/item/rih4zc](https://pay.ldxp.cn/item/rih4zc) | 极速AI | ChatGPT, Gemini | 0 | genericShop/待试采 | 无公开商品样例 |
| 44 | [https://faka.6188.store:8443/cat/2](https://faka.6188.store:8443/cat/2) | 网流工作室 | ChatGPT, GitHub, Google, Perplexity, 私人住宅IP | 0 | genericShop/待试采 | 无公开商品样例 |
| 45 | [https://lemon-watermelon.com/](https://lemon-watermelon.com/) | 柠檬西瓜 | ChatGPT, Gemini | 0 | 待识别 | 无公开商品样例 |
| 46 | [https://pay.ldxp.cn/shop/grokheavy](https://pay.ldxp.cn/shop/grokheavy) | Grok年卡专卖 | Grok | 3 | ldxpShop | SuperGrok 独享账号 三天升级试用号；SuperGrok 独享账号 一月会员 质保5天 新渠道 |
| 47 | [https://pay.ldxp.cn/shop/4GG4E3MF](https://pay.ldxp.cn/shop/4GG4E3MF) | 元筑AI | ChatGPT | 4 | ldxpShop | Plus 质保首登。提供账号密码、sub2api/cpa的json；GPT plus账号质保首登。提供账号密码、sub2api/cpa的json |
| 48 | [https://pay.qxvx.cn/shop/1V4GVK7D](https://pay.qxvx.cn/shop/1V4GVK7D) | 大发AI资源站 | ChatGPT, Claude, Cursor, Gemini, Grok | 0 | genericShop/待试采 | 无公开商品样例 |
| 49 | [https://fk1.ybkjs.top/](https://fk1.ybkjs.top/) | 月饼科技社 | ChatGPT, Gmail, Gemini, Claude, Cursor | 0 | 待识别 | 无公开商品样例 |
| 50 | [https://pay.ldxp.cn/shop/N5PXH3GX](https://pay.ldxp.cn/shop/N5PXH3GX) | AI List | ChatGPT, Gmail, Gemini, Apple Id, Claude | 54 | ldxpShop | 微软长效-outlook-【gr/o2双令牌号】-【英文随机+数字】Graph令牌号和OAuth2-IMAP-POP3；微软长效-hotmail-【gr/o2双令牌号】-【英文随机+数字】Graph令牌号和OAuth2-IMAP-POP3 |
| 51 | [https://pay.ldxp.cn/shop/SQ5C82YG](https://pay.ldxp.cn/shop/SQ5C82YG) | 邻家数字铺 | ChatGPT, Gemini, Gmail, Grok | 2 | ldxpShop | 【美国+1 】高性价比新号 \| 店主亲测手机稳定，不要电脑登录！！！大概率没了！！！ \| 必备小号备用号；｛冲自己号｝Gemini Pro一年会员自动开通CDK 包绑卡订阅 1次 低价不质保 |
| 52 | [https://pay.ldxp.cn/shop/aishop1](https://pay.ldxp.cn/shop/aishop1) | GPT大玩家, GPT 大玩家 | ChatGPT, Claude, Outlook | 32 | ldxpShop | 长效注册邮箱注册万物 微软邮箱hotmail.com邮箱 带密码 直接网页登录；长效注册邮箱注册万物 微软邮箱，这个是协议取件的@outlook.com |
| 53 | [https://pay.ldxp.cn/shop/MEDDEX4V](https://pay.ldxp.cn/shop/MEDDEX4V) | AI HOME | ChatGPT, Claude | 52 | ldxpShop | [普号] ChatGPT 长效微软邮箱；GPT账号（微软outlook邮箱） |
| 54 | [https://pay.ldxp.cn/shop/H2QPI3X2](https://pay.ldxp.cn/shop/H2QPI3X2) | 灵AI | ChatGPT | 2 | ldxpShop | 【包GCP】google邮箱Gmail【稳定老号】【20-24年随机地区】可做Pixel 家庭组 挖矿；Gemini Pro 充值自己账号 订阅12个月【无质保】 |
| 55 | [https://pay.ldxp.cn/shop/1D0LD6BR](https://pay.ldxp.cn/shop/1D0LD6BR) | 小猫GPT源头 | ChatGPT | 13 | ldxpShop | GROK【普号\|直登成品｜域名邮箱】只保首登；微软长效邮箱Outlook Trusted 邮箱- OAuth2 + Graph 满周长期有效 |
| 56 | [https://pay.ldxp.cn/shop/IK7OYLXZ](https://pay.ldxp.cn/shop/IK7OYLXZ) | 猫猫豆 | ChatGPT, Grok | 76 | ldxpShop | GROK【普号\|直登成品｜域名邮箱】只保首登【带帐密sso】；微软长效-outlook-【双令牌号】-【英文随机+数字】Graph令牌号和OAuth2-IMAP-POP3 |
| 57 | [https://pay.ldxp.cn/shop/KHRR17MS](https://pay.ldxp.cn/shop/KHRR17MS) | 商家9152 | ChatGPT | 0 | ldxpShop | 无公开商品样例 |
| 58 | [https://burstpro-ai.online/](https://burstpro-ai.online/) | BurstPro 智選商城 | ChatGPT | 0 | 待识别 | 无公开商品样例 |
| 59 | [https://web3chirou.com/](https://web3chirou.com/) | WEB3Al | ChatGPT, Gemini, 私人住宅IP, Claude, Telegram | 0 | 待识别 | 无公开商品样例 |
| 60 | [https://pay.ldxp.cn/shop/ji_su_ai](https://pay.ldxp.cn/shop/ji_su_ai) | 极速AI | ChatGPT, Claude, Grok, Gemini | 6 | ldxpShop | GPT账号（白号）普通号｜账号密码直登｜gpt专用｜高权重家宽｜独享号，长效【微软邮箱交付】；ChatGPT - Plus 月卡【只质保首登，到手即用！】 |
| 61 | [https://pay.ldxp.cn/shop/D92VW084](https://pay.ldxp.cn/shop/D92VW084) | 咔咔 | ChatGPT | 12 | ldxpShop | 新手尝鲜套餐｜¥5  ｜轻舟AI中转站 0.25倍率；10刀额度天卡｜¥9  ｜轻舟AI中转站 0.25倍率 |
| 62 | [https://pay.ldxp.cn/shop/GAXW96YR](https://pay.ldxp.cn/shop/GAXW96YR) | LynnZee | ChatGPT | 9 | ldxpShop | 微软Outlook Trusted 邮箱- OAuth2 + Graph 长期有效；GPT plus 成品号日抛x1【质保首登】 |
| 63 | [https://pay.ldxp.cn/shop/22DHYNNV](https://pay.ldxp.cn/shop/22DHYNNV) | 哈哈的ai杂货铺 | ChatGPT, Gemini | 6 | ldxpShop | GROK【普号\|直登成品｜域名邮箱】只保首登；Gemini pro一年CDK充值  包绑卡 1次  （充值无叠加 有会员不能充值） |
| 64 | [http://lynnzee.myweb999.cfd/](http://lynnzee.myweb999.cfd/) | LynnZee 店铺 | ChatGPT, Gemini, Claude | 0 | 待识别 | 无公开商品样例 |
| 65 | [https://pay.ldxp.cn/shop/qingqing](https://pay.ldxp.cn/shop/qingqing) | 青卿 | ChatGPT | 5 | ldxpShop | 【无质保】plus 1月直充卡【需新号】；Plus 土区自助卡密【秒充】【不用等凭证排队】【保证正规渠道土区】 |
| 66 | [https://pay.ldxp.cn/shop/YTR60TGVK](https://pay.ldxp.cn/shop/YTR60TGVK) | Ai小熊 | ChatGPT, Gmail, Gemini, Grok | 7 | ldxpShop | 22-24GMAIL邮箱/2FA/随机地区；Gemini3.1pro一年（直冲）到你自己的账号 |
| 67 | [https://pay.ldxp.cn/shop/AEUQ8PP3](https://pay.ldxp.cn/shop/AEUQ8PP3) | ai教父 | ChatGPT, Gemini, Hotmail, Claude, 虚拟卡 | 54 | ldxpShop | outlook-令牌长效-邮件获取:imap,pop3,graph(双令牌通用)；hotmail-令牌长效-已绑辅邮-卡密带辅邮账密-(已授权oauth2，IMAP GRAPH) |
| 68 | [https://fk.ybkjs.top/](https://fk.ybkjs.top/) | 惠民ai | ChatGPT, Google, Apple Id, Claude, Cursor | 0 | 待识别 | 无公开商品样例 |
| 69 | [https://www.zhanghao66.com/](https://www.zhanghao66.com/) | 全网最低批发ai账号店铺 | ChatGPT, Claude, Grok, Gemini | 0 | 待识别 | 无公开商品样例 |
| 70 | [https://pay.ldxp.cn/shop/7HVUEC3Y](https://pay.ldxp.cn/shop/7HVUEC3Y) | 464 | ChatGPT | 12 | ldxpShop | 微软长效-hotmail-【gr/o2双令牌号】-【英文随机+数字】Graph令牌号和OAuth2-IMAP-POP3；GROK【普号\|直登成品｜域名邮箱】只保首登 |
| 71 | [https://pay.ldxp.cn/shop/gpt5.5](https://pay.ldxp.cn/shop/gpt5.5) | AI华强北 | ChatGPT, 虚拟卡 | 4 | ldxpShop | CHATGPTPlus RT 成品号（带rt+已绑手机号验证）；chatgpt-cdk 直充 |
| 72 | [https://pay.ldxp.cn/shop/DJFT26BF](https://pay.ldxp.cn/shop/DJFT26BF) | 映核素材馆 | Gemini | 6 | ldxpShop | Kiro Pro 1000积分 成品号 质保首登 gmail邮箱；【日区PP渠道】ChatGPT Plus 独享成品号（质保首登/拍下即发/注意账号格式） |
| 73 | [https://pay.ldxp.cn/shop/SubAIP](https://pay.ldxp.cn/shop/SubAIP) | AI源头批发旗舰店 | ChatGPT, Claude, Perplexity | 17 | ldxpShop | ChatGPT - Plus 月卡 成品号质保首登；【包GCP】美区google邮箱Gmail【稳定老号】【20-24年】可做Pixel 家庭组 挖矿 |
| 74 | [https://pay.ldxp.cn/shop/ZM24RG4J](https://pay.ldxp.cn/shop/ZM24RG4J) | 伊莉雅ai会员店 | ChatGPT, Gmail, Gemini, Telegram | 42 | ldxpShop | 微软邮箱长效-outlook  oauth2令牌 refresh_token号  imap pop3；coedx 接码 （一次码）【出现手机号已被使用这种情况，直接带着截图投诉退款】 |
| 75 | [https://zzshu.com/](https://zzshu.com/) | 吱吱鼠 | ChatGPT, Claude, Gemini, Grok | 0 | 待识别 | 无公开商品样例 |
| 76 | [https://tgkey.cc/](https://tgkey.cc/) | Telegram会员自助充值 | Telegram | 0 | 待识别 | 无公开商品样例 |
| 77 | [https://pay.ldxp.cn/shop/5NVWW2PJ](https://pay.ldxp.cn/shop/5NVWW2PJ) | 元元低价ai店 | ChatGPT, Gmail, Gemini, Claude | 12 | ldxpShop | ChatGPT Plus  在线代开Puls （冲自己号，新渠道稳定1）；【日抛2- team发货格式cpa，sub2】 team成品质保首登，带rt，只能反代codex ，15刀 左右 |
| 78 | [https://a1gmail.com/](https://a1gmail.com/) | A1gmail谷歌邮箱批发, a1gmail | Gmail, Gemini | 0 | 待识别 | 无公开商品样例 |
| 79 | [https://pay.ldxp.cn/shop/anon](https://pay.ldxp.cn/shop/anon) | 千早爱音的AI小铺 | ChatGPT, Gemini, Claude, Grok | 4 | ldxpShop | 【包GCP】美区｜google邮箱【稳定老号】【22-24年】；【包GCP】Gemini Pro 1年订阅成品号【26年随机地区比老号稳】 |
| 80 | [https://pay.ldxp.cn/shop/ymymai](https://pay.ldxp.cn/shop/ymymai) | 亚米的整合服务供应商 | ChatGPT, Gmail, Gemini | 7 | ldxpShop | 提取12个月优惠链接 一次 gemin pro（不会用别买不退不换，小白别买）；GPT PLUS成品。质保首登 购买之前先看商品描述 |
| 81 | [https://catcard.uk/](https://catcard.uk/) | 猫咔～ | Gemini, ChatGPT, 短信服务 | 0 | 待识别 | 无公开商品样例 |
| 82 | [https://hiemail.store/](https://hiemail.store/) | 谷歌邮箱 AI源头批发 | ChatGPT, Google, Gmail, Gemini, Claude | 0 | genericShop/待试采 | 无公开商品样例 |
| 83 | [https://lubansms.com/](https://lubansms.com/) | Luban Sms | 短信服务 | 0 | 待识别 | 无公开商品样例 |
| 84 | [https://nikoers.com/](https://nikoers.com/) | NikoCard | 短信服务, 教育邮箱, ChatGPT, Gemini, 虚拟卡 | 0 | 待识别 | 无公开商品样例 |
| 85 | [https://meowka.vip/](https://meowka.vip/) | Meowka喵卡 | 教育邮箱 | 0 | 待识别 | 无公开商品样例 |
| 86 | [https://pay.ldxp.cn/shop/Q0GWJ4YV](https://pay.ldxp.cn/shop/Q0GWJ4YV) | Ai小店 | ChatGPT, Gemini, Grok | 41 | ldxpShop | super grok3天试用 质保首登；20-24GMAIL邮箱/2FA/随机地区 |
| 87 | [https://shop.bmoplus.com/](https://shop.bmoplus.com/) | bmoplus | ChatGPT, 虚拟卡, Grok, Claude, Google, Gemini | 0 | genericShop/待试采 | 无公开商品样例 |
| 88 | [https://shihuiai.cn/](https://shihuiai.cn/) | shihuiai | Gemini, Google | 0 | 待识别 | 无公开商品样例 |
| 89 | [https://pay.ldxp.cn/shop/RXKT7LFX](https://pay.ldxp.cn/shop/RXKT7LFX) | 商家9237 | ChatGPT, Gemini | 6 | ldxpShop | gemini pro一年  （绑定手机号就可以用）需要绑定手机号                   2-4年老邮箱；Gemini pro一年CDK充值一年（关闭支付资料） |
| 90 | [https://m.ifaka.cloud/](https://m.ifaka.cloud/) | AI源头 | ChatGPT, Google, Grok | 0 | genericShop/待试采 | 无公开商品样例 |
| 91 | [https://yh-mo.xyz/](https://yh-mo.xyz/) | yh-mo | Gemini | 0 | 待识别 | 无公开商品样例 |
| 92 | [https://gmail1888.com/](https://gmail1888.com/) | gmail1888 | Gemini, Gmail, Hotmail, Outlook | 0 | 待识别 | 无公开商品样例 |
| 93 | [https://pay.ldxp.cn/shop/2E2KPQD1](https://pay.ldxp.cn/shop/2E2KPQD1) | AI杂货 | ChatGPT, Claude | 5 | ldxpShop | Gpt Free（提供邮箱接码 已经接码）\| 注册地美国 \| outlook.com \| 家庭宽带注册；CHATGPT FREE号 （已经接过码） |
| 94 | [https://pay.ldxp.cn/shop/echo_dream](https://pay.ldxp.cn/shop/echo_dream) | AI小铺 | ChatGPT, Gemini, Grok | 16 | ldxpShop | 微软长效-outlook-【gr/o2双令牌号】-【英文随机+数字】Graph令牌号和OAuth2-IMAP-POP3；CHATGPT FREE号 （已经接过码） |
| 95 | [https://www.19cm.tech/](https://www.19cm.tech/) | 大白发卡 | ChatGPT, Gemini, Outlook, Telegram | 0 | 待识别 | 无公开商品样例 |
| 96 | [https://pay.ldxp.cn/shop/2W1EEK4J](https://pay.ldxp.cn/shop/2W1EEK4J) | AI主理人 | ChatGPT, Google, Gemini, Claude, Telegram | 27 | ldxpShop | 验证码接码-可接google。；微软邮箱长效-outlook 满周长效oauth2令牌 |
| 97 | [https://bio.link/gouqi](https://bio.link/gouqi) | 枸杞⭕ | Apple Id, Telegram | 0 | 待识别 | 无公开商品样例 |
| 98 | [https://academicgate.org/](https://academicgate.org/) | 苏哲AI订阅中心 | ChatGPT, Claude, Apple Id, Grok, Outlook | 0 | 待识别 | 无公开商品样例 |
| 99 | [https://pay.ldxp.cn/shop/AWXK3UJY](https://pay.ldxp.cn/shop/AWXK3UJY) | 彩虹马的AI店 | ChatGPT | 6 | ldxpShop | 提取12个月优惠链接 一次 gemin pro（不会用别买不退不换，小白别买）；Gemini pro一年CDK充值一年 （关闭付款资料） |
| 100 | [https://pay.ldxp.cn/shop/AZX4SPJ0](https://pay.ldxp.cn/shop/AZX4SPJ0) | Gemini批发 | ChatGPT | 1 | ldxpShop | GPT Plus成品号（质保两周） |
| 101 | [https://pay.ldxp.cn/shop/ai.shop](https://pay.ldxp.cn/shop/ai.shop) | AI开发商 | ChatGPT, Gemini, Grok, Gmail | 13 | ldxpShop | ChatGPT Team 成品母号（无质保）；提取12个月优惠链接 一次 gemin pro（懂的买 无教程）小白勿拍 |
| 102 | [https://tehuio.com/](https://tehuio.com/) | tehuio | ChatGPT, Claude, Cursor, Google, Grok | 0 | 待识别 | 无公开商品样例 |
| 103 | [https://xxxyan.cc/](https://xxxyan.cc/) | xxxyan | Apple Id, ChatGPT, Discord, Gemini, Google, Google Voice, Grok, Telegram, Tiktok, 推特 | 0 | 待识别 | 无公开商品样例 |
| 104 | [https://sd.ncet.top/](https://sd.ncet.top/) | 发卡网 | Gemini, 虚拟卡 | 0 | 待识别 | 无公开商品样例 |
| 105 | [https://pay.ldxp.cn/shop/TSW7DIEI](https://pay.ldxp.cn/shop/TSW7DIEI) | ai主理人 | Claude, ChatGPT, Gemini | 6 | ldxpShop | claude max 中转满血api；claude max api10刀兑换码 |
| 106 | [https://pay.ldxp.cn/shop/F06LXGPS](https://pay.ldxp.cn/shop/F06LXGPS) | aikami | Claude, ChatGPT | 2 | ldxpShop | gemini pro 一年 代订阅包含绑卡cdkey 无质保；Claude Pro 直充月卡 |
| 107 | [https://pay.ldxp.cn/shop/7DQD04V0](https://pay.ldxp.cn/shop/7DQD04V0) | AI货源小店 | ChatGPT, Gemini | 0 | ldxpShop | 无公开商品样例 |
| 108 | [https://ccdawang.win/products](https://ccdawang.win/products) | cc-cat | ChatGPT, Claude, Gemini, Grok | 0 | 待识别 | 无公开商品样例 |
| 109 | [https://gemini91.shop/](https://gemini91.shop/) | R佬的ai小店 | Gemini | 0 | genericShop/待试采 | 无公开商品样例 |
| 110 | [https://pay.ldxp.cn/shop/RYGO8TOG](https://pay.ldxp.cn/shop/RYGO8TOG) | GV全球供应商 | Google Voice | 0 | ldxpShop | 无公开商品样例 |
| 111 | [https://gmail91.shop/](https://gmail91.shop/) | 91网\|一手货源 | ChatGPT, Google, Grok, Outlook, Telegram | 0 | genericShop/待试采 | 无公开商品样例 |
| 112 | [https://morimm.com/](https://morimm.com/) | 小恐龙发卡网 | ChatGPT, Claude, Grok, Google, Gemini | 0 | 待识别 | 无公开商品样例 |

## 4. 重复 URL 分组

这些是 NodeBits 中不同店铺记录指向同一规范化入口的情况。导入 PriceAI 候选池前应按规范化 URL 去重，只保留一个渠道源，再把别名写入备注或别名字段。

| # | 规范化入口 | NodeBits 店铺名 |
|---:|---|---|
| 1 | [https://douyiner.cn/](https://douyiner.cn/) | Gemini账号批发, douyiner |
| 2 | [https://pay.ldxp.cn/shop/aishop1](https://pay.ldxp.cn/shop/aishop1) | GPT大玩家, GPT 大玩家 |
| 3 | [https://pay.ldxp.cn/shop/MEDDEX4V](https://pay.ldxp.cn/shop/MEDDEX4V) | AI HOME, AI HOME |
| 4 | [https://pay.ldxp.cn/shop/IK7OYLXZ](https://pay.ldxp.cn/shop/IK7OYLXZ) | 猫猫豆, 猫猫豆 |
| 5 | [https://a1gmail.com/](https://a1gmail.com/) | A1gmail谷歌邮箱批发, a1gmail |

## 5. 剔除的无效入口

| # | 入口 | NodeBits 店铺名 | 原因 |
|---:|---|---|---|
| 1 | http://localhost:3000/ | 测试店铺 | 本地测试地址，不是公开渠道 |

## 6. 后续处理建议

1. 先把本清单按规范化 URL 去重后导入“候选渠道池”，不要直接启用为正式报价来源。
2. 对 `pay.ldxp.cn/shop/...` 来源优先接入已有 ldxp 店铺采集器批量试采集。
3. 对 `kapay.shop`、`shop.auto-subscribe.com` 这类 Auto Subscribe 形态优先接入 autoSubscribe 采集器。
4. 对其他独立站先进入“待试采”，由试采集结果决定是归入已有通用采集器，还是进入“待补采集器”。
5. 单商品链接只能作为反查线索，不应直接成为渠道入口；正式渠道入口以本清单中的店铺入口为准。
