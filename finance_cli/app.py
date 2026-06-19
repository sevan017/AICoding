"""
app.py — 记账工具主入口

这是整个 Streamlit 应用的总控制文件，负责：
1. 页面配置（标题、图标、宽屏布局）
2. 初始化数据库（首次运行时自动建表）
3. 侧边栏筛选器（按月份、分类过滤）
4. 三个标签页的路由分发

运行方式：
    cd finance_cli
    streamlit run app.py

Streamlit 的核心理念：
    每次你在浏览器中点击按钮、选择下拉框、切换标签页，
    Streamlit 都会从上到下重新执行这个脚本——
    所有变量重新计算，页面根据最新数据重新渲染。
    所以不需要手动刷新页面，任何操作都会自动触发刷新。
"""

import streamlit as st

from config import CATEGORIES
from database import init_db
from tabs.add_record import render_add_form
from tabs.list_records import render_list
from tabs.statistics import render_stats

# ============================================================
# 1. 页面配置
# ============================================================
st.set_page_config(
    page_title="记账工具",  # 浏览器标签页标题
    page_icon="💰",  # 浏览器标签页图标（emoji）
    layout="wide",  # 宽屏布局，表格和图表有更大的展示空间
)

# ============================================================
# 2. 应用标题
# ============================================================
st.title("💰 记账工具")
st.caption("轻松记录每一笔开销，掌握你的消费习惯")

# ============================================================
# 3. 初始化数据库
# ============================================================
# 首次运行时，SQLite 数据库文件和 records 表会被自动创建
try:
    init_db()
except Exception as e:
    st.error(f"❌ 数据库初始化失败：{e}")
    st.stop()  # 停止渲染后续内容，避免页面显示不完整

# ============================================================
# 4. 侧边栏 — 筛选器
# ============================================================
st.sidebar.header("🔍 筛选条件")

# 月份筛选器
# 选项："全部" + 1 到 12 月
# 当用户选择 "全部" 时，month 赋值为 None（表示不筛选）
month_options = ["全部"] + list(range(1, 13))
month_raw = st.sidebar.selectbox("月份", month_options)
month = None if month_raw == "全部" else month_raw

# 分类筛选器
# 选项："全部" + 6 个预设分类
# 当用户选择 "全部" 时，category 赋值为 None（表示不筛选）
category_options = ["全部"] + CATEGORIES
category_raw = st.sidebar.selectbox("分类", category_options)
category = None if category_raw == "全部" else category_raw

# 侧边栏底部信息
st.sidebar.divider()
st.sidebar.caption("数据存储在 `finance.db` 文件中")
st.sidebar.caption("关闭浏览器标签页即可退出")

# ============================================================
# 5. 三个标签页
# ============================================================
# st.tabs() 创建标签页组件，返回三个 Tab 对象
tab1, tab2, tab3 = st.tabs(["📝 添加账目", "📋 账目列表", "📊 分类统计"])

# Tab 1：添加账目
with tab1:
    render_add_form()

# Tab 2：账目列表（传入筛选条件）
with tab2:
    render_list(month=month, category=category)

# Tab 3：分类统计（传入筛选条件）
with tab3:
    render_stats(month=month)
