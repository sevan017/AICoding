"""
list_records.py — "账目列表" Tab

提供 render_list() 函数，以表格形式展示所有账目记录。
支持按月份和分类筛选（筛选参数由 app.py 从侧边栏传入）。
同时提供按 ID 删除记录的功能。
"""

import pandas as pd
import streamlit as st

from database import delete_record, get_records


def render_list(month, category):
    """
    渲染账目列表，包含表格展示和删除功能。

    参数：
      month    — 月份筛选值（int 或 None，由 app.py 侧边栏传入）
      category — 分类筛选值（str 或 None，由 app.py 侧边栏传入）
    """
    st.subheader("📋 账目列表")

    # 从数据库获取符合条件的记录
    records = get_records(month=month, category=category)

    # --- 边界处理：数据库为空 ---
    if not records:
        st.info("📭 暂无记录，请先到「添加账目」标签页添加数据")
        return  # 提前返回，不渲染后面的表格和删除区域

    # --- 汇总信息：记录总数 + 金额合计 ---
    total_amount = sum(r["amount"] for r in records)
    col1, col2 = st.columns(2)
    with col1:
        st.caption(f"共 {len(records)} 条记录")
    with col2:
        st.caption(f"合计：¥{total_amount:.2f}")

    # --- 表格展示 ---
    # 将记录转为 pandas DataFrame，方便 Streamlit 渲染表格
    df = pd.DataFrame(records)
    # 重命名列名为中文，让表格更易读
    df_display = df.rename(
        columns={
            "id": "ID",
            "amount": "金额",
            "category": "分类",
            "date": "日期",
            "note": "备注",
        }
    )
    # st.dataframe 渲染可交互的表格（支持排序、列宽调整等）
    st.dataframe(df_display, use_container_width=True, hide_index=True)

    # --- 删除功能 ---
    st.subheader("🗑️ 删除账目")
    st.caption("输入要删除的记录 ID，点击删除按钮")

    # 用两列布局排列删除控件
    col1, col2 = st.columns([1, 3])
    with col1:
        # 数字输入框，min_value=1 确保输入的 ID 至少是 1
        delete_id = st.number_input("记录 ID", min_value=1, step=1, key="delete_id")
    with col2:
        st.write("")  # 占位，让按钮和输入框对齐
        st.write("")
        delete_btn = st.button("🗑️ 删除", type="primary")

    if delete_btn:
        # 先检查该 ID 是否在当前筛选结果的列表中
        # 这是为了防止用户误删不在当前页面显示范围的记录
        records_by_id = {r["id"]: r for r in records}
        if delete_id not in records_by_id:
            st.warning(f"⚠️ 未在当前列表中找到 ID={delete_id}，请确认 ID 是否正确")
        else:
            # 查出记录信息用于反馈
            target = records_by_id[delete_id]
            # 执行删除
            delete_record(delete_id)
            # 显示删除反馈
            st.success(f"✅ 已删除：ID={delete_id} {target['category']} ¥{target['amount']:.2f}")
            # 刷新页面
            st.rerun()
