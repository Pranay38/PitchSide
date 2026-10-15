import React from "react";
import { Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { HtmlDocumentFrame } from "../HtmlDocumentFrame";
import { encodeHtmlSection, decodeHtmlSection } from "../../lib/htmlSection";

function HtmlSectionView({ node, deleteNode }: NodeViewProps) {
    return <NodeViewWrapper className="my-4 rounded-lg border border-slate-300" contentEditable={false}>
        <div className="flex items-center justify-between bg-slate-100 p-2 text-sm text-slate-700">
            <span data-drag-handle className="cursor-grab">HTML stats / graphic section · drag to move</span>
            <button type="button" onClick={deleteNode}>Remove HTML section</button>
        </div>
        <HtmlDocumentFrame content={node.attrs.source} />
    </NodeViewWrapper>;
}
export const HtmlSectionExtension = Node.create({
    name: "htmlSection",
    group: "block",
    atom: true,
    draggable: true,
    addAttributes() {
        return { source: { default: "", parseHTML: element => decodeHtmlSection(element.getAttribute("data-html-section") || "") } };
    },
    parseHTML() { return [{ tag: "div[data-html-section]" }]; },
    renderHTML({ node }) { return ["div", { "data-html-section": encodeHtmlSection(node.attrs.source) }]; },
    addNodeView() { return ReactNodeViewRenderer(HtmlSectionView); },
});
