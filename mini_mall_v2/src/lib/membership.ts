/**
 * 心悦会员折扣率映射（等级 → 折扣率）
 * 1.0 = 原价，0.9 = 9 折
 */
const MEMBERSHIP_DISCOUNT: Record<number, number> = {
  0: 1.0,
  1: 0.98,
  2: 0.95,
  3: 0.9,
};

/** 累计消费门槛 */
const MEMBERSHIP_THRESHOLDS: Record<number, number> = {
  1: 8_000,
  2: 80_000,
  3: 800_000,
};

/** 等级中文名称 */
export const LEVEL_LABELS: Record<number, string> = {
  0: "普通会员",
  1: "心悦1",
  2: "心悦2",
  3: "心悦3",
};

/** 等级对应折扣描述 */
export const DISCOUNT_LABELS: Record<number, string> = {
  0: "原价",
  1: "9.8 折",
  2: "9.5 折",
  3: "9 折",
};

/** 根据用户累计消费金额计算心悦等级 */
export function calculateMembershipLevel(totalSpent: number): number {
  let level = 0;
  for (const [lvl, threshold] of Object.entries(MEMBERSHIP_THRESHOLDS)) {
    if (totalSpent >= threshold) {
      level = Math.max(level, parseInt(lvl, 10));
    }
  }
  return level;
}

/** 获取指定等级的折扣率 */
export function getDiscountRate(level: number): number {
  return MEMBERSHIP_DISCOUNT[level] ?? 1.0;
}

/** 金额保留两位小数（银行家舍入） */
export function roundToCent(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** 计算折后金额 */
export function applyDiscount(
  totalAmount: number,
  discountRate: number
): number {
  return roundToCent(totalAmount * discountRate);
}
