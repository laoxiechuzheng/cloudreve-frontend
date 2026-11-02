import React, { useEffect, useState } from "react";
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    InputAdornment,
    TextField,
    Typography,
    useMediaQuery,
} from "@material-ui/core";
import { useTheme } from "@material-ui/core/styles";
import { useTranslation } from "react-i18next";

// 与后端 models.shareKeyPattern 一致；空值表示恢复为默认（HashID）链接
export const SHARE_KEY_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function shareLinkPrefix() {
    return window.location.origin + "/s/";
}

// 修改链接标识（默认是分享链接 /s/ 之后的部分）。onSave(key) 返回 Promise，resolve 为生效后的链接标识。
// 文件外链等场景用 prefix / suffix / title / help 覆盖默认的分享文案和链接前缀。
export default function EditShareLink({
    open,
    onClose,
    sourceName,
    currentKey,
    onSave,
    prefix,
    suffix,
    title,
    help,
}) {
    const { t } = useTranslation("application", { keyPrefix: "share" });
    const { t: tCommon } = useTranslation("common");
    const [key, setKey] = useState(currentKey || "");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    // 手机上前缀和后缀会把输入框挤没，改为在输入框下方显示完整链接
    const theme = useTheme();
    const narrow = useMediaQuery(theme.breakpoints.down("xs"));

    useEffect(() => {
        if (open) {
            setKey(currentKey || "");
            setError("");
            setSaving(false);
        }
    }, [open, currentKey]);

    const trimmed = key.trim();
    const invalid = trimmed !== "" && !SHARE_KEY_PATTERN.test(trimmed);
    const unchanged = trimmed === (currentKey || "");
    const preview =
        (prefix || shareLinkPrefix()) +
        (trimmed || currentKey || "") +
        (suffix || "");

    const submit = (e) => {
        e.preventDefault();
        if (invalid || unchanged || saving) {
            return;
        }
        setSaving(true);
        setError("");
        onSave(trimmed)
            .then(() => onClose())
            .catch((err) => {
                setError(err.message);
                setSaving(false);
            });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={submit}>
                <DialogTitle>{title || t("editLinkTitle")}</DialogTitle>
                <DialogContent>
                    {sourceName && (
                        <Typography
                            variant="body2"
                            color="textSecondary"
                            gutterBottom
                            style={{ wordBreak: "break-all" }}
                        >
                            {sourceName}
                        </Typography>
                    )}
                    <TextField
                        id="share-link-key"
                        autoFocus
                        fullWidth
                        variant="outlined"
                        margin="normal"
                        label={t("linkKey")}
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        error={invalid || error !== ""}
                        helperText={
                            invalid
                                ? t("linkKeyInvalid")
                                : error || help || t("linkKeyHelp")
                        }
                        inputProps={{
                            maxLength: 64,
                            spellCheck: false,
                            autoCapitalize: "off",
                            autoComplete: "off",
                        }}
                        InputProps={{
                            startAdornment: narrow ? undefined : (
                                <InputAdornment position="start">
                                    {prefix || shareLinkPrefix()}
                                </InputAdornment>
                            ),
                            endAdornment:
                                suffix && !narrow ? (
                                    <InputAdornment
                                        position="end"
                                        title={suffix}
                                        style={{ maxWidth: "35%" }}
                                    >
                                        <span
                                            style={{
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {suffix}
                                        </span>
                                    </InputAdornment>
                                ) : undefined,
                        }}
                    />
                    {narrow && (
                        <Typography
                            variant="caption"
                            color="textSecondary"
                            component="div"
                            style={{ wordBreak: "break-all" }}
                        >
                            {preview}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>
                        {tCommon("cancel")}
                    </Button>
                    <Button
                        type="submit"
                        color="secondary"
                        disabled={invalid || unchanged || saving}
                    >
                        {t("saveLink")}
                        {saving && (
                            <CircularProgress
                                size={20}
                                style={{ marginLeft: 8 }}
                            />
                        )}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
