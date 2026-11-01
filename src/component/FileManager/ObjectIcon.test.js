import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import { combineReducers, createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import { Provider, useDispatch, useSelector } from "react-redux";
import { Router } from "react-router-dom";
import { createMemoryHistory } from "history";
import { I18nextProvider } from "react-i18next";
import i18next from "i18next";
import { DndProvider, useDragLayer } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import { Table, TableBody } from "@material-ui/core";
import explorer, { initState as explorerState } from "../../redux/explorer/reducer";
import viewUpdate, { initState as viewState } from "../../redux/viewUpdate/reducer";
import { getDownloadURL } from "../../services/file";
import { DirectoryViewProvider, useDirectoryView } from "./DirectoryView";
import ObjectIcon from "./ObjectIcon";
import DragLayer from "./DnD/DragLayer";
import CustomPaginationItem from "./PaginationItem";

jest.mock("../../i18n", () => ({ __esModule: true, default: { t: (key) => key }, languages: [] }));
jest.mock("../../services/file", () => ({ getDownloadURL: jest.fn() }));
// Jest 24 needs the package's real CommonJS builds; browser builds use its ESM entry.
jest.mock("react-dnd", () => jest.requireActual("react-dnd/dist/cjs"));
jest.mock("react-dnd-html5-backend", () => jest.requireActual("react-dnd-html5-backend/dist/cjs"));
jest.mock("dnd-core", () => jest.requireActual("dnd-core/dist/cjs"));

const i18n = i18next.createInstance();
i18n.init({ lng: "en", initImmediate: false, resources: { en: { application: { fileManager: { download: "Download", share: "Share", enter: "Open" } } } } });
const folder = { type: "dir", id: "d", name: "Docs", path: "/", date: "2020-01-01" };
const file = { type: "file", id: "a", name: "Alpha.png", path: "/", size: 42, date: "2020-01-01" };
const other = { ...file, id: "b", name: "Hidden.txt" };
let host, store, view, dragging;
function Probe() {
    view = useDirectoryView();
    dragging = useDragLayer((monitor) => ({ active: monitor.isDragging() })).active;
    return null;
}
function PaginatedObjects() {
    const page = useDirectoryView();
    const dispatch = useDispatch();
    const pagination = useSelector((state) => state.viewUpdate.pagination);
    return <>
        <Table><TableBody>{page.items.map((object) => <ObjectIcon key={object.id} file={object} />)}</TableBody></Table>
        <CustomPaginationItem
            count={page.pageCount}
            type="page"
            page={2}
            selected={page.page === 2}
            onClick={() => dispatch({ type: "SET_PAGINATION", pagination: { ...pagination, page: 2 } })}
        />
    </>;
}
function render(object = file, method = "list", paginated = false) {
    store = createStore(combineReducers({
        explorer, viewUpdate,
        navigator: (state = { path: "/" }, action) => action.type === "SET_NAVIGATOR" ? { path: action.path } : state,
        router: (state = { location: { pathname: "/home" } }) => state,
    }), {
        explorer: { ...explorerState, dirList: paginated ? [] : [folder], fileList: [file, other] },
        viewUpdate: { ...viewState, explorerViewMethod: method, navigatorLoading: false, pagination: paginated ? { page: 1, size: 1 } : viewState.pagination },
        navigator: { path: "/" }, router: { location: { pathname: "/home" } },
    }, applyMiddleware(thunk));
    act(() => {
        ReactDOM.render(
            <Provider store={store}><I18nextProvider i18n={i18n}><Router history={createMemoryHistory({ initialEntries: ["/home"] })}>
                <DndProvider backend={HTML5Backend}><DirectoryViewProvider><Probe />
                    {paginated ? <PaginatedObjects /> : method === "list" ? <Table><TableBody><ObjectIcon file={object} /></TableBody></Table> : <ObjectIcon file={object} />}
                    <DragLayer />
                </DirectoryViewProvider></DndProvider>
            </Router></I18nextProvider></Provider>, host
        );
    });
}
beforeEach(() => {
    host = document.createElement("div");
    host.id = "explorer-container";
    document.body.appendChild(host);
    localStorage.setItem("user", JSON.stringify({ anonymous: false, group: { allowShare: true } }));
    getDownloadURL.mockReset();
    getDownloadURL.mockRejectedValue(new Error("Offline test transport"));
});
afterEach(() => {
    act(() => { ReactDOM.unmountComponentAtNode(host); });
    host.remove();
    localStorage.clear();
});

it.each(["list", "smallIcon", "icon"])("downloads the clicked file in %s view without changing selection", async (method) => {
    render(file, method);
    act(() => { store.dispatch({ type: "SET_SELECTED_TARGET", targets: [other] }); });
    await act(async () => { Simulate.click(host.querySelector('[aria-label="Download"]')); });
    expect(getDownloadURL).toHaveBeenCalledTimes(1);
    expect(getDownloadURL).toHaveBeenCalledWith(file);
    expect(store.getState().explorer.selected).toEqual([other]);
    expect(store.getState().explorer.imgPreview.first.id).toBe("");
});

it("shares the clicked folder without navigating into it", () => {
    render(folder);
    act(() => { Simulate.click(host.querySelector('[aria-label="Share"]')); });
    expect(store.getState().explorer.selected).toEqual([folder]);
    expect(store.getState().viewUpdate.modals.share).toBe(true);
    expect(store.getState().navigator.path).toBe("/");
});

it("opens the activated image while retaining the complete original preview list", () => {
    render(file);
    act(() => { store.dispatch({ type: "SET_SELECTED_TARGET", targets: [other] }); });
    act(() => { Simulate.doubleClick(host.querySelector("tr")); });
    expect(store.getState().explorer.imgPreview.first).toBe(file);
    expect(store.getState().explorer.imgPreview.other).toEqual([file, other]);
});

it("a filtered drag picks the dragged file without reviving hidden selections", () => {
    render(file);
    act(() => { store.dispatch({ type: "SET_SELECTED_TARGET", targets: [other] }); });
    act(() => { view.setQuery("Alpha"); });
    expect(store.getState().explorer.selected).toEqual([]);
    const row = host.querySelector("tr");
    const event = new MouseEvent("dragstart", { bubbles: true, cancelable: true, clientX: 100, clientY: 200 });
    Object.defineProperty(event, "dataTransfer", { value: { types: [], setData: jest.fn(), setDragImage: jest.fn() } });
    act(() => { row.dispatchEvent(event); });
    expect(store.getState().explorer.selected).toEqual([file]);
    act(() => { row.dispatchEvent(new MouseEvent("dragend", { bubbles: true })); });
});

it.each(["drag end", "manager unmount"])("keeps edge scrolling after a page hover unmounts the source, then cleans up on %s", (finish) => {
    const frames = new Map();
    let nextFrame = 0;
    const requestFrame = jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
        frames.set(++nextFrame, callback);
        return nextFrame;
    });
    const cancelFrame = jest.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => { frames.delete(id); });
    const bounds = jest.spyOn(host, "getBoundingClientRect").mockReturnValue({ top: 100, bottom: 500 });
    Object.defineProperty(host, "scrollHeight", { value: 400 });
    Object.defineProperty(host, "clientHeight", { value: 100 });
    const transfer = { types: [], setData: jest.fn(), setDragImage: jest.fn() };
    const sendDrag = (target, type, clientY) => {
        const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: 100, clientY });
        Object.defineProperty(event, "dataTransfer", { value: transfer });
        act(() => { target.dispatchEvent(event); });
    };
    try {
        render(file, "list", true);
        const source = host.querySelector("tr");
        sendDrag(source, "dragstart", 200);
        expect(dragging).toBe(true);
        sendDrag(host.querySelector(".MuiPaginationItem-root"), "dragenter", 500);
        expect(store.getState().viewUpdate.pagination.page).toBe(2);
        expect(host.contains(source)).toBe(false);
        expect(host.querySelector("tr").textContent).toContain("Hidden.txt");
        expect(dragging).toBe(true);
        expect(store.getState().explorer.selected).toEqual([file]);

        sendDrag(window, "dragover", 480);
        expect(frames.size).toBe(1);
        const [id, callback] = frames.entries().next().value;
        frames.delete(id);
        act(() => { callback(); });
        expect(host.scrollTop).toBe(10);
        expect(frames.size).toBe(1);

        if (finish === "drag end") {
            sendDrag(window, "dragend", 480);
            expect(dragging).toBe(false);
        } else {
            act(() => { ReactDOM.unmountComponentAtNode(host); });
        }
        expect(frames.size).toBe(0);
        sendDrag(window, "dragover", 480);
        expect(frames.size).toBe(0);
        expect(host.scrollTop).toBe(10);
    } finally {
        sendDrag(window, "dragend", 480);
        act(() => { ReactDOM.unmountComponentAtNode(host); });
        requestFrame.mockRestore();
        cancelFrame.mockRestore();
        bounds.mockRestore();
    }
});
