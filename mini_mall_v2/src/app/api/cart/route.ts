import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCartItems } from "@/lib/cart-utils";

/**
 * GET /api/cart
 * 获取当前用户的购物车 — 含商品详情、单价小计
 * 需登录
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const items = await prisma.cartItem.findMany({
      where: { userId: session.userId },
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

    // 计算每个商品的小计和购物车总价
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

    return NextResponse.json({ items: cartItems, totalAmount });
  } catch (error) {
    console.error("获取购物车失败:", error);
    return NextResponse.json(
      { error: "获取购物车失败，请稍后重试" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart
 * 加入购物车 — productId + quantity
 * 如果购物车已有该商品，累加数量；否则新建
 * 检查库存，库存不足返回错误
 * 需登录
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, quantity = 1 } = body;

    // 输入校验
    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ error: "请提供商品 ID" }, { status: 400 });
    }

    const qty = parseInt(String(quantity), 10);
    if (Number.isNaN(qty) || qty < 1) {
      return NextResponse.json({ error: "数量必须大于 0" }, { status: 400 });
    }

    // 查询商品及现有购物车条目
    const [product, existingItem] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, stock: true, name: true },
      }),
      prisma.cartItem.findUnique({
        where: {
          userId_productId: {
            userId: session.userId,
            productId,
          },
        },
      }),
    ]);

    if (!product) {
      return NextResponse.json({ error: "商品不存在" }, { status: 404 });
    }

    // 计算最终数量（已有 + 新增）
    const finalQuantity = existingItem
      ? existingItem.quantity + qty
      : qty;

    // 库存检查
    if (finalQuantity > product.stock) {
      return NextResponse.json(
        {
          error: `库存不足：${product.name} 仅剩 ${product.stock} 件`,
        },
        { status: 409 }
      );
    }

    // 更新或创建购物车条目
    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: finalQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          userId: session.userId,
          productId,
          quantity: finalQuantity,
        },
      });
    }

    // 返回最新购物车
    const items = await getCartItems(session.userId);
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error("加入购物车失败:", error);
    return NextResponse.json(
      { error: "加入购物车失败，请稍后重试" },
      { status: 500 }
    );
  }
}

