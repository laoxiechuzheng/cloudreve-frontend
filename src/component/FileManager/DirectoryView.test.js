import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { Provider } from "react-redux";
import { combineReducers, createStore } from "redux";
import { Router } from "react-router-dom";
import { createMemoryHistory } from "history";
import explorer, { initState as explorerState } from "../../redux/explorer/reducer";
import viewUpdate, { initState as viewState } from "../../redux/viewUpdate/reducer";
import { DirectoryViewProvider, useDirectoryView } from "./DirectoryView";

jest.mock("../../i18n", () => ({ __esModule: true, default: { t: (key) => key }, languages: [] }));

const files = [
    { type: "file", id: "a", name: "Alpha" },
    { type: "file", id: "b", name: "Beta" },
    { type: "file", id: "c", name: "Alpine" },
];
let container, store, current;
function Probe() { current = useDirectoryView(); return null; }

beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    const reducer = combineReducers({
        explorer, viewUpdate,
        navigator: (state = { path: "/" }, action) => action.type === "SET_NAVIGATOR" ? { path: action.path } : state,
    });
    store = createStore(reducer, {
        explorer: { ...explorerState, fileList: files },
        viewUpdate: { ...viewState, navigatorLoading: false, pagination: { page: 1, size: 1 } },
        navigator: { path: "/" },
    });
    act(() => { ReactDOM.render(
        <Provider store={store}><Router history={createMemoryHistory({ initialEntries: ["/home"] })}>
            <DirectoryViewProvider><Probe /></DirectoryViewProvider>
        </Router></Provider>, container
    ); });
});
afterEach(() => {
    act(() => { ReactDOM.unmountComponentAtNode(container); });
    container.remove();
});

it("resets the last page and hidden selection immediately when the filter changes", () => {
    act(() => {
        store.dispatch({ type: "SET_PAGINATION", pagination: { page: 3, size: 1 } });
        store.dispatch({ type: "SET_SELECTED_TARGET", targets: [files[1]] });
    });
    act(() => current.setQuery("Al"));
    expect(current.items).toEqual([files[0]]);
    expect(current.total).toBe(2);
    expect(current.page).toBe(1);
    expect(current.pageCount).toBe(2);
    expect(store.getState().explorer.selected).toEqual([]);
    expect(store.getState().explorer.fileList).toBe(files);
});

it("preserves filtered range selection across pages", () => {
    act(() => current.setQuery("Al"));
    act(() => current.select(files[0], {}));
    act(() => { store.dispatch({ type: "SET_PAGINATION", pagination: { page: 2, size: 1 } }); });
    act(() => current.select(files[2], { shiftKey: true }));
    expect(store.getState().explorer.selected).toEqual([files[0], files[2]]);
});

it("clears the directory filter when navigating, but retains it when refreshing data", () => {
    act(() => current.setQuery("Al"));
    act(() => { store.dispatch({ type: "SET_FILE_LIST", list: [...files] }); });
    expect(current.query).toBe("Al");
    act(() => { store.dispatch({ type: "SET_NAVIGATOR", path: "/Docs", navigatorLoading: true }); });
    expect(current.query).toBe("");
    expect(current.page).toBe(1);
    act(() => { store.dispatch({ type: "SET_NAVIGATOR", path: "/", navigatorLoading: true }); });
    expect(current.query).toBe("");
});

it("resets to page one after page-size or sort changes", () => {
    act(() => { store.dispatch({ type: "SET_PAGINATION", pagination: { page: 3, size: 1 } }); });
    act(() => { store.dispatch({ type: "SET_PAGINATION", pagination: { page: 2, size: 2 } }); });
    expect(current.page).toBe(1);
    act(() => { store.dispatch({ type: "SET_PAGINATION", pagination: { page: 2, size: 2 } }); });
    act(() => { store.dispatch({ type: "SET_SORT_METHOD", method: "nameRev" }); });
    expect(current.page).toBe(1);
});

it("clamps the current page when deleting the final match", () => {
    act(() => current.setQuery("Al"));
    act(() => { store.dispatch({ type: "SET_PAGINATION", pagination: { page: 2, size: 1 } }); });
    act(() => { store.dispatch({ type: "SET_FILE_LIST", list: [files[0], files[1]] }); });
    expect(current.items).toEqual([files[0]]);
    expect(current.page).toBe(1);
    expect(store.getState().viewUpdate.pagination.page).toBe(1);
});
