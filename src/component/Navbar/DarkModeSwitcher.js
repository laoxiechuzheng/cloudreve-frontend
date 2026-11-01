import React, { useCallback } from "react";
import { IconButton, useTheme } from "@material-ui/core";
import DayIcon from "@material-ui/icons/Brightness7";
import NightIcon from "@material-ui/icons/Brightness4";
import { useDispatch } from "react-redux";
import Tooltip from "@material-ui/core/Tooltip";
import Auth from "../../middleware/Auth";
import { toggleDaylightMode } from "../../redux/explorer";
import { useTranslation } from "react-i18next";

const DarkModeSwitcher = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const dispatch = useDispatch();
    const ToggleThemeMode = useCallback(() => dispatch(toggleDaylightMode()), [
        dispatch,
    ]);
    const isDayLight = theme.palette.type !== "dark";
    const toggleMode = () => {
        Auth.SetPreference("theme_mode", isDayLight ? "dark" : "light");
        ToggleThemeMode();
    };
    return (
        <Tooltip
            title={
                isDayLight ? t("navbar.toDarkMode") : t("navbar.toLightMode")
            }
            placement="bottom"
        >
            <IconButton
                aria-label={isDayLight ? t("navbar.toDarkMode") : t("navbar.toLightMode")}
                onClick={toggleMode}
                color="inherit"
            >
                {isDayLight && <NightIcon />}
                {!isDayLight && <DayIcon />}
            </IconButton>
        </Tooltip>
    );
};

export default DarkModeSwitcher;
