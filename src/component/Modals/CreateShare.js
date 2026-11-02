import React, { useCallback, useRef } from "react";
import {
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Input,
    makeStyles,
    TextField,
} from "@material-ui/core";
import { toggleSnackbar } from "../../redux/explorer";
import { useDispatch } from "react-redux";
import API from "../../middleware/Api";
import List from "@material-ui/core/List";
import ListItemText from "@material-ui/core/ListItemText";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import LockIcon from "@material-ui/icons/Lock";
import TimerIcon from "@material-ui/icons/Timer";
import CasinoIcon from "@material-ui/icons/Casino";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import Divider from "@material-ui/core/Divider";
import MuiExpansionPanel from "@material-ui/core/ExpansionPanel";
import MuiExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import MuiExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import Typography from "@material-ui/core/Typography";
import withStyles from "@material-ui/core/styles/withStyles";
import InputLabel from "@material-ui/core/InputLabel";
import { Visibility, VisibilityOff } from "@material-ui/icons";
import IconButton from "@material-ui/core/IconButton";
import InputAdornment from "@material-ui/core/InputAdornment";
import OutlinedInput from "@material-ui/core/OutlinedInput";
import Tooltip from "@material-ui/core/Tooltip";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import ToggleIcon from "material-ui-toggle-icon";
import LinkIcon from "@material-ui/icons/Link";
import { useTranslation } from "react-i18next";
import EditShareLink, {
    SHARE_KEY_PATTERN,
    shareLinkPrefix,
} from "./EditShareLink";

const useStyles = makeStyles((theme) => ({
    widthAnimation: {},
    shareUrl: {
        minWidth: "400px",
    },
    wrapper: {
        margin: theme.spacing(1),
        position: "relative",
    },
    buttonProgress: {
        color: theme.palette.secondary.light,
        position: "absolute",
        top: "50%",
        left: "50%",
    },
    flexCenter: {
        alignItems: "center",
    },
    noFlex: {
        display: "block",
    },
    scoreCalc: {
        marginTop: 10,
    },
    expireLabel: {
        whiteSpace: "nowrap",
    },
}));

const ExpansionPanel = withStyles({
    root: {
        border: "0px solid rgba(0, 0, 0, .125)",
        boxShadow: "none",
        "&:not(:last-child)": {
            borderBottom: 0,
        },
        "&:before": {
            display: "none",
        },
        "&$expanded": {
            margin: "auto",
        },
    },
    expanded: {},
})(MuiExpansionPanel);

const ExpansionPanelSummary = withStyles({
    root: {
        padding: 0,
        "&$expanded": {},
    },
    content: {
        margin: 0,
        display: "initial",
        "&$expanded": {
            margin: "0 0",
        },
    },
    expanded: {},
})(MuiExpansionPanelSummary);

const ExpansionPanelDetails = withStyles((theme) => ({
    root: {
        padding: 24,
        backgroundColor: theme.palette.background.default,
    },
}))(MuiExpansionPanelDetails);

export default function CreatShare(props) {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const classes = useStyles();

    const ToggleSnackbar = useCallback(
        (vertical, horizontal, msg, color) =>
            dispatch(toggleSnackbar(vertical, horizontal, msg, color)),
        [dispatch]
    );

    const lastSubmit = useRef(null);
    const [expanded, setExpanded] = React.useState(false);
    const [shareURL, setShareURL] = React.useState("");
    const [editingLink, setEditingLink] = React.useState(false);
    const [values, setValues] = React.useState({
        password: "",
        downloads: 1,
        expires: 24 * 3600,
        showPassword: false,
        customKey: "",
    });
    const [shareOption, setShareOption] = React.useState({
        password: false,
        expire: false,
        preview: true,
        customKey: false,
    });
    const [customExpires, setCustomExpires] = React.useState(3600);
    const [customDownloads, setCustomDownloads] = React.useState(10);

    // 自定义链接：留空用默认（HashID）链接
    const customKey = shareOption.customKey ? values.customKey.trim() : "";
    const customKeyInvalid =
        customKey !== "" && !SHARE_KEY_PATTERN.test(customKey);

    // 已创建分享的链接拆成前缀（站点 + /s/）和链接标识
    const keyStart = shareURL.lastIndexOf("/s/") + 3;
    const sharePrefix = shareURL.slice(0, keyStart);
    const shareKey = shareURL.slice(keyStart);

    const handleChange = (prop) => (event) => {
        // 输入密码或自定义链接时同步勾选状态
        if (prop === "password" || prop === "customKey") {
            setShareOption({
                ...shareOption,
                [prop]: event.target.value !== "",
            });
        }

        setValues({ ...values, [prop]: event.target.value });
    };

    const handleClickShowPassword = () => {
        setValues({ ...values, showPassword: !values.showPassword });
    };

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const randomPassword = () => {
        setShareOption({ ...shareOption, password: true });
        setValues({
            ...values,
            password: Math.random().toString(36).substr(2).slice(2, 8),
            showPassword: true,
        });
    };

    const handleExpand = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    const handleCheck = (prop) => () => {
        if (!shareOption[prop]) {
            handleExpand(prop)(null, true);
        }
        if (
            (prop === "password" || prop === "customKey") &&
            shareOption[prop]
        ) {
            setValues({
                ...values,
                [prop]: "",
            });
        }
        setShareOption({ ...shareOption, [prop]: !shareOption[prop] });
    };

    const onClose = () => {
        props.onClose();
        setEditingLink(false);
        setTimeout(() => {
            setShareURL("");
        }, 500);
    };

    // 创建后修改链接，对话框里展示的链接随之更新
    const saveShareLink = (key) =>
        API.patch("/share/" + shareKey, {
            prop: "custom_key",
            value: key,
        }).then((response) => {
            const url = sharePrefix + response.data;
            setShareURL(url);
            ToggleSnackbar(
                "top",
                "right",
                t("share.linkChanged", { url }),
                "success"
            );
        });

    const senLink = () => {
        if (navigator.share) {
            let text = t("modals.shareLinkShareContent", {
                name: props.selected[0].name,
                link: shareURL,
            });
            if (lastSubmit.current && lastSubmit.current.password) {
                text += t("modals.shareLinkPasswordInfo", {
                    password: lastSubmit.current.password,
                });
            }
            navigator.share({ text });
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(shareURL);
            ToggleSnackbar("top", "right", t("modals.linkCopied"), "info");
        }
    };

    const submitShare = (e) => {
        e.preventDefault();
        if (customKeyInvalid) {
            return;
        }
        props.setModalsLoading(true);
        const submitFormBody = {
            id: props.selected[0].id,
            is_dir: props.selected[0].type === "dir",
            password: values.password,
            downloads: shareOption.expire
                ? values.downloads === -1
                    ? parseInt(customDownloads)
                    : values.downloads
                : -1,
            expire:
                values.expires === -1
                    ? parseInt(customExpires)
                    : values.expires,
            preview: shareOption.preview,
        };
        if (customKey !== "") {
            submitFormBody.custom_key = customKey;
        }
        lastSubmit.current = submitFormBody;

        API.post("/share", submitFormBody)
            .then((response) => {
                setShareURL(response.data);
                setValues({
                    password: "",
                    downloads: 1,
                    expires: 24 * 3600,
                    showPassword: false,
                    customKey: "",
                });
                setShareOption({
                    password: false,
                    expire: false,
                    preview: true,
                    customKey: false,
                });
                setExpanded(false);
                props.setModalsLoading(false);
            })
            .catch((error) => {
                ToggleSnackbar("top", "right", error.message, "error");
                props.setModalsLoading(false);
            });
    };

    const handleFocus = (event) => event.target.select();

    return (
        <Dialog
            open={props.open}
            onClose={onClose}
            aria-labelledby="form-dialog-title"
            className={classes.widthAnimation}
            maxWidth="xs"
            fullWidth
        >
            <DialogTitle id="form-dialog-title">
                {t("modals.createShareLink")}
            </DialogTitle>

            {shareURL === "" && (
                <>
                    <Divider />
                    <List>
                        <ExpansionPanel
                            expanded={expanded === "password"}
                            onChange={handleExpand("password")}
                        >
                            <ExpansionPanelSummary
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <ListItem button>
                                    <ListItemIcon>
                                        <LockIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={t(
                                            "modals.usePasswordProtection"
                                        )}
                                    />
                                    <ListItemSecondaryAction>
                                        <Checkbox
                                            checked={shareOption.password}
                                            onChange={handleCheck("password")}
                                        />
                                    </ListItemSecondaryAction>
                                </ListItem>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                <FormControl
                                    variant="outlined"
                                    color="secondary"
                                    fullWidth
                                >
                                    <InputLabel htmlFor="filled-adornment-password">
                                        {t("modals.sharePassword")}
                                    </InputLabel>
                                    <OutlinedInput
                                        fullWidth
                                        id="outlined-adornment-password"
                                        type={
                                            values.showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={values.password}
                                        onChange={handleChange("password")}
                                        endAdornment={
                                            <InputAdornment position="end">
                                                <Tooltip
                                                    title={t(
                                                        "modals.randomlyGenerate"
                                                    )}
                                                >
                                                    <IconButton
                                                        aria-label="toggle password visibility"
                                                        onClick={randomPassword}
                                                        edge="end"
                                                    >
                                                        <CasinoIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <IconButton
                                                    aria-label="toggle password visibility"
                                                    onClick={
                                                        handleClickShowPassword
                                                    }
                                                    onMouseDown={
                                                        handleMouseDownPassword
                                                    }
                                                    edge="end"
                                                >
                                                    <ToggleIcon
                                                        on={values.showPassword}
                                                        onIcon={<Visibility />}
                                                        offIcon={
                                                            <VisibilityOff />
                                                        }
                                                    />
                                                </IconButton>
                                            </InputAdornment>
                                        }
                                        labelWidth={70}
                                    />
                                </FormControl>
                            </ExpansionPanelDetails>
                        </ExpansionPanel>
                        <ExpansionPanel
                            expanded={expanded === "expire"}
                            onChange={handleExpand("expire")}
                        >
                            <ExpansionPanelSummary
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <ListItem button>
                                    <ListItemIcon>
                                        <TimerIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={t(
                                            "modals.expireAutomatically"
                                        )}
                                    />
                                    <ListItemSecondaryAction>
                                        <Checkbox
                                            checked={shareOption.expire}
                                            onChange={handleCheck("expire")}
                                        />
                                    </ListItemSecondaryAction>
                                </ListItem>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails
                                className={classes.flexCenter}
                            >
                                <FormControl
                                    style={{
                                        marginRight: 10,
                                    }}
                                >
                                    {values.downloads >= 0 && (
                                        <Select
                                            labelId="demo-simple-select-label"
                                            id="demo-simple-select"
                                            value={values.downloads}
                                            onChange={handleChange("downloads")}
                                        >
                                            {[1, 2, 3, 4, 5, 20, 50, 100].map(
                                                (v) => (
                                                    <MenuItem value={v} key={v}>
                                                        {t(
                                                            "modals.downloadLimitOptions",
                                                            { num: v }
                                                        )}
                                                    </MenuItem>
                                                )
                                            )}
                                            <MenuItem value={-1}>
                                                <em>{t("modals.custom")}</em>
                                            </MenuItem>
                                        </Select>
                                    )}
                                    {values.downloads === -1 && (
                                        <Input
                                            id="outlined-basic"
                                            type="number"
                                            inputProps={{
                                                min: 1,
                                            }}
                                            value={customDownloads}
                                            onChange={(e) =>
                                                setCustomDownloads(
                                                    e.target.value
                                                )
                                            }
                                            endAdornment={
                                                <InputAdornment position="start">
                                                    {t("modals.downloads")}
                                                </InputAdornment>
                                            }
                                        />
                                    )}
                                </FormControl>
                                <Typography className={classes.expireLabel}>
                                    {t("modals.or")}
                                </Typography>
                                <FormControl
                                    style={{
                                        marginRight: 10,
                                        marginLeft: 10,
                                    }}
                                >
                                    {values.expires >= 0 && (
                                        <Select
                                            labelId="demo-simple-select-label"
                                            id="demo-simple-select"
                                            value={values.expires}
                                            onChange={handleChange("expires")}
                                        >
                                            <MenuItem value={300}>
                                                {t("modals.5minutes")}
                                            </MenuItem>
                                            <MenuItem value={3600}>
                                                {t("modals.1hour")}
                                            </MenuItem>
                                            <MenuItem value={24 * 3600}>
                                                {t("modals.1day")}
                                            </MenuItem>
                                            <MenuItem value={7 * 24 * 3600}>
                                                {t("modals.7days")}
                                            </MenuItem>
                                            <MenuItem value={30 * 24 * 3600}>
                                                {t("modals.30days")}
                                            </MenuItem>
                                            <MenuItem value={-1}>
                                                <em>{t("modals.custom")}</em>
                                            </MenuItem>
                                        </Select>
                                    )}
                                    {values.expires === -1 && (
                                        <Input
                                            id="outlined-basic"
                                            type="number"
                                            inputProps={{
                                                min: 1,
                                            }}
                                            value={customExpires}
                                            onChange={(e) =>
                                                setCustomExpires(e.target.value)
                                            }
                                            endAdornment={
                                                <InputAdornment position="start">
                                                    {t("modals.seconds")}
                                                </InputAdornment>
                                            }
                                        />
                                    )}
                                </FormControl>
                                <Typography className={classes.expireLabel}>
                                    {t("modals.downloadSuffix")}
                                </Typography>
                            </ExpansionPanelDetails>
                        </ExpansionPanel>
                        <ExpansionPanel
                            expanded={expanded === "preview"}
                            onChange={handleExpand("preview")}
                        >
                            <ExpansionPanelSummary
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <ListItem button>
                                    <ListItemIcon>
                                        <LockIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={t("modals.allowPreview")}
                                    />
                                    <ListItemSecondaryAction>
                                        <Checkbox
                                            checked={shareOption.preview}
                                            onChange={handleCheck("preview")}
                                        />
                                    </ListItemSecondaryAction>
                                </ListItem>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                <Typography>
                                    {t("modals.allowPreviewDescription")}
                                </Typography>
                            </ExpansionPanelDetails>
                        </ExpansionPanel>
                        <ExpansionPanel
                            expanded={expanded === "customKey"}
                            onChange={handleExpand("customKey")}
                        >
                            <ExpansionPanelSummary
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <ListItem button>
                                    <ListItemIcon>
                                        <LinkIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={t("modals.customShareLink")}
                                    />
                                    <ListItemSecondaryAction>
                                        <Checkbox
                                            checked={shareOption.customKey}
                                            onChange={handleCheck("customKey")}
                                        />
                                    </ListItemSecondaryAction>
                                </ListItem>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                <TextField
                                    id="share-custom-key"
                                    fullWidth
                                    variant="outlined"
                                    color="secondary"
                                    label={t("share.linkKey")}
                                    value={values.customKey}
                                    onChange={handleChange("customKey")}
                                    error={customKeyInvalid}
                                    helperText={
                                        customKeyInvalid
                                            ? t("share.linkKeyInvalid")
                                            : t("modals.customShareLinkHelp")
                                    }
                                    inputProps={{
                                        maxLength: 64,
                                        spellCheck: false,
                                        autoCapitalize: "off",
                                        autoComplete: "off",
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                {shareLinkPrefix()}
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </ExpansionPanelDetails>
                        </ExpansionPanel>
                    </List>
                    <Divider />
                </>
            )}
            {shareURL !== "" && (
                <DialogContent>
                    <TextField
                        onFocus={handleFocus}
                        autoFocus
                        inputProps={{ readonly: true }}
                        label={t("modals.shareLink")}
                        value={shareURL}
                        variant="outlined"
                        fullWidth
                    />
                </DialogContent>
            )}

            <DialogActions>
                {shareURL !== "" && (
                    <Button onClick={() => setEditingLink(true)}>
                        {t("share.editLink")}
                    </Button>
                )}
                {shareURL !== "" && (
                    <div className={classes.wrapper}>
                        <Button onClick={senLink} color="secondary">
                            {t("modals.sendLink")}
                        </Button>
                    </div>
                )}
                <Button onClick={onClose}>
                    {t("close", { ns: "common" })}
                </Button>

                {shareURL === "" && (
                    <div className={classes.wrapper}>
                        <Button
                            onClick={submitShare}
                            color="secondary"
                            disabled={props.modalsLoading || customKeyInvalid}
                        >
                            {t("modals.createShareLink")}
                            {props.modalsLoading && (
                                <CircularProgress
                                    size={24}
                                    className={classes.buttonProgress}
                                />
                            )}
                        </Button>
                    </div>
                )}
            </DialogActions>
            {shareURL !== "" && (
                <EditShareLink
                    open={editingLink}
                    onClose={() => setEditingLink(false)}
                    sourceName={props.selected[0] && props.selected[0].name}
                    currentKey={shareKey}
                    prefix={sharePrefix}
                    onSave={saveShareLink}
                />
            )}
        </Dialog>
    );
}
