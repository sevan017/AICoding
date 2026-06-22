"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * 退出按钮 — 客户端组件
 * 点击后调用 /api/auth/logout，然后跳转首页
 */
export default function LogoutButton({ userName }: { userName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 hidden sm:inline">{userName}</span>
      <button
        onClick={handleLogout}
        disabled={loading}
        className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {loading ? "退出中…" : "退出"}
      </button>
    </div>
  );
}
