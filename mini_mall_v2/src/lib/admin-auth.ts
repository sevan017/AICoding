import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * Admin 权限校验 — 验证当前用户是否为 ADMIN 角色
 * 非 ADMIN 返回 403，未登录返回 401
 * 校验通过返回 session（包含 userId 和 role）
 */
export async function requireAdmin(): Promise<
  | { authorized: true; userId: string; role: string }
  | { authorized: false; response: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "请先登录" }, { status: 401 }),
    };
  }

  if (session.role !== "ADMIN") {
    return {
      authorized: false,
      response: NextResponse.json({ error: "无权访问，需要管理员权限" }, { status: 403 }),
    };
  }

  return { authorized: true, userId: session.userId, role: session.role };
}
