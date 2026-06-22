import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
  category?: {
    name: string;
    slug: string;
  } | null;
}

/**
 * 商品卡片组件 — 用于首页商品网格
 * 展示商品图片、名称、价格、分类标签和库存状态
 */
export default function ProductCard({
  id,
  name,
  price,
  imageUrl,
  stock,
  category,
}: ProductCardProps) {
  const isOutOfStock = stock <= 0;

  return (
    <Link
      href={`/products/${id}`}
      className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* 商品图片区域 */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">暂时缺货</span>
          </div>
        )}
      </div>

      {/* 商品信息区域 */}
      <div className="p-4 space-y-2">
        {category && (
          <span className="inline-block text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            {category.name}
          </span>
        )}
        <h3 className="font-medium text-gray-900 line-clamp-2 leading-snug">
          {name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-red-600">
            ¥{price.toFixed(2)}
          </span>
          {!isOutOfStock && (
            <span className="text-xs text-gray-500">库存 {stock} 件</span>
          )}
        </div>
      </div>
    </Link>
  );
}
