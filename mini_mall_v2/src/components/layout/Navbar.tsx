import Link from "next/link";
import { getSessionPayload } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

/**
 * 顶部导航栏 — Server Component
 * 复用 auth.ts 的 getSessionPayload 读取 Cookie，
 * 用户名已存储在 Cookie payload 中，免数据库查询
 */
export default async function Navbar() {
  const payload = await getSessionPayload();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between sm:px-6">
        {/* 左侧 Logo */}
        <Link href="/" className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors">
          Mini Mall
        </Link>

        {/* 右侧导航 */}
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/cart"
            className="px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
          >
            购物车
          </Link>
          <Link
            href="/orders"
            className="px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
          >
            我的订单
          </Link>

          {payload ? (
            <LogoutButton userName={payload.userName} />
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              登录
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
