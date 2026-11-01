import React from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import { Typography, useMediaQuery } from "@material-ui/core";
import { useDispatch, useSelector } from "react-redux";
import { Pagination } from "@material-ui/lab";
import CustomPaginationItem from "./PaginationItem";
import { setPagination } from "../../redux/viewUpdate/action";
import { useDirectoryView } from "./DirectoryView";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
        backgroundColor: theme.palette.background.paper, borderTop: "1px solid " + theme.palette.divider,
        padding: "8px 16px", flexShrink: 0, minHeight: 48,
    },
    count: { color: theme.palette.text.secondary, fontVariantNumeric: "tabular-nums" },
}));

export default function PaginationFooter() {
    const classes = useStyles();
    const dispatch = useDispatch();
    const view = useDirectoryView();
    const pagination = useSelector((state) => state.viewUpdate.pagination);
    const loading = useSelector((state) => state.viewUpdate.navigatorLoading);
    const error = useSelector((state) => state.viewUpdate.navigatorError);
    const theme = useTheme();
    const mobile = useMediaQuery(theme.breakpoints.down("xs"));
    if (view.pageCount <= 1 || loading || error) return null;
    return (
        <div className={classes.root}>
            <Typography variant="caption" className={classes.count}>{view.startIndex + 1}-{view.endIndex} / {view.total}</Typography>
            <Pagination
                renderItem={(item) => <CustomPaginationItem count={view.pageCount} isMobile={mobile} {...item} />}
                color="primary"
                shape="rounded"
                size="small"
                count={view.pageCount}
                page={view.page}
                onChange={(event, page) => dispatch(setPagination({ ...pagination, page }))}
            />
        </div>
    );
}
