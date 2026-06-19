# CLAUDE.md — 记账工具 (Finance CLI)

## 项目概述

一个基于 **Python + Streamlit + SQLite3** 的个人记账 Web 应用。无需安装数据库软件，SQLite 文件自动创建，开箱即用。

## 功能一览

| 功能 | 说明 |
|------|------|
| 添加账目 | 填写金额、分类、日期、备注，网页表单提交 |
| 查看列表 | 表格展示所有账目，支持按月份和分类筛选 |
| 删除账目 | 输入记录 ID 删除，有确认机制防止误删 |
| 分类统计 | 柱状图 + 统计表，按分类汇总金额和占比 |

## 技术栈

| 组件 | 用途 |
|------|------|
| Python 3.8+ | 编程语言 |
| Streamlit | Web 界面框架（自动生成网页，无需写 HTML/CSS/JS） |
| SQLite3 | 数据库（Python 内置，无需安装，数据存于 .db 文件） |
| pandas | 数据处理（Streamlit 表格和图表依赖） |

## 项目结构

```
finance_cli/
├── CLAUDE.md              # 本文件，项目操作指引
├── .gitignore             # Git 忽略规则（忽略 *.db 数据库文件）
├── requirements.txt       # Python 依赖包列表
├── config.py              # 全局常量：6 个预设分类、数据库文件名
├── database.py            # 数据库操作层（建表、增删查、统计）
├── app.py                 # 应用入口（页面布局、侧边栏筛选器、Tab 路由）
└── tabs/
    ├── __init__.py         # 包初始化文件（空）
    ├── add_record.py       # "添加账目" Tab 的界面渲染
    ├── list_records.py     # "账目列表" Tab 的界面渲染
    └── statistics.py       # "分类统计" Tab 的界面渲染
```

**依赖关系**：`app.py` → `tabs/*.py` → `database.py` → `config.py`

- `config.py` 最底层，只定义常量
- `database.py` 封装所有 SQL 操作，是数据访问的唯一入口
- `tabs/*.py` 只负责画界面，通过 `database.py` 读写数据
- `app.py` 是入口，组合侧边栏和三个 Tab

## 数据库表结构

表名：`records`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增，唯一标识一条记录 |
| amount | REAL | 金额，不能为空 |
| category | TEXT | 分类，不能为空（6 个预设值之一） |
| date | TEXT | 日期，格式 YYYY-MM-DD |
| note | TEXT | 备注，可为空，默认空字符串 |

建表 SQL（由 `database.py` 的 `init_db()` 自动执行）：
```sql
CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    note TEXT DEFAULT ''
)
```

## 预设分类

`config.py` 中定义的 6 个分类：

| 分类 | 典型场景 |
|------|----------|
| 餐饮 | 吃饭、外卖、聚餐、买菜 |
| 交通 | 公交、地铁、打车、加油 |
| 购物 | 日用品、衣服、电子产品 |
| 娱乐 | 电影、游戏、旅游、运动 |
| 居住 | 房租、水电、物业、维修 |
| 其他 | 无法归入以上分类的支出 |

> 可以自由修改 `config.py` 中的 `CATEGORIES` 列表来增删分类。

## 环境准备

### 1. 检查 Python 版本
```bash
python --version   # 需要 3.8 或更高
```

### 2. 安装依赖
```bash
cd finance_cli
pip install -r requirements.txt
```

### 3. 启动应用
```bash
streamlit run app.py
```

浏览器会自动打开 `http://localhost:8501`，即可开始使用。

### 4. 停止应用
在终端按 `Ctrl + C`。

## 使用指南

### 添加账目
1. 点击"添加账目"标签页
2. 填写金额（必填，须大于 0）
3. 选择分类（下拉框，6 个预设分类）
4. 选择日期（日期选择器，默认今天）
5. 填写备注（可选）
6. 点击"添加"按钮
7. 看到绿色成功提示即表示添加成功

### 查看列表
1. 点击"账目列表"标签页
2. 使用左侧边栏筛选器按月份、分类过滤
3. 表格显示所有符合条件的记录，按日期降序排列
4. 表格上方显示记录总数和金额合计

### 删除账目
1. 在"账目列表"标签页底部
2. 输入要删除的记录 ID
3. 点击"删除"按钮
4. 系统会确认后删除（防止误删当前筛选范围外的记录）

### 分类统计
1. 点击"分类统计"标签页
2. 左侧边栏的月份筛选器同样生效
3. 上方显示月度总支出
4. 柱状图直观展示各分类金额对比
5. 下方表格列出分类、笔数、总额、占比

## 边界处理说明

| 场景 | 应用行为 |
|------|----------|
| 首次运行，数据库不存在 | 自动创建 `finance.db` 文件和 `records` 表 |
| 数据库中没有任何记录 | 列表显示"暂无记录"，统计显示"暂无数据" |
| 输入金额为 0 或负数 | 红色错误提示"金额必须大于 0" |
| 输入金额过大（> 999,999.99） | 黄色警告提示 |
| 备注超过 100 字符 | 黄色警告提示 |
| 日期选择在未来 | 黄色警告提醒但允许提交 |
| 删除不存在的 ID | 黄色警告"未在当前列表中找到 ID=XX" |
| 删除已被筛选掉的记录 | 拒绝删除，提示该 ID 不在当前列表中 |
| 某月没有任何支出 | 统计图显示 6 个分类均为 0，防除零错误 |
| 某分类在当月无记录 | 统计表仍显示该分类，笔数=0、总额=0、占比=0% |
| 数据库文件被误删 | 重新启动应用会自动创建新的空数据库 |

## Streamlit 工作原理（给初学者）

Streamlit 的核心机制是**"每次交互都重新运行整个脚本"**：

1. 你在浏览器中点击按钮、选择下拉框、切换标签页
2. Streamlit 从头到尾重新执行 `app.py`
3. 所有变量重新计算，页面根据新数据重新渲染

这意味着：
- 不需要手动刷新页面——任何操作都会自动刷新
- 代码中的 `st.rerun()` 会立即触发一次重新运行
- 变量不会在两次交互之间保留（除非使用 `st.session_state`，本项目暂不需要）

## 常见问题

**Q: 数据存在哪里？**
A: 数据存在 `finance_cli/finance.db` 文件中（SQLite 数据库）。该文件已在 `.gitignore` 中忽略，不会被提交到 git。

**Q: 如何备份数据？**
A: 直接复制 `finance.db` 文件即可。恢复时放回原位置。

**Q: 如何查看原始数据？**
A: 可以用任何 SQLite 客户端打开 `finance.db`，例如 VS Code 的 SQLite 插件、DB Browser for SQLite，或命令行 `sqlite3 finance.db`。

**Q: 如何修改分类？**
A: 编辑 `config.py` 中的 `CATEGORIES` 列表。注意：已有数据中的旧分类不会自动迁移，需要手动更新数据库。

**Q: 端口被占用怎么办？**
A: 启动时指定其他端口：
```bash
streamlit run app.py --server.port 8502
```
