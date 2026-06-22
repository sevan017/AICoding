"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import Image from "next/image";
import Link from "next/link";

interface OrderDetail {
  id: string;
  totalAmount: number;
  discountRate: number;
  finalAmount: number;
  status: string;
  createdAt: string;
  orderItems: {
    id: string;
    quantity: number;
    price: number;
    product: { id: string; name: string; imageUrl: string };
  }[];
}

const STATUS_MAP: Record<string, string> = {
  PENDING: "待付款", PAID: "已支付", SHIPPED: "已发货",
  COMPLETED: "已完成", CANCELLED: "已取消",
};

/**
 * 订单详情页 — 商品明细 + 金额 + 状态 + 模拟支付
 */
export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.status === 401) { router.push(`/login?redirect=/orders/${id}`); return; }
      if (!res.ok) throw new Error("加载失败");
      const data = await res.json();
      setOrder(data.order);
    } catch {
      setError("加载订单详情失败");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  async function handlePay() {
    setPaying(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "支付失败"); return; }
      setOrder(data.order);
    } catch {
      setError("网络错误");
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">加载中…</p></div>;
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">{error}</p>
        <button onClick={fetchOrder} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">重新加载</button>
      </div>
    );
  }

  if (!order) return null;

  const discountLabel = order.discountRate < 1 ? `${(order.discountRate * 100).toFixed(0)} 折` : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">订单详情</h1>
        <p className="text-xs text-gray-400 mb-6">
          订单号：{order.id} &nbsp;|&nbsp;
          下单时间：{new Date(order.createdAt).toLocaleString("zh-CN")}
        </p>

        {/* 状态 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">订单状态</span>
            <span className="text-sm font-semibold text-blue-600">{STATUS_MAP[order.status] || order.status}</span>
          </div>
        </div>

        {/* 商品明细 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h2 className="text-sm font-medium text-gray-900 mb-3">商品明细</h2>
          <div className="space-y-3">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex gap-3 items-center">
                <div className="relative w-14 h-14 rounded bg-gray-100 overflow-hidden shrink-0">
                  <Image src={item.product.imageUrl || "/placeholder.svg"} alt={item.product.name} fill className="object-cover" sizes="56px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-500">¥{item.price.toFixed(2)} × {item.quantity}</p>
                </div>
                <span className="text-sm font-medium">¥{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 金额汇总 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>商品合计</span>
            <span>¥{order.totalAmount.toFixed(2)}</span>
          </div>
          {discountLabel && (
            <div className="flex justify-between text-blue-600">
              <span>会员折扣（{discountLabel}）</span>
              <span>-¥{(order.totalAmount - order.finalAmount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100">
            <span className="text-gray-900">实付</span>
            <span className="text-red-600">¥{order.finalAmount.toFixed(2)}</span>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
        )}

        {/* 模拟支付按钮 */}
        {order.status === "PENDING" && (
          <button
            onClick={handlePay}
            disabled={paying}
            className={`w-full py-3 rounded-lg text-base font-semibold transition-colors ${
              paying ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {paying ? "支付中…" : "模拟支付"}
          </button>
        )}

        <p className="text-center mt-4 space-x-4">
          <Link href="/orders" className="text-sm text-gray-500 hover:text-gray-700">← 返回订单列表</Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">返回首页</Link>
        </p>
      </div>
    </div>
  );
}
