import React, { useEffect, useRef } from "react";
import { useDrop } from "react-dnd";
import { PaginationItem } from "@material-ui/lab";

export default function CustomPaginationItem({ count, isMobile, ...props }) {
    const triggered = useRef(false);
    const [{ canDrop, isOver }, drop] = useDrop({
        accept: "object",
        collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
    });
    const active = canDrop && isOver;
    useEffect(() => {
        if (!active) triggered.current = false;
        if (active && !triggered.current && !props.selected && !props.disabled && props.onClick && !props.type.endsWith("ellipsis")) {
            triggered.current = true;
            props.onClick();
        }
    }, [active, props]);
    if (isMobile && (props.type === "page" || props.type.endsWith("ellipsis"))) {
        return props.selected ? <span aria-current="page" style={{ padding: "0 8px", fontSize: 12 }}>{props.page} / {count}</span> : null;
    }
    return <PaginationItem ref={drop} {...props} />;
}
