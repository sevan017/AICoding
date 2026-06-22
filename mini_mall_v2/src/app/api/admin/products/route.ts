import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

/** GET /api/admin/products — 所有商品列表（含分类） */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const products = await prisma.product.findMany({
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ products });
  } catch (error) {
    console.error("获取商品列表失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

/** POST /api/admin/products — 新增商品 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { name, description, price, imageUrl, stock, categoryId } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "请输入商品名称" }, { status: 400 });
    }
    if (typeof price !== "number" || price < 0) {
      return NextResponse.json({ error: "请输入有效价格" }, { status: 400 });
    }
    if (typeof stock !== "number" || stock < 0 || !Number.isInteger(stock)) {
      return NextResponse.json({ error: "请输入有效库存数量" }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json({ error: "请选择分类" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: (description || "").trim(),
        price,
        imageUrl: imageUrl || "/placeholder.svg",
        stock,
        categoryId,
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("新增商品失败:", error);
    return NextResponse.json({ error: "新增失败" }, { status: 500 });
  }
}
