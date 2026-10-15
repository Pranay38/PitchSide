"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { readHtmlDocument } from "../lib/htmlDocument";

/** Never add allow-same-origin: imported scripts must not access the site's session or DOM. */
export function HtmlDocumentFrame({ content }: { content: string }) {
    const frame = useRef<HTMLIFrameElement>(null);
    const [height, setHeight] = useState(800);
    const source = useMemo(() => {
        const html = readHtmlDocument(content) || "";
        return html + `<script>(()=>{const report=()=>parent.postMessage({type:'touchline-html-height',height:Math.max(document.body?.scrollHeight||0,document.body?.offsetHeight||0)},'*');addEventListener('load',()=>{report();new ResizeObserver(report).observe(document.body)});})();</script>`;
    }, [content]);
    useEffect(() => {
        setHeight(800);
        const receive = (event: MessageEvent) => {
            if (event.source !== frame.current?.contentWindow || event.data?.type !== "touchline-html-height") return;
            const next = event.data.height;
            if (typeof next === "number" && Number.isFinite(next)) setHeight(Math.max(400, Math.min(30000, Math.ceil(next))));
        };
        window.addEventListener("message", receive);
        return () => window.removeEventListener("message", receive);
    }, [content]);
    return <iframe ref={frame} title="Imported HTML article" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={source} style={{ width: "100%", height, border: 0, display: "block" }} />;
}
