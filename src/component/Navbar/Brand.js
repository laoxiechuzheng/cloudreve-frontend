import React from "react";
import { makeStyles, Typography } from "@material-ui/core";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "inline-flex", alignItems: "center", minWidth: 0,
        color: theme.palette.text.primary, textDecoration: "none",
    },
    logo: { width: 32, height: 32, objectFit: "contain", flexShrink: 0, marginRight: 10 },
    name: { fontWeight: 650, minWidth: 0, maxWidth: 220 },
}));

export default function Brand({ className, to = "/" }) {
    const classes = useStyles();
    const title = useSelector((state) => state.siteConfig.title) || "Cloudreve";
    return (
        <Link to={to} className={`${classes.root} ${className || ""}`} title={title}>
            <img className={classes.logo} src="/static/img/cloudreve.svg" alt="" />
            <Typography component="span" variant="h6" className={classes.name} noWrap>{title}</Typography>
        </Link>
    );
}
