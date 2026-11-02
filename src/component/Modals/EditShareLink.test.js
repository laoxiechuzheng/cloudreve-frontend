import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import { I18nextProvider } from "react-i18next";
import i18next from "i18next";
import EditShareLink, { SHARE_KEY_PATTERN } from "./EditShareLink";

const i18n = i18next.createInstance();
i18n.init({ lng: "en", initImmediate: false, resources: { en: {
    application: { share: {
        editLinkTitle: "Edit share link", linkKey: "Link", linkKeyHelp: "Help text",
        linkKeyInvalid: "Bad format", saveLink: "Save",
    } },
    common: { cancel: "Cancel" },
} } });

let host;
const render = (props) => act(() => { ReactDOM.render(
    <I18nextProvider i18n={i18n}><EditShareLink open sourceName="app.exe" currentKey="vPiD" {...props} /></I18nextProvider>, host
); });
const input = () => document.body.querySelector("#share-link-key");
const saveButton = () => [...document.body.querySelectorAll("button")].find((b) => b.textContent.startsWith("Save"));
const type = (value) => act(() => { Simulate.change(input(), { target: { value } }); });
const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
});
afterEach(() => {
    act(() => { ReactDOM.unmountComponentAtNode(host); });
    host.remove();
});

it("accepts the same key format as the server", () => {
    ["vPiD", "98k-win_2", "a".repeat(64)].forEach((key) => expect(SHARE_KEY_PATTERN.test(key)).toBe(true));
    ["", "a b", "a/b", "中文", "a".repeat(65)].forEach((key) => expect(SHARE_KEY_PATTERN.test(key)).toBe(false));
});

it("shows the full link, blocks invalid or unchanged keys and saves the trimmed key", async () => {
    const onSave = jest.fn(() => Promise.resolve());
    const onClose = jest.fn();
    render({ onSave, onClose });
    expect(input().value).toBe("vPiD");
    expect(document.body.textContent).toContain(window.location.origin + "/s/");
    expect(saveButton().disabled).toBe(true);

    type("bad key");
    expect(document.body.textContent).toContain("Bad format");
    expect(saveButton().disabled).toBe(true);

    type("  98k-win  ");
    expect(saveButton().disabled).toBe(false);
    act(() => { Simulate.submit(input().closest("form")); });
    await flush();
    expect(onSave).toHaveBeenCalledWith("98k-win");
    expect(onClose).toHaveBeenCalled();
});

it("allows clearing back to the default link and keeps the dialog open on a server error", async () => {
    const onSave = jest.fn(() => Promise.reject(new Error("Taken by old.exe")));
    const onClose = jest.fn();
    render({ onSave, onClose });
    type("");
    expect(saveButton().disabled).toBe(false);
    act(() => { Simulate.submit(input().closest("form")); });
    await flush();
    expect(onSave).toHaveBeenCalledWith("");
    expect(onClose).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain("Taken by old.exe");
    expect(saveButton().disabled).toBe(false);
});
