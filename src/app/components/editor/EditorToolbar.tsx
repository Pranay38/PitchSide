import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered,
    Heading1, Heading2, Heading3, Quote, Minus, AlignLeft, AlignCenter, AlignRight,
    Link as LinkIcon, Undo2, Redo2, ImagePlus, MessageCircle, BarChart2, BookOpen, Sparkles
} from "lucide-react";

export function ToolbarButton({
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

export function ToolbarDivider() {
    return <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />;
}
