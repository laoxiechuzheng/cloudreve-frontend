import AuthLayout, { useAuthStyles } from "./AuthLayout";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
    Avatar,
    Button,
    Typography,
} from "@material-ui/core";
import { useHistory } from "react-router-dom";
import API from "../../middleware/Api";
import EmailIcon from "@material-ui/icons/EmailOutlined";
import { useLocation } from "react-router";
import { toggleSnackbar } from "../../redux/explorer";
import { useTranslation } from "react-i18next";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

function Activation() {
    const { t } = useTranslation();
    const query = useQuery();
    const location = useLocation();

    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState("");

    const dispatch = useDispatch();
    const ToggleSnackbar = useCallback(
        (vertical, horizontal, msg, color) =>
            dispatch(toggleSnackbar(vertical, horizontal, msg, color)),
        [dispatch]
    );
    const history = useHistory();

    const classes = useAuthStyles();

    useEffect(() => {
        API.get(
            "/user/activate/" + query.get("id") + "?sign=" + query.get("sign")
        )
            .then((response) => {
                setEmail(response.data);
                setSuccess(true);
            })
            .catch((error) => {
                ToggleSnackbar("top", "right", error.message, "warning");
                history.push("/login");
            });
        // eslint-disable-next-line
    }, [location]);

    return (
        <AuthLayout>
            {success && (
                <div className={classes.paper}>
                    <Avatar className={classes.avatar}>
                        <EmailIcon />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        {t("login.activateSuccess")}
                    </Typography>
                    <Typography style={{ marginTop: "20px" }}>
                        {t("login.accountActivated")}
                    </Typography>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        className={classes.submit}
                        onClick={() => history.push("/login?username=" + email)}
                    >
                        {t("login.backToSingIn")}
                    </Button>
                </div>
            )}
        </AuthLayout>
    );
}

export default Activation;
