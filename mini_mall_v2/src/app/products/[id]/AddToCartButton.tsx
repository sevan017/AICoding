"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AddToCartButtonProps {
  productId: string;
  disabled?: boolean;
}

/**
 * 加入购物车按钮 — 客户端组件
 * 点击后调用购物车 API，成功后跳转购物车页面
 * 当前购物车 API 尚未实现，点击时提示并跳转登录页（作为占位）
 */
export default function AddToCartButton({
  productId,
  disabled = false,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAddToCart() {
    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (res.status === 401) {
        // 未登录，跳转登录页
        router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "添加失败，请稍后重试");
        return;
      }

      // 添加成功，跳转购物车
      router.push("/cart");
    } catch {
      alert("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={disabled || loading}
      className={`w-full py-3 rounded-lg text-base font-semibold transition-colors ${
        disabled || loading
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
      }`}
    >
      {loading ? "添加中…" : disabled ? "暂时缺货" : "加入购物车"}
    </button>
  );
}
