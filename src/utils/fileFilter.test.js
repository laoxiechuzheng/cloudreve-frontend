import { filterDirectory, paginateDirectory, selectVisibleFile, toggleVisibleSelection } from "./fileFilter";

const folders = Object.freeze([
    Object.freeze({ id: "same", type: "dir", name: "Project docs" }),
    Object.freeze({ id: "d2", type: "dir", name: "Archive" }),
]);
const files = Object.freeze([
    Object.freeze({ id: "same", type: "file", name: "PROJECT notes.txt" }),
    Object.freeze({ id: "f2", type: "file", name: "photo.jpg" }),
    Object.freeze({ id: "f3", type: "file", name: "Project final.pdf" }),
    Object.freeze({ id: "f4", type: "file", name: "\u4e2d\u6587 \u8bf4\u660e.txt" }),
]);

describe("current directory filtering and pagination", () => {
    it("matches files and folders case-insensitively without replacing original objects", () => {
        const result = filterDirectory(folders, files, "  pRoJeCt ");
        expect(result).toEqual([folders[0], files[0], files[2]]);
        expect(result[0]).toBe(folders[0]);
        expect(result[1]).toBe(files[0]);
        expect(folders).toHaveLength(2);
        expect(files).toHaveLength(4);
    });
    it("matches Unicode and literal spaces without treating punctuation as a regex", () => {
        expect(filterDirectory(folders, files, "\u4e2d\u6587 \u8bf4\u660e")).toEqual([files[3]]);
        expect(filterDirectory(folders, files, "[txt]")).toEqual([]);
    });
    it("clearing the query restores the complete original ordered directory", () => {
        filterDirectory(folders, files, "photo");
        expect(filterDirectory(folders, files, "   ")).toEqual([...folders, ...files]);
    });
    it("paginates the merged filtered order across the folder/file boundary", () => {
        const result = paginateDirectory(filterDirectory(folders, files, "project"), 2, 2);
        expect(result.items).toEqual([files[2]]);
        expect(result).toMatchObject({ page: 2, pageCount: 2, startIndex: 2, endIndex: 3, total: 3 });
    });
    it("clamps an old last page after results shrink", () => {
        const result = paginateDirectory([files[1]], 50, 9);
        expect(result.items).toEqual([files[1]]);
        expect(result).toMatchObject({ page: 1, pageCount: 1, startIndex: 0, endIndex: 1, total: 1 });
    });
    it("disabling pagination never yields a negative selection index", () => {
        const result = paginateDirectory([...folders, ...files], -1, 8);
        expect(result.items).toEqual([...folders, ...files]);
        expect(result).toMatchObject({ page: 1, pageCount: 1, startIndex: 0, endIndex: 6, total: 6 });
    });
    it("empty matches have truthful zero counts and a usable first page", () => {
        expect(paginateDirectory([], 50, 9)).toEqual({
            items: [], page: 1, pageCount: 0, startIndex: 0, endIndex: 0, total: 0,
        });
    });
});

describe("selection in the visible directory order", () => {
    const visible = [folders[0], files[0], files[2]];
    it("shift-selects only matching objects, including a folder/file boundary", () => {
        expect(selectVisibleFile(visible, [folders[0]], folders[0], files[2], { shiftKey: true }).selected).toEqual(visible);
    });
    it("keeps the range anchor so a range can shrink and reverse across pages", () => {
        const range = selectVisibleFile(visible, [files[2]], files[2], folders[0], { shiftKey: true });
        expect(range.anchor).toBe(files[2]);
        expect(selectVisibleFile(visible, range.selected, range.anchor, files[0], { shiftKey: true }).selected).toEqual([files[0], files[2]]);
    });
    it("falls back to the clicked object when filtering or refresh removed the anchor", () => {
        expect(selectVisibleFile(visible, [files[1]], files[1], files[2], { shiftKey: true })).toEqual({ selected: [files[2]], anchor: files[2] });
    });
    it("does not reuse a stale range after selection was cleared", () => {
        expect(selectVisibleFile(visible, [], folders[0], files[2], { shiftKey: true }).selected).toEqual([files[2]]);
    });
    it("ctrl-toggle distinguishes files and folders with the same backend id", () => {
        const added = selectVisibleFile(visible, [folders[0]], folders[0], files[0], { ctrlKey: true });
        expect(added.selected).toEqual([folders[0], files[0]]);
        expect(selectVisibleFile(visible, added.selected, added.anchor, folders[0], { ctrlKey: true }).selected).toEqual([files[0]]);
    });
    it("uses Command for additive selection on macOS", () => {
        expect(selectVisibleFile(visible, [folders[0]], folders[0], files[0], { metaKey: true }, true).selected).toEqual([folders[0], files[0]]);
    });
    it("preserves the original no-op for mixed shift and toggle modifiers", () => {
        expect(selectVisibleFile(visible, [folders[0]], folders[0], files[2], { shiftKey: true, ctrlKey: true })).toEqual({ selected: [folders[0]], anchor: folders[0] });
    });
    it("select-all compares actual visible members rather than just selection length", () => {
        expect(toggleVisibleSelection([files[0], files[2]], [files[1], files[3]])).toEqual([files[0], files[2]]);
        expect(toggleVisibleSelection([files[0], files[2]], [files[0], files[2]])).toEqual([]);
    });
});
