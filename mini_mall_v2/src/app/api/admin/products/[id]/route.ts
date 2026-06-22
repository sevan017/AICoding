import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

/** GET /api/admin/products/[id] — 商品详情 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
    if (!product) return NextResponse.json({ error: "商品不存在" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (error) {
    console.error("获取商品失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

/** PUT /api/admin/products/[id] — 更新商品 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, price, imageUrl, stock, categoryId } = body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "商品不存在" }, { status: 404 });

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(price !== undefined && { price }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(stock !== undefined && { stock }),
        ...(categoryId !== undefined && { categoryId }),
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("更新商品失败:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

/** DELETE /api/admin/products/[id] — 删除商品 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "商品不存在" }, { status: 404 });

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除商品失败:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
