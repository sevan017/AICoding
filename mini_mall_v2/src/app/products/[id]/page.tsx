import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AddToCartButton from "./AddToCartButton";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * 商品详情页 — 大图 + 名称/价格/描述/库存 + 加入购物车
 * Server Component 获取数据，购物车交互由客户端组件处理
 */
export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!product) {
    notFound();
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* 面包屑导航 */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            首页
          </Link>
          <span>/</span>
          {product.category && (
            <>
              <Link
                href={`/?category=${product.category.slug}`}
                className="hover:text-blue-600 transition-colors"
              >
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-900 truncate">{product.name}</span>
        </nav>

        {/* 商品主内容 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* 左侧 — 商品大图 */}
            <div className="relative aspect-square bg-gray-100">
              <Image
                src={product.imageUrl || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white font-semibold text-xl">
                    暂时缺货
                  </span>
                </div>
              )}
            </div>

            {/* 右侧 — 商品信息 */}
            <div className="p-6 sm:p-8 flex flex-col justify-between">
              <div className="space-y-4">
                {/* 分类标签 */}
                {product.category && (
                  <Link
                    href={`/?category=${product.category.slug}`}
                    className="inline-block text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    {product.category.name}
                  </Link>
                )}

                {/* 商品名称 */}
                <h1 className="text-2xl font-bold text-gray-900">
                  {product.name}
                </h1>

                {/* 价格 */}
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-red-600">
                    ¥{product.price.toFixed(2)}
                  </span>
                </div>

                {/* 库存状态 */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      isOutOfStock ? "bg-red-400" : "bg-green-400"
                    }`}
                  />
                  <span className="text-sm text-gray-600">
                    {isOutOfStock
                      ? "暂时缺货"
                      : `有货（库存 ${product.stock} 件）`}
                  </span>
                </div>

                {/* 商品描述 */}
                {product.description && (
                  <div className="pt-4 border-t border-gray-100">
                    <h2 className="text-sm font-medium text-gray-900 mb-2">
                      商品描述
                    </h2>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="mt-8 space-y-3">
                <AddToCartButton
                  productId={product.id}
                  disabled={isOutOfStock}
                />
                <Link
                  href="/"
                  className="block text-center py-2.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ← 返回商品列表
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
