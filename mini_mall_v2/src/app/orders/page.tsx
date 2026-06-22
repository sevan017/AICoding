"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface OrderSummary {
  id: string;
  totalAmount: number;
  discountRate: number;
  finalAmount: number;
  status: string;
  createdAt: string;
  orderItems: { id: string; quantity: number; product: { id: string; name: string; imageUrl: string } }[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待付款", color: "bg-yellow-100 text-yellow-700" },
  PAID: { label: "已支付", color: "bg-green-100 text-green-700" },
  SHIPPED: { label: "已发货", color: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "已完成", color: "bg-gray-100 text-gray-700" },
  CANCELLED: { label: "已取消", color: "bg-red-100 text-red-700" },
};

/**
 * 订单列表页
 */
export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.status === 401) { router.push("/login?redirect=/orders"); return; }
      const data = await res.json();
      setOrders(data.orders);
    } catch {
      setError("加载订单失败");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">加载中…</p></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">{error}</p>
        <button onClick={fetchOrders} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">重新加载</button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-gray-500">暂无订单</p>
        <Link href="/" className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">去逛逛</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">我的订单</h1>

        <div className="space-y-3">
          {orders.map((order) => {
            const status = STATUS_MAP[order.status] || { label: order.status, color: "bg-gray-100 text-gray-600" };
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleString("zh-CN", {
                      year: "numeric", month: "2-digit", day: "2-digit",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                {/* 商品缩略 */}
                <div className="flex gap-2 mb-2">
                  {order.orderItems.slice(0, 4).map((item) => (
                    <div key={item.id} className="relative w-14 h-14 rounded bg-gray-100 overflow-hidden shrink-0">
                      <Image src={item.product.imageUrl || "/placeholder.svg"} alt={item.product.name} fill className="object-cover" sizes="56px" />
                    </div>
                  ))}
                  {order.orderItems.length > 4 && (
                    <div className="w-14 h-14 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-500 shrink-0">
                      +{order.orderItems.length - 4}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    共 {order.orderItems.reduce((s, i) => s + i.quantity, 0)} 件
                  </span>
                  <span className="text-lg font-bold text-red-600">¥{order.finalAmount.toFixed(2)}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← 返回首页</Link>
        </p>
      </div>
    </div>
  );
}
