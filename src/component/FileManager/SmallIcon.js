import React from "react";
import { useSelector } from "react-redux";
import { ButtonBase, IconButton, Typography, fade, makeStyles } from "@material-ui/core";
import CheckCircleRounded from "@material-ui/icons/CheckCircleRounded";
import Folder from "@material-ui/icons/Folder";
import classNames from "classnames";
import { sizeToString } from "../../utils";
import TypeIcon from "./TypeIcon";
import FileName from "./FileName";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex", alignItems: "center", minWidth: 0, minHeight: 64,
        border: "1px solid " + theme.palette.divider, borderRadius: 8,
        backgroundColor: theme.palette.background.paper, padding: "4px 8px",
        "&:hover": { borderColor: theme.palette.text.disabled, backgroundColor: theme.palette.action.hover },
    },
    selected: { "&, &:hover": { backgroundColor: fade(theme.palette.primary.main, 0.1), borderColor: theme.palette.primary.main } },
    active: { outline: "2px solid " + theme.palette.primary.main, outlineOffset: -2 },
    selector: { padding: 8, color: theme.palette.text.secondary, flexShrink: 0 },
    checked: { color: theme.palette.primary.main },
    name: {
        display: "block", minWidth: 0, flex: 1, textAlign: "left", padding: "6px 4px", borderRadius: 4,
        "&:focus-visible": { outline: "2px solid " + theme.palette.primary.main },
    },
    title: { display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 },
    meta: { color: theme.palette.text.secondary, display: "block", marginTop: 2 },
}));

export default function SmallIcon({ file, isFolder, isActive, onIconClick, onOpen, actions }) {
    const classes = useStyles();
    const selected = useSelector((state) => state.explorer.selected);
    const isSelected = selected.includes(file);
    return (
        <div className={classNames(classes.root, { [classes.selected]: isSelected, [classes.active]: isActive })}>
            <IconButton
                className={classes.selector}
                aria-label={file.name}
                aria-pressed={isSelected}
                onClick={onIconClick}
                onDoubleClick={(event) => event.stopPropagation()}
                tabIndex={onIconClick ? 0 : -1}
            >
                {isSelected ? <CheckCircleRounded className={classes.checked} /> : isFolder ? <Folder /> : <TypeIcon fileName={file.name} />}
            </IconButton>
            <ButtonBase
                className={classes.name}
                title={file.name}
                tabIndex={onOpen ? 0 : -1}
                onKeyDown={(event) => {
                    if (event.key === "Enter" && onOpen) {
                        event.preventDefault();
                        event.stopPropagation();
                        onOpen();
                    }
                }}
            >
                <Typography component="span" variant="body2" className={classes.title}><FileName name={file.name} /></Typography>
                {!isFolder && <Typography component="span" variant="caption" className={classes.meta}>{sizeToString(file.size)}</Typography>}
            </ButtonBase>
            {actions}
        </div>
    );
}
