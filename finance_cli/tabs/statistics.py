"""
statistics.py — "分类统计" Tab

提供 render_stats() 函数，展示按分类汇总的统计信息：
- 月度总支出
- 柱状图（各分类金额对比）
- 统计表（分类、笔数、总额、占比）

支持按月份筛选（筛选参数由 app.py 从侧边栏传入）。
"""

import pandas as pd
import streamlit as st

from config import CATEGORIES
from database import get_stats


def render_stats(month):
    """
    渲染分类统计页面，包含柱状图和统计表。

    参数：
      month — 月份筛选值（int 或 None，由 app.py 侧边栏传入）
    """
    st.subheader("📊 分类统计")

    # 从数据库获取按分类汇总的统计数据
    stats = get_stats(month=month)

    # --- 边界处理：没有任何记录 ---
    if not stats:
        st.info("📭 暂无数据，请先到「添加账目」标签页添加记录")
        return

    # --- 补全缺失分类（某个分类在当月没有任何记录时也显示它）---
    # 将已有数据转为 {分类: {count, total, percent}} 的字典
    stats_by_cat = {s["category"]: s for s in stats}

    # 计算所有分类的总支出（用于缺类补零时计算占比）
    grand_total = sum(s["total"] for s in stats)
    # 月份提示文案
    month_label = f"{month} 月" if month else "全部月份"
    st.metric(label=f"📅 {month_label} 总支出", value=f"¥{grand_total:,.2f}")

    # 为 6 个预设分类补齐数据
    complete_stats = []
    for cat in CATEGORIES:
        if cat in stats_by_cat:
            complete_stats.append(stats_by_cat[cat])
        else:
            # 该分类没有记录，补一条全零的数据
            complete_stats.append(
                {
                    "category": cat,
                    "count": 0,
                    "total": 0,
                    "percent": 0.0,
                }
            )

    # --- 柱状图 ---
    # 将数据转为 DataFrame，以分类为索引、总额为值
    df = pd.DataFrame(complete_stats)
    chart_df = df.set_index("category")[["total"]]
    # st.bar_chart 是 Streamlit 内置的柱状图组件
    # 横轴 = 分类（index），纵轴 = 总额（total 列）
    st.bar_chart(chart_df, y_label="总额（元）", x_label="分类")

    # --- 统计表 ---
    # 格式化显示：金额显示两位小数，占比显示百分号
    df_display = df.rename(
        columns={
            "category": "分类",
            "count": "笔数",
            "total": "总额",
            "percent": "占比",
        }
    )
    # 格式化金额列（保留两位小数）
    df_display["总额"] = df_display["总额"].apply(lambda x: f"¥{x:.2f}")
    # 格式化占比列（加上 % 符号）
    df_display["占比"] = df_display["占比"].apply(lambda x: f"{x}%")

    # 按总额降序排列（先转回数值排序再格式化也行，这里用原始 df 的 total 排序索引）
    df_display = df_display.sort_values("笔数", ascending=False)

    st.dataframe(df_display, use_container_width=True, hide_index=True)
