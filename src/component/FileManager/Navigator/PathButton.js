import React, { useEffect } from "react";
import ExpandMore from "@material-ui/icons/ExpandMore";
import { Button } from "@material-ui/core";
import { makeStyles } from "@material-ui/core";
import { useDrop } from "react-dnd";
import classNames from "classnames";
import MoreIcon from "@material-ui/icons/MoreHoriz";

const useStyles = makeStyles((theme) => ({
    expandMore: {
        color: theme.palette.text.secondary,
    },
    active: {
        boxShadow: "0 0 0 2px " + theme.palette.primary.light,
    },
    button: {
        textTransform: "none",
        borderRadius: 8,
        minWidth: 36,
        maxWidth: 240,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        color: theme.palette.text.primary,
    },
    label: {
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
}));

export default function PathButton(props) {
    const inputRef = React.useRef(null);

    const [{ canDrop, isOver }, drop] = useDrop({
        accept: "object",
        drop: () => {
            if (props.more) {
                inputRef.current.click();
            } else {
                return {
                    folder: {
                        id: -1,
                        path: props.path,
                        name: props.folder === "/" ? "" : props.folder,
                    },
                };
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    });

    const isActive = canDrop && isOver;

    useEffect(() => {
        if (props.more && isActive) {
            inputRef.current.click();
        }
        // eslint-disable-next-line
    }, [isActive]);

    const classes = useStyles();
    return (
        <span onClick={props.onClick} ref={inputRef}>
            <Button
                ref={drop}
                className={classNames(
                    {
                        [classes.active]: isActive,
                    },
                    classes.button
                )}
                component="span"
                title={props.title || (props.more ? undefined : String(props.folder))}
            >
                {props.more && <MoreIcon />}
                {!props.more && (
                    <>
                        <span className={classes.label}>{props.folder}</span>
                        {props.last && (
                            <ExpandMore className={classes.expandMore} />
                        )}
                    </>
                )}
            </Button>
        </span>
    );
}
