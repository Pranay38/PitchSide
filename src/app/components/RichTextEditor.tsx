import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { ResizableImage } from "./extensions/ResizableImageExtension";
import { SocialEmbed, detectPlatform } from "./extensions/SocialEmbedExtension";
import { EmbeddedImage } from "./extensions/EmbeddedImageExtension";
import type { SocialPlatform } from "./extensions/SocialEmbedExtension";
import { useEffect, useRef, useState } from "react";
import type { BlogPost } from "../data/posts";
import { InternalLinkSuggestion } from "./InternalLinkSuggestion";
import { EditorialBlockExtension } from "./extensions/EditorialBlockExtension";
import type { EditorialBlockKind } from "./extensions/EditorialBlockExtension";
import { GlossaryHighlightExtension } from "./extensions/GlossaryHighlightPlugin";
import { GlossaryHighlightTooltip } from "./extensions/GlossaryHighlightTooltip";
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Heading3,
    Quote,
    Minus,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Link as LinkIcon,
    Undo2,
    Redo2,
    ImagePlus,
    X,
    Share2,
    Sparkles,
    BarChart2,
    MessageCircle, // using as a generic tweet icon since lucide might not have X logo natively
    BookOpen,
} from "lucide-react";

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    existingPosts?: BlogPost[];
}

/** Compress and convert an image file to a base64 data URL */
function compressImage(file: File, maxWidth = 900, quality = 0.75): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let w = img.width;
                let h = img.height;
                if (w > maxWidth) {
                    h = (h * maxWidth) / w;
                    w = maxWidth;
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                if (!ctx) return reject(new Error("Canvas not supported"));
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL("image/webp", quality));
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function ToolbarButton({
    onClick,
    isActive = false,
    children,
    title,
}: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-1.5 rounded-md transition-colors ${isActive
                ? "bg-[#16A34A] text-white"
                : "text-[#64748B] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[#0F172A] dark:hover:text-white"
                }`}
        >
            {children}
        </button>
    );
}

function ToolbarDivider() {
    return <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />;
}

export function RichTextEditor({ content, onChange, existingPosts = [] }: RichTextEditorProps) {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [showEmbedModal, setShowEmbedModal] = useState(false);
    const [embedSrc, setEmbedSrc] = useState("");
    const [embedCreditText, setEmbedCreditText] = useState("");
    const [embedCreditUrl, setEmbedCreditUrl] = useState("");
    const [embedAltText, setEmbedAltText] = useState("");
    const [embedHeight, setEmbedHeight] = useState("");
    const [detectedPlatform, setDetectedPlatform] = useState<SocialPlatform>("twitter"); // default to twitter now
    const [isSofascoreModal, setIsSofascoreModal] = useState(false);
    const [isImageUploadModal, setIsImageUploadModal] = useState(false);
    const [isTweetModal, setIsTweetModal] = useState(false);
    const [savedSelection, setSavedSelection] = useState<number | null>(null);
    const [showEditorialMenu, setShowEditorialMenu] = useState(false);

    const handleEmbedUrlChange = (val: string) => {
        let extractedUrl = val;
        let extractedHeight = "";
        // Extract src if the user pasted an <iframe> or <script> embed code snippet
        const srcMatch = val.match(/src=["'](.*?)["']/i);
        if (srcMatch && srcMatch[1]) {
            extractedUrl = srcMatch[1];
        }

        const heightMatch = val.match(/height=["']?(\d+)/i);
        if (heightMatch && heightMatch[1]) {
            extractedHeight = heightMatch[1];
        }

        setEmbedSrc(extractedUrl);
        setEmbedHeight(extractedHeight);
        setDetectedPlatform(detectPlatform(extractedUrl));
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Underline,
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-[#16A34A] underline cursor-pointer",
                },
            }),
            ResizableImage.configure({
                inline: false,
                allowBase64: true,
                HTMLAttributes: {
                    class: "rounded-lg max-w-full h-auto mx-auto my-4",
                },
            }),
            SocialEmbed,
            EmbeddedImage,
            EditorialBlockExtension,
            GlossaryHighlightExtension.configure({
                active: true,
            }),
        ],
        content: content || "",
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class:
                    "prose prose-sm max-w-none min-h-[400px] px-4 py-3 focus:outline-none text-[#0F172A] dark:text-gray-200 " +
                    "prose-headings:text-[#0F172A] dark:prose-headings:text-white " +
                    "prose-strong:text-[#0F172A] dark:prose-strong:text-white " +
                    "prose-blockquote:border-l-4 prose-blockquote:border-[#16A34A] prose-blockquote:text-[#64748B] dark:prose-blockquote:text-gray-400 " +
                    "prose-a:text-[#16A34A] " +
                    "prose-img:rounded-lg prose-img:max-w-full prose-img:mx-auto [&_.glossary-highlight]:border-b-2 [&_.glossary-highlight]:border-dotted [&_.glossary-highlight]:border-[#16A34A] [&_.glossary-highlight]:cursor-help",
            },
        },
    });

    useEffect(() => {
        if (!editor) return;
        if (editor.getHTML() === (content || "")) return;
        editor.commands.setContent(content || "", { emitUpdate: false });
    }, [content, editor]);

    if (!editor) return null;

    const addLink = () => {
        const url = window.prompt("Enter URL:");
        if (url) {
            editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }
    };

    const addImageByUrl = () => {
        const url = window.prompt("Enter image URL:");
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith("image/")) return;
        try {
            const dataUrl = await compressImage(file);
            setSavedSelection(editor.state.selection.from);
            setEmbedSrc(dataUrl);
            setDetectedPlatform("image");
            setIsImageUploadModal(true);
            setIsTweetModal(false);
            setIsSofascoreModal(false);
            setShowEmbedModal(true);
        } catch {
            console.error("Failed to process image");
        }
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    const triggerImageUpload = () => {
        imageInputRef.current?.click();
    };

    const DEFAULT_ATTRS: Record<EditorialBlockKind, Record<string, string>> = {
        "timeline": {
            title: "How the match turned",
            items: JSON.stringify(["12' | Early overload | Built access down the right side", "37' | Midfield reset | Control improved after the shape changed", "61' | Double substitution | The tempo lift changed the game state"]),
        },
        "stats-card": {
            title: "Match Snapshot",
            items: JSON.stringify(["Possession | 61% | Territory tilted after minute 20", "Shots | 14 | Sustained pressure from zone 14", "PPDA | 8.4 | Press stayed live for most of the match"]),
        },
        "quote-block": {
            quote: "We had to find a different angle into midfield.",
            attribution: "Manager Name",
            role: "Head coach",
        },
        "key-takeaways": {
            title: "Key Takeaways",
            items: JSON.stringify(["The press worked because the distances stayed short.", "The bench changed the rhythm, not just the personnel.", "Territory mattered more than raw possession."]),
        },
        "comparison-table": {
            title: "Before and After",
            columns: "Metric|First Half|Second Half",
            items: JSON.stringify(["Touches in box | 5 | 13", "Progressive passes | 17 | 28", "Shots | 4 | 10"]),
        },
        "tactical-board": {
            title: "Tactical sequence",
            description: "Optional context for this tactical sequence.",
            blockId: "",
        },
        "match-center": {
            blockId: "",
        },
    };

    const insertEditorialBlock = (kind: EditorialBlockKind) => {
        const defaults = DEFAULT_ATTRS[kind] || {};
        editor.chain().focus().insertEditorialBlock({ kind, ...defaults }).run();
        setShowEditorialMenu(false);
    };

    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] overflow-hidden transition-all focus-within:ring-2 focus-within:ring-[#16A34A]/50 focus-within:border-[#16A34A]">
            {/* Hidden file input for image upload */}
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
            />

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 bg-white dark:bg-[#1E293B] border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                {/* Undo/Redo */}
                <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
                    <Undo2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
                    <Redo2 className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Headings */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive("heading", { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive("heading", { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive("heading", { level: 3 })}
                    title="Heading 3"
                >
                    <Heading3 className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Text formatting */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive("bold")}
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive("italic")}
                    title="Italic"
                >
                    <Italic className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive("underline")}
                    title="Underline"
                >
                    <UnderlineIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive("strike")}
                    title="Strikethrough"
                >
                    <Strikethrough className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Lists */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive("bulletList")}
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive("orderedList")}
                    title="Numbered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Block elements */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive("blockquote")}
                    title="Blockquote"
                >
                    <Quote className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    title="Horizontal Rule"
                >
                    <Minus className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={addLink} isActive={editor.isActive("link")} title="Add Link">
                    <LinkIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={triggerImageUpload} title="Upload Image from Device">
                    <ImagePlus className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={addImageByUrl} title="Add Image from URL">
                    <div className="relative">
                        <ImagePlus className="w-4 h-4 opacity-50" />
                        <LinkIcon className="w-3 h-3 absolute bottom-0 right-[-4px]" />
                    </div>
                </ToolbarButton>
                <ToolbarButton onClick={() => {
                    setSavedSelection(editor.state.selection.from);
                    setIsSofascoreModal(false);
                    setIsImageUploadModal(false);
                    setIsTweetModal(true);
                    setDetectedPlatform("twitter");
                    setShowEmbedModal(true);
                }} title="Embed X / Twitter Post">
                    <MessageCircle className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => {
                    setSavedSelection(editor.state.selection.from);
                    setIsSofascoreModal(true);
                    setIsTweetModal(false);
                    setIsImageUploadModal(false);
                    setDetectedPlatform("sofascore");
                    setShowEmbedModal(true);
                }} title="Embed Sofascore Widget">
                    <BarChart2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton 
                    onClick={() => editor.chain().focus().toggleGlossaryHighlight().run()} 
                    isActive={(editor.storage as any).glossaryHighlight?.active} 
                    title="Toggle Glossary Highlights"
                >
                    <BookOpen className="w-4 h-4" />
                </ToolbarButton>
                {/* Editorial Blocks — prominent labeled button */}
                <button
                    type="button"
                    onClick={() => setShowEditorialMenu((current) => !current)}
                    title="Editorial Blocks — insert timelines, stats, quotes and more"
                    className={`ml-1 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        showEditorialMenu
                            ? "bg-[#16A34A] text-white shadow-sm shadow-[#16A34A]/30"
                            : "border border-[#16A34A]/40 bg-[#16A34A]/8 text-[#16A34A] hover:bg-[#16A34A]/15 dark:border-[#16A34A]/30 dark:bg-[#16A34A]/10 dark:text-[#4ade80]"
                    }`}
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    Editorial Blocks
                </button>

                <ToolbarDivider />

                {/* Alignment */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign("left").run()}
                    isActive={editor.isActive({ textAlign: "left" })}
                    title="Align Left"
                >
                    <AlignLeft className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign("center").run()}
                    isActive={editor.isActive({ textAlign: "center" })}
                    title="Align Center"
                >
                    <AlignCenter className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign("right").run()}
                    isActive={editor.isActive({ textAlign: "right" })}
                    title="Align Right"
                >
                    <AlignRight className="w-4 h-4" />
                </ToolbarButton>

                {/* Word count indicator */}
                <div className="ml-auto pl-2 flex items-center gap-2 text-[11px] font-medium text-[#94A3B8] dark:text-gray-500 select-none" title="Word count & estimated reading time">
                    {(() => {
                        const text = editor.getText();
                        const words = text.split(/\s+/).filter(Boolean).length;
                        const mins = Math.max(1, Math.ceil(words / 238));
                        return (
                            <>
                                <span>{words.toLocaleString()} words</span>
                                <span className="text-gray-300 dark:text-gray-700">•</span>
                                <span>~{mins} min read</span>
                            </>
                        );
                    })()}
                </div>
            </div>

            {showEditorialMenu && (
                <div className="border-b border-gray-200 bg-[#F8FAFC] px-4 py-4 dark:border-gray-700 dark:bg-[#08111f]">
                    <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">
                                    Editorial Blocks
                                </p>
                            </div>
                            <p className="text-xs text-[#64748B] dark:text-gray-400">
                                Click a block to insert it at your cursor. Edit the placeholder text to fill in your content.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowEditorialMenu(false)}
                            className="shrink-0 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-[#475569] transition-colors hover:border-[#16A34A]/30 hover:text-[#16A34A] dark:border-gray-700 dark:text-gray-300"
                        >
                            Close
                        </button>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {([
                            { id: "timeline",         icon: "⏱", label: "Timeline",         desc: "Add a step-by-step match, transfer, or season sequence." },
                            { id: "stats-card",       icon: "📊", label: "Stats Card",        desc: "Highlight three or four numbers with quick context." },
                            { id: "quote-block",      icon: "💬", label: "Quote Block",       desc: "Pull a sharper quote out of the body copy." },
                            { id: "key-takeaways",    icon: "✅", label: "Key Takeaways",     desc: "Summarize the section in fast, scannable bullets." },
                            { id: "comparison-table", icon: "⚖️", label: "Comparison Table",  desc: "Compare phases, players, or teams in one block." },
                            { id: "tactical-board",   icon: "🎯", label: "Tactical Board",    desc: "Embed a saved tactical sequence inside the article." },
                            { id: "match-center",     icon: "🏟️", label: "Match Center",      desc: "Embed a live or finished broadcast-style match center." },
                        ] as const).map((block) => (
                            <button
                                key={block.id}
                                type="button"
                                onClick={() => insertEditorialBlock(block.id)}
                                className="group flex items-start gap-3 rounded-[1.1rem] border border-gray-200 bg-white px-4 py-3 text-left transition-all hover:border-[#16A34A]/40 hover:bg-[#16A34A]/5 hover:shadow-sm dark:border-gray-700 dark:bg-[#0F172A] dark:hover:border-[#16A34A]/30 dark:hover:bg-[#16A34A]/10"
                            >
                                <span className="mt-0.5 text-lg leading-none shrink-0">{block.icon}</span>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-[#0F172A] group-hover:text-[#16A34A] dark:text-white dark:group-hover:text-[#4ade80] transition-colors">{block.label}</p>
                                    <p className="mt-0.5 text-xs leading-5 text-[#64748B] dark:text-gray-400">{block.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Editor */}
            <EditorContent editor={editor} />
            <GlossaryHighlightTooltip />

            {/* Internal Link Suggestions */}
            {existingPosts.length > 0 && (
                <InternalLinkSuggestion editor={editor} posts={existingPosts} />
            )}

            {/* Embed Social / Image Modal */}
            {showEmbedModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                                {isSofascoreModal ? (
                                    <>
                                        <BarChart2 className="w-5 h-5 text-[#16A34A]" />
                                        Embed Sofascore Widget
                                    </>
                                ) : isImageUploadModal ? (
                                    <>
                                        <ImagePlus className="w-5 h-5 text-[#16A34A]" />
                                        Upload Image with Credits
                                    </>
                                ) : isTweetModal ? (
                                    <>
                                        <MessageCircle className="w-5 h-5 text-[#16A34A]" />
                                        Embed X / Twitter Post
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="w-5 h-5 text-[#16A34A]" />
                                        Embed Post or Image
                                    </>
                                )}
                            </h3>
                            <button
                                onClick={() => { setShowEmbedModal(false); setEmbedSrc(""); setEmbedHeight(""); setEmbedCreditText(""); setEmbedCreditUrl(""); setEmbedAltText(""); setDetectedPlatform("twitter"); setIsSofascoreModal(false); setIsImageUploadModal(false); setIsTweetModal(false); }}
                                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#64748B] transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-[#64748B] dark:text-gray-400 mb-1.5">
                                    {isSofascoreModal ? "Paste Sofascore Iframe HTML *" : isImageUploadModal ? "Image Data URL (Uploaded) *" : isTweetModal ? "Paste Tweet URL *" : "Paste URL *"}
                                </label>
                                <input
                                    value={isImageUploadModal ? "Local file uploaded successfully. Add credits below." : embedSrc}
                                    onChange={(e) => {
                                        if (!isImageUploadModal) handleEmbedUrlChange(e.target.value);
                                    }}
                                    placeholder={isSofascoreModal ? "<iframe src='...' ></iframe>" : isTweetModal ? "https://x.com/username/status/123..." : "Paste a tweet, Instagram, YouTube, or image URL"}
                                    disabled={isImageUploadModal}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-sm text-[#0F172A] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    autoFocus={!isImageUploadModal}
                                />
                            </div>

                            {/* Auto-detected platform badge */}
                            {embedSrc.trim() && (
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${detectedPlatform === "twitter" ? "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" :
                                        detectedPlatform === "instagram" ? "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" :
                                            detectedPlatform === "youtube" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                                detectedPlatform === "sofascore" ? "bg-green-100 text-[#16A34A] dark:bg-green-900/30 dark:text-green-400" :
                                                    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                        }`}>
                                        {detectedPlatform === "twitter" && "𝕏 Twitter"}
                                        {detectedPlatform === "instagram" && "📷 Instagram"}
                                        {detectedPlatform === "youtube" && "▶ YouTube"}
                                        {detectedPlatform === "sofascore" && "📊 Sofascore"}
                                        {detectedPlatform === "image" && "🖼 Image"}
                                    </span>
                                    <span className="text-xs text-[#94A3B8]">Auto-detected</span>
                                </div>
                            )}

                            {/* Credit fields only for image type */}
                            {detectedPlatform === "image" && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-[#64748B] dark:text-gray-400 mb-1.5">Alt Text (SEO & Accessibility)</label>
                                        <input
                                            value={embedAltText}
                                            onChange={(e) => setEmbedAltText(e.target.value)}
                                            placeholder="Describe the image for search engines & screen readers"
                                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-sm text-[#0F172A] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-[#64748B] dark:text-gray-400 mb-1.5">Credit Text</label>
                                        <input
                                            value={embedCreditText}
                                            onChange={(e) => setEmbedCreditText(e.target.value)}
                                            placeholder="Source: Twitter / @FabrizioRomano"
                                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-sm text-[#0F172A] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-[#64748B] dark:text-gray-400 mb-1.5">Credit Link</label>
                                        <input
                                            value={embedCreditUrl}
                                            onChange={(e) => setEmbedCreditUrl(e.target.value)}
                                            placeholder="https://original-source.com/..."
                                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-sm text-[#0F172A] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F172A]/50">
                            <button
                                type="button"
                                onClick={() => { setShowEmbedModal(false); setEmbedSrc(""); setEmbedHeight(""); setEmbedCreditText(""); setEmbedCreditUrl(""); setEmbedAltText(""); setDetectedPlatform("twitter"); setIsSofascoreModal(false); setIsImageUploadModal(false); setIsTweetModal(false); }}
                                className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#0F172A] dark:hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (embedSrc.trim()) {
                                        let chain = editor.chain().focus();
                                        if (savedSelection !== null) {
                                            chain = chain.setTextSelection(savedSelection);
                                        }
                                        if (detectedPlatform === "image") {
                                            chain.setEmbeddedImage({
                                                src: embedSrc.trim(),
                                                creditText: embedCreditText.trim(),
                                                creditUrl: embedCreditUrl.trim(),
                                                alt: embedAltText.trim(),
                                            }).run();
                                        } else {
                                            chain.setSocialEmbed({
                                                url: embedSrc.trim(),
                                                platform: detectedPlatform,
                                                creditText: embedCreditText.trim(),
                                                creditUrl: embedCreditUrl.trim(),
                                                embedHeight: embedHeight,
                                            }).run();
                                        }
                                        setEmbedSrc("");
                                        setEmbedHeight("");
                                        setEmbedCreditText("");
                                        setEmbedCreditUrl("");
                                        setEmbedAltText("");
                                        setDetectedPlatform("twitter");
                                        setSavedSelection(null);
                                        setShowEmbedModal(false);
                                        setIsSofascoreModal(false);
                                        setIsImageUploadModal(false);
                                        setIsTweetModal(false);
                                    }
                                }}
                                disabled={!embedSrc.trim()}
                                className="px-5 py-2 bg-[#16A34A] text-white rounded-xl text-sm font-semibold hover:bg-[#15803d] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-[#16A34A]/25"
                            >
                                Embed
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
