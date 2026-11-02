import React, { useCallback, useEffect, useState } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from "@material-ui/core";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import API from "../../middleware/Api";
import { openGetSourceDialog, toggleSnackbar } from "../../redux/explorer";
import EditShareLink from "./EditShareLink";

// 单个文件的 /f/<key>/<文件名> 外链才可修改；批量结果、其他形式的外链返回 null
export function parseSourceLink(source, selected) {
    if (!source || selected.length !== 1 || selected[0].type !== "file") {
        return null;
    }
    let url;
    try {
        url = new URL(source);
    } catch (e) {
        return null;
    }
    const match = /^\/f\/([^/]+)\//.exec(url.pathname);
    if (!match) {
        return null;
    }
    return {
        prefix: url.origin + "/f/",
        key: decodeURIComponent(match[1]),
    };
}

// 获取文件外链对话框，source 为空时关闭
export default function GetSource({ source, selected, onClose }) {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [editing, setEditing] = useState(false);

    const ToggleSnackbar = useCallback(
        (vertical, horizontal, msg, color) =>
            dispatch(toggleSnackbar(vertical, horizontal, msg, color)),
        [dispatch]
    );

    // 对话框被其他途径关闭时也收起修改框，避免下次打开时直接弹出
    useEffect(() => {
        if (!source) {
            setEditing(false);
        }
    }, [source]);

    const link = parseSourceLink(source, selected);

    const copySource = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(source);
            ToggleSnackbar("top", "right", t("modals.linkCopied"), "info");
        }
    };

    // 返回新的完整外链，留在对话框里展示
    const saveLink = (key) =>
        API.patch("/file/source", { id: selected[0].id, key }).then(
            (response) => {
                dispatch(openGetSourceDialog(response.data));
                ToggleSnackbar(
                    "top",
                    "right",
                    t("share.linkChanged", { url: response.data }),
                    "success"
                );
            }
        );

    return (
        <>
            <Dialog
                open={!!source}
                onClose={onClose}
                aria-labelledby="form-dialog-title"
                fullWidth
            >
                <DialogTitle id="form-dialog-title">
                    {t("modals.getSourceLinkTitle")}
                </DialogTitle>

                <DialogContent>
                    <TextField
                        autoFocus
                        inputProps={{ readonly: true }}
                        label={t("modals.sourceLink")}
                        multiline
                        value={source}
                        variant="outlined"
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    {link && (
                        <Button onClick={() => setEditing(true)}>
                            {t("share.editLink")}
                        </Button>
                    )}
                    <Button onClick={copySource} color="secondary">
                        {t("copyToClipboard", { ns: "common" })}
                    </Button>
                    <Button onClick={onClose}>
                        {t("close", { ns: "common" })}
                    </Button>
                </DialogActions>
            </Dialog>
            {link && (
                <EditShareLink
                    open={editing}
                    onClose={() => setEditing(false)}
                    sourceName={selected[0].name}
                    currentKey={link.key}
                    prefix={link.prefix}
                    suffix={"/" + selected[0].name}
                    title={t("share.editSourceLinkTitle")}
                    help={t("share.sourceLinkKeyHelp")}
                    onSave={saveLink}
                />
            )}
        </>
    );
}
