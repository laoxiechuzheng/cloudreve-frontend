import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { createMuiTheme, fade, getLuminance, lighten } from "@material-ui/core/styles";

export const normalizeThemeMode = (preference, prefersDarkMode = false) =>
    preference === "dark" || preference === "light"
        ? preference
        : prefersDarkMode ? "dark" : "light";

export function readThemePreference(storage) {
    try {
        const preferences = JSON.parse((storage || window.localStorage).getItem("user_preference") || "{}");
        const mode = preferences && preferences.theme_mode;
        return mode === "light" || mode === "dark" ? mode : null;
    } catch (error) {
        return null;
    }
}

function colorOrDefault(value, fallback, legacy) {
    if (typeof value !== "string" || value.toLowerCase() === legacy) return fallback;
    try {
        return Number.isFinite(getLuminance(value)) ? value : fallback;
    } catch (error) {
        return fallback;
    }
}

export function createAppTheme(config, prefersDarkMode = false, preference = null, locale = {}) {
    const source = config && typeof config === "object" ? config : {};
    const palette = source.palette || {};
    const type = normalizeThemeMode(preference, prefersDarkMode);
    const dark = type === "dark";
    const primary = colorOrDefault(palette.primary && palette.primary.main, "#4150d8", "#3f51b5");
    const secondary = colorOrDefault(palette.secondary && palette.secondary.main, "#087f72", "#f50057");
    const text = dark ? "#eceef3" : "#202431";
    const muted = dark ? "#b0b5c1" : "#646b7c";
    const border = dark ? "#353942" : "#e1e5ec";
    const paper = dark ? "#202329" : "#ffffff";
    const canvas = dark ? "#17191e" : "#f5f6f9";
    const accent = dark ? lighten(primary, 0.36) : primary;
    const theme = createMuiTheme({
        ...source,
        palette: {
            ...palette,
            type,
            primary: { main: accent },
            secondary: { main: dark ? lighten(secondary, 0.36) : secondary },
            success: { main: dark ? "#57c5b4" : "#087f72" },
            warning: { main: dark ? "#edbd63" : "#a7660b" },
            error: { main: dark ? "#f68b8b" : "#c93d49" },
            info: { main: accent },
            background: {
                default: canvas,
                paper
            },
            text: {
                primary: text,
                secondary: muted,
                disabled: dark ? "#7c8390" : "#8b91a0",
                hint: muted
            },
            divider: border,
            action: {
                hover: fade(accent, dark ? 0.1 : 0.045),
                selected: fade(accent, dark ? 0.16 : 0.09),
            },
            explorer: {
                ...palette.explorer,
                filename: text,
                icon: muted,
                bgSelected: fade(accent, dark ? 0.16 : 0.09),
                emptyIcon: dark ? "#454b56" : "#d7dce8",
            },
        },
        shape: {
            ...source.shape,
            borderRadius: 8
        },
        typography: {
            ...source.typography,
            fontFamily: (source.typography && source.typography.fontFamily) ||
                '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
            h1: {
                fontSize: "2rem",
                fontWeight: 650,
                letterSpacing: 0
            },
            h2: {
                fontSize: "1.75rem",
                fontWeight: 650,
                letterSpacing: 0
            },
            h3: {
                fontSize: "1.5rem",
                fontWeight: 650,
                letterSpacing: 0
            },
            h4: {
                fontSize: "1.375rem",
                fontWeight: 650,
                letterSpacing: 0
            },
            h5: {
                fontSize: "1.25rem",
                fontWeight: 650,
                letterSpacing: 0,
                lineHeight: 1.45
            },
            h6: {
                fontSize: "1.0625rem",
                fontWeight: 600,
                letterSpacing: 0,
                lineHeight: 1.5
            },
            subtitle1: {
                fontSize: "0.9375rem",
                fontWeight: 500,
                letterSpacing: 0
            },
            subtitle2: {
                fontSize: "0.875rem",
                fontWeight: 600,
                letterSpacing: 0
            },
            body1: {
                fontSize: "0.9375rem",
                lineHeight: 1.6,
                letterSpacing: 0
            },
            body2: {
                fontSize: "0.875rem",
                lineHeight: 1.55,
                letterSpacing: 0
            },
            button: {
                fontWeight: 600,
                textTransform: "none",
                letterSpacing: 0
            },
            caption: { letterSpacing: 0 },
            overline: { letterSpacing: 0 },
        },
        mixins: {
            ...source.mixins,
            toolbar: {
                minHeight: 56,
                "@media (min-width:600px)": { minHeight: 64 }
            },
        },
        props: {
            ...source.props,
            MuiButton: {
                disableElevation: true,
                ...(source.props && source.props.MuiButton)
            },
        },
    }, locale);

    return {
        ...theme,
        overrides: {
            ...theme.overrides,
            MuiCssBaseline: {
                "@global": {
                    body: {
                        backgroundColor: canvas,
                        color: text,
                        colorScheme: type
                    },
                    "button, input, select, textarea": { font: "inherit" },
                    "a:focus-visible, button:focus-visible, [tabindex]:focus-visible": {
                        outline: `2px solid ${accent}`,
                        outlineOffset: 3,
                    },
                    "::selection": { backgroundColor: fade(accent, 0.22) },
                },
            },
            MuiAppBar: {
                colorPrimary: {
                    backgroundColor: paper,
                    color: text
                },
                root: {
                    boxShadow: "none",
                    borderBottom: `1px solid ${border}`
                }
            },
            MuiPaper: {
                root: { backgroundImage: "none" },
                elevation1: {
                    boxShadow: "none",
                    border: `1px solid ${border}`
                },
                rounded: { borderRadius: 8 }
            },
            MuiDrawer: { paper: { backgroundColor: paper } },
            MuiButton: {
                root: {
                    borderRadius: 6,
                    minHeight: 36,
                    textTransform: "none",
                    padding: "7px 16px"
                },
                contained: {
                    boxShadow: "none",
                    "&:hover": { boxShadow: "none" }
                },
                outlined: { borderColor: border },
                sizeSmall: {
                    minHeight: 30,
                    padding: "4px 10px"
                },
                sizeLarge: { minHeight: 44 },
            },
            MuiIconButton: {
                root: { padding: 10 },
                sizeSmall: { padding: 6 }
            },
            MuiListItem: {
                root: {
                    paddingTop: 10,
                    paddingBottom: 10,
                    "&$selected, &$selected:hover": {
                        backgroundColor: theme.palette.action.selected,
                        color: accent
                    },
                    "&$selected .MuiListItemIcon-root": { color: accent }
                },
                dense: {
                    paddingTop: 6,
                    paddingBottom: 6
                },
            },
            MuiListItemIcon: {
                root: {
                    minWidth: 40,
                    color: muted
                }
            },
            MuiListItemText: {
                primary: { overflowWrap: "anywhere" },
                secondary: { overflowWrap: "anywhere" }
            },
            MuiTab: {
                root: {
                    textTransform: "none",
                    minHeight: 44,
                    fontWeight: 600
                }
            },
            MuiTabs: {
                root: { minHeight: 44 },
                indicator: {
                    height: 3,
                    borderRadius: 2
                }
            },
            MuiOutlinedInput: {
                root: {
                    borderRadius: 6,
                    backgroundColor: paper
                },
                notchedOutline: { borderColor: border },
                input: { padding: "15px 14px" }
            },
            MuiInput: { underline: { "&:before": { borderBottomColor: border } } },
            MuiFormLabel: { root: { color: muted } },
            MuiFormHelperText: { root: { lineHeight: 1.6 } },
            MuiTableCell: {
                root: {
                    borderBottom: `1px solid ${border}`,
                    padding: "13px 16px"
                },
                head: {
                    color: muted,
                    fontWeight: 600,
                    backgroundColor: canvas
                },
                stickyHeader: { backgroundColor: canvas },
                sizeSmall: { padding: "9px 12px" }
            },
            MuiTableRow: { root: { "&$hover:hover": { backgroundColor: theme.palette.action.hover } } },
            MuiDialog: {
                paper: {
                    borderRadius: 8,
                    boxShadow: "0 16px 56px rgba(0,0,0,.22)",
                    margin: 16
                },
                paperWidthSm: { width: "calc(100% - 32px)" }
            },
            MuiDialogTitle: { root: { padding: "20px 24px 12px" } },
            MuiDialogActions: {
                root: {
                    padding: "12px 24px 20px",
                    flexWrap: "wrap"
                }
            },
            MuiPopover: {
                paper: {
                    border: `1px solid ${border}`,
                    boxShadow: "0 8px 30px rgba(0,0,0,.14)"
                }
            },
            MuiTooltip: {
                tooltip: {
                    fontSize: "0.75rem",
                    borderRadius: 4
                }
            },
            MuiChip: {
                root: { borderRadius: 6 },
                colorPrimary: {
                    backgroundColor: theme.palette.action.selected,
                    color: accent
                }
            },
            MuiLinearProgress: {
                root: {
                    borderRadius: 4,
                    height: 5
                }
            },
            MuiExpansionPanel: {
                root: {
                    boxShadow: "none",
                    "&:before": { backgroundColor: border }
                }
            },
            MuiAccordion: {
                root: {
                    boxShadow: "none",
                    "&:before": { backgroundColor: border }
                }
            },
            MuiAlert: { root: { borderRadius: 6 } },
        },
    };
}

export function useAppTheme(locale) {
    const config = useSelector((state) => state.siteConfig.theme);
    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
    const [, refreshPreference] = useState(0);
    const preference = readThemePreference();
    useEffect(() => {
        const onStorage = (event) => {
            if (!event.key || event.key === "user_preference") refreshPreference((value) => value + 1);
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);
    const theme = useMemo(() => createAppTheme(config, prefersDarkMode, preference, locale), [config, prefersDarkMode, preference, locale]);
    useEffect(() => {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", theme.palette.background.paper);
    }, [theme]);
    return theme;
}
