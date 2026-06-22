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
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

interface Category { id: string; name: string; slug: string; }
interface Product { id: string; name: string; description: string; price: number; imageUrl: string; stock: number; categoryId: string; category: Category | null; createdAt: string; }

/** 商品管理页 */
export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: 0, imageUrl: "", stock: 0, categoryId: "" });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
      ]);
      if (pRes.status === 403 || pRes.status === 401) { router.push("/login"); return; }
      const [pData, cData] = await Promise.all([pRes.json(), cRes.json()]);
      setProducts(pData.products);
      setCategories(cData.categories);
    } catch { setError("加载失败"); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openCreate() {
    setEditId(null);
    setForm({ name: "", description: "", price: 0, imageUrl: "", stock: 0, categoryId: categories[0]?.id || "" });
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditId(p.id);
    setForm({ name: p.name, description: p.description, price: p.price, imageUrl: p.imageUrl, stock: p.stock, categoryId: p.categoryId });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const url = editId ? `/api/admin/products/${editId}` : "/api/admin/products";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); alert(d.error || "保存失败"); return; }
      setShowForm(false);
      fetchData();
    } catch { alert("网络错误"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`确定删除商品"${name}"吗？`)) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); alert(d.error); return; }
      fetchData();
    } catch { alert("网络错误"); }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">加载中…</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">商品管理</h1>
          <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">新增商品</button>
        </div>

        {/* 商品表格 */}
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">名称</th>
                <th className="px-4 py-3 text-left">分类</th>
                <th className="px-4 py-3 text-right">价格</th>
                <th className="px-4 py-3 text-right">库存</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.category?.name || "-"}</td>
                  <td className="px-4 py-3 text-right">¥{p.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{p.stock}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline">编辑</button>
                    <button onClick={() => handleDelete(p.id, p.name)} className="text-red-500 hover:underline">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <p className="text-center py-8 text-gray-400">暂无商品</p>}
        </div>

        {/* 新增/编辑弹窗 */}
        {showForm && (
          <Modal title={editId ? "编辑商品" : "新增商品"} onClose={() => setShowForm(false)}>
            <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="商品名称" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <textarea className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="描述" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <div className="flex gap-2">
              <input type="number" min="0" step="0.01" className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="价格" value={form.price || ""} onChange={e => setForm({ ...form, price: +e.target.value })} />
              <input type="number" min="0" step="1" className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="库存" value={form.stock || ""} onChange={e => setForm({ ...form, stock: +e.target.value })} />
            </div>
            <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="图片 URL" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
            <select className="w-full px-3 py-2 border rounded-lg text-sm" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">选择分类</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
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
