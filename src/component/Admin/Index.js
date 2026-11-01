import React, { useCallback, useEffect, useState } from "react";
import { Avatar, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Grid, List, ListItem, ListItemAvatar, ListItemIcon, ListItemText, Paper, Typography, makeStyles, useTheme } from "@material-ui/core";
import { Description, Favorite, FileCopy, Forum, GitHub, Home, Launch, Lock, People, Public, Telegram } from "@material-ui/icons";
import { Alert, Skeleton } from "@material-ui/lab";
import { fade } from "@material-ui/core/styles";
import { Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { useDispatch } from "react-redux";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import TimeAgo from "timeago-react";
import { toggleSnackbar } from "../../redux/explorer";
import API from "../../middleware/Api";
import { Trans, useTranslation } from "react-i18next";

const useStyles = makeStyles((theme) => ({
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" },
    metrics: { marginBottom: 28 },
    metric: { display: "flex", alignItems: "center", padding: 20, gap: 14, height: "100%", textDecoration: "none", color: "inherit", "&:hover": { borderColor: theme.palette.primary.main }, [theme.breakpoints.down("xs")]: { padding: 14, flexDirection: "column", alignItems: "flex-start", gap: 10 } },
    metricBody: { minWidth: 0, flex: 1 },
    metricValue: { fontSize: "1.625rem", fontWeight: 650, lineHeight: 1.3, fontVariantNumeric: "tabular-nums", overflowWrap: "anywhere" },
    metricIcon: { width: 40, height: 40, borderRadius: 8 },
    section: { borderTop: "1px solid " + theme.palette.divider, paddingTop: 24, paddingBottom: 24 },
    sectionTitle: { marginBottom: 16 },
    chart: { width: "100%", height: 290, minWidth: 0, marginTop: 16 },
    resource: { minWidth: 0 },
    resourceList: { "& .MuiListItem-root": { borderRadius: 6 }, "& .MuiListItemText-root": { minWidth: 0 } },
    version: { color: theme.palette.text.secondary, fontSize: "0.8125rem" },
    news: { padding: 0, "& .MuiListItem-root": { paddingLeft: 0, paddingRight: 0 }, "& .MuiListItemText-primary": { fontWeight: 500 }, "& .MuiListItemAvatar-root": { minWidth: 48 } },
    author: { width: 32, height: 32 },
    linkIcon: { color: theme.palette.text.secondary, fontSize: 16, marginLeft: 8 },
}));

export default function Index() {
    const { t } = useTranslation("dashboard");
    const classes = useStyles();
    const theme = useTheme();
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [summaryError, setSummaryError] = useState("");
    const [newsLoading, setNewsLoading] = useState(true);
    const [newsError, setNewsError] = useState(false);
    const [lineData, setLineData] = useState([]);
    const [news, setNews] = useState([]);
    const [newsUsers, setNewsUsers] = useState({});
    const [open, setOpen] = React.useState(false);
    const [siteURL, setSiteURL] = React.useState("");
    const [statistics, setStatistics] = useState({
        fileTotal: 0,
        userTotal: 0,
        publicShareTotal: 0,
        secretShareTotal: 0,
    });
    const [version, setVersion] = useState({
        backend: "-",
    });

    const dispatch = useDispatch();
    const ToggleSnackbar = useCallback(
        (vertical, horizontal, msg, color) =>
            dispatch(toggleSnackbar(vertical, horizontal, msg, color)),
        [dispatch]
    );

    const ResetSiteURL = () => {
        setOpen(false);
        API.patch("/admin/setting", {
            options: [
                {
                    key: "siteURL",
                    value: window.location.origin,
                },
            ],
        })
            .then(() => {
                setSiteURL(window.location.origin);
                ToggleSnackbar("top", "right", t("settings.saved"), "success");
            })
            .catch((error) => {
                ToggleSnackbar("top", "right", error.message, "error");
            });
    };

    useEffect(() => {
        API.get("/admin/summary")
            .then((response) => {
                const data = [];
                response.data.date.forEach((v, k) => {
                    data.push({
                        name: v,
                        file: response.data.files[k],
                        user: response.data.users[k],
                        share: response.data.shares[k],
                    });
                });
                setLineData(data);
                setStatistics({
                    fileTotal: response.data.fileTotal,
                    userTotal: response.data.userTotal,
                    publicShareTotal: response.data.publicShareTotal,
                    secretShareTotal: response.data.secretShareTotal,
                });
                setVersion(response.data.version);
                setSiteURL(response.data.siteURL);
                if (
                    response.data.siteURL === "" ||
                    response.data.siteURL !== window.location.origin
                ) {
                    setOpen(true);
                }
            })
            .catch((error) => {
                setSummaryError(error.message);
                ToggleSnackbar("top", "right", error.message, "error");
            })
            .finally(() => setSummaryLoading(false));

        axios
            .get("/api/v3/admin/news?tag=" + t("summary.newsTag"))
            .then((response) => {
                setNews(response.data.data);
                const res = {};
                response.data.included.forEach((v) => {
                    if (v.type === "users") {
                        res[v.id] = v.attributes;
                    }
                });
                setNewsUsers(res);
            })
            .catch((error) => {
                setNewsError(true);
            })
            .finally(() => setNewsLoading(false));
    }, []);


    const metrics = [
        { key: "userTotal", label: "summary.totalUsers", icon: <People />, color: theme.palette.primary.main, to: "/admin/user" },
        { key: "fileTotal", label: "summary.totalFiles", icon: <FileCopy />, color: theme.palette.warning.main, to: "/admin/file" },
        { key: "publicShareTotal", label: "summary.publicShares", icon: <Public />, color: theme.palette.success.main, to: "/admin/share" },
        { key: "secretShareTotal", label: "summary.privateShares", icon: <Lock />, color: theme.palette.text.secondary, to: "/admin/share" },
    ];
    const resources = [
        { label: t("summary.homepage"), icon: <Home />, url: "https://cloudreve.org" },
        { label: "GitHub", icon: <GitHub />, url: "https://github.com/cloudreve/cloudreve" },
        { label: t("summary.documents"), icon: <Description />, url: "https://docs.cloudreve.org/" },
        { label: t("summary.forum"), icon: <Forum />, url: t("summary.forumLink") },
        { label: t("summary.telegramGroup"), icon: <Telegram />, url: t("summary.telegramGroupLink") },
        { label: t("summary.buyPro"), icon: <Favorite />, url: "https://cloudreve.org/pro" },
    ];

    return (
        <>
            <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="site-url-title" aria-describedby="site-url-description">
                <DialogTitle id="site-url-title">{t("summary.confirmSiteURLTitle")}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="site-url-description">
                        {t(siteURL === "" ? "summary.siteURLNotSet" : "summary.siteURLNotMatch", { current: window.location.origin })}
                    </DialogContentText>
                    <DialogContentText>{t("summary.siteURLDescription")}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>{t("summary.ignore")}</Button>
                    <Button onClick={ResetSiteURL} color="primary" variant="contained">{t("summary.changeIt")}</Button>
                </DialogActions>
            </Dialog>
            <div className={classes.header}>
                <Typography component="h1" variant="h5">{t("nav.summary")}</Typography>
                <div className={classes.version}>Cloudreve {version.backend} {version.is_pro === "true" && <Chip size="small" label="Pro" />}</div>
            </div>
            {summaryError && <Alert severity="error">{summaryError}</Alert>}
            <Grid container spacing={2} className={classes.metrics}>
                {metrics.map((metric) => <Grid item xs={6} md={3} key={metric.key}>
                    <Paper component={RouterLink} to={metric.to} className={classes.metric}>
                        <Avatar className={classes.metricIcon} style={{ color: metric.color, backgroundColor: fade(metric.color, 0.12) }}>{metric.icon}</Avatar>
                        <div className={classes.metricBody}>
                            <Typography className={classes.metricValue}>{summaryLoading ? <Skeleton width={64} /> : summaryError ? "--" : statistics[metric.key]}</Typography>
                            <Typography variant="body2" color="textSecondary">{t(metric.label)}</Typography>
                        </div>
                    </Paper>
                </Grid>)}
            </Grid>
            <section className={classes.section} aria-labelledby="trend-title">
                <Typography id="trend-title" component="h2" variant="h6">{t("summary.trend")}</Typography>
                <div className={classes.chart} role="img" aria-label={t("summary.trend")}>
                    {summaryLoading ? <Skeleton variant="rect" height={260} /> : <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                            <CartesianGrid stroke={theme.palette.divider} strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" stroke={theme.palette.text.secondary} tick={{ fontSize: 12 }} tickLine={false} minTickGap={28} />
                            <YAxis stroke={theme.palette.text.secondary} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderColor: theme.palette.divider, borderRadius: 6, color: theme.palette.text.primary }} />
                            <Legend iconType="plainline" wrapperStyle={{ fontSize: 13 }} />
                            <Line name={t("nav.files")} type="monotone" dataKey="file" stroke={theme.palette.primary.main} strokeWidth={2} dot={false} />
                            <Line name={t("nav.users")} type="monotone" dataKey="user" stroke={theme.palette.success.main} strokeWidth={2} dot={false} />
                            <Line name={t("nav.shares")} type="monotone" dataKey="share" stroke={theme.palette.warning.main} strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>}
                </div>
            </section>
            <Grid container spacing={3} className={classes.section}>
                <Grid item xs={12} md={8}>
                    <Typography component="h2" variant="h6" className={classes.sectionTitle}>{t("summary.forum")}</Typography>
                    {newsLoading && <Skeleton variant="rect" height={120} />}
                    {newsError && <Typography variant="body2" color="textSecondary">{t("summary.newsletterError")}</Typography>}
                    <List className={classes.news}>
                        {news && news.map((item) => {
                            const author = newsUsers[item.relationships.startUser.data.id];
                            return <React.Fragment key={item.id}>
                                <ListItem button component="a" href={"https://forum.cloudreve.org/d/" + item.id} target="_blank" rel="noopener noreferrer" alignItems="flex-start">
                                    <ListItemAvatar><Avatar className={classes.author} alt={author ? author.username : ""} src={author && author.avatarUrl} /></ListItemAvatar>
                                    <ListItemText primary={item.attributes.title} secondary={<>
                                        {author && author.username}{" "}
                                        <Trans ns="dashboard" i18nKey="summary.publishedAt" components={[<TimeAgo key={0} datetime={item.attributes.startTime} locale={t("timeAgoLocaleCode", { ns: "common" })} />]} />
                                    </>} />
                                    <Launch className={classes.linkIcon} />
                                </ListItem><Divider />
                            </React.Fragment>;
                        })}
                    </List>
                </Grid>
                <Grid item xs={12} md={4} className={classes.resource}>
                    <Typography component="h2" variant="h6" className={classes.sectionTitle}>Cloudreve</Typography>
                    <List dense className={classes.resourceList}>
                        {resources.map((resource) => <ListItem key={resource.url} button component="a" href={resource.url} target="_blank" rel="noopener noreferrer">
                            <ListItemIcon>{resource.icon}</ListItemIcon><ListItemText primary={resource.label} /><Launch className={classes.linkIcon} />
                        </ListItem>)}
                    </List>
                </Grid>
            </Grid>
        </>
    );
}
