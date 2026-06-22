import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** 生成每页的链接 URL，{page} 会被替换为实际页码 */
  urlPattern: string;
}

/**
 * 分页组件 — "上一页 / 页码 / 下一页" 导航
 * urlPattern 示例："/?page={page}" 或 "/?category=toy&page={page}"
 */
export default function Pagination({
  currentPage,
  totalPages,
  urlPattern,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // 生成可见页码列表（带省略号）
  const visiblePages = generateVisiblePages(currentPage, totalPages);

  function buildUrl(page: number) {
    return urlPattern.replace("{page}", String(page));
  }

  return (
    <nav
      className="flex items-center justify-center gap-1 mt-10"
      aria-label="分页导航"
    >
      {/* 上一页 */}
      {currentPage > 1 ? (
        <Link
          href={buildUrl(currentPage - 1)}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
        >
          上一页
        </Link>
      ) : (
        <span className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-300 cursor-not-allowed">
          上一页
        </span>
      )}

      {/* 页码 */}
      <div className="flex items-center gap-1">
        {visiblePages.map((page, index) => {
          if (page === "...") {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                ...
              </span>
            );
          }

          const isActive = page === currentPage;
          return (
            <Link
              key={page}
              href={buildUrl(page)}
              className={`w-9 h-9 flex items-center justify-center text-sm rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white font-semibold"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {page}
            </Link>
          );
        })}
      </div>

      {/* 下一页 */}
      {currentPage < totalPages ? (
        <Link
          href={buildUrl(currentPage + 1)}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
        >
          下一页
        </Link>
      ) : (
        <span className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-300 cursor-not-allowed">
          下一页
        </span>
      )}
    </nav>
  );
}

/**
 * 生成可见页码范围（包含省略号逻辑）
 * 始终显示首页、尾页，当前页附近 ±2 页，其余用 "..." 折叠
 */
function generateVisiblePages(
  current: number,
  total: number
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];

  // 首页
  pages.push(1);

  if (current > 4) {
    pages.push("...");
  }

  // 当前页附近的页码
  const start = Math.max(2, current - 2);
  const end = Math.min(total - 1, current + 2);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 3) {
    pages.push("...");
  }

  // 尾页
  pages.push(total);

  return pages;
}
