import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useRef } from "react";
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
} from "lucide-react";

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
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

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
    const imageInputRef = useRef<HTMLInputElement>(null);

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

    const handleAddImage = () => {
        // Show a choice: upload or URL
        const choice = window.confirm(
            "Click OK to upload from device, or Cancel to paste a URL"
        );
        if (choice) {
            imageInputRef.current?.click();
        } else {
            addImageByUrl();
        }
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
                <ToolbarButton onClick={handleAddImage} isActive={editor.isActive("image")} title="Add Image">
                    <ImagePlus className="w-4 h-4" />
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
        </div>
    );
}
