# 记账工具 (Finance CLI) — 开发对话记录

## 项目概述

构建一个基于 **Python + Streamlit + SQLite3** 的个人记账 Web 应用。

## 对话时间线

### 2026-06-19

#### 1. 需求确认
用户提出做一个 Python Web 记账工具，功能包括：
- 添加账目（金额、分类、日期、备注）——在网页表单里填写
- 查看列表（按月份和分类筛选）——表格展示
- 删除账目——输入 ID 删除
- 分类统计——柱状图 + 统计表

技术栈：Python + Streamlit + SQLite3。预设 6 个分类：餐饮、交通、购物、娱乐、居住、其他。

用户明确表示是编程新手，要求先出方案再动手。

#### 2. 方案设计
探索了 `finance_cli/` 目录现状——原有代码文件已被删除但仍保留在 git 历史中。Launched 2 agents：
- Explore agent：探查项目结构和 git 历史
- Plan agent：设计实施方案

**决策**：从 git 恢复原有代码，增强中文注释和边界处理（而非从零重写，因为原代码结构清晰、SQL 参数化防注入）。

方案经用户审阅后批准，同时用户要求将 CLAUDE.md 作为项目初始化文档写入项目目录。

#### 3. 环境准备
- Python 3.13.12 ✅
- pip 26.0.1 ✅
- 安装 `streamlit>=1.35.0` 和 `pandas>=2.2.0` ✅
- pip 源切换为清华镜像（`https://pypi.tuna.tsinghua.edu.cn/simple`）

#### 4. 代码编写
按顺序创建/增强以下文件：

| 文件 | 说明 |
|------|------|
| `CLAUDE.md` | 项目操作文档（技术栈、表结构、使用指南、FAQ） |
| `requirements.txt` | streamlit>=1.35.0, pandas>=2.2.0 |
| `.gitignore` | 忽略 `__pycache__/`、`*.pyc`、`*.db` |
| `config.py` | 6 个预设分类常量 + 数据库文件名 |
| `database.py` | SQLite 数据层，使用 `with conn:` 资源管理 |
| `tabs/__init__.py` | 包初始化文件 |
| `tabs/add_record.py` | 添加账目表单，含金额/日期/备注校验 |
| `tabs/list_records.py` | 列表展示 + 删除，显示记录数和合计 |
| `tabs/statistics.py` | 柱状图 + 统计表，缺类补零 |
| `app.py` | Streamlit 主入口，侧边栏筛选器 + 3 个 Tab |

所有文件均包含详细中文注释。

#### 5. 验证测试

**语法检查**：7 个 Python 文件全部通过 `py_compile`。

**功能测试**（全部通过）：
- `init_db()` — 自动建表 ✅
- `add_record()` — 写入 5 条测试数据 ✅
- `get_records()` — 查询全部返回 5 条 ✅
- `get_records(month=6)` — 按月筛选返回 5 条 ✅
- `get_records(category='餐饮')` — 按分类筛选返回 2 条 ✅
- `get_stats()` — 4 个分类，占比约 100% ✅
- `delete_record()` — 删除后剩余 4 条 ✅

**启动测试**：`streamlit run app.py` 启动成功，HTTP 200 响应。预填 7 条演示数据。

## 项目最终结构

```
finance_cli/
├── CLAUDE.md              # 项目操作文档
├── .gitignore             # Git 忽略规则
├── requirements.txt       # Python 依赖
├── config.py              # 全局常量
├── database.py            # SQLite 数据层
├── app.py                 # Streamlit 主入口
└── tabs/
    ├── __init__.py
    ├── add_record.py       # 添加账目 Tab
    ├── list_records.py     # 账目列表 Tab
    └── statistics.py       # 分类统计 Tab
```

## 数据库表结构

```sql
CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    note TEXT DEFAULT ''
)
```

## 启动方式

```bash
cd finance_cli
pip install -r requirements.txt
streamlit run app.py
# 浏览器访问 http://localhost:8501
```

## 关键设计决策

1. **恢复 vs 重写**：选择从 git 恢复原有代码并增强，因为原代码结构好、SQL 安全
2. **不使用 st.session_state**：当前功能不需要跨 rerun 保存状态
3. **with conn 资源管理**：替代手动 conn.close()，自动提交和释放
4. **缺类补零**：statistics.py 中即使某分类无记录也显示该分类（笔数=0, 总额=0）
5. **删除保护**：删除前检查 ID 是否在当前筛选列表中，防止误删不可见记录
6. **pip 源**：切换为清华镜像加速下载
