"""
add_record.py — "添加账目" Tab

提供 render_add_form() 函数，渲染添加账目的网页表单。
用户填写金额、分类、日期、备注后点击"添加"按钮提交。
"""

import datetime

import streamlit as st

from config import CATEGORIES
from database import add_record


def render_add_form():
    """渲染添加账目的表单界面。"""
    st.subheader("✏️ 添加账目")

    # st.form 会创建一个表单容器，用户点击"添加"按钮后才触发提交
    # clear_on_submit=True 表示提交成功后自动清空表单内容
    with st.form("add_form", clear_on_submit=True):
        # 金额输入（数字输入框，最小值为 0，步长为 0.01 支持两位小数）
        amount = st.number_input(
            "💰 金额（元）",
            min_value=0.0,
            max_value=999999.99,  # 设置上限，防止输入超大数值
            step=0.01,
            format="%.2f",
        )

        # 分类选择（下拉框，选项来自 config.py 的 CATEGORIES 列表）
        category = st.selectbox("📂 分类", CATEGORIES)

        # 日期选择（日期选择器，默认选中今天）
        today = datetime.date.today()
        date = st.date_input("📅 日期", value=today)

        # 备注输入（文本输入框，限制长度防止数据库存储异常数据）
        note = st.text_input(
            "📝 备注（可选）",
            max_chars=100,  # 限制最多 100 个字符
            placeholder="例如：午餐外卖",
        )

        # 提交按钮（form_submit_button 必须放在 with st.form 代码块内）
        submitted = st.form_submit_button("✅ 添加")

    # --- 以下是表单提交后的处理逻辑 ---
    if submitted:
        # 校验 1：金额必须大于 0
        if amount <= 0:
            st.error("❌ 金额必须大于 0")
            return  # 提前返回，不执行后续的添加操作

        # 校验 2：金额过大时弹出警告但允许提交
        if amount > 99999.99:
            st.warning("⚠️ 金额较大，请确认是否正确")

        # 校验 3：日期选在未来时弹出提醒（可能是计划支出）
        if date > today:
            st.warning("⚠️ 日期在未来，请确认是否为计划支出")

        # 校验 4：备注过长时提示
        if len(note) > 100:
            st.warning("⚠️ 备注过长，已自动截断")
            note = note[:100]

        # 调用 database.py 的数据写入函数，插入一条记录
        add_record(
            amount=amount,
            category=category,
            date=date.isoformat(),  # date 对象 → "YYYY-MM-DD" 字符串
            note=note.strip(),  # 去除首尾空格
        )

        # 显示成功提示，告知用户添加了什么内容
        st.success(f"✅ 已添加：{category} ¥{amount:.2f}")

        # st.rerun() 会让 Streamlit 立即重新运行整个脚本，
        # 页面会刷新，列表和统计会自动更新为最新数据
        st.rerun()
