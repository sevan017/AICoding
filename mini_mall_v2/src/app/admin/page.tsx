import Link from "next/link";

/** 管理后台首页 */
export default function AdminPage() {
  const links = [
    { href: "/admin/products", label: "商品管理", desc: "查看、新增、编辑、删除商品" },
    { href: "/admin/orders", label: "订单管理", desc: "查看所有订单，更新订单状态" },
    { href: "/admin/categories", label: "分类管理", desc: "管理商品分类" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">管理后台</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{link.label}</h2>
              <p className="text-sm text-gray-500">{link.desc}</p>
            </Link>
          ))}
        </div>
        <p className="text-center mt-8">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← 返回首页</Link>
        </p>
      </div>
    </div>
  );
}
