import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSession } from "@/lib/auth";

/**
 * POST /api/auth/register
 * 用户注册 — 验证邮箱唯一性 + 密码长度 ≥ 6
 * 成功后自动写入 session Cookie，直接登录态
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // ---- 输入校验 ----
    const errors: string[] = [];

    // 基本邮箱格式校验：至少包含 @ 和 .，长度 ≥ 5，不含空格
    const emailRegex = /^[^\s@]{1,}@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email)) {
      errors.push("请提供有效的邮箱地址");
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      errors.push("密码长度不能少于 6 位");
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      errors.push("请填写昵称");
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join("；") }, { status: 400 });
    }

    // ---- 检查邮箱唯一性 ----
    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    // ---- 创建用户 ----
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: hashed,
        name: name.trim(),
        role: "USER",
      },
    });

    // ---- 自动登录：写入 session Cookie ----
    await setSession(user.id, user.role, user.name);

    return NextResponse.json(
      {
        message: "注册成功",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("注册失败:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
