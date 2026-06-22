import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setSession } from "@/lib/auth";

/**
 * POST /api/auth/login
 * 用户登录 — 验证邮箱 + 密码，成功后写入 session Cookie
 *
 * 安全策略：无论"用户不存在"还是"密码错误"，统一返回相同错误信息，
 * 防止攻击者通过错误信息差异撞库枚举已注册邮箱。
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // ---- 输入校验 ----
    if (!email || !password) {
      return NextResponse.json(
        { error: "请输入邮箱和密码" },
        { status: 400 }
      );
    }

    // ---- 查找用户 ----
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    // 无论用户不存在还是密码错误，统一返回（防止撞库）
    if (!user) {
      return NextResponse.json(
        { error: "邮箱或密码不正确" },
        { status: 401 }
      );
    }

    // ---- 验证密码 ----
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "邮箱或密码不正确" },
        { status: 401 }
      );
    }

    // ---- 写入 session ----
    await setSession(user.id, user.role, user.name);

    return NextResponse.json({
      message: "登录成功",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("登录失败:", error);
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 }
    );
  }
}
