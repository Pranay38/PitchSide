import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { EditorialBlockNodeView } from "./EditorialBlockNodeView";

export type EditorialBlockKind =
  | "timeline"
  | "stats-card"
  | "quote-block"
  | "key-takeaways"
  | "comparison-table"
  | "tactical-board"
  | "match-center";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    editorialBlock: {
      insertEditorialBlock: (attrs: {
        kind: EditorialBlockKind;
        title?: string;
        items?: string;   // JSON string: string[]
        columns?: string; // pipe-separated column headers, for comparison-table
        quote?: string;
        attribution?: string;
        role?: string;
        blockId?: string; // for tactical-board / match-center
        description?: string;
      }) => ReturnType;
    };
  }
}

export const EditorialBlockExtension = Node.create({
  name: "editorialBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      kind:        { default: "stats-card" },
      title:       { default: "" },
      items:       { default: "[]" },  // JSON string[]
      columns:     { default: "" },
      quote:       { default: "" },
      attribution: { default: "" },
      role:        { default: "" },
      blockId:     { default: "" },
      description: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-editorial-block]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const { kind, title, items, columns, quote, attribution, role, blockId, description } = HTMLAttributes;
    return [
      "div",
      {
        "data-editorial-block": kind,
        "data-title": title || "",
        "data-items": items || "[]",
        "data-columns": columns || "",
        "data-quote": quote || "",
        "data-attribution": attribution || "",
        "data-role": role || "",
        "data-block-id": blockId || "",
        "data-description": description || "",
        style: "display:none", // invisible in serialised HTML; ArticleContentRenderer handles rendering
      },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EditorialBlockNodeView);
  },

  addCommands() {
    return {
      insertEditorialBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },
});
