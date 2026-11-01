import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import { combineReducers, createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import { Provider } from "react-redux";
import { Router } from "react-router-dom";
import { createMemoryHistory } from "history";
import { I18nextProvider } from "react-i18next";
import i18next from "i18next";
import explorer, { initState as explorerState } from "../../redux/explorer/reducer";
import viewUpdate, { initState as viewState } from "../../redux/viewUpdate/reducer";
import { startBatchDownload } from "../../redux/explorer/action";
import * as explorerActions from "../../redux/explorer/action";
import { DirectoryViewProvider } from "./DirectoryView";
import DirectoryToolbar from "./DirectoryToolbar";

jest.mock("../../i18n", () => ({ __esModule: true, default: { t: (key) => key }, languages: [] }));

const i18n = i18next.createInstance();
i18n.init({ lng: "en", initImmediate: false, resources: { en: { application: { fileManager: {
    listView: "List", gridViewSmall: "Compact", gridViewLarge: "Grid", batchDownload: "Batch download",
} } } } });
const files = [{ type: "file", id: "a", name: "Alpha" }, { type: "file", id: "b", name: "Beta" }, { type: "file", id: "c", name: "Alpine" }];
let host, store;
beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    store = createStore(combineReducers({ explorer, viewUpdate, navigator: (state = { path: "/" }) => state }), {
        explorer: { ...explorerState, fileList: files },
        viewUpdate: { ...viewState, navigatorLoading: false, pagination: { page: 1, size: 1 } },
        navigator: { path: "/" },
    }, applyMiddleware(thunk));
    // The existing downloader opens browser streams; verify its caller's target selection here.
    jest.spyOn(explorerActions, "startBatchDownload").mockReturnValue({ type: "BATCH_DOWNLOAD_REQUESTED" });
    act(() => { ReactDOM.render(
        <Provider store={store}><I18nextProvider i18n={i18n}><Router history={createMemoryHistory({ initialEntries: ["/home"] })}>
            <DirectoryViewProvider><DirectoryToolbar /></DirectoryViewProvider>
        </Router></I18nextProvider></Provider>, host
    ); });
});
afterEach(() => {
    act(() => { ReactDOM.unmountComponentAtNode(host); });
    host.remove();
    localStorage.clear();
    startBatchDownload.mockRestore();
});

it("offers explicit persisted view choices and cannot deselect the active mode", () => {
    act(() => { Simulate.click(host.querySelector('button[aria-label="List"]')); });
    expect(store.getState().viewUpdate.explorerViewMethod).toBe("list");
    expect(JSON.parse(localStorage.getItem("user_preference")).view_method).toBe("list");
    act(() => { Simulate.click(host.querySelector('button[aria-label="List"]')); });
    expect(store.getState().viewUpdate.explorerViewMethod).toBe("list");
});

it("filters the loaded directory and batches only matches across pages", () => {
    act(() => { Simulate.change(host.querySelector('input[aria-label="Filter this folder"]'), { target: { value: "Al" } }); });
    expect(host.textContent).toContain("2 of 3 items");
    act(() => { Simulate.click(host.querySelector('button[aria-label="Batch download"]')); });
    expect(store.getState().explorer.selected).toEqual([files[0], files[2]]);
    expect(startBatchDownload).toHaveBeenCalledTimes(1);
    expect(store.getState().explorer.fileList).toBe(files);
});

it("never falls back to downloading the whole directory for an empty filter", () => {
    act(() => { Simulate.change(host.querySelector('input[aria-label="Filter this folder"]'), { target: { value: "missing" } }); });
    expect(host.textContent).toContain("0 of 3 items");
    expect(host.querySelector('button[aria-label="Batch download"]').disabled).toBe(true);
    expect(startBatchDownload).not.toHaveBeenCalled();
    act(() => { Simulate.click(host.querySelector('button[aria-label="Clear filter"]')); });
    expect(host.textContent).toContain("3 items");
    expect(store.getState().viewUpdate.pagination.page).toBe(1);
});
