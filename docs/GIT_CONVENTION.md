# Git 提交与代码规范

本项目使用 `husky` + `lint-staged` + `commitlint` 统一代码风格与提交格式。

## 提交信息规范（Conventional Commits）

提交信息统一采用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 格式，由 `commitlint` 在提交时自动校验：

```
<type>(<scope>): <subject>
```

示例：

- `feat(web): 添加首页文章流`
- `fix(api): 修复刷新令牌过期问题`
- `docs: 更新部署文档`

### type 常用值

| type       | 说明                   |
| ---------- | ---------------------- |
| `feat`     | 新增功能               |
| `fix`      | 修复缺陷               |
| `docs`     | 文档变更               |
| `style`    | 代码格式（不影响功能） |
| `refactor` | 重构                   |
| `perf`     | 性能优化               |
| `test`     | 测试相关               |
| `build`    | 构建系统               |
| `ci`       | CI 配置                |
| `chore`    | 其他杂项               |
| `revert`   | 回滚                   |

### 长度限制

- 标题（header）不超过 72 字符
- 正文（body）每行不超过 100 字符

## 提交前自动格式化

`.husky/pre-commit` 会在提交前执行 `lint-staged`，对暂存文件运行 `prettier --write`，保持代码风格统一。

## 使用说明

- 首次克隆项目后运行 `pnpm install`，会自动执行 `husky` 配置 Git hooks。
- 提交时请按上述格式编写 message，否则会被 `commit-msg` 钩子拦截。

## 调试

- 跳过 Git hooks：`git commit --no-verify`
- 手动检查提交信息：`echo "feat: xxx" | pnpm exec commitlint`
