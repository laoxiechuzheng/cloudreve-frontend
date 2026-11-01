import React, { useState } from "react";
import { ButtonBase, IconButton, Typography, fade, makeStyles } from "@material-ui/core";
import CheckCircleRoundedIcon from "@material-ui/icons/CheckCircleRounded";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useSelector } from "react-redux";
import { useLocation } from "react-router";
import classNames from "classnames";
import { baseURL } from "../../middleware/Api";
import { sizeToString } from "../../utils";
import pathHelper from "../../utils/page";
import TypeIcon from "./TypeIcon";
import FileName from "./FileName";

const useStyles = makeStyles((theme) => ({
    root: {
        border: "1px solid " + theme.palette.divider, borderRadius: 8, overflow: "hidden", minWidth: 0,
        backgroundColor: theme.palette.background.paper,
        "&:hover": { borderColor: theme.palette.text.disabled },
    },
    selected: { "&, &:hover": { backgroundColor: fade(theme.palette.primary.main, 0.08), borderColor: theme.palette.primary.main } },
    preview: {
        width: "100%", height: 144, display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: theme.palette.background.default, borderBottom: "1px solid " + theme.palette.divider,
        "&:focus-visible": { outline: "2px solid " + theme.palette.primary.main, outlineOffset: -3 },
    },
    image: { width: "100%", height: "100%", objectFit: "contain", userSelect: "none" },
    iconBig: { fontSize: 52 },
    info: { display: "flex", alignItems: "center", padding: "8px 10px", minWidth: 0, gap: 6 },
    selector: { color: theme.palette.text.secondary, padding: 8, flexShrink: 0 },
    checked: { color: theme.palette.primary.main },
    name: { minWidth: 0, flex: 1 },
    title: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 },
    meta: { color: theme.palette.text.secondary, fontVariantNumeric: "tabular-nums" },
    footer: { padding: "0 12px 10px", display: "flex", justifyContent: "flex-end", minHeight: 36 },
}));

export default function FileIcon({ file, onIconClick, onOpen, actions }) {
    const classes = useStyles();
    const selected = useSelector((state) => state.explorer.selected);
    const shareInfo = useSelector((state) => state.viewUpdate.shareInfo);
    const location = useLocation();
    const [failedThumbnail, setFailedThumbnail] = useState(null);
    const isSelected = selected.includes(file);
    const thumbnail = baseURL + (pathHelper.isSharePage(location.pathname) && shareInfo
        ? "/share/thumb/" + shareInfo.key + "/" + file.id + "?path=" + encodeURIComponent(file.path)
        : "/file/thumb/" + file.id);
    return (
        <div className={classNames(classes.root, { [classes.selected]: isSelected })}>
            <ButtonBase
                className={classes.preview}
                aria-label={file.name}
                tabIndex={onOpen ? 0 : -1}
                onKeyDown={(event) => {
                    if (event.key === "Enter" && onOpen) {
                        event.preventDefault();
                        event.stopPropagation();
                        onOpen();
                    }
                }}
            >
                {file.thumb && failedThumbnail !== thumbnail ? (
                    <LazyLoadImage
                        src={thumbnail}
                        alt={file.name}
                        className={classes.image}
                        draggable={false}
                        onError={() => setFailedThumbnail(thumbnail)}
                    />
                ) : <TypeIcon className={classes.iconBig} fileName={file.name} />}
            </ButtonBase>
            <div className={classes.info}>
                <IconButton
                    className={classes.selector}
                    aria-label={file.name}
                    aria-pressed={isSelected}
                    tabIndex={onIconClick ? 0 : -1}
                    onClick={onIconClick}
                    onDoubleClick={(event) => event.stopPropagation()}
                >
                    {isSelected ? <CheckCircleRoundedIcon className={classes.checked} /> : <TypeIcon fileName={file.name} />}
                </IconButton>
                <div className={classes.name} title={file.name}>
                    <Typography variant="body2" className={classes.title}><FileName name={file.name} /></Typography>
                    <Typography variant="caption" className={classes.meta}>{sizeToString(file.size)}</Typography>
                </div>
            </div>
            {actions && <div className={classes.footer}>{actions}</div>}
        </div>
    );
}
