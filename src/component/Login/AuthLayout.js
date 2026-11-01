import React from "react";
import { makeStyles } from "@material-ui/core";

export const useAuthStyles = makeStyles((theme) => ({
    paper: {
        display: "flex", flexDirection: "column", alignItems: "flex-start",
        backgroundColor: "transparent", border: 0, boxShadow: "none", padding: 0,
        "& h1": { overflowWrap: "anywhere" },
        "& > .MuiDivider-root": { width: "100%", marginTop: 24 },
    },
    avatar: {
        width: 40, height: 40, borderRadius: 8, marginBottom: 16,
        backgroundColor: theme.palette.action.selected, color: theme.palette.primary.main,
    },
    avatarSuccess: {
        width: 40, height: 40, borderRadius: 8, marginBottom: 16,
        backgroundColor: theme.palette.action.selected, color: theme.palette.success.main,
    },
    form: { width: "100%", marginTop: 16 },
    submit: { marginTop: 20, minHeight: 44 },
    link: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, width: "100%", marginTop: 20, fontSize: "0.875rem" },
    authnLink: { marginTop: 24, "& .MuiButton-root": { width: "100%", minHeight: 44 } },
}));

const useStyles = makeStyles((theme) => ({
    layout: {
        width: "100%", maxWidth: 440, margin: "0 auto", padding: theme.spacing(6, 3, 8),
        [theme.breakpoints.down("xs")]: { padding: theme.spacing(4, 3, 6) },
    },
}));

export default function AuthLayout({ children }) {
    const classes = useStyles();
    return <section className={classes.layout}>{children}</section>;
}
