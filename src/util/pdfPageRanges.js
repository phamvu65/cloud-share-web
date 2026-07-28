// Parses a comma-separated page range string (e.g. "1-3, 5, 8-10") into a list
// of { start, end, label } tuples, one per output file, validated against pageCount.
export const parsePageRanges = (input, pageCount) => {
    const tokens = input.split(',').map((t) => t.trim()).filter(Boolean);

    if (tokens.length === 0) {
        throw new Error('Vui lòng nhập ít nhất một khoảng trang.');
    }

    return tokens.map((token) => {
        const match = token.match(/^(\d+)(?:-(\d+))?$/);
        if (!match) {
            throw new Error(`"${token}" không đúng định dạng (ví dụ: 1-3 hoặc 5).`);
        }

        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : start;

        if (start < 1 || end > pageCount || start > end) {
            throw new Error(`Khoảng "${token}" không hợp lệ (tài liệu có ${pageCount} trang).`);
        }

        return { start, end, label: start === end ? `${start}` : `${start}-${end}` };
    });
};

export const everyPageAsRange = (pageCount) =>
    Array.from({ length: pageCount }, (_, i) => ({ start: i + 1, end: i + 1, label: `${i + 1}` }));
