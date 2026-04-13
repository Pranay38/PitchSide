import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { getCategoryBadgeColor } from "./utils";

export interface BlogArticleData {
  category: string;
  description: string;
  image: string;
  publishDate: string;
  readMoreLink: string;
  title: string;
}

export default function Blogs({ articles }: { articles: BlogArticleData[] }) {
  if (!articles || articles.length === 0) return null;

  return (
    <section className="relative bg-[#F8FAFC] px-4 py-12 sm:py-16 md:py-20 dark:bg-[#0B1120] transition-colors duration-300 overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

      <div className="mx-auto max-w-[1240px] relative">
        <div className="mb-8 text-center sm:mb-12">
          <p className="mb-3 font-black text-[#16A34A] text-[11px] uppercase tracking-[0.22em] sm:mb-4">
            Curated
          </p>
          <h2 className="font-outfit font-black text-3xl text-[#0F172A] tracking-tight sm:text-4xl md:text-5xl dark:text-white">
            Editor&apos;s Picks
          </h2>
        </div>
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article, index) => (
            <Link
              to={article.readMoreLink}
              className="group block overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/5 dark:border-gray-800 dark:bg-[#0F172A]"
              key={index}
            >
              <div className="relative mb-4 sm:mb-6 overflow-hidden">
                <img
                  alt={article.title}
                  className="aspect-square h-64 w-full object-cover sm:h-72 md:h-80 transition-transform duration-700 group-hover:scale-110"
                  src={article.image || "https://images.unsplash.com/photo-1558174685-430919a96c8d"}
                />
                {/* Gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <p
                  className={`absolute top-4 left-4 rounded-full border px-3 py-1 font-black text-[10px] tracking-widest uppercase backdrop-blur-md ${getCategoryBadgeColor(article.category, true)}`}
                >
                  {article.category}
                </p>
              </div>
              <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                <h3 className="mb-3 font-outfit font-black text-xl text-[#0F172A] tracking-tight sm:text-2xl dark:text-white transition-colors group-hover:text-[#16A34A]">
                  {article.title}
                </h3>
                <p className="mb-6 text-[#64748B] text-sm leading-relaxed dark:text-gray-400 line-clamp-3">
                  {article.description}
                </p>
                {/* Arrow + Date */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="relative flex items-center overflow-hidden font-bold text-[#16A34A] text-xs">
                    <span className="mr-3 overflow-hidden rounded-full bg-[#16A34A]/10 p-2.5 transition-colors duration-300 ease-in group-hover:bg-[#16A34A] group-hover:text-white text-[#16A34A]">
                      <ArrowRight className="h-4 w-4 translate-x-0 opacity-100 transition-all duration-500 ease-in group-hover:translate-x-8 group-hover:opacity-0" />
                      <ArrowRight className="absolute top-1/2 -left-4 h-4 w-4 -translate-y-1/2 transition-all duration-500 ease-in-out group-hover:left-2.5" />
                    </span>
                    Read more
                  </span>
                  <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {article.publishDate}
                    <span className="w-8 border-t border-gray-200 dark:border-gray-800" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
