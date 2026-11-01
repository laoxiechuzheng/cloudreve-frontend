import React from "react";
import SmallIcon from "./SmallIcon";

export default function Folder({ folder, ...props }) {
    return <SmallIcon file={folder} isFolder {...props} />;
}
