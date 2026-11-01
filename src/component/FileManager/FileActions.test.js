import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18next from "i18next";
import FileActions from "./FileActions";

const i18n = i18next.createInstance();
i18n.init({ lng: "en", resources: { en: { application: { fileManager: { download: "Download", share: "Share", enter: "Open" } } } }, initImmediate: false });
let container;
beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    localStorage.setItem("user", JSON.stringify({ anonymous: false, group: { allowShare: true } }));
});
afterEach(() => {
    act(() => { ReactDOM.unmountComponentAtNode(container); });
    container.remove();
    localStorage.clear();
});

function render(file, route = "/home", handlers = {}) {
    act(() => {
        ReactDOM.render(
            <I18nextProvider i18n={i18n}>
                <MemoryRouter initialEntries={[route]}>
                    <div onClick={handlers.rowClick} onDoubleClick={handlers.rowDoubleClick}>
                        <FileActions file={file} onDownload={handlers.download} onShare={handlers.share} onOpen={handlers.open} />
                    </div>
                </MemoryRouter>
            </I18nextProvider>, container
        );
    });
}

it("downloads the clicked file without selecting or opening its row", () => {
    const handlers = { download: jest.fn(), rowClick: jest.fn(), rowDoubleClick: jest.fn() };
    render({ type: "file", name: "notes.txt" }, "/home", handlers);
    const button = container.querySelector('[aria-label="Download"]');
    expect(button).not.toBeNull();
    act(() => { Simulate.click(button); Simulate.doubleClick(button); });
    expect(handlers.download).toHaveBeenCalledTimes(1);
    expect(handlers.rowClick).not.toHaveBeenCalled();
    expect(handlers.rowDoubleClick).not.toHaveBeenCalled();
});

it("offers folder navigation and share instead of a file download", () => {
    const handlers = { open: jest.fn(), share: jest.fn(), rowClick: jest.fn() };
    render({ type: "dir", name: "Docs" }, "/home", handlers);
    expect(container.querySelector('[aria-label="Download"]')).toBeNull();
    expect(container.querySelector('[aria-label="Open"]')).not.toBeNull();
    act(() => {
        Simulate.click(container.querySelector('[aria-label="Open"]'));
        Simulate.click(container.querySelector('[aria-label="Share"]'));
    });
    expect(handlers.open).toHaveBeenCalledTimes(1);
    expect(handlers.share).toHaveBeenCalledTimes(1);
    expect(handlers.rowClick).not.toHaveBeenCalled();
});

it.each(["/s/key", "/s/key?path=%2Fdocs", "/other"])("does not expose share creation on %s", (route) => {
    render({ type: "file", name: "notes.txt" }, route);
    expect(container.querySelector('[aria-label="Share"]')).toBeNull();
    expect(container.querySelector('[aria-label="Download"]')).not.toBeNull();
});

it("does not expose share creation when the group forbids it", () => {
    localStorage.setItem("user", JSON.stringify({ anonymous: false, group: { allowShare: false } }));
    render({ type: "file", name: "notes.txt" });
    expect(container.querySelector('[aria-label="Share"]')).toBeNull();
});

it.each([null, { anonymous: true, group: { allowShare: true } }])("does not expose share creation for user %j", (user) => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
    render({ type: "file", name: "notes.txt" });
    expect(container.querySelector('[aria-label="Share"]')).toBeNull();
});
