import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { makeStyles } from "@material-ui/core";
import { useDrag } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import classNames from "classnames";
import statusHelper from "../../utils/page";
import { isMac, pathBack } from "../../utils";
import { changeContextMenu, dragAndDrop, navigateTo, openPreview, openShareDialog } from "../../redux/explorer";
import { startDownload } from "../../redux/explorer/action";
import { useDirectoryView } from "./DirectoryView";
import FileActions from "./FileActions";
import FileIcon from "./FileIcon";
import SmallIcon from "./SmallIcon";
import TableItem from "./TableRow";
import DropWarpper from "./DnD/DropWarpper";

const useStyles = makeStyles(() => ({
    container: { minWidth: 0 },
    dragging: { opacity: 0.4 },
}));

export default function ObjectIcon({ file }) {
    const path = useSelector((state) => state.navigator.path);
    const search = useSelector((state) => state.explorer.search);
    const shareInfo = useSelector((state) => state.viewUpdate.shareInfo);
    const selected = useSelector((state) => state.explorer.selected);
    const viewMethod = useSelector((state) => state.viewUpdate.explorerViewMethod);
    const location = useLocation();
    const dispatch = useDispatch();
    const view = useDirectoryView();
    const classes = useStyles();

    const contextMenu = (event) => {
        if (file.type === "up") return;
        event.preventDefault();
        event.stopPropagation();
        if (!selected.includes(file)) view.setSelection([file]);
        dispatch(changeContextMenu("file", true));
    };
    const enterFolder = () => {
        const parent = search && file.path ? file.path : path;
        dispatch(navigateTo(parent === "/" ? parent + file.name : parent + "/" + file.name));
    };
    const handleClick = (event) => {
        if (file.type === "up") {
            event.stopPropagation();
            dispatch(navigateTo(pathBack(path)));
            return;
        }
        view.select(file, event);
        if (file.type === "dir" && !event.ctrlKey && !event.metaKey && !event.shiftKey) enterFolder();
    };
    const open = () => {
        if (file.type === "up") {
            dispatch(navigateTo(pathBack(path)));
        } else if (file.type === "dir") {
            enterFolder();
        } else {
            // Preview thunks read the selection; always open the item that was activated.
            view.setSelection([file]);
            dispatch(openPreview(shareInfo));
        }
    };
    const handleIconClick = (event) => {
        event.stopPropagation();
        view.select(file, {
            shiftKey: event.shiftKey,
            ctrlKey: !event.shiftKey && !isMac(),
            metaKey: !event.shiftKey && isMac(),
        });
    };
    const actions = <FileActions
        file={file}
        compact={viewMethod !== "icon" || file.type === "dir"}
        onDownload={() => dispatch(startDownload(shareInfo, file))}
        onOpen={enterFolder}
        onShare={() => { view.setSelection([file]); dispatch(openShareDialog()); }}
    />;
    const [{ isDragging }, drag, preview] = useDrag({
        item: { object: file, type: "object", selected: [...selected], viewMethod },
        begin: () => {
            if (!selected.includes(file)) view.setSelection([file]);
        },
        end: (item, monitor) => {
            const result = monitor.getDropResult();
            if (item && result && result.folder && (item.object.id !== result.folder.id || item.object.type !== result.folder.type)) {
                dispatch(dragAndDrop(item.object, result.folder));
            }
        },
        canDrag: () => file.type !== "up" && !statusHelper.isMobile() && statusHelper.isHomePage(location.pathname),
        collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    });
    useEffect(() => { preview(getEmptyImage(), { captureDraggingState: true }); }, [preview]);
    const common = {
        onIconClick: handleIconClick, onOpen: open, actions,
        contextMenu, handleClick, handleDoubleClick: open,
        className: classNames(classes.container, { [classes.dragging]: isDragging }),
    };
    if (viewMethod === "list") {
        return file.type === "dir"
            ? <DropWarpper {...common} isListView pref={drag} folder={file} />
            : <TableItem {...common} pref={drag} file={file} />;
    }
    return (
        <div ref={drag} className={common.className} onContextMenu={contextMenu} onClick={handleClick} onDoubleClick={open}>
            {file.type === "dir" ? <DropWarpper {...common} isListView={false} folder={file} />
                : viewMethod === "icon" ? <FileIcon {...common} file={file} /> : <SmallIcon {...common} file={file} />}
        </div>
    );
}
