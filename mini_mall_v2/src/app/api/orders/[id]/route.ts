import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getCurrentUser } from "@/lib/auth";
import { calculateMembershipLevel } from "@/lib/membership";

/**
 * GET /api/orders/[id]
 * 订单详情 — 含商品明细
 * 需登录，只能查看自己的订单
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    // 只能查看自己的订单，admin 可查看所有
    if (order.userId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ error: "无权访问该订单" }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("获取订单详情失败:", error);
    return NextResponse.json(
      { error: "获取订单详情失败，请稍后重试" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/orders/[id]
 * 模拟支付 — 将订单状态从 PENDING 改为 PAID
 * 支付成功后：累加用户累计消费 + 重新计算心悦等级
 * 需登录，只能操作自己的订单
 */
export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, finalAmount: true },
    });

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    // 只能操作自己的订单
    if (order.userId !== user.id) {
      return NextResponse.json({ error: "无权操作该订单" }, { status: 403 });
    }

    // 只有 PENDING 状态可以支付
    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: `当前订单状态为 ${order.status}，无法支付` },
        { status: 400 }
      );
    }

    // 事务：更新订单状态 + 更新用户累计消费 + 重新计算等级
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: "PAID" },
      });

      // 累加消费金额
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { totalSpent: { increment: order.finalAmount } },
        select: { totalSpent: true },
      });

      // 重新计算心悦等级
      const newLevel = calculateMembershipLevel(updatedUser.totalSpent);
      await tx.user.update({
        where: { id: user.id },
        data: { membershipLevel: newLevel },
      });
    });

    // 返回更新后的订单
    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } },
          },
        },
      },
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error("支付失败:", error);
    return NextResponse.json(
      { error: "支付失败，请稍后重试" },
      { status: 500 }
    );
  }
}
