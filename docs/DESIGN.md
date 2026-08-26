# DevShare（技享）设计规范

## 1. 品牌

- 品牌名：**DevShare（技享）**（占位，可替换）
- 定位：面向开发者的技术内容社区
- 标语：中文「技术内容社区」/ 英文 "Developer Content Community"

## 2. 色彩（Tailwind v4 @theme tokens）

| Token | 值 | 用途 |
| --- | --- | --- |
| `brand-500` | `#2F6BFF` | 主色：链接、主按钮、选中态 |
| `brand-50/100` | `#EEF4FF/#D9E6FF` | 浅色背景、标签底 |
| `accent-500` | `#00C2A8` | 强调色：写文章按钮、品牌渐变 |
| `bg` | `#F7F8FA` | 页面背景 |
| `text` | `#0F172A`（slate-900）| 正文/标题 |
| 中性色 | slate 系列 | 边框、次要文字、hover |

规则：v1 仅浅色主题；品牌渐变 `from-brand-500 to-accent-500` 用于 Logo 与视觉点缀。

## 3. 字体与排版

- 字体栈：`Inter, PingFang SC, Hiragino Sans GB, Microsoft YaHei, system-ui`
- 代码字体：`JetBrains Mono, SFMono-Regular, Consolas`
- 正文 16px / 行高 1.8；标题层级用粗体 + 字号区分；长文排版见 `.prose-content`。

## 4. 组件规范（手写 Tailwind，无组件库）

| 组件 | 说明 |
| --- | --- |
| BaseButton | primary / secondary / ghost / danger × sm / md / lg，loading / disabled |
| BaseInput / BaseTextarea / BaseSelect | 表单控件，聚焦 ring 反馈，错误态 |
| BaseModal | 遮罩 + 居中卡片 + Esc 关闭 |
| BaseDropdown | 点击触发 + 点击外部关闭 |
| BaseTabs | 下划线式 tab |
| BaseToast | 顶部居中消息，3.2s 自动消失 |
| BaseAvatar / BaseTag / BaseSkeleton / BaseSpinner / BaseEmpty | 展示类原子组件 |
| ArticleCard | 信息流卡片，**固定高度 144px**（虚拟滚动前提） |
| VirtualFeed | TanStack Virtual 封装，SSR 首屏直出前 12 条，客户端激活后虚拟化 |
| HotRank | 热门榜，前三名彩色角标 |

## 5. 交互与体验

- 信息流：进入即 SSR 首屏 → 客户端虚拟滚动 + 触底加载更多；
- 互动（点赞/收藏/关注）：乐观更新 + Toast 反馈；未登录点击跳转登录；
- 语言切换：顶栏下拉，保存到 `df_locale` cookie，URL `/zh` `/en` 前缀；
- 图片：懒加载 + 封面缩略图，上传 ≤ 5MB 且仅图片。
