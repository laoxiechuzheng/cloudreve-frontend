import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import { Provider } from "react-redux";
import { createStore } from "redux";
import { I18nextProvider } from "react-i18next";
import i18next from "i18next";
import API from "../../middleware/Api";
import CreateShare from "./CreateShare";

jest.mock("../../i18n", () => ({ __esModule: true, default: { t: (key) => key }, languages: [] }));
jest.mock("../../middleware/Api", () => ({ __esModule: true, default: { post: jest.fn(), patch: jest.fn() } }));

const i18n = i18next.createInstance();
i18n.init({ lng: "en", initImmediate: false, defaultNS: "application", ns: ["application", "common"], resources: { en: {
    application: {
        modals: { createShareLink: "Create share link", customShareLink: "Custom link", customShareLinkHelp: "Empty = default", shareLink: "Share link", sendLink: "Send" },
        share: { editLink: "Edit link", editLinkTitle: "Edit share link", linkKey: "Link", linkKeyHelp: "Help text", linkKeyInvalid: "Bad format", saveLink: "Save", linkChanged: "Changed to {{url}}" },
    },
    common: { cancel: "Cancel", close: "Close" },
} } });

const file = { id: "f1", name: "deploy.sh", type: "file" };
let host, store;
const render = () => act(() => { ReactDOM.render(
    <Provider store={store}><I18nextProvider i18n={i18n}>
        <CreateShare open onClose={jest.fn()} selected={[file]} modalsLoading={false} setModalsLoading={jest.fn()} />
    </I18nextProvider></Provider>, host
); });
const button = (label) => [...document.body.querySelectorAll("button")].find((b) => b.textContent === label);
const type = (el, value) => act(() => { Simulate.change(el, { target: { value } }); });
const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
const customInput = () => document.body.querySelector("#share-custom-key");
const shownLink = () => [...document.body.querySelectorAll("input")].find((i) => i.value.includes("/s/"));

beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    store = createStore((state = {}) => state);
    API.post.mockReset();
    API.patch.mockReset();
});
afterEach(() => {
    act(() => { ReactDOM.unmountComponentAtNode(host); });
    host.remove();
});

it("sends no custom_key when the custom link is left empty", async () => {
    API.post.mockResolvedValue({ data: "https://pan.example.test/s/Ab3x" });
    render();
    act(() => { Simulate.click(button("Create share link")); });
    await flush();
    expect(API.post).toHaveBeenCalledTimes(1);
    expect(API.post.mock.calls[0][1]).not.toHaveProperty("custom_key");
    expect(shownLink().value).toBe("https://pan.example.test/s/Ab3x");
});

it("blocks an invalid custom link and sends a valid one as custom_key", async () => {
    API.post.mockResolvedValue({ data: "https://pan.example.test/s/deploy-v2" });
    render();
    expect(document.body.textContent).toContain(window.location.origin + "/s/");

    type(customInput(), "bad key");
    expect(document.body.textContent).toContain("Bad format");
    expect(button("Create share link").disabled).toBe(true);

    type(customInput(), " deploy-v2 ");
    expect(button("Create share link").disabled).toBe(false);
    act(() => { Simulate.click(button("Create share link")); });
    await flush();
    expect(API.post).toHaveBeenCalledWith("/share", expect.objectContaining({ id: "f1", is_dir: false, custom_key: "deploy-v2" }));
    expect(shownLink().value).toBe("https://pan.example.test/s/deploy-v2");
});

it("edits the link right after creating the share and shows the new URL", async () => {
    API.post.mockResolvedValue({ data: "https://pan.example.test/s/Ab3x" });
    API.patch.mockResolvedValue({ data: "deploy" });
    render();
    act(() => { Simulate.click(button("Create share link")); });
    await flush();

    act(() => { Simulate.click(button("Edit link")); });
    const keyInput = document.body.querySelector("#share-link-key");
    expect(keyInput.value).toBe("Ab3x");
    expect(document.body.textContent).toContain("https://pan.example.test/s/");
    type(keyInput, "deploy");
    act(() => { Simulate.submit(keyInput.closest("form")); });
    await flush();
    expect(API.patch).toHaveBeenCalledWith("/share/Ab3x", { prop: "custom_key", value: "deploy" });
    expect(shownLink().value).toBe("https://pan.example.test/s/deploy");
});
