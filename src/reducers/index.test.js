import { applyMiddleware, createStore } from "redux";
import thunk from "redux-thunk";
import createReducer, { initState as cloudreveState } from "./index";
import { createMemoryHistory } from "history";
import { initState as viewUpdateState } from "../redux/viewUpdate/reducer";
import { initState as explorerState } from "../redux/explorer/reducer";

import { changeSubTitle, setPagination, setSubtitle } from "../redux/viewUpdate/action";
import {
    addSelectedTargets,
    changeSortMethod,
    openTorrentDownload,
    removeSelectedTargets,
    setDirList,
    setFileList,
    setLastSelect,
    setSelectedTarget,
    setShiftSelectedIds,
    setSortMethod,
    updateFileList,
} from "../redux/explorer/action";
import {
    applyThemes, changeContextMenu, changeViewMethod,
    closeAllModals, dragAndDrop, drawerToggleAction, navigateTo, navigateUp,
    openCompressDialog,
    openCopyDialog, openCreateFolderDialog,
    openDecompressDialog,
    openGetSourceDialog,
    openLoadingDialog, openMoveDialog, openMusicDialog,
    openRemoteDownloadDialog, openRemoveDialog, openRenameDialog, openResaveDialog, openShareDialog,
    openTorrentDownloadDialog,
    refreshFileList,
    refreshStorage,
    saveFile,
    searchMyFile,
    setModalsLoading, setNavigator, setNavigatorError, setNavigatorLoadingStatus, setSessionStatus, setShareUserPopover,
    setSiteConfig, setUserPopover,
    showImgPreivew, toggleDaylightMode,
    toggleSnackbar
} from "../redux/explorer";

jest.mock("../i18n", () => {
    const i18n = require("i18next").createInstance();
    i18n.init({
        lng: "zh-CN",
        defaultNS: "application",
        initImmediate: false,
        resources: {
            "zh-CN": { application: require("../../public/locales/zh-CN/application.json") },
        },
    });
    global.window.subTitle = "Cloudreve";
    return i18n;
});

// App reducers are tested separately from the router factory's own state.
const rootReducer = createReducer(createMemoryHistory());
const cloudreveApp = (state, action) => {
    const { router, ...application } = rootReducer(state, action);
    return application;
};

const initState = {
    ...cloudreveState,
    viewUpdate: viewUpdateState,
    explorer: explorerState,
};
const createTestStore = (state) => {
    const actions = [];
    const recordActions = () => (next) => (action) => {
        actions.push(action);
        return next(action);
    };
    const store = createStore(
        cloudreveApp,
        state,
        applyMiddleware(thunk, recordActions)
    );
    return { ...store, getActions: () => actions };
};

const createFile = (overrides = {}) => ({
    id: "file-1",
    name: "document.txt",
    type: "file",
    size: 10,
    date: "2020-04-30T00:00:00Z",
    create_date: "2020-04-29T00:00:00Z",
    path: "/",
    source_enabled: false,
    ...overrides,
});

const createSortableLists = () => {
    // Creation and modification dates deliberately produce different orders.
    const fileList = [
        createFile({
            id: "file-1",
            name: "b10",
            size: 11,
            create_date: "2020-05-01T00:00:00Z",
            date: "2020-04-29T00:00:00Z",
        }),
        createFile({
            id: "file-2",
            name: "b2",
            size: 110,
            create_date: "2020-04-29T00:00:00Z",
            date: "2020-04-30T00:00:00Z",
        }),
        createFile({
            id: "file-3",
            name: "z",
            size: 10,
            create_date: "2020-04-30T00:00:00Z",
            date: "2020-05-01T00:00:00Z",
        }),
    ].map((file) => Object.freeze(file));
    const dirList = fileList.map((file) => Object.freeze({
        ...file,
        id: "dir-" + file.id,
        name: file.name + "_dir",
        type: "dir",
    }));
    return {
        fileList: Object.freeze(fileList),
        dirList: Object.freeze(dirList),
    };
};

// Hand-checked order, independent of the production comparators.
const sortCases = [
    ["sizePos", [2, 0, 1]],
    ["sizeRes", [1, 0, 2]],
    ["namePos", [1, 0, 2]],
    ["nameRev", [2, 0, 1]],
    ["timePos", [1, 2, 0]],
    ["timeRev", [0, 2, 1]],
];

describe("index reducer", () => {
    beforeEach(() => {
        localStorage.clear();
        document.title = initState.siteConfig.title;
        delete window.currntPath;
    });

    afterEach(() => {
        localStorage.clear();
        document.title = initState.siteConfig.title;
        delete window.currntPath;
    });

    it("should return the initial state", () => {
        expect(cloudreveApp(undefined, { type: "@@INIT" })).toEqual(initState);
    });

    it("should handle redux init", () => {
        expect(cloudreveApp(undefined, { type: "@@redux/INIT" })).toEqual(
            initState
        );
    });

    it("should handle DRAWER_TOGGLE", () => {
        const openAction = drawerToggleAction(true);
        expect(cloudreveApp(initState, openAction)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                open: true,
            },
        });

        const clossAction = drawerToggleAction(false);
        expect(cloudreveApp(initState, clossAction)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                open: false,
            },
        });
    });

    it("should handle CHANGE_VIEW_METHOD", () => {
        const action = changeViewMethod("list");
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                explorerViewMethod: "list",
            },
        });
    });

    it("should handle SET_SORT_METHOD", () => {
        const action = setSortMethod("sizeRes");
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                sortMethod: "sizeRes",
            },
        });
    });

    describe("CHANGE_SORT_METHOD", () => {
        it.each(sortCases)("should handle %s", async (method, order) => {
            const { fileList, dirList } = createSortableLists();
            const state = {
                ...initState,
                explorer: { ...initState.explorer, fileList, dirList },
            };
            const expectedFiles = order.map((index) => fileList[index]);
            const expectedDirs = order.map((index) => dirList[index]);
            const store = createTestStore(state);
            await store.dispatch(changeSortMethod(method));
            expect(store.getActions()).toEqual([
                setSortMethod(method),
                setDirList(expectedDirs),
                setFileList(expectedFiles),
            ]);
            expect(store.getState()).toEqual({
                ...state,
                viewUpdate: { ...state.viewUpdate, sortMethod: method },
                explorer: {
                    ...state.explorer,
                    fileList: expectedFiles,
                    dirList: expectedDirs,
                },
            });
            expect(JSON.parse(localStorage.getItem("user_preference"))).toEqual({
                sort: method,
            });
        });
    });

    it("should handle CHANGE_CONTEXT_MENU", () => {
        const action1 = changeContextMenu("empty", false);
        expect(cloudreveApp(initState, action1)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                contextOpen: false,
                contextType: "empty",
            },
        });
        const action2 = changeContextMenu("aa", true);
        expect(cloudreveApp(initState, action2)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                contextOpen: true,
                contextType: "aa",
            },
        });
    });

    it("should handle DRAG_AND_DROP", () => {
        const action = dragAndDrop("source", "target");
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            explorer: {
                ...initState.explorer,
                dndSignal: true,
                dndTarget: "target",
                dndSource: "source",
            },
        });
    });

    it("should handle SET_NAVIGATOR_LOADING_STATUE", () => {
        const action = setNavigatorLoadingStatus(true);
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                navigatorLoading: true,
            },
        });
    });

    it("should handle SET_NAVIGATOR_ERROR", () => {
        const action = setNavigatorError(true, "Error Message");
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                navigatorError: true,
                navigatorErrorMsg: "Error Message",
            },
        });
    });

    describe("UPDATE_FILE_LIST", () => {
        it.each(sortCases)("should handle %s", async (method, order) => {
            const paginationCases = [
                { pagination: { page: 1, size: 100 }, corrected: { page: 1, size: 100 } },
                { pagination: { page: 4, size: 2 }, corrected: { page: 3, size: 2 } },
                { pagination: { page: 2, size: 2 } },
                { pagination: { page: 1, size: -1 } },
                { pagination: { page: 3, size: 2 }, corrected: { page: 1, size: 2 }, empty: true },
            ];
            for (const { pagination, corrected, empty } of paginationCases) {
                const { fileList, dirList } = createSortableLists();
                const list = Object.freeze(empty ? [] : [
                    fileList[0], dirList[0], fileList[1], dirList[1], fileList[2], dirList[2],
                ]);
                const expectedFiles = empty ? [] : order.map((index) => fileList[index]);
                const expectedDirs = empty ? [] : order.map((index) => dirList[index]);
                const state = {
                    ...initState,
                    explorer: { ...initState.explorer, fileList, dirList },
                    viewUpdate: { ...initState.viewUpdate, sortMethod: method, pagination },
                };
                const store = createTestStore(state);
                await store.dispatch(updateFileList(list));
                expect(store.getActions()).toEqual([
                    setDirList(expectedDirs),
                    setFileList(expectedFiles),
                    ...(corrected ? [setPagination(corrected)] : []),
                ]);
                expect(store.getState()).toEqual({
                    ...state,
                    explorer: {
                        ...state.explorer,
                        fileList: expectedFiles,
                        dirList: expectedDirs,
                    },
                    viewUpdate: {
                        ...state.viewUpdate,
                        pagination: corrected || pagination,
                    },
                });
            }
        });
    });

    it("should handle SET_FILE_LIST", () => {
        const action = setFileList([
            {
                type: "file",
                id: "a",
            },
            {
                type: "file",
                id: "b",
            },
        ]);
        expect(
            cloudreveApp(
                {
                    ...initState,
                    explorer: {
                        ...initState.explorer,
                        fileList: [{ type: "file", id: "test" }],
                    },
                },
                action
            )
        ).toEqual({
            ...initState,
            explorer: {
                ...initState.explorer,
                fileList: [
                    {
                        type: "file",
                        id: "a",
                    },
                    {
                        type: "file",
                        id: "b",
                    },
                ],
            },
        });
    });

    it("should handle SET_DIR_LIST", () => {
        const action = setDirList([
            {
                type: "dir",
                id: "a",
            },
            {
                type: "dir",
                id: "b",
            },
        ]);
        expect(
            cloudreveApp(
                {
                    ...initState,
                    explorer: {
                        ...initState.explorer,
                        dirList: [{ type: "dir", id: "test" }],
                    },
                },
                action
            )
        ).toEqual({
            ...initState,
            explorer: {
                ...initState.explorer,
                dirList: [
                    {
                        type: "dir",
                        id: "a",
                    },
                    {
                        type: "dir",
                        id: "b",
                    },
                ],
            },
        });
    });

    it("should handle ADD_SELECTED_TARGETS", () => {
        const existing = createFile({ id: "existing" });
        const newSelect = [
            createFile({ id: "new-file" }),
            createFile({ id: "new-dir", type: "dir" }),
        ];
        const state = cloudreveApp(initState, setSelectedTarget([existing]));
        const action = addSelectedTargets(newSelect);
        expect(cloudreveApp(state, action)).toEqual({
            ...initState,
            explorer: {
                ...initState.explorer,
                selected: [existing, ...newSelect],
                selectProps: {
                    isMultiple: true,
                    withFolder: true,
                    withFile: true,
                    withSourceEnabled: true,
                },
            },
        });
    });

    it("should handle SET_SELECTED_TARGET", () => {
        const file = createFile();
        const sourceFile = createFile({ id: "source-file", source_enabled: true });
        const folder = createFile({ id: "folder", type: "dir" });
        const state = cloudreveApp(initState, setSelectedTarget([
            createFile({ id: "previous-selection", source_enabled: true }),
        ]));
        const cases = [
            {
                selected: [file, folder],
                selectProps: { isMultiple: true, withFolder: true, withFile: true, withSourceEnabled: true },
            },
            {
                selected: [file],
                selectProps: { isMultiple: false, withFolder: false, withFile: true, withSourceEnabled: false },
            },
            {
                selected: [sourceFile],
                selectProps: { isMultiple: false, withFolder: false, withFile: true, withSourceEnabled: true },
            },
            {
                selected: [folder],
                selectProps: { isMultiple: false, withFolder: true, withFile: false, withSourceEnabled: true },
            },
            {
                selected: [],
                selectProps: { isMultiple: false, withFolder: false, withFile: false, withSourceEnabled: false },
            },
        ];
        for (const { selected, selectProps } of cases) {
            expect(cloudreveApp(state, setSelectedTarget(selected))).toEqual({
                ...initState,
                explorer: {
                    ...initState.explorer,
                    selected,
                    selectProps,
                },
            });
        }
    });

    it("should handle RMOVE_SELECTED_TARGETS", () => {
        const sourceFile = createFile({ id: "1", source_enabled: true });
        const remainingFile = createFile({ id: "2" });
        const state = cloudreveApp(initState, setSelectedTarget([sourceFile, remainingFile]));
        const remove = ["1"];
        const action = removeSelectedTargets(remove);
        const nextState = cloudreveApp(state, action);
        expect(nextState).toEqual({
            ...initState,
            explorer: {
                ...initState.explorer,
                selected: [remainingFile],
                selectProps: {
                    isMultiple: false,
                    withFolder: false,
                    withFile: true,
                    withSourceEnabled: false,
                },
            },
        });
        expect(cloudreveApp(nextState, removeSelectedTargets(["2"]))).toEqual(initState);
    });

    it("should handle NAVIGATOR_TO", async () => {
        const navState = {
            ...initState,
            navigator: { ...initState.navigator, path: "/to/somewhere" },
            viewUpdate: {
                ...initState.viewUpdate,
                pagination: { page: 3, size: 25 },
            },
        };
        const cases = [
            { path: "/somewhere", loading: true, pagination: { page: 1, size: 25 } },
            { path: "/to/somewhere", loading: false, pagination: { page: 3, size: 25 } },
        ];
        for (const { path, loading, pagination } of cases) {
            const store = createTestStore(navState);
            await store.dispatch(navigateTo(path));
            expect(store.getActions()).toEqual([
                ...(loading ? [setPagination(pagination)] : []),
                setNavigator(path, loading),
            ]);
            expect(store.getState()).toEqual({
                ...navState,
                navigator: { ...navState.navigator, path },
                viewUpdate: { ...navState.viewUpdate, pagination, navigatorLoading: loading },
                explorer: { ...navState.explorer, search: undefined },
            });
            expect(window.currntPath).toEqual(path);
        }
    });

    it("should handle NAVIGATOR_UP", async () => {
        const cases = [
            { path: "/to/somewhere", parent: "/to", loading: true, page: 1 },
            { path: "/to", parent: "/", loading: true, page: 1 },
            { path: "/", parent: "/", loading: false, page: 3 },
        ];
        for (const { path, parent, loading, page } of cases) {
            const navState = {
                ...initState,
                navigator: { ...initState.navigator, path },
                viewUpdate: { ...initState.viewUpdate, pagination: { page: 3, size: 25 } },
            };
            const pagination = { page, size: 25 };
            const store = createTestStore(navState);
            await store.dispatch(navigateUp());
            expect(store.getActions()).toEqual([
                ...(loading ? [setPagination(pagination)] : []),
                setNavigator(parent, loading),
            ]);
            expect(store.getState()).toEqual({
                ...navState,
                navigator: { ...navState.navigator, path: parent },
                viewUpdate: { ...navState.viewUpdate, pagination, navigatorLoading: loading },
                explorer: { ...navState.explorer, search: undefined },
            });
            expect(window.currntPath).toEqual(parent);
        }
    });

    it("should handle SET_NAVIGATOR", () => {
        const navState = {
            ...initState,
            navigator: {
                ...initState.navigator,
                path: "/to/somewhere",
            },
            viewUpdate: {
                ...initState.viewUpdate,
                contextOpen: true,
                navigatorError: true,
                navigatorLoading: false,
            },
            explorer: {
                ...initState.explorer,
                selected: [createFile({ source_enabled: true })],
                selectProps: {
                    isMultiple: false,
                    withFolder: false,
                    withFile: true,
                    withSourceEnabled: true,
                },
                search: { keywords: "keywords/previous", searchPath: "/to" },
            },
        };
        const action = setNavigator("/newpath", true);
        expect(cloudreveApp(navState, action)).toEqual({
            ...initState,
            navigator: {
                ...initState.navigator,
                path: "/newpath",
            },
            viewUpdate: {
                ...initState.viewUpdate,
                contextOpen: false,
                navigatorError: false,
                navigatorLoading: true,
            },
            explorer: {
                ...initState.explorer,
                selected: [],
                selectProps: {
                    isMultiple: false,
                    withFolder: false,
                    withFile: false,
                    withSourceEnabled: false,
                },
                search: undefined,
            },
        });
        expect(window.currntPath).toEqual("/newpath");
    });

    it("should handle TOGGLE_DAYLIGHT_MODE", () => {
        const action = toggleDaylightMode();
        const darkState = {
            ...initState,
            siteConfig: {
                ...initState.siteConfig,
                theme: {
                    ...initState.siteConfig.theme,
                    palette: {
                        ...initState.siteConfig.theme.palette,
                        type: "dark",
                    },
                },
            },
        };
        const lightState = {
            ...initState,
            siteConfig: {
                ...initState.siteConfig,
                theme: {
                    ...initState.siteConfig.theme,
                    palette: {
                        ...initState.siteConfig.theme.palette,
                        type: "light",
                    },
                },
            },
        };
        expect(cloudreveApp(initState, action)).toEqual(darkState);
        expect(cloudreveApp(darkState, action)).toEqual(lightState);
    });

    it("should handle APPLY_THEME", () => {
        const action = applyThemes("foo");
        const stateWithThemes = {
            ...initState,
            siteConfig: {
                ...initState.siteConfig,
                themes: JSON.stringify({ foo: "bar" }),
            },
        };
        expect(cloudreveApp(stateWithThemes, action)).toEqual({
            ...stateWithThemes,
            siteConfig: {
                ...stateWithThemes.siteConfig,
                theme: "bar",
            },
        });
    });

    it("should handle OPEN_CREATE_FOLDER_DIALOG", () => {
        const action = openCreateFolderDialog();
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    createNewFolder: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle OPEN_RENAME_DIALOG", () => {
        const action = openRenameDialog();
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    rename: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle OPEN_REMOVE_DIALOG", () => {
        const action = openRemoveDialog();
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    remove: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle OPEN_MOVE_DIALOG", () => {
        const action = openMoveDialog();
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    move: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle OPEN_RESAVE_DIALOG", () => {
        const action = openResaveDialog();
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    resave: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle SET_USER_POPOVER", () => {
        // TODO: update to real anchor
        const action = setUserPopover("anchor");
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                userPopoverAnchorEl: "anchor",
            },
        });
    });

    it("should handle SET_SHARE_USER_POPOVER", () => {
        // TODO: update to real anchor
        const action = setShareUserPopover("anchor");
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                shareUserPopoverAnchorEl: "anchor",
            },
        });
    });

    it("should handle OPEN_SHARE_DIALOG", () => {
        // TODO: update to real anchor
        const action = openShareDialog();
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    share: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle SET_SITE_CONFIG", () => {
        // TODO: update to real anchor
        const action = setSiteConfig({ foo: "bar" });
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            siteConfig: {
                foo: "bar",
            },
        });
    });

    it("should handle SET_SITE_CONFIG", () => {
        // TODO: update to real anchor
        const action = setSiteConfig({ foo: "bar" });
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            siteConfig: {
                foo: "bar",
            },
        });
    });

    it("should handle OPEN_MUSIC_DIALOG", () => {
        const action = openMusicDialog();
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    music: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle OPEN_REMOTE_DOWNLOAD_DIALOG", () => {
        const action = openRemoteDownloadDialog();
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    remoteDownload: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle OPEN_TORRENT_DOWNLOAD_DIALOG", async () => {
        const torrent = createFile({ id: "torrent", name: "archive.torrent" });
        const selectedState = cloudreveApp(initState, setSelectedTarget([torrent]));
        const state = {
            ...selectedState,
            viewUpdate: { ...selectedState.viewUpdate, contextOpen: true },
        };
        const store = createTestStore(state);
        await store.dispatch(openTorrentDownload());
        expect(store.getActions()).toEqual([openTorrentDownloadDialog(torrent)]);
        expect(store.getState()).toEqual({
            ...state,
            viewUpdate: {
                ...state.viewUpdate,
                modals: {
                    ...state.viewUpdate.modals,
                    remoteDownload: true,
                    remoteDownloadTorrent: torrent,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle OPEN_DECOMPRESS_DIALOG", () => {
        const action = openDecompressDialog();
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    decompress: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle OPEN_COMPRESS_DIALOG", () => {
        const action = openCompressDialog();
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    compress: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle OPEN_GET_SOURCE_DIALOG", () => {
        const sources = [
            "https://files.example.test/document.txt",
            "a.txt: https://files.example.test/a.txt\nb.txt: https://files.example.test/b.txt",
        ];
        const state = {
            ...initState,
            viewUpdate: { ...initState.viewUpdate, contextOpen: true },
        };
        for (const source of sources) {
            expect(cloudreveApp(state, openGetSourceDialog(source))).toEqual({
                ...initState,
                viewUpdate: {
                    ...initState.viewUpdate,
                    modals: {
                        ...initState.viewUpdate.modals,
                        getSource: source,
                    },
                    contextOpen: false,
                },
            });
        }
    });

    it("should handle OPEN_COPY_DIALOG", () => {
        const action = openCopyDialog();
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    copy: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle OPEN_LOADING_DIALOG", () => {
        const action = openLoadingDialog("loading");
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    loading: true,
                    loadingText: "loading",
                },
                contextOpen: false,
            },
        });
    });

    it("should handle CLOSE_ALL_MODALS", () => {
        const openState = {
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    createNewFolder: true,
                    createNewFile: true,
                    rename: true,
                    move: true,
                    remove: true,
                    share: true,
                    music: true,
                    remoteDownload: true,
                    remoteDownloadTorrent: createFile({ name: "archive.torrent" }),
                    getSource: "https://files.example.test/document.txt",
                    resave: true,
                    copy: true,
                    loading: true,
                    loadingText: "loading",
                    compress: true,
                    decompress: true,
                    option: {
                        options: [{ key: "server", name: "Server", open: true }],
                        title: "Download method",
                        callback: jest.fn(),
                        onClose: jest.fn(),
                    },
                    directoryDownloading: true,
                    directoryDownloadLog: "Downloaded document.txt",
                    directoryDownloadDone: true,
                },
            },
        };
        const action = closeAllModals();
        const closedState = cloudreveApp(openState, action);
        expect(closedState).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    createNewFolder: false,
                    createNewFile: false,
                    rename: false,
                    move: false,
                    remove: false,
                    share: false,
                    music: false,
                    remoteDownload: false,
                    remoteDownloadTorrent: null,
                    getSource: "",
                    resave: false,
                    copy: false,
                    loading: false,
                    loadingText: "loading",
                    compress: false,
                    decompress: false,
                    option: undefined,
                    directoryDownloading: false,
                    directoryDownloadLog: "",
                    directoryDownloadDone: false,
                },
            },
        });
        expect(cloudreveApp(closedState, action)).toEqual(closedState);
        expect(cloudreveApp(closedState, openRemoteDownloadDialog())).toEqual({
            ...closedState,
            viewUpdate: {
                ...closedState.viewUpdate,
                modals: {
                    ...closedState.viewUpdate.modals,
                    remoteDownload: true,
                    remoteDownloadTorrent: null,
                },
            },
        });
    });

    it("should handle CHANGE_SUB_TITLE", async () => {
        const store = createTestStore(initState);
        const action = changeSubTitle("test sub title");
        await store.dispatch(action);
        expect(store.getActions()).toEqual([setSubtitle("test sub title")]);
        expect(store.getState()).toEqual({
            ...initState,
            viewUpdate: { ...initState.viewUpdate, subTitle: "test sub title" },
        });
        expect(document.title).toEqual("test sub title - Cloudreve");
    });

    it("should handle SET_SUBTITLE", () => {
        const action = setSubtitle("test sub title 2");
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                subTitle: "test sub title 2",
            },
        });
    });

    it("should handle TOGGLE_SNACKBAR", () => {
        const action = toggleSnackbar(
            "top",
            "right",
            "something wrong",
            "error"
        );
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                snackbar: {
                    toggle: true,
                    vertical: "top",
                    horizontal: "right",
                    msg: "something wrong",
                    color: "error",
                },
            },
        });
    });

    it("should handle SET_MODALS_LOADING", () => {
        const action = setModalsLoading("test loading status");
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modalsLoading: "test loading status",
            },
        });
    });

    it("should handle SET_SESSION_STATUS", () => {
        const action = setSessionStatus(true);
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                isLogin: true,
            },
        });
    });

    it("should handle REFRESH_FILE_LIST", () => {
        const search = { keywords: "keywords/report", searchPath: "/documents" };
        const state = {
            ...initState,
            navigator: { ...initState.navigator, path: "/搜索结果" },
            explorer: {
                ...initState.explorer,
                search,
                selected: [createFile({ source_enabled: true }), createFile({ type: "dir", id: "folder" })],
                selectProps: { isMultiple: true, withFolder: true, withFile: true, withSourceEnabled: true },
            },
        };
        const action = refreshFileList();
        const refreshedState = cloudreveApp(state, action);
        expect(refreshedState).toEqual({
            ...state,
            navigator: {
                ...state.navigator,
                refresh: false,
            },
            explorer: {
                ...initState.explorer,
                search,
                selected: [],
                selectProps: {
                    isMultiple: false,
                    withFolder: false,
                    withFile: false,
                    withSourceEnabled: false,
                },
            },
        });
        expect(cloudreveApp(refreshedState, action)).toEqual({
            ...refreshedState,
            navigator: { ...refreshedState.navigator, refresh: true },
        });
    });

    it("should handle SEARCH_MY_FILE", () => {
        const state = {
            ...initState,
            navigator: { ...initState.navigator, path: "/documents" },
            viewUpdate: {
                ...initState.viewUpdate,
                contextOpen: true,
                navigatorError: true,
                navigatorLoading: false,
            },
            explorer: {
                ...initState.explorer,
                selected: [createFile({ source_enabled: true }), createFile({ type: "dir", id: "folder" })],
                selectProps: { isMultiple: true, withFolder: true, withFile: true, withSourceEnabled: true },
            },
        };
        const action = searchMyFile("keywords/report", "/documents");
        const searchState = cloudreveApp(state, action);
        expect(searchState).toEqual({
            ...initState,
            navigator: {
                ...initState.navigator,
                path: "/搜索结果",
                refresh: true,
            },
            viewUpdate: {
                ...initState.viewUpdate,
                contextOpen: false,
                navigatorError: false,
                navigatorLoading: true,
            },
            explorer: {
                ...initState.explorer,
                selected: [],
                selectProps: {
                    isMultiple: false,
                    withFolder: false,
                    withFile: false,
                    withSourceEnabled: false,
                },
                search: { keywords: "keywords/report", searchPath: "/documents" },
            },
        });
        // Once on the results path, toggling refresh makes Navigator load again.
        const nextSearch = searchMyFile("keywords/invoice", "");
        const repeatedState = cloudreveApp(searchState, nextSearch);
        expect(repeatedState).toEqual({
            ...searchState,
            navigator: { ...searchState.navigator, refresh: false },
            explorer: {
                ...searchState.explorer,
                search: { keywords: "keywords/invoice", searchPath: "" },
            },
        });
        expect(cloudreveApp(repeatedState, nextSearch)).toEqual({
            ...repeatedState,
            navigator: { ...repeatedState.navigator, refresh: true },
        });
    });

    it("should handle SHOW_IMG_PREIVEW", () => {
        const action = showImgPreivew({ type: "file" });
        const showImgState = {
            ...initState,
            explorer: {
                ...initState.explorer,
                fileList: [{ type: "file" }, { type: "dir" }],
            },
        };
        expect(cloudreveApp(showImgState, action)).toEqual({
            ...showImgState,
            explorer: {
                ...showImgState.explorer,
                imgPreview: {
                    ...showImgState.explorer.imgPreview,
                    first: { type: "file" },
                    other: [{ type: "file" }, { type: "dir" }],
                },
            },
        });
    });

    it("should handle REFRESH_STORAGE", () => {
        const action = refreshStorage();

        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                storageRefresh: true,
            },
        });
    });

    it("should handle SAVE_FILE", () => {
        const action = saveFile();
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            explorer: {
                ...initState.explorer,
                fileSave: true,
            },
        });
    });

    it("should handle SET_LAST_SELECT", () => {
        const action = setLastSelect({ type: "file" }, 1);
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            explorer: {
                ...initState.explorer,
                lastSelect: {
                    file: { type: "file" },
                    index: 1,
                },
            },
        });
    });

    it("should handle SET_SHIFT_SELECTED_IDS", () => {
        const action = setShiftSelectedIds(["1", "2"]);
        expect(cloudreveApp(initState, action)).toEqual({
            ...initState,
            explorer: {
                ...initState.explorer,
                shiftSelectedIds: ["1", "2"],
            },
        });
    });
});
