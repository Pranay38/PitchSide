import React from "react";
import { Image, Upload, Link, X } from "lucide-react";

interface CoverImageUploadProps {
    imageMode: "upload" | "url";
    setImageMode: (mode: "upload" | "url") => void;
    coverImage: string;
    setCoverImage: (url: string) => void;
    uploading: boolean;
    dragOver: boolean;
    setDragOver: (val: boolean) => void;
    handleFileUpload: (file: File) => void;
    handleDrop: (e: React.DragEvent) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
}

export function CoverImageUpload({
    imageMode,
    setImageMode,
    coverImage,
    setCoverImage,
    uploading,
    dragOver,
    setDragOver,
    handleFileUpload,
    handleDrop,
    fileInputRef
}: CoverImageUploadProps) {
    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
            <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white mb-3">
                <Image className="w-4 h-4 text-[#16A34A]" />
                Cover Image
            </label>

            {/* Toggle: Upload vs URL */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                    type="button"
                    onClick={() => setImageMode("upload")}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${imageMode === "upload"
                        ? "bg-[#16A34A] text-white border-[#16A34A] shadow-md shadow-[#16A34A]/20"
                        : "bg-gray-50 dark:bg-[#0F172A] border-gray-200 dark:border-gray-600 text-[#64748B] dark:text-gray-400 hover:border-[#16A34A]"
                        }`}
                >
                    <Upload className="w-4 h-4" />
                    Upload from Device
                </button>
                <button
                    type="button"
                    onClick={() => setImageMode("url")}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${imageMode === "url"
                        ? "bg-[#16A34A] text-white border-[#16A34A] shadow-md shadow-[#16A34A]/20"
                        : "bg-gray-50 dark:bg-[#0F172A] border-gray-200 dark:border-gray-600 text-[#64748B] dark:text-gray-400 hover:border-[#16A34A]"
                        }`}
                >
                    <Link className="w-4 h-4" />
                    Paste URL
                </button>
            </div>

            {/* Upload mode */}
            {imageMode === "upload" && (
                <>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                        }}
                    />
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${dragOver
                            ? "border-[#16A34A] bg-[#16A34A]/5"
                            : "border-gray-300 dark:border-gray-600 hover:border-[#16A34A] hover:bg-gray-50 dark:hover:bg-[#0F172A]"
                            }`}
                    >
                        {uploading ? (
                            <div className="flex items-center gap-2 text-[#16A34A]">
                                <div className="w-5 h-5 border-2 border-[#16A34A] border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm font-medium">Processing...</span>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-[#94A3B8]" />
                                <div className="text-center">
                                    <p className="text-sm font-medium text-[#0F172A] dark:text-white">
                                        Click to upload or drag & drop
                                    </p>
                                    <p className="text-xs text-[#94A3B8] mt-1">
                                        PNG, JPG, WEBP up to 10MB — auto-compressed
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}

            {/* URL mode */}
            {imageMode === "url" && (
                <>
                    <input
                        type="url"
                        value={coverImage.startsWith("data:") ? "" : coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm"
                    />
                    <p className="text-xs text-[#94A3B8] dark:text-gray-500 mt-2">
                        Tip: Use{" "}
                        <a href="https://unsplash.com" target="_blank" rel="noopener" className="text-[#16A34A] hover:underline">
                            Unsplash
                        </a>{" "}
                        for free high-quality images
                    </p>
                </>
            )}

            {/* Preview */}
            {coverImage && (
                <div className="mt-4 relative">
                    <div className="aspect-[21/9] rounded-xl overflow-hidden">
                        <img
                            src={coverImage}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => { setCoverImage(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors"
                        title="Remove image"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
