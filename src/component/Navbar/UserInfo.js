import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { IconButton, Typography, withStyles } from "@material-ui/core";
import Auth from "../../middleware/Auth";
import DarkModeSwitcher from "./DarkModeSwitcher";
import Avatar from "@material-ui/core/Avatar";
import { setUserPopover } from "../../redux/explorer";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state) => {
    return {
        isLogin: state.viewUpdate.isLogin,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        setUserPopover: (anchor) => {
            dispatch(setUserPopover(anchor));
        },
    };
};

const styles = (theme) => ({
    userNav: { padding: 20, borderBottom: "1px solid " + theme.palette.divider },
    avatar: { padding: 0, borderRadius: 8 },
    avatarImg: { width: 44, height: 44, borderRadius: 8 },
    nickName: { marginTop: 12, fontSize: "0.9375rem", fontWeight: 600 },
    flexAvatar: { display: "flex", alignItems: "center", justifyContent: "space-between" },
    groupName: { fontSize: "0.8125rem", color: theme.palette.text.secondary },
    storageCircle: { minWidth: 0 },
});

class UserInfoCompoment extends Component {
    showUserInfo = (e) => {
        this.props.setUserPopover(e.currentTarget);
    };

    render() {
        const { classes, t } = this.props;
        const isLogin = Auth.Check(this.props.isLogin);
        const user = Auth.GetUser(this.props.isLogin);

        return (
            <div className={classes.userNav}>
                <div className={classes.flexAvatar}>
                    <IconButton aria-label={t("navbar.myProfile")} onClick={this.showUserInfo} className={classes.avatar}>
                        {isLogin && (
                            <Avatar
                                src={"/api/v3/user/avatar/" + user.id + "/l"}
                                className={classes.avatarImg}
                            />
                        )}
                        {!isLogin && (
                            <Avatar
                                src={"/api/v3/user/avatar/0/l"}
                                className={classes.avatarImg}
                            />
                        )}
                    </IconButton>
                    <DarkModeSwitcher position="left" />
                </div>
                <div className={classes.storageCircle}>
                    <Typography
                        className={classes.nickName}
                        component="h2"
                        noWrap
                    >
                        {isLogin ? user.nickname : t("navbar.notLoginIn")}
                    </Typography>
                    <Typography
                        className={classes.groupName}
                        component="h2"
                        color="textSecondary"
                        noWrap
                    >
                        {isLogin ? user.group.name : t("navbar.visitor")}
                    </Typography>
                </div>
            </div>
        );
    }
}

UserInfoCompoment.propTypes = {
    classes: PropTypes.object.isRequired,
};

const UserInfo = connect(
    mapStateToProps,
    mapDispatchToProps
)(withStyles(styles)(withTranslation()(UserInfoCompoment)));

export default UserInfo;
