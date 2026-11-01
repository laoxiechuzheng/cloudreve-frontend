import { shareKey, mountShare } from "./utils/shareRoute";
import { register } from "./serviceWorker";

const key = shareKey(
    window.location.pathname,
    window.location.search,
    "noModule" in document.createElement("script") && "fetch" in window
);

register();
if (key) {
    mountShare(document, window, key, process.env.REACT_APP_UI_VERSION || "3.8.3-custom.1");
} else {
    import("./application");
}
