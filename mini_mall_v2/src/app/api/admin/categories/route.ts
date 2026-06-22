import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

/** GET /api/admin/categories — 分类列表（含商品数量） */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });

    const result = categories.map(({ _count, ...rest }) => ({
      ...rest,
      productCount: _count.products,
    }));

    return NextResponse.json({ categories: result });
  } catch (error) {
    console.error("获取分类列表失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

/** POST /api/admin/categories — 新增分类 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { name, slug } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "请输入分类名称" }, { status: 400 });
    }
    if (!slug || typeof slug !== "string" || !slug.trim()) {
      return NextResponse.json({ error: "请输入分类标识" }, { status: 400 });
    }

    // 检查唯一性
    const existing = await prisma.category.findFirst({
      where: { OR: [{ name: name.trim() }, { slug: slug.trim() }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "分类名称或标识已存在" },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: { name: name.trim(), slug: slug.trim() },
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json(
      {
        category: { ...category, productCount: category._count.products },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("新增分类失败:", error);
    return NextResponse.json({ error: "新增失败" }, { status: 500 });
  }
}
