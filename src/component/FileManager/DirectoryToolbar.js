import React from "react";
import { Button, Checkbox, IconButton, InputAdornment, TextField, Tooltip, Typography, makeStyles } from "@material-ui/core";
import { ToggleButton, ToggleButtonGroup } from "@material-ui/lab";
import SearchIcon from "@material-ui/icons/Search";
import CloseIcon from "@material-ui/icons/Close";
import RefreshIcon from "@material-ui/icons/Refresh";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import CreateNewFolderIcon from "@material-ui/icons/CreateNewFolder";
import GetAppIcon from "@material-ui/icons/GetApp";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import ViewListIcon from "@material-ui/icons/ViewList";
import ViewModuleIcon from "@material-ui/icons/ViewModule";
import ViewComfyIcon from "@material-ui/icons/ViewComfy";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import Auth from "../../middleware/Auth";
import pathHelper from "../../utils/page";
import { changeViewMethod, navigateUp, openCreateFolderDialog, refreshFileList } from "../../redux/explorer";
import { startBatchDownload } from "../../redux/explorer/action";
import { openFileSelector } from "../../redux/viewUpdate/action";
import { useDirectoryView } from "./DirectoryView";

const useStyles = makeStyles((theme) => ({
    root: { padding: "12px 20px", backgroundColor: theme.palette.background.paper, borderBottom: "1px solid " + theme.palette.divider, flexShrink: 0 },
    summary: { display: "flex", alignItems: "center", gap: 8, minHeight: 32, marginBottom: 10, minWidth: 0 },
    heading: { minWidth: 0, fontSize: 16, fontWeight: 600, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" },
    count: { color: theme.palette.text.secondary, whiteSpace: "nowrap", marginLeft: "auto", fontVariantNumeric: "tabular-nums" },
    controls: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 },
    filter: { flex: "1 1 220px", minWidth: 160, "& .MuiOutlinedInput-root": { borderRadius: 8, backgroundColor: theme.palette.background.default } },
    tools: { display: "flex", alignItems: "center", gap: 4, flexShrink: 0 },
    views: { marginLeft: "auto", height: 36, "& .MuiToggleButton-root": { padding: "6px 9px" } },
    icon: { padding: 8, borderRadius: 8 },
    checkbox: { padding: 4 },
    upload: { borderRadius: 8, boxShadow: "none", whiteSpace: "nowrap" },
    mobileParent: { [theme.breakpoints.up("sm")]: { display: "none" } },
    searchIcon: { color: theme.palette.text.secondary },
    [theme.breakpoints.down("xs")]: {
        root: { padding: "10px 12px" },
        filter: { flexBasis: "100%" },
        heading: { fontSize: 15 },
        count: { fontSize: 11 },
    },
}));

export default function DirectoryToolbar({ share }) {
    const classes = useStyles();
    const dispatch = useDispatch();
    const view = useDirectoryView();
    const { pathname } = useLocation();
    const { t, i18n } = useTranslation("application", { keyPrefix: "fileManager" });
    const chinese = i18n.language && i18n.language.startsWith("zh");
    const path = useSelector((state) => state.navigator.path);
    const search = useSelector((state) => state.explorer.search);
    const selected = useSelector((state) => state.explorer.selected);
    const loading = useSelector((state) => state.viewUpdate.navigatorLoading);
    const error = useSelector((state) => state.viewUpdate.navigatorError);
    const method = useSelector((state) => state.viewUpdate.explorerViewMethod);
    const canCreate = pathHelper.isHomePage(pathname) && !search;
    const disabled = loading || error;
    const selectedOnPage = view.items.filter((file) => selected.includes(file)).length;
    const filterLabel = t(search ? "filterLoadedResults" : "filterCurrentDirectory", {
        defaultValue: search ? (chinese ? "\u7b5b\u9009\u5f53\u524d\u7ed3\u679c" : "Filter loaded results") : (chinese ? "\u7b5b\u9009\u5f53\u524d\u6587\u4ef6\u5939" : "Filter this folder"),
    });
    const clearLabel = t("clearFilter", { defaultValue: chinese ? "\u6e05\u9664\u7b5b\u9009" : "Clear filter" });
    const count = selected.length ? t("selectedCount", { count: selected.length, defaultValue: chinese ? "\u5df2\u9009 {{count}} \u9879" : "{{count}} selected" })
        : view.query.trim() ? t("matchCount", { count: view.total, total: view.loadedTotal, defaultValue: chinese ? "{{count}} / {{total}} \u9879" : "{{count}} of {{total}} items" })
        : t("itemCount", { count: view.loadedTotal, defaultValue: chinese ? "{{count}} \u9879" : "{{count}} items" });
    const batchDownload = () => {
        const targets = selected.length ? selected : view.all;
        if (!targets.length || disabled) return;
        view.setSelection(targets);
        dispatch(startBatchDownload(share));
    };
    return (
        <div className={classes.root}>
            <div className={classes.summary}>
                <Checkbox
                    className={classes.checkbox}
                    color="primary"
                    checked={view.items.length > 0 && selectedOnPage === view.items.length}
                    indeterminate={selectedOnPage > 0 && selectedOnPage < view.items.length}
                    disabled={disabled || !view.items.length}
                    onChange={() => view.selectAll(view.items)}
                    inputProps={{ "aria-label": t("selectPage", { defaultValue: chinese ? "\u9009\u62e9\u5f53\u524d\u9875" : "Select current page" }) }}
                />
                {path !== "/" && <Tooltip title={t("backToParentFolder")}><IconButton className={classes.mobileParent} size="small" aria-label={t("backToParentFolder")} onClick={() => dispatch(navigateUp())}><ArrowUpwardIcon fontSize="small" /></IconButton></Tooltip>}
                <Typography component="h2" className={classes.heading} title={path}>{path === "/" ? t("files") : path.split("/").pop()}</Typography>
                {!disabled && <Typography component="span" variant="caption" className={classes.count} aria-live="polite">{count}</Typography>}
            </div>
            <div className={classes.controls}>
                <TextField
                    className={classes.filter}
                    variant="outlined"
                    size="small"
                    value={view.query}
                    placeholder={filterLabel}
                    disabled={disabled}
                    onChange={(event) => view.setQuery(event.target.value)}
                    onKeyDown={(event) => {
                        event.stopPropagation();
                        if (event.key === "Escape") view.setQuery("");
                    }}
                    inputProps={{ "aria-label": filterLabel }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" className={classes.searchIcon} /></InputAdornment>,
                        endAdornment: view.query && <InputAdornment position="end"><IconButton size="small" aria-label={clearLabel} title={clearLabel} onClick={() => view.setQuery("")}><CloseIcon fontSize="small" /></IconButton></InputAdornment>,
                    }}
                />
                <div className={classes.tools}>
                    {canCreate && <Button className={classes.upload} variant="contained" color="primary" size="small" startIcon={<CloudUploadIcon />} disabled={disabled} onClick={() => dispatch(openFileSelector())}>{t("uploadFiles")}</Button>}
                    {canCreate && <Tooltip title={t("newFolder")}><span><IconButton className={classes.icon} aria-label={t("newFolder")} disabled={disabled} onClick={() => dispatch(openCreateFolderDialog())}><CreateNewFolderIcon fontSize="small" /></IconButton></span></Tooltip>}
                    <Tooltip title={t("batchDownload")}><span><IconButton className={classes.icon} aria-label={t("batchDownload")} disabled={disabled || !view.total} onClick={batchDownload}><GetAppIcon fontSize="small" /></IconButton></span></Tooltip>
                    <Tooltip title={t("refresh")}><span><IconButton className={classes.icon} aria-label={t("refresh")} disabled={loading} onClick={() => dispatch(refreshFileList())}><RefreshIcon fontSize="small" /></IconButton></span></Tooltip>
                </div>
                <ToggleButtonGroup className={classes.views} size="small" exclusive value={method} aria-label={t("listView")} onChange={(event, value) => {
                    if (value) { Auth.SetPreference("view_method", value); dispatch(changeViewMethod(value)); }
                }}>
                    <ToggleButton value="list" aria-label={t("listView")} title={t("listView")}><ViewListIcon fontSize="small" /></ToggleButton>
                    <ToggleButton value="smallIcon" aria-label={t("gridViewSmall")} title={t("gridViewSmall")}><ViewComfyIcon fontSize="small" /></ToggleButton>
                    <ToggleButton value="icon" aria-label={t("gridViewLarge")} title={t("gridViewLarge")}><ViewModuleIcon fontSize="small" /></ToggleButton>
                </ToggleButtonGroup>
            </div>
        </div>
    );
}
