import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/products/[id]
 * 商品详情 — 包含关联的分类信息
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "商品不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("获取商品详情失败:", error);
    return NextResponse.json(
      { error: "获取商品详情失败，请稍后重试" },
      { status: 500 }
    );
  }
}
