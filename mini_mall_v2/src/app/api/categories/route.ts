import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/categories
 * 分类列表 — 包含每个分类下的商品数量（只统计有商品的分类）
 */
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    // 格式化：提取 count 到顶层，更易读
    const result = categories.map(({ _count, ...rest }) => ({
      ...rest,
      productCount: _count.products,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("获取分类列表失败:", error);
    return NextResponse.json(
      { error: "获取分类列表失败，请稍后重试" },
      { status: 500 }
    );
  }
}
