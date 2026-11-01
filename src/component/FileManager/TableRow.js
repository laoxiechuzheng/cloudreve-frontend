import React from "react";
import { useSelector } from "react-redux";
import { ButtonBase, IconButton, TableCell, TableRow, Typography, fade, makeStyles } from "@material-ui/core";
import FolderIcon from "@material-ui/icons/Folder";
import KeyboardReturnIcon from "@material-ui/icons/KeyboardReturn";
import CheckCircleRoundedIcon from "@material-ui/icons/CheckCircleRounded";
import classNames from "classnames";
import { sizeToString } from "../../utils";
import { formatLocalTime } from "../../utils/datetime";
import TypeIcon from "./TypeIcon";
import FileName from "./FileName";

const useStyles = makeStyles((theme) => ({
    row: {
        backgroundColor: theme.palette.background.paper,
        "&:hover": { backgroundColor: theme.palette.action.hover },
        "&$selected, &$selected:hover": { backgroundColor: fade(theme.palette.primary.main, 0.1) },
    },
    selected: {},
    active: { outline: "2px solid " + theme.palette.primary.main, outlineOffset: -2 },
    cell: { padding: "8px 16px", borderBottomColor: theme.palette.divider },
    nameCell: { minWidth: 0, paddingLeft: 12, paddingRight: 8 },
    name: { display: "flex", alignItems: "center", minWidth: 0, gap: 10 },
    selector: { padding: 8, flexShrink: 0, color: theme.palette.text.secondary },
    checked: { color: theme.palette.primary.main },
    nameButton: {
        minWidth: 0, display: "block", textAlign: "left", borderRadius: 4,
        "&:focus-visible": { outline: "2px solid " + theme.palette.primary.main },
    },
    text: { display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 },
    meta: { color: theme.palette.text.secondary, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" },
    hideAuto: { [theme.breakpoints.down("sm")]: { display: "none" } },
    actions: {
        width: 100, padding: "4px 12px 4px 0",
        [theme.breakpoints.down("xs")]: { width: 84, paddingRight: 4 },
    },
}));

export default function TableItem(props) {
    const { file, actions, onOpen } = props;
    const classes = useStyles();
    const selected = useSelector((state) => state.explorer.selected);
    const isSelected = selected.includes(file);
    const icon = file.type === "dir" ? <FolderIcon /> : file.type === "up" ? <KeyboardReturnIcon /> : <TypeIcon fileName={file.name} />;
    return (
        <TableRow
            ref={props.pref}
            aria-selected={isSelected}
            onContextMenu={props.contextMenu}
            onClick={props.handleClick}
            onDoubleClick={props.handleDoubleClick}
            className={classNames(classes.row, props.className, {
                [classes.selected]: isSelected,
                [classes.active]: props.isActive,
            })}
        >
            <TableCell ref={props.dref} component="th" scope="row" className={classNames(classes.cell, classes.nameCell)}>
                <div className={classes.name}>
                    <IconButton
                        className={classes.selector}
                        aria-label={file.name}
                        aria-pressed={isSelected}
                        onClick={file.type === "up" ? props.handleClick : props.onIconClick}
                        onDoubleClick={(event) => event.stopPropagation()}
                    >
                        {isSelected ? <CheckCircleRoundedIcon className={classes.checked} /> : icon}
                    </IconButton>
                    <ButtonBase
                        className={classes.nameButton}
                        title={file.name}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" && onOpen) {
                                event.preventDefault();
                                event.stopPropagation();
                                onOpen();
                            }
                        }}
                    >
                        <Typography component="span" variant="body2" className={classes.text}>
                            <FileName name={file.name} />
                        </Typography>
                    </ButtonBase>
                </div>
            </TableCell>
            <TableCell className={classNames(classes.cell, classes.meta, classes.hideAuto)}>
                {file.type === "file" ? sizeToString(file.size) : "-"}
            </TableCell>
            <TableCell className={classNames(classes.cell, classes.meta, classes.hideAuto)}>
                {file.date ? formatLocalTime(file.date) : "-"}
            </TableCell>
            <TableCell align="right" className={classNames(classes.cell, classes.actions)}>{actions}</TableCell>
        </TableRow>
    );
}
