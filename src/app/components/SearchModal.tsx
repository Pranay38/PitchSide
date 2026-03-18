import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { Search, X, Loader2, FileText, Calendar } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  publishedAt: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setQuery("");
      setResults([]);
      setHasSearched(false);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
            const data = await response.json();
            setResults(Array.isArray(data) ? data : []);
        } else {
            setResults([]);
        }
      } catch (err) {
        console.error("Search failed:", err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-start pt-[10vh] px-4 backdrop-blur-sm bg-[#0F172A]/80 transition-opacity animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-4 duration-300">
        
        {/* Search Input Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search articles, tactics, transfers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-[#0F172A] dark:text-gray-100 text-lg placeholder-gray-400 font-medium"
          />
          {isSearching && <Loader2 className="w-5 h-5 text-[#16A34A] animate-spin" />}
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#0F172A] text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results Body */}
        <div className="max-h-[60vh] overflow-y-auto">
          {hasSearched && !isSearching && results.length === 0 && query.trim() && (
            <div className="p-12 text-center text-gray-500">
              <p className="font-semibold text-lg text-gray-700 dark:text-gray-300 mb-2">No results found</p>
              <p className="text-sm">Try adjusting your keywords.</p>
            </div>
          )}

          {!hasSearched && !query.trim() && (
            <div className="p-8 text-center text-gray-400 text-sm">
              Type at least 1 character to search. Supported by MongoDB Atlas Search.
            </div>
          )}

          {results.length > 0 && (
            <div className="p-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 py-2">
                Articles
              </h3>
              {results.map((post) => (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  onClick={onClose}
                  className="flex flex-col gap-1 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#0F172A] group transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="font-semibold text-base text-[#0F172A] dark:text-gray-200 group-hover:text-[#16A34A] transition-colors line-clamp-1">
                      {post.title}
                    </h4>
                  </div>
                  {post.excerpt && (
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.publishedAt || new Date()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
