"""
database.py — SQLite 数据库操作层

本文件封装了所有与 SQLite 数据库打交道的工作，包括：
- 建表（首次运行时自动创建）
- 增删查（添加、删除、查询账目记录）
- 统计（按分类汇总金额和占比）

上层模块（如 tabs/*.py）只需调用这里的函数，不用关心 SQL 语句怎么写。
"""

import sqlite3

from config import DB_NAME


def get_connection():
    """
    创建数据库连接。

    设置了 row_factory = sqlite3.Row，这样查询返回的每一行数据
    都可以用 row["列名"] 的方式访问（像字典一样），比用数字索引更直观。
    """
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row  # 让查询结果支持 row["列名"] 访问
    return conn


def init_db():
    """
    初始化数据库：如果 records 表不存在则自动创建。

    表结构说明：
      id       — 自增主键，每添加一条记录自动 +1，唯一标识
      amount   — 金额（REAL 表示浮点数，NOT NULL 表示必填）
      category — 分类（TEXT 字符串，NOT NULL 必填）
      date     — 日期（TEXT 字符串，格式 YYYY-MM-DD）
      note     — 备注（TEXT 字符串，可为空，默认空字符串）
    """
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount REAL NOT NULL,
                category TEXT NOT NULL,
                date TEXT NOT NULL,
                note TEXT DEFAULT ''
            )
            """
        )
        # with 语句结束时自动提交（commit），无需手动调用 conn.commit()


def add_record(amount, category, date, note):
    """
    添加一条账目记录。

    参数：
      amount   — 金额（数字）
      category — 分类（6 个预设值之一，如 "餐饮"）
      date     — 日期（字符串，格式 "YYYY-MM-DD"）
      note     — 备注（字符串，可为空）

    注意：SQL 中的 ? 是参数化占位符，值由后面的元组传入。
          这样做是为了防止 SQL 注入攻击，绝不是简单的字符串拼接。
    """
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO records (amount, category, date, note) VALUES (?, ?, ?, ?)",
            (amount, category, date, note),
        )


def get_records(month=None, category=None):
    """
    查询账目列表，支持按月份和分类筛选。

    参数：
      month    — 月份（1-12 的数字），None 表示不筛选
      category — 分类名称，None 表示不筛选

    返回：list[dict]，每个 dict 是一条记录，按日期降序排列（最新的在前）

    技巧说明：
      WHERE 1=1 是一个 "恒真条件"，本身不影响查询结果。
      它的作用是方便后面用 AND 动态拼接筛选条件——
      不管有没有筛选条件，SQL 语法都是正确的。
      strftime('%m', date) 从 "YYYY-MM-DD" 字符串中提取月份（01-12）。
    """
    sql = "SELECT * FROM records WHERE 1=1"
    params = []

    if month:
        # strftime('%m', date) 提取日期的月份部分
        sql += " AND strftime('%m', date) = ?"
        params.append(f"{month:02d}")  # 格式化为两位数字，1 → "01"

    if category:
        sql += " AND category = ?"
        params.append(category)

    sql += " ORDER BY date DESC, id DESC"  # 按日期降序，同日期按 ID 降序

    with get_connection() as conn:
        rows = conn.execute(sql, params).fetchall()

    # 将 sqlite3.Row 对象转为普通 dict，方便后续处理
    return [dict(row) for row in rows]


def delete_record(record_id):
    """
    按 ID 删除一条记录。

    参数：
      record_id — 要删除的记录 ID（整数）
    """
    with get_connection() as conn:
        conn.execute("DELETE FROM records WHERE id = ?", (record_id,))


def get_stats(month=None):
    """
    按分类统计金额和占比。

    参数：
      month — 月份（1-12 的数字），None 表示统计全部

    返回：list[dict]，每个 dict 包含：
      category — 分类名称
      count    — 该分类的记录条数
      total    — 该分类的金额合计
      percent  — 占总金额的百分比（浮点数，如 35.5 表示 35.5%）

    SQL 说明：
      COUNT(*)  — 统计行数（该分类有多少条记录）
      SUM(amount) — 求和（该分类总共花了多少钱）
      GROUP BY category — 按分类分组（每个分类一行汇总结果）
      ORDER BY total DESC — 按总金额从高到低排列
      || 是 SQLite 中的字符串拼接运算符
    """
    with get_connection() as conn:
        # 先计算所有符合条件记录的总金额（用于算百分比）
        total_sql = "SELECT COALESCE(SUM(amount), 0) FROM records WHERE 1=1"
        params_total = []

        if month:
            total_sql += " AND strftime('%m', date) = ?"
            params_total.append(f"{month:02d}")

        total_all = conn.execute(total_sql, params_total).fetchone()[0]

        # 按分类汇总统计
        stats_sql = """
            SELECT
                category,
                COUNT(*) AS count,
                SUM(amount) AS total
            FROM records
            WHERE 1=1
        """
        params_stats = []

        if month:
            stats_sql += " AND strftime('%m', date) = ?"
            params_stats.append(f"{month:02d}")

        stats_sql += " GROUP BY category ORDER BY total DESC"
        rows = conn.execute(stats_sql, params_stats).fetchall()

    # 计算每个分类的百分比
    # or 1 是为了防止除零错误（当没有任何记录时 total_all 为 0）
    result = []
    for row in rows:
        result.append(
            {
                "category": row["category"],
                "count": row["count"],
                "total": row["total"],
                "percent": round(row["total"] / (total_all or 1) * 100, 1),
            }
        )

    return result
