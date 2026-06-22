import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

/** 合法的状态流转 */
const VALID_STATUSES = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"];

/** GET /api/admin/orders/[id] — 订单详情 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        orderItems: {
          include: { product: { select: { id: true, name: true, imageUrl: true } } },
        },
      },
    });
    if (!order) return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    return NextResponse.json({ order });
  } catch (error) {
    console.error("获取订单失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

/** PUT /api/admin/orders/[id] — 更新订单状态 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `无效状态，可选值：${VALID_STATUSES.join("、")}` },
        { status: 400 }
      );
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "订单不存在" }, { status: 404 });

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { id: true, name: true, email: true } },
        orderItems: {
          include: { product: { select: { id: true, name: true, imageUrl: true } } },
        },
      },
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("更新订单状态失败:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
