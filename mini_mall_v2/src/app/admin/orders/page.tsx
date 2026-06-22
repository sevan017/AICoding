"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface OrderSummary {
  id: string; totalAmount: number; discountRate: number; finalAmount: number;
  status: string; createdAt: string;
  user: { id: string; name: string; email: string };
  orderItems: { id: string; quantity: number; product: { id: string; name: string } }[];
}

const STATUS_MAP: Record<string, string> = { PENDING: "待付款", PAID: "已支付", SHIPPED: "已发货", COMPLETED: "已完成", CANCELLED: "已取消" };
const NEXT_STATUS: Record<string, string[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["COMPLETED", "CANCELLED"],
};
/** 终态：不可再操作 */
const TERMINAL_STATUSES = new Set(["COMPLETED", "CANCELLED"]);

/**
 * 订单管理页 — 所有订单列表 + 状态流转
 */
export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders");
      if (res.status === 403 || res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      setOrders(data.orders);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function updateStatus(orderId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { const d = await res.json(); alert(d.error); return; }
      fetchOrders();
    } catch { alert("网络错误"); }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">加载中…</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">订单管理</h1>

        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-400">
                  {new Date(order.createdAt).toLocaleString("zh-CN")} &nbsp;|&nbsp;
                  {order.user.name} ({order.user.email})
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  order.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                  order.status === "PAID" ? "bg-green-100 text-green-700" :
                  order.status === "SHIPPED" ? "bg-blue-100 text-blue-700" :
                  order.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-600"
                }`}>{STATUS_MAP[order.status] || order.status}</span>
              </div>

              <div className="flex flex-wrap gap-1 mb-2">
                {order.orderItems.map((item) => (
                  <span key={item.id} className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                    {item.product.name} × {item.quantity}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  共 {order.orderItems.reduce((s, i) => s + i.quantity, 0)} 件 &nbsp;
                  {order.discountRate < 1 && <span className="text-blue-500">({(order.discountRate * 100).toFixed(0)}折)</span>}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-red-600">¥{order.finalAmount.toFixed(2)}</span>
                  {!TERMINAL_STATUSES.has(order.status) && NEXT_STATUS[order.status]?.map((ns) => (
                    <button
                      key={ns}
                      onClick={() => updateStatus(order.id, ns)}
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        ns === "CANCELLED" ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                      }`}
                    >
                      {STATUS_MAP[ns]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {orders.length === 0 && <p className="text-center py-8 text-gray-400">暂无订单</p>}

        <p className="text-center mt-6">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">← 返回管理后台</Link>
        </p>
      </div>
    </div>
  );
}
