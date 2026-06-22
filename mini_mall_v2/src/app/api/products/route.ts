import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const PAGE_SIZE = 9;

/**
 * GET /api/products
 * 商品列表 — 支持模糊搜索、分类筛选、分页
 * 查询参数：
 *   search   — 按商品名称模糊匹配（可选）
 *   category — 按分类 slug 筛选（可选）
 *   page     — 页码，从 1 开始，默认 1
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

    // 构建 where 条件：搜索词匹配名称，分类 slug 精确匹配
    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.name = { contains: search };
      // SQLite 不支持区分大小写的 contains，但 Prisma 默认行为已覆盖
    }

    if (category) {
      where.category = { slug: category };
    }

    // 并行查询：商品列表 + 总数
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return NextResponse.json({
      products,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("获取商品列表失败:", error);
    return NextResponse.json(
      { error: "获取商品列表失败，请稍后重试" },
      { status: 500 }
    );
  }
}
