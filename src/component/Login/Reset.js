import AuthLayout, { useAuthStyles } from "./AuthLayout";
import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Avatar,
    Button,
    Divider,
    FormControl,
    Link,
    TextField,
    Typography,
} from "@material-ui/core";
import API from "../../middleware/Api";
import KeyIcon from "@material-ui/icons/VpnKeyOutlined";
import { useCaptcha } from "../../hooks/useCaptcha";
import { toggleSnackbar } from "../../redux/explorer";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import InputAdornment from "@material-ui/core/InputAdornment";
import { EmailOutlined } from "@material-ui/icons";
import { useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";

function Reset() {
    const { t } = useTranslation();

    const [input, setInput] = useState({
        email: "",
    });
    const [loading, setLoading] = useState(false);
    const forgetCaptcha = useSelector(
        (state) => state.siteConfig.forgetCaptcha
    );
    const registerEnabled = useSelector(
        (state) => state.siteConfig.registerEnabled
    );
    const dispatch = useDispatch();
    const ToggleSnackbar = useCallback(
        (vertical, horizontal, msg, color) =>
            dispatch(toggleSnackbar(vertical, horizontal, msg, color)),
        [dispatch]
    );
    const handleInputChange = (name) => (e) => {
        setInput({
            ...input,
            [name]: e.target.value,
        });
    };

    const {
        captchaLoading,
        isValidate,
        validate,
        CaptchaRender,
        captchaRefreshRef,
        captchaParamsRef,
    } = useCaptcha();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const submit = (e) => {
        e.preventDefault();
        setLoading(true);
        if (!isValidate.current.isValidate && forgetCaptcha) {
            validate(() => submit(e), setLoading);
            return;
        }
        API.post("/user/reset", {
            userName: input.email,
            ...captchaParamsRef.current,
        })
            .then(() => {
                setLoading(false);
                ToggleSnackbar(
                    "top",
                    "right",
                    t("login.resetEmailSent"),
                    "success"
                );
            })
            .catch((error) => {
                setLoading(false);
                ToggleSnackbar("top", "right", error.message, "warning");
                captchaRefreshRef.current();
            });
    };

    const classes = useAuthStyles();

    return (
        <AuthLayout>
            <div className={classes.paper}>
                <Avatar className={classes.avatar}>
                    <KeyIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    {t("login.findMyPassword")}
                </Typography>
                <form className={classes.form} onSubmit={submit}>
                    <FormControl margin="normal" required fullWidth>
                        <TextField
                            id="email"
                            required
                            variant={"outlined"}
                            label={t("login.email")}
                            inputProps={{
                                name: "email",
                                type: "email",
                            }}
                            InputProps={{
                                startAdornment: !isMobile && (
                                    <InputAdornment position="start">
                                        <EmailOutlined />
                                    </InputAdornment>
                                ),
                            }}
                            onChange={handleInputChange("email")}
                            autoComplete="username"
                            value={input.email}
                            autoFocus
                        />
                    </FormControl>
                    {forgetCaptcha && <CaptchaRender />}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        disabled={
                            loading || (forgetCaptcha ? captchaLoading : false)
                        }
                        className={classes.submit}
                    >
                        {t("login.sendMeAnEmail")}
                    </Button>{" "}
                </form>{" "}
                <Divider />
                <div className={classes.link}>
                    <div>
                        <Link component={RouterLink} to={"/login"}>
                            {t("login.backToSingIn")}
                        </Link>
                    </div>
                    <div>
                        {registerEnabled && (
                            <Link component={RouterLink} to={"/signup"}>
                                {t("login.signUpAccount")}
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}

export default Reset;
