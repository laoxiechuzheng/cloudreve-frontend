import React, { useState } from "react";
import { Avatar, IconButton, makeStyles, Menu, MenuItem, Tooltip } from "@material-ui/core";
import { useDispatch, useSelector } from "react-redux";
import { FormatPageBreak } from "mdi-material-ui";
import { useTranslation } from "react-i18next";
import { setShareUserPopover } from "../../../redux/explorer";
import { changeSortMethod } from "../../../redux/explorer/action";
import { changePageSize } from "../../../redux/viewUpdate/action";
import Sort from "../Sort";

const useStyles = makeStyles(() => ({
    root: { display: "inline-flex", alignItems: "center", gap: 2 },
    sideButton: { padding: 8, borderRadius: 8 },
    avatar: { height: 24, width: 24 },
}));

const paginationOptions = [50, 100, 200, 500, 1000, -1];

export default function SubActions({ isSmall, inherit }) {
    const { t } = useTranslation("application", { keyPrefix: "fileManager" });
    const classes = useStyles();
    const dispatch = useDispatch();
    const share = useSelector((state) => state.viewUpdate.shareInfo);
    const sort = useSelector((state) => state.viewUpdate.sortMethod);
    const pageSize = useSelector((state) => state.viewUpdate.pagination.size);
    const [anchor, setAnchor] = useState(null);
    return (
        <div className={classes.root}>
            <Tooltip title={t("paginationSize")}>
                <IconButton
                    aria-label={t("paginationSize")}
                    className={classes.sideButton}
                    onClick={(event) => setAnchor(event.currentTarget)}
                    color={inherit ? "inherit" : "default"}
                >
                    <FormatPageBreak fontSize={isSmall ? "small" : "default"} />
                </IconButton>
            </Tooltip>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
                {paginationOptions.map((option) => (
                    <MenuItem
                        key={option}
                        selected={option === pageSize}
                        onClick={() => { dispatch(changePageSize(option)); setAnchor(null); }}
                    >
                        {option === -1 ? t("noPagination") : t("paginationOption", { option })}
                    </MenuItem>
                ))}
            </Menu>
            <Sort value={sort} isSmall={isSmall} inherit={inherit} className={classes.sideButton} onChange={(value) => dispatch(changeSortMethod(value))} />
            {share && (
                <Tooltip title={t("shareCreateBy", { nick: share.creator.nick })}>
                    <IconButton
                        aria-label={t("shareCreateBy", { nick: share.creator.nick })}
                        className={classes.sideButton}
                        onClick={(event) => dispatch(setShareUserPopover(event.currentTarget))}
                    >
                        <Avatar className={classes.avatar} src={"/api/v3/user/avatar/" + share.creator.key + "/s"} />
                    </IconButton>
                </Tooltip>
            )}
        </div>
    );
}
