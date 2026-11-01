import { useMemo } from "react";
import { useSelector } from "react-redux";
import { filterDirectory, paginateDirectory } from "../utils/fileFilter";

export function usePagination(query = "", pageOverride) {
    const files = useSelector((state) => state.explorer.fileList);
    const folders = useSelector((state) => state.explorer.dirList);
    const pagination = useSelector((state) => state.viewUpdate.pagination);
    const all = useMemo(() => filterDirectory(folders, files, query), [folders, files, query]);
    return useMemo(() => {
        const page = paginateDirectory(all, pagination.size, pageOverride === undefined ? pagination.page : pageOverride);
        return {
            ...page,
            all,
            loadedTotal: folders.length + files.length,
            dirList: page.items.filter((file) => file.type === "dir"),
            fileList: page.items.filter((file) => file.type === "file"),
        };
    }, [all, folders.length, files.length, pagination.size, pagination.page, pageOverride]);
}
