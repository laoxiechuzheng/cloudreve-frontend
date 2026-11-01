import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import { usePagination } from "../../hooks/pagination";
import { setSelectedTarget } from "../../redux/explorer";
import { setPagination } from "../../redux/viewUpdate/action";
import { isMac } from "../../utils";
import { selectVisibleFile, toggleVisibleSelection } from "../../utils/fileFilter";

const DirectoryView = createContext(null);
export const useDirectoryView = () => useContext(DirectoryView);

export function DirectoryViewProvider({ children }) {
    const dispatch = useDispatch();
    const { pathname } = useLocation();
    const path = useSelector((state) => state.navigator.path);
    const search = useSelector((state) => state.explorer.search);
    const selected = useSelector((state) => state.explorer.selected);
    const sort = useSelector((state) => state.viewUpdate.sortMethod);
    const pagination = useSelector((state) => state.viewUpdate.pagination);
    const scope = JSON.stringify([pathname, path, search && search.keywords, search && search.searchPath]);
    const [filter, setFilter] = useState({ scope, query: "" });
    const query = filter.scope === scope ? filter.query : "";
    const anchor = useRef(null);
    const previous = useRef({ scope, sort, size: pagination.size });
    const reset = previous.current.scope !== scope || previous.current.sort !== sort || previous.current.size !== pagination.size;
    const view = usePagination(query, reset ? 1 : undefined);
    const previousItems = useRef(view.all);

    useEffect(() => {
        if (reset) {
            anchor.current = null;
            dispatch(setSelectedTarget([]));
            if (previous.current.scope !== scope) setFilter({ scope, query: "" });
        }
        previous.current = { scope, sort, size: pagination.size };
        if (view.page !== pagination.page) {
            dispatch(setPagination({ ...pagination, page: view.page }));
        }
    }, [dispatch, reset, scope, sort, pagination, view.page]);

    useEffect(() => {
        // A refreshed listing replaces objects. Do not let stale selections target hidden files.
        if (previousItems.current !== view.all) {
            previousItems.current = view.all;
            if (!view.all.includes(anchor.current)) anchor.current = null;
            const retained = selected.filter((file) => view.all.includes(file));
            if (!reset && retained.length !== selected.length) dispatch(setSelectedTarget(retained));
        }
    }, [dispatch, reset, selected, view.all]);

    const setQuery = (value) => {
        setFilter({ scope, query: value });
        anchor.current = null;
        dispatch(setSelectedTarget([]));
        dispatch(setPagination({ ...pagination, page: 1 }));
    };

    const setSelection = (targets) => {
        anchor.current = targets.length === 1 ? targets[0] : null;
        dispatch(setSelectedTarget(targets));
    };

    const select = (file, event) => {
        const result = selectVisibleFile(view.all, selected, anchor.current, file, event, isMac());
        anchor.current = result.anchor;
        dispatch(setSelectedTarget(result.selected));
    };

    return (
        <DirectoryView.Provider value={{
            ...view, query, setQuery, select, setSelection,
            selectAll: (items = view.all) => setSelection(toggleVisibleSelection(items, selected)),
        }}>
            {children}
        </DirectoryView.Provider>
    );
}
