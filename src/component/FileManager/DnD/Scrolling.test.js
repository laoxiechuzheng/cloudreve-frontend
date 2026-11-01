import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import useDragScrolling from "./Scrolling";

let host, current, registered, addListener;
function Probe() { current = useDragScrolling(); return null; }
beforeEach(() => {
    host = document.createElement("div");
    host.id = "explorer-container";
    document.body.appendChild(host);
    registered = [];
    addListener = jest.spyOn(window, "addEventListener");
    act(() => { ReactDOM.render(<Probe />, host); });
});
afterEach(() => {
    act(() => { ReactDOM.unmountComponentAtNode(host); });
    registered.forEach((handler) => window.removeEventListener("dragover", handler, false));
    addListener.mockRestore();
    host.remove();
});

it("removes the original drag listener after selection causes a rerender", () => {
    current.addEventListenerForWindow();
    const listener = addListener.mock.calls.find((args) => args[0] === "dragover")[1];
    registered.push(listener);
    act(() => { ReactDOM.render(<Probe />, host); });
    const removeListener = jest.spyOn(window, "removeEventListener");
    current.removeEventListenerForWindow();
    const removed = removeListener.mock.calls.filter((args) => args[0] === "dragover").map((args) => args[1]);
    removeListener.mockRestore();
    expect(removed).toContain(listener);
});

it("cleans up an active drag when the file manager unmounts", () => {
    current.addEventListenerForWindow();
    const listener = addListener.mock.calls.find((args) => args[0] === "dragover")[1];
    registered.push(listener);
    const removeListener = jest.spyOn(window, "removeEventListener");
    act(() => { ReactDOM.unmountComponentAtNode(host); });
    const removed = removeListener.mock.calls.filter((args) => args[0] === "dragover").map((args) => args[1]);
    removeListener.mockRestore();
    expect(removed).toContain(listener);
});

it("cancels the scheduled animation frame when dragging ends", () => {
    const frames = new Map();
    let nextId = 0;
    const requestFrame = jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
        frames.set(++nextId, callback);
        return nextId;
    });
    const cancelFrame = jest.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => { frames.delete(id); });
    const bounds = jest.spyOn(host, "getBoundingClientRect").mockReturnValue({ top: 100, bottom: 500 });
    Object.defineProperty(host, "scrollHeight", { value: 400 });
    Object.defineProperty(host, "clientHeight", { value: 100 });
    try {
        current.addEventListenerForWindow();
        registered.push(addListener.mock.calls.find((args) => args[0] === "dragover")[1]);
        window.dispatchEvent(new MouseEvent("dragover", { clientY: 480 }));
        expect(frames.size).toBe(1);
        const [id, callback] = frames.entries().next().value;
        frames.delete(id);
        callback();
        expect(host.scrollTop).toBe(10);
        expect(frames.size).toBe(1);
        current.removeEventListenerForWindow();
        expect(frames.size).toBe(0);
    } finally {
        current.removeEventListenerForWindow();
        requestFrame.mockRestore();
        cancelFrame.mockRestore();
        bounds.mockRestore();
    }
});
