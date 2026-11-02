import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import { Provider, useSelector } from "react-redux";
import { combineReducers, createStore } from "redux";
import { I18nextProvider } from "react-i18next";
import i18next from "i18next";
import API from "../../middleware/Api";
import viewUpdate, { initState as viewState } from "../../redux/viewUpdate/reducer";
import GetSource, { parseSourceLink } from "./GetSource";

jest.mock("../../i18n", () => ({ __esModule: true, default: { t: (key) => key }, languages: [] }));
jest.mock("../../middleware/Api", () => ({ __esModule: true, default: { patch: jest.fn() } }));

const i18n = i18next.createInstance();
i18n.init({ lng: "en", initImmediate: false, defaultNS: "application", ns: ["application", "common"], resources: { en: {
    application: {
        modals: { getSourceLinkTitle: "Get source link", sourceLink: "Source link", linkCopied: "Copied" },
        share: { editLink: "Edit link", editSourceLinkTitle: "Edit source link", sourceLinkKeyHelp: "Follows the file", linkKey: "Link", linkKeyInvalid: "Bad format", saveLink: "Save", linkChanged: "Changed to {{url}}" },
    },
    common: { cancel: "Cancel", close: "Close", copyToClipboard: "Copy" },
} } });

const file = { id: "f1", name: "deploy-jpcc2c-debian.sh", type: "file" };
const source = "https://pan.example.test/f/NR6cM/deploy-jpcc2c-debian.sh";
let host, store;

function Harness({ selected }) {
    const current = useSelector((state) => state.viewUpdate.modals.getSource);
    return <GetSource source={current} selected={selected} onClose={jest.fn()} />;
}
const render = (selected, getSource = source) => {
    store = createStore(combineReducers({ viewUpdate }), {
        viewUpdate: { ...viewState, modals: { ...viewState.modals, getSource } },
    });
    act(() => { ReactDOM.render(
        <Provider store={store}><I18nextProvider i18n={i18n}><Harness selected={selected} /></I18nextProvider></Provider>, host
    ); });
};
const button = (label) => [...document.body.querySelectorAll("button")].find((b) => b.textContent === label);
const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    API.patch.mockReset();
});
afterEach(() => {
    act(() => { ReactDOM.unmountComponentAtNode(host); });
    host.remove();
});

it("only treats a single file's /f/ link as editable", () => {
    expect(parseSourceLink(source, [file])).toEqual({ prefix: "https://pan.example.test/f/", key: "NR6cM" });
    expect(parseSourceLink(source, [file, { ...file, id: "f2" }])).toBeNull();
    expect(parseSourceLink(source, [{ ...file, type: "dir" }])).toBeNull();
    expect(parseSourceLink("https://bucket.example.test/obj/deploy.sh?sign=x", [file])).toBeNull();
    expect(parseSourceLink("a.sh: https://pan.example.test/f/NR6cM/a.sh\nb.sh: https://pan.example.test/f/Q2/b.sh", [file])).toBeNull();
    expect(parseSourceLink("", [file])).toBeNull();
});

it("keeps batch output read-only", () => {
    render([file, { ...file, id: "f2", name: "b.sh" }], "a.sh: https://pan.example.test/f/NR6cM/a.sh\nb.sh: https://pan.example.test/f/Q2/b.sh");
    expect(button("Copy")).toBeDefined();
    expect(button("Edit link")).toBeUndefined();
});

it("edits a single file's source link and shows the new URL", async () => {
    API.patch.mockResolvedValue({ data: "https://pan.example.test/f/deploy/deploy-jpcc2c-debian.sh" });
    render([file]);
    act(() => { Simulate.click(button("Edit link")); });

    const keyInput = document.body.querySelector("#share-link-key");
    expect(keyInput.value).toBe("NR6cM");
    const text = document.body.textContent;
    expect(text).toContain("Edit source link");
    expect(text).toContain("https://pan.example.test/f/");
    expect(text).toContain("/deploy-jpcc2c-debian.sh");
    expect(text).toContain("Follows the file");

    act(() => { Simulate.change(keyInput, { target: { value: "deploy" } }); });
    act(() => { Simulate.submit(keyInput.closest("form")); });
    await flush();
    expect(API.patch).toHaveBeenCalledWith("/file/source", { id: "f1", key: "deploy" });
    expect(store.getState().viewUpdate.modals.getSource).toBe("https://pan.example.test/f/deploy/deploy-jpcc2c-debian.sh");
    expect([...document.body.querySelectorAll("textarea")].some((el) => el.value === "https://pan.example.test/f/deploy/deploy-jpcc2c-debian.sh")).toBe(true);
});
