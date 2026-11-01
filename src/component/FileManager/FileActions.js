import React from "react";
import { Button, IconButton, Tooltip, makeStyles } from "@material-ui/core";
import GetApp from "@material-ui/icons/GetApp";
import FolderOpen from "@material-ui/icons/FolderOpen";
import Share from "@material-ui/icons/Share";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import Auth from "../../middleware/Auth";
import pathHelper from "../../utils/page";

const useStyles = makeStyles((theme) => ({
    root: { display: "inline-flex", alignItems: "center", flexShrink: 0, gap: 2 },
    button: { padding: 8, borderRadius: 8 },
    download: { minWidth: 0, borderRadius: 8, padding: "4px 10px", fontWeight: 500 },
}));

export default function FileActions({ file, onDownload, onShare, onOpen, compact = true }) {
    const classes = useStyles();
    const { pathname } = useLocation();
    const { t } = useTranslation("application", { keyPrefix: "fileManager" });
    const user = Auth.GetUser();
    const canShare = pathHelper.isHomePage(pathname) && user && !user.anonymous && user.group && user.group.allowShare;
    const stop = (event) => event.stopPropagation();
    const run = (action) => (event) => { event.stopPropagation(); action(); };
    if (file.type !== "file" && file.type !== "dir") return null;
    return (
        <div className={classes.root} onClick={stop} onDoubleClick={stop} onMouseDown={stop} onPointerDown={stop} onKeyDown={stop} onContextMenu={stop} draggable={false} onDragStart={(event) => { event.preventDefault(); event.stopPropagation(); }}>
            {file.type === "file" && (compact ? (
                <Tooltip title={t("download")}>
                    <IconButton className={classes.button} color="primary" aria-label={t("download")} onClick={run(onDownload)}><GetApp fontSize="small" /></IconButton>
                </Tooltip>
            ) : (
                <Button className={classes.download} variant="outlined" color="primary" size="small" aria-label={t("download")} startIcon={<GetApp fontSize="small" />} onClick={run(onDownload)}>{t("download")}</Button>
            ))}
            {file.type === "dir" && (
                <Tooltip title={t("enter")}>
                    <IconButton className={classes.button} color="primary" aria-label={t("enter")} onClick={run(onOpen)}><FolderOpen fontSize="small" /></IconButton>
                </Tooltip>
            )}
            {canShare && (
                <Tooltip title={t("share")}>
                    <IconButton className={classes.button} aria-label={t("share")} onClick={run(onShare)}><Share fontSize="small" /></IconButton>
                </Tooltip>
            )}
        </div>
    );
}
