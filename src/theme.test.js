import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { Provider } from "react-redux";
import { createStore } from "redux";
import { createAppTheme, normalizeThemeMode, readThemePreference, useAppTheme } from "./theme";

describe("shared application theme", () => {
    test.each([null, undefined, "system", "invalid", {}, false])(
        "follows the system for an unspecified or invalid preference: %p",
        (preference) => {
            expect(normalizeThemeMode(preference, true)).toBe("dark");
            expect(normalizeThemeMode(preference, false)).toBe("light");
        }
    );

    test("an explicit mode overrides the system", () => {
        expect(normalizeThemeMode("light", true)).toBe("light");
        expect(normalizeThemeMode("dark", false)).toBe("dark");
    });

    test("reads existing preferences without rewriting unrelated values", () => {
        const value = JSON.stringify({
            theme_mode: "dark",
            view_method: "list"
        });
        const storage = { getItem: jest.fn(() => value) };
        expect(readThemePreference(storage)).toBe("dark");
        expect(storage.getItem).toHaveBeenCalledWith("user_preference");
        expect(storage.getItem()).toBe(value);
    });

    test.each(["not json", "null", "[]", "{}", '{"theme_mode":"invalid"}'])(
        "recovers from malformed or absent theme preference: %s",
        (value) => expect(readThemePreference({ getItem: () => value })).toBe(null)
    );

    test("unavailable storage falls back to the system", () => {
        expect(readThemePreference({ getItem: () => { throw new Error("blocked"); } })).toBe(null);
    });

    test("does not mutate a Redux theme, including nested objects", () => {
        const config = Object.freeze({
            palette: Object.freeze({
                type: "light",
                primary: Object.freeze({ main: "#008577" }),
                background: Object.freeze({ paper: "#fff" }),
            }),
            shape: Object.freeze({ borderRadius: 12 }),
        });
        const before = JSON.stringify(config);
        const dark = createAppTheme(config, true, null);
        const light = createAppTheme(config, true, "light");
        expect(JSON.stringify(config)).toBe(before);
        expect(dark.palette.type).toBe("dark");
        expect(light.palette.type).toBe("light");
        expect(light.palette.primary.main).toBe("#008577");
        expect(dark.palette.background.paper).not.toBe(light.palette.background.paper);
    });

    test("normalizes legacy defaults and incomplete configuration", () => {
        const legacy = createAppTheme({ palette: { primary: { main: "#3f51b5" } } });
        expect(legacy.palette.primary.main).toBe("#4150d8");
        expect(legacy.shape.borderRadius).toBe(8);
        expect(createAppTheme(null).palette.primary.main).toBe("#4150d8");
        expect(createAppTheme({ palette: { primary: { main: "invalid" } } }).palette.primary.main).toBe("#4150d8");
    });

    test("dark palette and explorer colors never inherit light text", () => {
        const theme = createAppTheme({
palette: {
                text: { primary: "#111" },
                explorer: { filename: "#111" }
            },
}, false, "dark");
        expect(theme.palette.explorer.filename).toBe(theme.palette.text.primary);
        expect(theme.palette.text.primary).not.toBe("#111");
        expect(theme.palette.background.default).not.toBe("#fff");
    });
});

describe("theme preference integration", () => {
    let container;
    let originalMatchMedia;
    beforeEach(() => {
        originalMatchMedia = window.matchMedia;
        window.matchMedia = jest.fn(() => ({
            matches: true,
            addListener: jest.fn(),
            removeListener: jest.fn()
        }));
        localStorage.clear();
        container = document.createElement("div");
        document.body.appendChild(container);
    });
    afterEach(() => {
        act(() => { ReactDOM.unmountComponentAtNode(container); });
        container.remove();
        localStorage.clear();
        window.matchMedia = originalMatchMedia;
    });

    function Probe() {
        const theme = useAppTheme();
        return <span
            data-mode={theme.palette.type}
            data-primary={theme.palette.primary.main}
        />;
    }

    function mount() {
        const store = createStore((state = { siteConfig: { theme: { palette: { type: "light" } } } }, action) =>
            action.type === "APPLY_CONFIG" ? { siteConfig: { theme: action.theme } } : state);
        act(() => { ReactDOM.render(<Provider store={store}><Probe /></Provider>, container); });
        return store;
    }

    test("an existing settings change takes effect on the next Redux render", () => {
        const store = mount();
        expect(container.firstChild.dataset.mode).toBe("dark");
        expect(store.getState().siteConfig.theme.palette.type).toBe("light");
        act(() => {
            store.dispatch({
                type: "APPLY_CONFIG",
                theme: { palette: { primary: { main: "#008577" } } }
            });
            localStorage.setItem("user_preference", JSON.stringify({ theme_mode: "light" }));
        });
        expect(container.firstChild.dataset.mode).toBe("light");
        expect(container.firstChild.dataset.primary).toBe("#008577");
    });

    test("cross-tab changes and clearing preferences restore the correct mode", () => {
        mount();
        act(() => {
            localStorage.setItem("user_preference", JSON.stringify({ theme_mode: "light" }));
            window.dispatchEvent(new StorageEvent("storage", { key: "user_preference" }));
        });
        expect(container.firstChild.dataset.mode).toBe("light");
        act(() => {
            localStorage.clear();
            window.dispatchEvent(new StorageEvent("storage", { key: null }));
        });
        expect(container.firstChild.dataset.mode).toBe("dark");
    });
});
