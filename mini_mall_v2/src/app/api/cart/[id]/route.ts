import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCartItems } from "@/lib/cart-utils";

/**
 * 验证购物车条目是否属于当前用户
 * 不匹配时返回 null（调用方返回 404/403）
 */
async function getOwnedCartItem(cartItemId: string, userId: string) {
  return prisma.cartItem.findFirst({
    where: { id: cartItemId, userId },
    include: {
      product: { select: { id: true, name: true, price: true, imageUrl: true, stock: true } },
    },
  });
}

/**
 * PUT /api/cart/[id]
 * 修改购物车商品数量
 * 需登录
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const rawQty = parseInt(String(body.quantity), 10);

    if (Number.isNaN(rawQty) || rawQty < 1) {
      return NextResponse.json({ error: "数量必须大于 0" }, { status: 400 });
    }

    // 验证归属权
    const item = await getOwnedCartItem(id, session.userId);
    if (!item) {
      return NextResponse.json(
        { error: "购物车中没有该商品" },
        { status: 404 }
      );
    }

    // 库存检查
    if (rawQty > item.product.stock) {
      return NextResponse.json(
        {
          error: `库存不足：${item.product.name} 仅剩 ${item.product.stock} 件`,
        },
        { status: 409 }
      );
    }

    await prisma.cartItem.update({
      where: { id },
      data: { quantity: rawQty },
    });

    const cart = await getCartItems(session.userId);
    return NextResponse.json(cart);
  } catch (error) {
    console.error("更新购物车失败:", error);
    return NextResponse.json(
      { error: "更新购物车失败，请稍后重试" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart/[id]
 * 删除购物车中的某项
 * 需登录
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;

    // 验证归属权
    const item = await getOwnedCartItem(id, session.userId);
    if (!item) {
      return NextResponse.json(
        { error: "购物车中没有该商品" },
        { status: 404 }
      );
    }

    await prisma.cartItem.delete({ where: { id } });

    const cart = await getCartItems(session.userId);
    return NextResponse.json(cart);
  } catch (error) {
    console.error("删除购物车商品失败:", error);
    return NextResponse.json(
      { error: "删除购物车商品失败，请稍后重试" },
      { status: 500 }
    );
  }
}
