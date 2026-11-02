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
} from "@material-ui/core";
import { useTranslation } from "react-i18next";

// 与后端 models.shareKeyPattern 一致；空值表示恢复为默认（HashID）链接
export const SHARE_KEY_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function shareLinkPrefix() {
    return window.location.origin + "/s/";
}

// 修改分享链接（/s/ 之后的部分）。onSave(key) 返回 Promise，resolve 为生效后的链接标识。
export default function EditShareLink({
    open,
    onClose,
    sourceName,
    currentKey,
    onSave,
}) {
    const { t } = useTranslation("application", { keyPrefix: "share" });
    const { t: tCommon } = useTranslation("common");
    const [key, setKey] = useState(currentKey || "");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

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
                <DialogTitle>{t("editLinkTitle")}</DialogTitle>
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
                                : error || t("linkKeyHelp")
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
