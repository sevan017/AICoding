import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/product/ProductCard";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 9;

interface HomePageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    page?: string;
  }>;
}

/**
 * 首页 — 商品网格展示 + 搜索框 + 分类标签切换 + 分页
 * Server Component，数据在服务端获取
 */
export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const categorySlug = params.category || "";
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));

  // 并行加载：分类列表 + 商品数据
  const [categories, productData] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    }),
    fetchProducts(search, categorySlug, currentPage),
  ]);

  const { products, total, totalPages } = productData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">商品列表</h1>

        {/* 搜索框 */}
        <form action="/" method="GET" className="mb-6">
          {categorySlug && (
            <input type="hidden" name="category" value={categorySlug} />
          )}
          <div className="flex gap-2 max-w-lg">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="搜索商品名称…"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              搜索
            </button>
            {search && (
              <Link
                href={`/?${categorySlug ? `category=${categorySlug}` : ""}`}
                className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 self-center"
              >
                清除
              </Link>
            )}
          </div>
        </form>

        {/* 分类标签 */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !categorySlug
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            全部
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/?category=${cat.slug}${search ? `&search=${search}` : ""}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                categorySlug === cat.slug
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
              }`}
            >
              {cat.name} ({cat._count.products})
            </Link>
          ))}
        </div>

        {/* 商品网格 */}
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  imageUrl={product.imageUrl}
                  stock={product.stock}
                  category={product.category}
                />
              ))}
            </div>

            {/* 分页 */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              urlPattern={`/?${categorySlug ? `category=${categorySlug}&` : ""}${search ? `search=${search}&` : ""}page={page}`}
            />
          </>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg mb-2">暂无商品</p>
            <p className="text-sm">
              {search ? "请尝试其他搜索关键词" : "请稍后查看"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** 封装商品查询逻辑 */
async function fetchProducts(
  search: string,
  categorySlug: string,
  page: number
) {
  const where: Record<string, unknown> = {};

  if (search) {
    where.name = { contains: search };
  }

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

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

  return {
    products,
    total,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}
