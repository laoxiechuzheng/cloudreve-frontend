import { useCallback, useEffect, useMemo, useRef } from "react";
import { throttle } from "lodash";

export default function useDragScrolling() {
    const scrolling = useRef({ direction: 0, frame: null });
    const onDragOver = useMemo(() => {
        const step = () => {
            scrolling.current.frame = null;
            const target = document.querySelector("#explorer-container");
            if (!target || !scrolling.current.direction) return;
            const before = target.scrollTop;
            const limit = Math.max(0, target.scrollHeight - target.clientHeight);
            target.scrollTop = Math.max(0, Math.min(limit, before + scrolling.current.direction * 10));
            if (target.scrollTop !== before) scrolling.current.frame = window.requestAnimationFrame(step);
        };
        return throttle((event) => {
            const target = document.querySelector("#explorer-container");
            if (!target) return;
            const bounds = target.getBoundingClientRect();
            scrolling.current.direction = event.clientY < bounds.top + 64 ? -1
                : event.clientY > Math.min(bounds.bottom, window.innerHeight) - 64 ? 1 : 0;
            if (scrolling.current.direction && scrolling.current.frame === null) {
                scrolling.current.frame = window.requestAnimationFrame(step);
            }
        }, 100);
    }, []);

    const removeEventListenerForWindow = useCallback(() => {
        window.removeEventListener("dragover", onDragOver, false);
        onDragOver.cancel();
        scrolling.current.direction = 0;
        if (scrolling.current.frame !== null) window.cancelAnimationFrame(scrolling.current.frame);
        scrolling.current.frame = null;
    }, [onDragOver]);

    useEffect(() => removeEventListenerForWindow, [removeEventListenerForWindow]);

    const addEventListenerForWindow = useCallback(() => {
        window.addEventListener("dragover", onDragOver, false);
    }, [onDragOver]);

    return { addEventListenerForWindow, removeEventListenerForWindow };
}
