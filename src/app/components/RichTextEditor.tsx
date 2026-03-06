import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { SocialEmbed, detectPlatform } from "./extensions/SocialEmbedExtension";
import type { SocialPlatform } from "./extensions/SocialEmbedExtension";
import { useRef, useState } from "react";
import type { BlogPost } from "../data/posts";
import { InternalLinkSuggestion } from "./InternalLinkSuggestion";
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
    Camera,
    X,
    Share2,
} from "lucide-react";

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
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

export function RichTextEditor({ content, onChange, placeholder, existingPosts = [] }: RichTextEditorProps) {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [showEmbedModal, setShowEmbedModal] = useState(false);
    const [embedSrc, setEmbedSrc] = useState("");
    const [embedCreditText, setEmbedCreditText] = useState("");
    const [embedCreditUrl, setEmbedCreditUrl] = useState("");
    const [detectedPlatform, setDetectedPlatform] = useState<SocialPlatform>("image");

    const handleEmbedUrlChange = (url: string) => {
        setEmbedSrc(url);
        setDetectedPlatform(detectPlatform(url));
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
            Image.configure({
                inline: false,
                allowBase64: true,
                HTMLAttributes: {
                    class: "rounded-lg max-w-full h-auto mx-auto my-4",
                },
            }),
            SocialEmbed,
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
                    "prose-img:rounded-lg prose-img:max-w-full prose-img:mx-auto",
            },
        },
    });

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
            editor.chain().focus().setImage({ src: dataUrl }).run();
        } catch {
            console.error("Failed to process image");
        }
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    const triggerImageUpload = () => {
        imageInputRef.current?.click();
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
                <ToolbarButton onClick={() => setShowEmbedModal(true)} title="Embed Social Post / Image">
                    <Share2 className="w-4 h-4" />
                </ToolbarButton>

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
            </div>

            {/* Editor */}
            <EditorContent editor={editor} />

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
                                <Share2 className="w-5 h-5 text-[#16A34A]" />
                                Embed Post or Image
                            </h3>
                            <button
                                onClick={() => { setShowEmbedModal(false); setEmbedSrc(""); setEmbedCreditText(""); setEmbedCreditUrl(""); setDetectedPlatform("image"); }}
                                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#64748B] transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-[#64748B] dark:text-gray-400 mb-1.5">Paste URL *</label>
                                <input
                                    value={embedSrc}
                                    onChange={(e) => handleEmbedUrlChange(e.target.value)}
                                    placeholder="Paste a tweet, Instagram, YouTube, or image URL"
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-sm text-[#0F172A] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all"
                                    autoFocus
                                />
                            </div>

                            {/* Auto-detected platform badge */}
                            {embedSrc.trim() && (
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${detectedPlatform === "twitter" ? "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" :
                                            detectedPlatform === "instagram" ? "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" :
                                                detectedPlatform === "youtube" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                                    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                        }`}>
                                        {detectedPlatform === "twitter" && "𝕏 Twitter"}
                                        {detectedPlatform === "instagram" && "📷 Instagram"}
                                        {detectedPlatform === "youtube" && "▶ YouTube"}
                                        {detectedPlatform === "image" && "🖼 Image"}
                                    </span>
                                    <span className="text-xs text-[#94A3B8]">Auto-detected</span>
                                </div>
                            )}

                            {/* Credit fields only for image type */}
                            {detectedPlatform === "image" && (
                                <>
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
                                onClick={() => { setShowEmbedModal(false); setEmbedSrc(""); setEmbedCreditText(""); setEmbedCreditUrl(""); setDetectedPlatform("image"); }}
                                className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#0F172A] dark:hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (embedSrc.trim()) {
                                        editor.chain().focus().setSocialEmbed({
                                            url: embedSrc.trim(),
                                            platform: detectedPlatform,
                                            creditText: embedCreditText.trim(),
                                            creditUrl: embedCreditUrl.trim(),
                                        }).run();
                                        setEmbedSrc("");
                                        setEmbedCreditText("");
                                        setEmbedCreditUrl("");
                                        setDetectedPlatform("image");
                                        setShowEmbedModal(false);
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
