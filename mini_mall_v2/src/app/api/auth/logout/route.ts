import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

/**
 * POST /api/auth/logout
 * 退出登录 — 清除 session Cookie
 */
export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ message: "已退出登录" });
  } catch (error) {
    console.error("退出登录失败:", error);
    return NextResponse.json(
      { error: "退出登录失败，请稍后重试" },
      { status: 500 }
    );
  }
}
