import React, { useEffect, useState } from "react";
import {
    AppBar, Collapse, Divider, Drawer, IconButton, List, ListItem, ListItemIcon, ListItemText, makeStyles, Toolbar, Tooltip, Typography, useMediaQuery, useTheme
} from "@material-ui/core";
import {
    Assignment, Category, CloudDownload, Contacts, Group, Home, Image, InsertDriveFile, Language, ListAlt, Mail, Palette, Person, Settings, SettingsEthernet, Share, Storage, Contactless, ExpandLess, ExpandMore, Close, Menu
} from "@material-ui/icons";
import { useDispatch } from "react-redux";
import { useHistory, useLocation } from "react-router";
import { useRouteMatch } from "react-router-dom";
import { changeSubTitle } from "../../redux/viewUpdate/action";
import Brand from "../Navbar/Brand";
import UserAvatar from "../Navbar/UserAvatar";
import { useTranslation } from "react-i18next";

const drawerWidth = 240;
const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
        width: "100%",
        minHeight: "100vh"
    },
    appBar: {
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary
    },
    header: {
        gap: 12,
        "& .MuiIconButton-root": {
            width: 40,
            height: 40,
            flexShrink: 0
        }
    },
    brand: {
        flexShrink: 1,
        minWidth: 0
    },
    title: {
        color: theme.palette.text.secondary,
        paddingLeft: 20,
        borderLeft: "1px solid " + theme.palette.divider,
        [theme.breakpoints.down("sm")]: { display: "none" }
    },
    grow: { flex: 1 },
    drawerPaper: {
        width: drawerWidth,
        maxWidth: "calc(100vw - 48px)",
        [theme.breakpoints.up("md")]: {
            top: 64,
            height: "calc(100% - 64px)"
        },
    },
    drawerHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px"
    },
    navigation: {
        padding: "16px 12px",
        "& .MuiListItem-root": {
            borderRadius: 6,
            marginBottom: 3,
            minHeight: 42
        },
        "& .MuiListItemText-primary": { fontSize: "0.875rem" },
        "& .MuiSvgIcon-root": { fontSize: 21 }
    },
    subMenu: { padding: "2px 0 8px 16px" },
    active: { "& .MuiListItemText-primary": { fontWeight: 600 } },
    content: {
        flex: 1,
        minWidth: 0,
        padding: theme.spacing(3),
        [theme.breakpoints.down("sm")]: { padding: theme.spacing(2) }
    },
    toolbar: theme.mixins.toolbar,
}));

const items = [
    {
        title: "nav.summary",
        icon: <Home />,
        path: "home",
    },
    {
        title: "nav.settings",
        icon: <Settings />,
        sub: [
            {
                title: "nav.basicSetting",
                path: "basic",
                icon: <Language />,
            },
            {
                title: "nav.publicAccess",
                path: "access",
                icon: <Contacts />,
            },
            {
                title: "nav.email",
                path: "mail",
                icon: <Mail />,
            },
            {
                title: "nav.transportation",
                path: "upload",
                icon: <SettingsEthernet />,
            },
            {
                title: "nav.appearance",
                path: "theme",
                icon: <Palette />,
            },
            {
                title: "nav.image",
                path: "image",
                icon: <Image />,
            },
            {
                title: "nav.captcha",
                path: "captcha",
                icon: <Category />,
            },
        ],
    },
    {
        title: "nav.storagePolicy",
        icon: <Storage />,
        path: "policy",
    },
    {
        title: "nav.nodes",
        icon: <Contactless />,
        path: "node",
    },
    {
        title: "nav.groups",
        icon: <Group />,
        path: "group",
    },
    {
        title: "nav.users",
        icon: <Person />,
        path: "user",
    },
    {
        title: "nav.files",
        icon: <InsertDriveFile />,
        path: "file",
    },
    {
        title: "nav.shares",
        icon: <Share />,
        path: "share",
    },
    {
        title: "nav.tasks",
        icon: <Assignment />,
        sub: [
            {
                title: "nav.remoteDownload",
                path: "download",
                icon: <CloudDownload />,
            },
            {
                title: "nav.generalTasks",
                path: "task",
                icon: <ListAlt />,
            },
        ],
    },
];


export default function Dashboard({ content }) {
    const { t } = useTranslation("dashboard");
    const classes = useStyles();
    const theme = useTheme();
    const desktop = useMediaQuery(theme.breakpoints.up("md"));
    const [desktopOpen, setDesktopOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(null);
    const history = useHistory();
    const location = useLocation();
    const dispatch = useDispatch();
    const { path } = useRouteMatch();
    const isActive = (route) => location.pathname === "/admin/" + route || location.pathname.startsWith("/admin/" + route + "/");

    useEffect(() => {
        dispatch(changeSubTitle(t("nav.title")));
        return () => dispatch(changeSubTitle());
    }, [dispatch, t]);

    useEffect(() => {
        setMobileOpen(false);
        const parent = items.find((item) => item.sub && item.sub.some((sub) => isActive(sub.path)));
        setMenuOpen(parent ? parent.title : null);
    }, [location.pathname]);

    const navigate = (route) => {
        history.push("/admin/" + route);
        setMobileOpen(false);
    };
    const routeItem = (item) => (
        <ListItem
            key={item.title}
            button
            selected={isActive(item.path)}
            aria-current={isActive(item.path) ? "page" : undefined}
            className={isActive(item.path) ? classes.active : undefined}
            onClick={() => navigate(item.path)}
        >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={t(item.title)} />
        </ListItem>
    );

    return (
        <div className={classes.root}>
            <AppBar
                position="fixed"
                className={classes.appBar}
                color="default"
            >
                <Toolbar className={classes.header}>
                    <Tooltip title={t("nav.title")}>
                        <IconButton
                            color="inherit"
                            edge="start"
                            aria-label={t("nav.title")}
                            aria-expanded={desktop ? desktopOpen : mobileOpen}
                            aria-controls="admin-navigation"
                            onClick={() => desktop ? setDesktopOpen(!desktopOpen) : setMobileOpen(!mobileOpen)}
                        ><Menu /></IconButton>
                    </Tooltip>
                    <Brand
                        className={classes.brand}
                        to="/admin/home"
                    />
                    <Typography
                        variant="body2"
                        className={classes.title}
                    >{t("nav.title")}</Typography>
                    <div className={classes.grow} />
                    <UserAvatar />
                </Toolbar>
            </AppBar>
            <Drawer
                variant={desktop ? "persistent" : "temporary"}
                open={desktop ? desktopOpen : mobileOpen}
                onClose={() => setMobileOpen(false)}
                style={{
                    width: desktop && desktopOpen ? drawerWidth : 0,
                    flexShrink: 0
                }}
                classes={{ paper: classes.drawerPaper }}
                ModalProps={{ keepMounted: true }}
            >
                {!desktop && <><div className={classes.drawerHeader}><Brand to="/admin/home" /><IconButton
                    aria-label={t("close", { ns: "common" })}
                    onClick={() => setMobileOpen(false)}
                ><Close /></IconButton></div><Divider /></>}
                <List
                    component="nav"
                    id="admin-navigation"
                    aria-label={t("nav.title")}
                    className={classes.navigation}
                >
                    {items.map((item) => item.path ? routeItem(item) : (
                        <React.Fragment key={item.title}>
                            <ListItem
                                button
                                onClick={() => setMenuOpen(menuOpen === item.title ? null : item.title)}
                                aria-expanded={menuOpen === item.title}
                                aria-controls={"admin-group-" + item.title}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon><ListItemText primary={t(item.title)} />
                                {menuOpen === item.title ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                            </ListItem>
                            <Collapse
                                in={menuOpen === item.title}
                                timeout="auto"
                            >
                                <List
                                    dense
                                    id={"admin-group-" + item.title}
                                    className={classes.subMenu}
                                >{item.sub.map(routeItem)}</List>
                            </Collapse>
                        </React.Fragment>
                    ))}
                </List>
            </Drawer>
            <main className={classes.content}><div className={classes.toolbar} />{content(path)}</main>
        </div>
    );
}
