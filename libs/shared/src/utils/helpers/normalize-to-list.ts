export function normalizeToList<T>(items: T[], total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    return {
        items,
        totalItems: total,
        totalPages,
        currentPage: Number(page),
        lastPage: Number(page) == totalPages,
        firstPage: Number(page) <= 1,
        exceededLastPage: Number(page) > totalPages,
        itemsLength: items.length,
        limit: Number(limit),
    };
}