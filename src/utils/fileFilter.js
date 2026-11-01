export function filterDirectory(folders, files, query = "") {
    const all = [...folders, ...files];
    const needle = query.trim().toLowerCase();
    return needle ? all.filter((file) => file.name.toLowerCase().includes(needle)) : all;
}

export function paginateDirectory(items, size, requestedPage) {
    const total = items.length;
    const pageSize = size === -1 ? Math.max(total, 1) : Math.max(size, 1);
    const pageCount = Math.ceil(total / pageSize);
    const page = Math.max(1, Math.min(requestedPage, pageCount || 1));
    const startIndex = pageSize * (page - 1);
    return {
        items: items.slice(startIndex, startIndex + pageSize),
        page,
        pageCount,
        startIndex,
        endIndex: Math.min(startIndex + pageSize, total),
        total,
    };
}

export function selectVisibleFile(items, selected, anchor, file, event = {}, mac = false) {
    const { ctrlKey, metaKey, shiftKey } = event;
    if (shiftKey && (ctrlKey || metaKey)) {
        return { selected, anchor };
    }
    const start = items.indexOf(anchor);
    const end = items.indexOf(file);
    if (shiftKey && selected.length > 0 && start !== -1 && end !== -1) {
        return { selected: items.slice(Math.min(start, end), Math.max(start, end) + 1), anchor };
    }
    if (mac ? metaKey : ctrlKey) {
        return {
            selected: selected.includes(file) ? selected.filter((item) => item !== file) : [...selected, file],
            anchor: file,
        };
    }
    return { selected: [file], anchor: file };
}

export function toggleVisibleSelection(items, selected) {
    return items.every((file) => selected.includes(file)) ? [] : [...items];
}
