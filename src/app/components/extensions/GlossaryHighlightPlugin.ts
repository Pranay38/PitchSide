import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Node as ProseMirrorNode } from "prosemirror-model";
import { getAllTerms } from "../../data/footballGlossary";

export interface GlossaryHighlightOptions {
  active: boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    glossaryHighlight: {
      toggleGlossaryHighlight: () => ReturnType;
    }
  }
}

const GlossaryHighlightPluginKey = new PluginKey("glossaryHighlight");

export const GlossaryHighlightExtension = Extension.create<GlossaryHighlightOptions>({
  name: "glossaryHighlight",

  addOptions() {
    return {
      active: true,
    };
  },

  addStorage() {
    return {
      active: this.options.active,
    };
  },

  addCommands() {
    return {
      toggleGlossaryHighlight:
        () =>
        ({ editor, tr }) => {
          (editor.storage as any).glossaryHighlight.active = !(editor.storage as any).glossaryHighlight.active;
          tr.setMeta(GlossaryHighlightPluginKey, { active: (editor.storage as any).glossaryHighlight.active });
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const terms = getAllTerms();
    
    // Sort terms by length descending so we match longer phrases first
    terms.sort((a, b) => b.length - a.length);

    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    };

    const termPatterns = terms.map(escapeRegExp).join("|");
    const regex = new RegExp(`\\b(${termPatterns})\\b`, "gi");

    function getDecorations(doc: ProseMirrorNode, active: boolean): DecorationSet {
      if (!active) {
        return DecorationSet.empty;
      }

      const decorations: Decoration[] = [];
      doc.descendants((node, pos) => {
        if (node.isText && node.text) {
          const text = node.text;
          let match;
          regex.lastIndex = 0; 
          while ((match = regex.exec(text)) !== null) {
            const start = pos + match.index;
            const end = start + match[0].length;
            decorations.push(
              Decoration.inline(start, end, {
                class: "glossary-highlight",
                "data-term": match[0].toLowerCase(),
              })
            );
          }
        }
      });
      return DecorationSet.create(doc, decorations);
    }

    let active = this.options.active;

    return [
      new Plugin({
        key: GlossaryHighlightPluginKey,
        state: {
          init(config, state) {
            return getDecorations(state.doc, active);
          },
          apply(tr, oldSet, oldState, newState) {
            const meta = tr.getMeta(GlossaryHighlightPluginKey);
            if (meta && meta.active !== undefined) {
              active = meta.active;
              return getDecorations(newState.doc, active);
            }
            if (tr.docChanged) {
              return getDecorations(newState.doc, active);
            }
            return oldSet.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
