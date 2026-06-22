"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LEVEL_LABELS, DISCOUNT_LABELS, getDiscountRate, applyDiscount, roundToCent } from "@/lib/membership";

interface CartData {
  items: {
    id: string;
    productId: string;
    quantity: number;
    subtotal: number;
    product: { id: string; name: string; price: number; imageUrl: string; stock: number };
  }[];
  totalAmount: number;
}

interface UserInfo {
  id: string;
  name: string;
  membershipLevel: number;
}

/**
 * 结算页 — 确认订单信息，展示心悦会员折扣，提交订单
 */
export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [cartRes, userRes] = await Promise.all([
        fetch("/api/cart"),
        fetch("/api/auth/me"),
      ]);

      if (cartRes.status === 401 || userRes.status === 401) {
        router.push("/login?redirect=/checkout");
        return;
      }

      const [cartData, userData] = await Promise.all([
        cartRes.json(),
        userRes.json(),
      ]);

      if (cartData.items?.length === 0) {
        router.push("/cart");
        return;
      }

      setCart(cartData);
      setUser(userData.user);
    } catch {
      setError("加载结算信息失败");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/orders", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "提交订单失败");
        return;
      }
      router.push(`/orders/${data.order.id}`);
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">加载中…</p></div>;
  }

  if (!cart || !user) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">{error || "数据加载失败"}</p></div>;
  }

  // 统一使用 membership 工具计算，与后端 POST /api/orders 保持一致
  const discountRate = getDiscountRate(user.membershipLevel);
  const finalAmount = applyDiscount(cart.totalAmount, discountRate);
  const discountAmount = roundToCent(cart.totalAmount - finalAmount);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">确认订单</h1>

        {/* 订单商品摘要 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 space-y-3">
          {cart.items.map((item) => (
            <div key={item.id} className="flex gap-3 items-center">
              <div className="relative w-12 h-12 rounded bg-gray-100 overflow-hidden shrink-0">
                <Image src={item.product.imageUrl || "/placeholder.svg"} alt={item.product.name} fill className="object-cover" sizes="48px" />
              </div>
              <span className="flex-1 text-sm text-gray-900 truncate">{item.product.name}</span>
              <span className="text-sm text-gray-500">×{item.quantity}</span>
              <span className="text-sm font-medium">¥{item.subtotal.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* 会员折扣信息 */}
        <div className="bg-blue-50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span>
              会员等级：<strong>{LEVEL_LABELS[user.membershipLevel]}</strong>
            </span>
            <span className="text-blue-600 font-medium">{DISCOUNT_LABELS[user.membershipLevel]}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-blue-200">
              <span>折扣减免</span>
              <span className="text-red-500">-¥{discountAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* 合计 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">实付金额</span>
            <span className="text-2xl font-bold text-red-600">¥{finalAmount.toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">共 {cart.items.reduce((s, i) => s + i.quantity, 0)} 件商品</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
        )}

        {/* 操作按钮 */}
        <div className="space-y-3">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-full py-3 rounded-lg text-base font-semibold transition-colors ${
              submitting ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {submitting ? "提交中…" : "提交订单"}
          </button>
          <Link href="/cart" className="block text-center py-2.5 text-sm text-gray-600 hover:text-gray-800">
            ← 返回购物车
          </Link>
        </div>
      </div>
    </div>
  );
}
