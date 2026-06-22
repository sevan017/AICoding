import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

/** DELETE /api/admin/categories/[id] — 删除分类（仅当无商品时允许） */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!category) {
      return NextResponse.json({ error: "分类不存在" }, { status: 404 });
    }

    if (category._count.products > 0) {
      return NextResponse.json(
        { error: `无法删除：分类"${category.name}"下还有 ${category._count.products} 件商品` },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除分类失败:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
