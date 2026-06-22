import { prisma } from "@/lib/prisma";

/** 查询用户购物车完整数据（供 cart API 和 [id] API 共用） */
export async function getCartItems(userId: string) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          imageUrl: true,
          stock: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });

  const cartItems = items.map((item) => ({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    product: item.product,
    subtotal: +(item.product.price * item.quantity).toFixed(2),
  }));

  const totalAmount = +cartItems
    .reduce((sum, item) => sum + item.subtotal, 0)
    .toFixed(2);

  return { items: cartItems, totalAmount };
}
