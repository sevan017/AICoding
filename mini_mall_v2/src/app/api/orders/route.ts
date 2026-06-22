import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getCurrentUser } from "@/lib/auth";
import { getDiscountRate, applyDiscount, roundToCent } from "@/lib/membership";

/**
 * GET /api/orders
 * 获取当前用户的订单列表（按时间倒序，含订单明细）
 * 需登录
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.userId },
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("获取订单列表失败:", error);
    return NextResponse.json(
      { error: "获取订单列表失败，请稍后重试" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * 从购物车创建订单
 * 事务内：创建订单 + 扣减库存 + 清空购物车
 * 库存不足时返回具体商品名
 * 需登录
 */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    // 查询购物车（含商品信息，用于锁库存快照）
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: { select: { id: true, name: true, price: true, stock: true } },
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "购物车为空" }, { status: 400 });
    }

    // 库存校验（事务前先做一次校验，避免事务内回滚开销）
    const outOfStock: string[] = [];
    for (const item of cartItems) {
      if (item.quantity > item.product.stock) {
        outOfStock.push(
          `${item.product.name}（需要 ${item.quantity} 件，库存 ${item.product.stock} 件）`
        );
      }
    }

    if (outOfStock.length > 0) {
      return NextResponse.json(
        { error: `以下商品库存不足：${outOfStock.join("；")}` },
        { status: 409 }
      );
    }

    // 计算金额（使用统一的 roundToCent）
    const totalAmount = roundToCent(
      cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      )
    );
    const discountRate = getDiscountRate(user.membershipLevel);
    const finalAmount = applyDiscount(totalAmount, discountRate);

    // 事务：二次校验库存 + 创建订单 + 扣库存 + 清空购物车
    const order = await prisma.$transaction(async (tx) => {
      // 0. 事务内二次校验库存（防止事务前查到的数据在事务开始前被其它写入修改）
      for (const item of cartItems) {
        const current = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, name: true },
        });
        if (!current || current.stock < item.quantity) {
          throw new Error(
            `库存不足：${current?.name || item.productId} 仅剩 ${current?.stock ?? 0} 件`
          );
        }
      }

      // 1. 创建订单
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          totalAmount,
          discountRate,
          finalAmount,
          status: "PENDING",
          orderItems: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price, // 下单时价格快照
            })),
          },
        },
        include: {
          orderItems: {
            include: {
              product: { select: { id: true, name: true, imageUrl: true } },
            },
          },
        },
      });

      // 2. 扣减库存
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 3. 清空当前用户购物车
      await tx.cartItem.deleteMany({ where: { userId: user.id } });

      return newOrder;
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("创建订单失败:", error);
    return NextResponse.json(
      { error: "创建订单失败，请稍后重试" },
      { status: 500 }
    );
  }
}
