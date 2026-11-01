import React, { useEffect } from "react";
import { Button, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel, Typography, makeStyles } from "@material-ui/core";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import SearchIcon from "@material-ui/icons/Search";
import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";
import { configure, GlobalHotKeys } from "react-hotkeys";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import classNames from "classnames";
import { changeContextMenu, openRemoveDialog, refreshFileList } from "../../redux/explorer";
import { changeSortMethod } from "../../redux/explorer/action";
import { isMac } from "../../utils";
import pathHelper from "../../utils/page";
import ContextMenu from "./ContextMenu";
import ImgPreview from "./ImgPreview";
import ObjectIcon from "./ObjectIcon";
import { useDirectoryView } from "./DirectoryView";

const useStyles = makeStyles((theme) => ({
    root: { padding: "16px 20px 24px", flex: 1, minHeight: 240, [theme.breakpoints.down("xs")]: { padding: "12px 12px 20px" } },
    list: { padding: 0, [theme.breakpoints.down("xs")]: { padding: 0 } },
    table: { tableLayout: "fixed", width: "100%", "& thead th": { color: theme.palette.text.secondary } },
    head: { backgroundColor: theme.palette.background.default, "& th": { fontSize: 12, fontWeight: 600, padding: "12px 16px" } },
    sizeColumn: { width: 120 },
    dateColumn: { width: 200 },
    actionColumn: { width: 100, [theme.breakpoints.down("xs")]: { width: 84 } },
    hideAuto: { [theme.breakpoints.down("sm")]: { display: "none" } },
    section: { marginBottom: 20, minWidth: 0 },
    typeHeader: { fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, marginBottom: 10 },
    grid: { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 200px), 1fr))" },
    compactGrid: { gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 290px), 1fr))" },
    empty: { minHeight: 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, textAlign: "center", padding: 24, color: theme.palette.text.secondary },
    emptyIcon: { fontSize: 48, color: theme.palette.text.disabled },
    error: { color: theme.palette.error.main },
    message: { maxWidth: 560, overflowWrap: "anywhere" },
}));

const keyMap = {
    DELETE_FILE: "del",
    SELECT_ALL_SHOWED: `${isMac() ? "command" : "ctrl"}+a`,
    SELECT_ALL: `${isMac() ? "command" : "ctrl"}+shift+a`,
    DESELECT_ALL: "esc",
};

export default function Explorer({ share }) {
    const classes = useStyles();
    const { t, i18n } = useTranslation("application", { keyPrefix: "fileManager" });
    const { pathname } = useLocation();
    const dispatch = useDispatch();
    const view = useDirectoryView();
    const selected = useSelector((state) => state.explorer.selected);
    const search = useSelector((state) => state.explorer.search);
    const loading = useSelector((state) => state.viewUpdate.navigatorLoading);
    const sort = useSelector((state) => state.viewUpdate.sortMethod);
    const error = useSelector((state) => state.viewUpdate.navigatorError);
    const errorMessage = useSelector((state) => state.viewUpdate.navigatorErrorMsg);
    const method = useSelector((state) => state.viewUpdate.explorerViewMethod);
    const home = pathHelper.isHomePage(pathname);
    const filtered = Boolean(view.query.trim());
    const chinese = i18n.language && i18n.language.startsWith("zh");

    useEffect(() => { configure({ ignoreTags: ["input", "select", "textarea"] }); }, []);
    const handlers = {
        DELETE_FILE: () => { if (selected.length && home && !loading && !error) dispatch(openRemoveDialog()); },
        SELECT_ALL_SHOWED: (event) => { event.preventDefault(); if (!loading && !error) view.selectAll(view.items); },
        SELECT_ALL: (event) => { event.preventDefault(); if (!loading && !error) view.selectAll(); },
        DESELECT_ALL: (event) => { event.preventDefault(); view.setSelection([]); },
    };
    const columns = [
        { label: "name", asc: "namePos", desc: "nameRev" },
        { label: "size", asc: "sizePos", desc: "sizeRes", className: classNames(classes.hideAuto, classes.sizeColumn) },
        { label: "lastModified", asc: "modifyTimePos", desc: "modifyTimeRev", className: classNames(classes.hideAuto, classes.dateColumn) },
    ];
    const group = (items, label, compact) => items.length > 0 && (
        <section className={classes.section} data-clickaway="true">
            <Typography component="h3" className={classes.typeHeader} data-clickaway="true">{t(label)} ({items.length})</Typography>
            <div className={classNames(classes.grid, { [classes.compactGrid]: compact })} data-clickaway="true">
                {items.map((file) => <ObjectIcon key={file.type + ":" + file.id} file={file} />)}
            </div>
        </section>
    );

    return (
        <div
            data-clickaway="true"
            className={classNames(classes.root, { [classes.list]: method === "list" })}
            onClick={(event) => { if (event.target.dataset.clickaway) view.setSelection([]); }}
            onContextMenu={(event) => {
                event.preventDefault();
                if (!search && home && !loading && !error) dispatch(changeContextMenu("empty", true));
            }}
        >
            <GlobalHotKeys handlers={handlers} allowChanges keyMap={keyMap} />
            <ContextMenu share={share} />
            <ImgPreview />
            {error ? (
                <div className={classes.empty} role="alert">
                    <ErrorOutlineIcon className={classes.error} />
                    <Typography variant="subtitle1">{t("listError")}</Typography>
                    <Typography variant="body2" className={classes.message}>{errorMessage && (errorMessage.message || String(errorMessage))}</Typography>
                    <Button color="primary" onClick={() => dispatch(refreshFileList())}>{t("refresh")}</Button>
                </div>
            ) : loading ? (
                <div className={classes.empty}><CircularProgress size={30} /></div>
            ) : !view.total ? (
                <div className={classes.empty} data-clickaway="true" role="status">
                    {filtered || search ? <SearchIcon className={classes.emptyIcon} /> : <FolderOpenIcon className={classes.emptyIcon} />}
                    <Typography variant="subtitle1">{filtered ? t("noFilterMatches", { defaultValue: chinese ? "\u6ca1\u6709\u5339\u914d\u7684\u6587\u4ef6\u6216\u6587\u4ef6\u5939" : "No matching files or folders" }) : home && !search ? t("dropFileHere") : t("nothingFound")}</Typography>
                    {filtered ? <Button color="primary" onClick={() => view.setQuery("")}>{t("clearFilter", { defaultValue: chinese ? "\u6e05\u9664\u7b5b\u9009" : "Clear filter" })}</Button>
                        : home && !search && <Typography variant="body2">{t("orClickUploadButton")}</Typography>}
                </div>
            ) : method === "list" ? (
                <Table size="small" className={classes.table}>
                    <TableHead className={classes.head}>
                        <TableRow>
                            {columns.map((column) => <TableCell key={column.label} className={column.className} sortDirection={sort === column.asc ? "asc" : sort === column.desc ? "desc" : false}>
                                <TableSortLabel active={sort === column.asc || sort === column.desc} direction={sort === column.desc ? "desc" : "asc"} onClick={() => dispatch(changeSortMethod(sort === column.asc ? column.desc : column.asc))}>{t(column.label)}</TableSortLabel>
                            </TableCell>)}
                            <TableCell align="right" className={classes.actionColumn}>{t("actions", { defaultValue: chinese ? "\u64cd\u4f5c" : "Actions" })}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>{view.items.map((file) => <ObjectIcon key={file.type + ":" + file.id} file={file} />)}</TableBody>
                </Table>
            ) : <>{group(view.dirList, "folders", true)}{group(view.fileList, "files", method === "smallIcon")}</>}
        </div>
    );
}
