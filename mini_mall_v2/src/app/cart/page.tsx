"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

/** 购物车条目类型 */
interface CartProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: CartProduct;
  subtotal: number;
}

interface CartData {
  items: CartItem[];
  totalAmount: number;
}

/**
 * 购物车页面
 * 展示购物车商品列表 + 数量调整 + 删除 + 总价 + 提交订单
 */
export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null); // 正在操作的条目 ID

  // 加载购物车数据
  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.status === 401) {
        router.push("/login?redirect=/cart");
        return;
      }
      if (!res.ok) throw new Error("加载失败");
      const data = await res.json();
      setCart(data);
    } catch {
      setError("加载购物车失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // 修改数量
  async function updateQuantity(itemId: string, newQty: number) {
    if (newQty < 1) return;
    setActionLoading(itemId);
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "修改失败");
        return;
      }
      setCart(data);
    } catch {
      alert("网络错误，请稍后重试");
    } finally {
      setActionLoading(null);
    }
  }

  // 删除条目
  async function removeItem(itemId: string) {
    if (!confirm("确定要删除该商品吗？")) return;
    setActionLoading(itemId);
    try {
      const res = await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "删除失败");
        return;
      }
      setCart(data);
    } catch {
      alert("网络错误，请稍后重试");
    } finally {
      setActionLoading(null);
    }
  }

  // ---- 加载态 ----
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">加载购物车中…</p>
      </div>
    );
  }

  // ---- 错误态 ----
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">{error}</p>
        <button
          onClick={fetchCart}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          重新加载
        </button>
      </div>
    );
  }

  // ---- 空购物车 ----
  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-gray-500">购物车是空的</p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          去逛逛
        </Link>
      </div>
    );
  }

  // ---- 正常购物车 ----
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">购物车</h1>

        {/* 商品列表 */}
        <div className="space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm p-4 flex gap-4"
            >
              {/* 商品图片 */}
              <Link
                href={`/products/${item.productId}`}
                className="shrink-0"
              >
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-100 overflow-hidden">
                  <Image
                    src={item.product.imageUrl || "/placeholder.svg"}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              </Link>

              {/* 商品信息 & 操作 */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${item.productId}`}
                  className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-blue-600"
                >
                  {item.product.name}
                </Link>
                <p className="text-sm text-gray-500 mt-0.5">
                  单价 ¥{item.product.price.toFixed(2)}
                </p>

                <div className="flex items-center justify-between mt-2">
                  {/* 数量调整 */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={
                        item.quantity <= 1 || actionLoading === item.id
                      }
                      className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={
                        item.quantity >= item.product.stock ||
                        actionLoading === item.id
                      }
                      className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                    >
                      +
                    </button>
                  </div>

                  {/* 小计 + 删除 */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-red-600">
                      ¥{item.subtotal.toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={actionLoading === item.id}
                      className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-40 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 底部汇总栏 */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-600">
              共 {cart.items.reduce((s, i) => s + i.quantity, 0)} 件
            </span>
            <span className="ml-4 text-lg font-bold text-red-600">
              ¥{cart.totalAmount.toFixed(2)}
            </span>
          </div>
          <Link
            href="/checkout"
            className="px-6 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            提交订单
          </Link>
        </div>

        {/* 返回首页 */}
        <p className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 继续购物
          </Link>
        </p>
      </div>
    </div>
  );
}
