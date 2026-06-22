import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

// ============================================================
// 配置常量
// ============================================================
const SALT_ROUNDS = 10;
const COOKIE_NAME = "mm_session";
/** Cookie 有效期：7 天（秒） */
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

// ============================================================
// 密码工具
// ============================================================

/** 使用 bcryptjs 对明文密码做哈希 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** 验证明文密码与哈希是否匹配 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================================
// Token 签名与验证（HMAC-SHA256）
// ============================================================

export interface SessionPayload {
  userId: string;
  role: string;
  userName: string;
  /** 过期时间戳（毫秒） */
  exp: number;
}

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "NEXTAUTH_SECRET 环境变量未设置，生产环境必须配置！请运行: npx auth secret"
      );
    }
    console.warn(
      "⚠ NEXTAUTH_SECRET 未设置，使用开发用 fallback（session 可被伪造，仅限本地开发）"
    );
    return "mm-fallback-secret-do-not-use-in-prod";
  }

  return secret;
}

/** 对 payload 做 HMAC-SHA256 签名，返回 "payload.token" 格式的字符串 */
function signPayload(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = crypto.createHmac("sha256", getSecret());
  const signature = hmac.update(data).digest("base64url");
  return `${data}.${signature}`;
}

/** 验证签名并解析 payload，失败或过期返回 null（导出供 Navbar 等组件复用） */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [data, signature] = parts;
    const hmac = crypto.createHmac("sha256", getSecret());
    const expected = hmac.update(data).digest("base64url");

    // 签名不匹配 → 篡改或伪造
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString()
    ) as SessionPayload;

    // 已过期
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

// ============================================================
// Session 管理
// ============================================================

/** Cookie 基础配置 */
function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

/**
 * 设置 Session — 将 userId + role + userName 签名后写入 httpOnly Cookie
 * 生产环境自动启用 secure；userName 存入 Cookie 避免 Navbar 额外查库
 */
export async function setSession(
  userId: string,
  role: string,
  userName: string = ""
): Promise<void> {
  const payload: SessionPayload = {
    userId,
    role,
    userName,
    exp: Date.now() + COOKIE_MAX_AGE * 1000,
  };

  const token = signPayload(payload);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, cookieOptions());
}

/** 从 Cookie 中读取并验证 session token，返回原始 payload（供 Navbar 等 Server Component 复用） */
export async function getSessionPayload(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * 读取 Session — 从 Cookie 中解析当前用户信息
 * 返回 null 表示未登录或 session 已过期/被篡改
 */
export async function getSession(): Promise<{
  userId: string;
  role: string;
} | null> {
  const payload = await getSessionPayload();
  if (!payload) return null;
  return { userId: payload.userId, role: payload.role };
}

/**
 * 获取当前登录用户的完整信息（包含 email、name、等级等）
 * 未登录返回 null
 */
export async function getCurrentUser(): Promise<Omit<
  User,
  "password"
> | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    // 排除敏感字段
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      totalSpent: true,
      membershipLevel: true,
      createdAt: true,
    },
  });

  return user;
}

/**
 * 清除 Session — 删除 Cookie（退出登录）
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    ...cookieOptions(),
    maxAge: 0, // 立即过期
  });
}
