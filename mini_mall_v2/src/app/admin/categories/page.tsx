"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/** 模态框 — 支持遮罩点击关闭 + ESC 关闭 */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

interface Category { id: string; name: string; slug: string; productCount: number; createdAt: string; }

/** 分类管理页 */
export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.status === 403 || res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      setCategories(data.categories);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  async function handleSave() {
    if (!name.trim() || !slug.trim()) { alert("请填写名称和标识"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
      });
      if (!res.ok) { const d = await res.json(); alert(d.error); return; }
      setShowForm(false); setName(""); setSlug("");
      fetchCategories();
    } catch { alert("网络错误"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string, catName: string) {
    if (!confirm(`确定删除分类"${catName}"吗？`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); alert(d.error); return; }
      fetchCategories();
    } catch { alert("网络错误"); }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">加载中…</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">分类管理</h1>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">新增分类</button>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">名称</th>
                <th className="px-4 py-3 text-left">标识</th>
                <th className="px-4 py-3 text-right">商品数</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.slug}</td>
                  <td className="px-4 py-3 text-right">{c.productCount}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(c.id, c.name)}
                      disabled={c.productCount > 0}
                      className={`text-sm ${c.productCount > 0 ? "text-gray-300 cursor-not-allowed" : "text-red-500 hover:underline"}`}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {categories.length === 0 && <p className="text-center py-8 text-gray-400">暂无分类</p>}
        </div>

        {/* 新增弹窗 */}
        {showForm && (
          <Modal title="新增分类" onClose={() => setShowForm(false)}>
            <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="分类名称" value={name} onChange={e => setName(e.target.value)} />
            <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="URL 标识（英文）" value={slug} onChange={e => setSlug(e.target.value)} />
            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">{saving ? "保存中…" : "保存"}</button>
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">取消</button>
            </div>
          </Modal>
        )}

        <p className="text-center mt-6">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">← 返回管理后台</Link>
        </p>
      </div>
    </div>
  );
}
