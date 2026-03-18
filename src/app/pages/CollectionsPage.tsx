import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  Layers3,
  Library,
  Loader2,
  Sparkles,
} from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PageState } from "../components/PageState";
import { formatReadTimeTotal, hashString, sumReadTimeMinutes } from "../lib/contentMetrics";

interface CollectionSummary {
  id: string;
  title: string;
  description: string;
  emoji: string;
  postCount: number;
  createdAt: string;
  updatedAt?: string;
}

interface CollectionPost {
  id: string;
  title: string;
  excerpt?: string;
  coverImage?: string;
  date?: string;
  category?: string;
  readTime?: string;
  club?: string;
  tags?: string[];
}

interface CollectionDetail extends CollectionSummary {
  posts: CollectionPost[];
  postIds: string[];
}

const COLLECTION_THEMES = [
  { from: "#0F172A", to: "#16A34A" },
  { from: "#1E293B", to: "#F59E0B" },
  { from: "#111827", to: "#0EA5E9" },
  { from: "#172554", to: "#22C55E" },
  { from: "#3F1D2E", to: "#F97316" },
];

function getCollectionTheme(collection: CollectionSummary) {
  return COLLECTION_THEMES[hashString(`${collection.title}-${collection.emoji}`) % COLLECTION_THEMES.length];
}

function getFallbackCover(collection: CollectionSummary): string {
  const theme = getCollectionTheme(collection);
  const title = encodeURIComponent(collection.title);
  return `https://dummyimage.com/1200x800/${theme.from.replace("#", "")}/${theme.to.replace("#", "")}.png&text=${title}`;
}

function normalizeCollectionDetail(detail: CollectionDetail): CollectionDetail {
  const orderedPosts = [...detail.posts].sort((left, right) => {
    const leftIndex = detail.postIds.indexOf(left.id);
    const rightIndex = detail.postIds.indexOf(right.id);
    return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex)
      - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
  });

  return {
    ...detail,
    postCount: detail.postCount || orderedPosts.length,
    posts: orderedPosts,
  };
}

function CollectionCard({
  collection,
  detail,
  onOpen,
  featured = false,
}: {
  collection: CollectionSummary;
  detail?: CollectionDetail;
  onOpen: (id: string) => void;
  featured?: boolean;
}) {
  const theme = getCollectionTheme(collection);
  const coverImage = detail?.posts[0]?.coverImage || getFallbackCover(collection);
  const totalMinutes = detail ? sumReadTimeMinutes(detail.posts) : 0;
  const startHere = detail?.posts[0];

  return (
    <button
      type="button"
      onClick={() => onOpen(collection.id)}
      className={`group relative overflow-hidden rounded-[2rem] border border-gray-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#16A34A]/30 hover:shadow-xl dark:border-gray-800 dark:bg-[#0F172A] ${
        featured ? "min-h-[420px]" : "min-h-[320px]"
      }`}
    >
      <div className="absolute inset-0">
        <img src={coverImage} alt={collection.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(180deg, transparent, ${theme.from}cc)` }}
        />
      </div>

      <div className="relative flex h-full flex-col justify-between p-6 text-white md:p-7">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/12 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-sm">
              {featured ? "Featured collection" : "Reading list"}
            </span>
            <span className="rounded-full bg-black/20 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
              {collection.postCount} article{collection.postCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-6 max-w-2xl">
            <p className="text-4xl leading-none">{collection.emoji}</p>
            <h2 className={`mt-4 font-black font-outfit leading-[0.95] ${featured ? "text-4xl md:text-5xl" : "text-3xl"}`}>
              {collection.title}
            </h2>
            {collection.description && (
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/78 md:text-base">
                {collection.description}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60">Total time</p>
              <p className="mt-2 text-lg font-black font-outfit">{formatReadTimeTotal(totalMinutes, "Curated read")}</p>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60">Start here</p>
              <p className="mt-2 text-sm font-bold leading-5 text-white/92">
                {startHere?.title || "First article in the reading order"}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60">Updated</p>
              <p className="mt-2 text-sm font-bold text-white/92">
                {new Date(collection.updatedAt || collection.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-[#bbf7d0]">
            Open reading list
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </button>
  );
}

function CollectionCardShell({
  collection,
  detail,
  detailLoadingId,
  onOpen,
  featured = false,
}: {
  collection: CollectionSummary;
  detail?: CollectionDetail;
  detailLoadingId: string | null;
  onOpen: (id: string) => void;
  featured?: boolean;
}) {
  return (
    <div className="relative">
      <CollectionCard
        collection={collection}
        detail={detail}
        onOpen={onOpen}
        featured={featured}
      />
      {detailLoadingId === collection.id && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[2rem] bg-[#0F172A]/45 text-white backdrop-blur-sm">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
    </div>
  );
}

export function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [collectionDetails, setCollectionDetails] = useState<Record<string, CollectionDetail>>({});
  const [activeCollection, setActiveCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);

  const fetchCollectionDetail = useCallback(async (id: string): Promise<CollectionDetail | null> => {
    try {
      const res = await fetch(`/api/collections?id=${id}`);
      if (!res.ok) return null;
      const nextDetail = normalizeCollectionDetail(await res.json());
      setCollectionDetails((current) => ({ ...current, [id]: nextDetail }));
      return nextDetail;
    } catch {
      return null;
    }
  }, []);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/collections");
      if (!res.ok) {
        setCollections([]);
        setLoading(false);
        return;
      }

      const nextCollections = await res.json() as CollectionSummary[];
      setCollections(nextCollections);
      setLoading(false);

      nextCollections.forEach((collection) => {
        void fetchCollectionDetail(collection.id);
      });
    } catch {
      setCollections([]);
      setLoading(false);
    }
  }, [fetchCollectionDetail]);

  useEffect(() => {
    void fetchCollections();
  }, [fetchCollections]);

  const openCollection = async (id: string) => {
    if (collectionDetails[id]) {
      setActiveCollection(collectionDetails[id]);
      return;
    }

    setDetailLoadingId(id);
    const detail = await fetchCollectionDetail(id);
    setDetailLoadingId(null);
    if (detail) {
      setActiveCollection(detail);
    }
  };

  const featuredCollections = useMemo(() => (
    [...collections].sort((left, right) => right.postCount - left.postCount).slice(0, 3)
  ), [collections]);
  const listCollections = useMemo(() => (
    collections.filter((collection) => !featuredCollections.some((featured) => featured.id === collection.id))
  ), [collections, featuredCollections]);

  if (activeCollection) {
    const collection = activeCollection;
    const theme = getCollectionTheme(collection);
    const coverImage = collection.posts[0]?.coverImage || getFallbackCover(collection);
    const startHere = collection.posts[0];
    const followOnPosts = collection.posts.slice(1);
    const totalMinutes = sumReadTimeMinutes(collection.posts);

    return (
      <div className="page-atmosphere min-h-screen transition-colors duration-300">
        <SEO
          title={`${collection.title} | Reading Lists`}
          description={collection.description || `A curated collection of ${collection.posts.length} articles on The Touchline Dribble.`}
          type="website"
          url="https://pitchside-orcin.vercel.app/collections"
        />
        <Header />

        <main>
          <section className="relative overflow-hidden">
            <div className="absolute inset-0">
              <img src={coverImage} alt={collection.title} className="h-full w-full object-cover" />
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(180deg, ${theme.from}66, ${theme.from}dd)` }}
              />
            </div>

            <div className="relative mx-auto w-full max-w-[1180px] px-4 py-10 text-white sm:px-6 md:py-16">
              <button
                type="button"
                onClick={() => setActiveCollection(null)}
                className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-white/80 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to reading lists
              </button>

              <div className="mt-8 max-w-4xl">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-white/12 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                    Reading list
                  </span>
                  <span className="rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
                    {collection.postCount} article{collection.postCount === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-6 text-5xl leading-none">{collection.emoji}</p>
                <h1 className="mt-5 text-4xl font-black font-outfit leading-[0.92] md:text-6xl">
                  {collection.title}
                </h1>
                {collection.description && (
                  <p className="mt-5 max-w-3xl text-base leading-7 text-white/80 md:text-lg">
                    {collection.description}
                  </p>
                )}

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-4 backdrop-blur-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60">Estimated time</p>
                    <p className="mt-2 text-lg font-black font-outfit">{formatReadTimeTotal(totalMinutes, "Quick read")}</p>
                  </div>
                  <div className="rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-4 backdrop-blur-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60">Start here</p>
                    <p className="mt-2 text-sm font-bold leading-5 text-white/92">{startHere?.title || "Opening article"}</p>
                  </div>
                  <div className="rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-4 backdrop-blur-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60">Published order</p>
                    <p className="mt-2 text-sm font-bold text-white/92">Curated to read front to back</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6">
            {startHere ? (
              <div className="space-y-10">
                <div className="section-surface rounded-[2rem] border border-gray-200 p-6 shadow-sm dark:border-gray-800 md:p-8">
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
                        Start Here
                      </p>
                      <h2 className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                        The first piece in the reading order
                      </h2>
                    </div>
                    <Link
                      to={`/post/${startHere.id}`}
                      className="inline-flex items-center gap-2 rounded-full bg-[#16A34A] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#15803d]"
                    >
                      Open first article
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="overflow-hidden rounded-[1.75rem]">
                      <img src={startHere.coverImage || coverImage} alt={startHere.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#16A34A]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">
                            Start here
                          </span>
                          {startHere.readTime && (
                            <span className="rounded-full bg-[#F8FAFC] px-3 py-1 text-[11px] font-semibold text-[#475569] dark:bg-[#08111f] dark:text-gray-300">
                              {startHere.readTime}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-5 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                          {startHere.title}
                        </h3>
                        {startHere.excerpt && (
                          <p className="mt-4 text-base leading-7 text-[#64748B] dark:text-gray-400">
                            {startHere.excerpt}
                          </p>
                        )}
                      </div>

                      <div className="mt-8 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[1.25rem] bg-[#F8FAFC] px-4 py-3 text-sm text-[#475569] dark:bg-[#08111f] dark:text-gray-300">
                          {startHere.club || startHere.category || "Editorial"}
                        </div>
                        <div className="rounded-[1.25rem] bg-[#F8FAFC] px-4 py-3 text-sm text-[#475569] dark:bg-[#08111f] dark:text-gray-300">
                          {startHere.date || "Freshly added"}
                        </div>
                        <div className="rounded-[1.25rem] bg-[#F8FAFC] px-4 py-3 text-sm text-[#475569] dark:bg-[#08111f] dark:text-gray-300">
                          Read this before the rest
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {followOnPosts.length > 0 && (
                  <section className="section-surface rounded-[2rem] border border-gray-200 p-6 shadow-sm dark:border-gray-800 md:p-8">
                    <div className="mb-6">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
                        Reading Order
                      </p>
                      <h2 className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                        Continue through the list
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {followOnPosts.map((post, index) => (
                        <Link
                          key={post.id}
                          to={`/post/${post.id}`}
                          className="group block rounded-[1.5rem] border border-gray-200 bg-white p-5 transition-colors hover:border-[#16A34A]/30 hover:bg-[#16A34A]/5 dark:border-gray-800 dark:bg-[#0F172A]"
                        >
                          <div className="flex gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#16A34A]/10 text-sm font-black text-[#16A34A]">
                              {index + 2}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#94A3B8]">
                                {post.readTime && <span>{post.readTime}</span>}
                                {post.date && (
                                  <>
                                    <span>•</span>
                                    <span>{post.date}</span>
                                  </>
                                )}
                              </div>
                              <h3 className="mt-2 text-xl font-black font-outfit text-[#0F172A] transition-colors group-hover:text-[#16A34A] dark:text-white">
                                {post.title}
                              </h3>
                              {post.excerpt && (
                                <p className="mt-2 text-sm leading-6 text-[#64748B] dark:text-gray-400">
                                  {post.excerpt}
                                </p>
                              )}
                            </div>
                            <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[#16A34A] transition-transform group-hover:translate-x-1" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <PageState
                icon={BookOpen}
                eyebrow="Reading Lists"
                title="This collection is empty"
                description="Add articles to this reading list and the guided reading flow will appear here."
              />
            )}
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="page-atmosphere min-h-screen transition-colors duration-300">
      <SEO
        title="Reading Lists"
        description="Curated article collections from The Touchline Dribble — deep dives, tactical breakdowns, and more."
        type="website"
        url="https://pitchside-orcin.vercel.app/collections"
      />
      <Header />

      <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
        <section className="editorial-hero rounded-[2rem] border border-gray-200 p-6 shadow-xl shadow-[#0F172A]/[0.04] dark:border-gray-800 md:p-8">
          <div className="pointer-events-none absolute inset-0 grid-fade opacity-40" />
          <div className="pointer-events-none absolute left-0 top-0 h-48 w-48 rounded-full bg-[#16A34A]/10 blur-3xl" />
          <div className="relative">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
              Reading Lists
            </p>
          </div>

          <div className="relative mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-black font-outfit leading-tight text-[#0F172A] dark:text-white md:text-5xl">
                Editorial reading lists with a clearer entry point, stronger covers, and a real read order.
              </h1>
              <p className="mt-3 text-base leading-7 text-[#64748B] dark:text-gray-400">
                These are not just saved bundles. Each list should feel like a guided route through a football idea, with a featured opening piece and a cleaner sense of what comes next.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[340px]">
              <div className="rounded-2xl bg-[#16A34A]/8 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">Lists</p>
                <p className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">{collections.length}</p>
              </div>
              <div className="rounded-2xl bg-[#0F172A]/5 p-4 dark:bg-white/5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:text-gray-400">Featured</p>
                <p className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">{featuredCollections.length}</p>
              </div>
              <div className="rounded-2xl bg-[#0F172A]/5 p-4 dark:bg-white/5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:text-gray-400">Focus</p>
                <p className="mt-2 text-base font-black font-outfit text-[#0F172A] dark:text-white">Curated, not generic</p>
              </div>
            </div>
          </div>

          <div className="relative mt-7 flex flex-wrap gap-2">
            <div className="filter-chip">
              <Sparkles className="h-3.5 w-3.5" />
              Featured covers
            </div>
            <div className="filter-chip">
              <Clock className="h-3.5 w-3.5" />
              Total read time
            </div>
            <div className="filter-chip">
              <Layers3 className="h-3.5 w-3.5" />
              Start here entry point
            </div>
          </div>
        </section>

        <section className="mt-10">
          {loading ? (
            <div className="flex flex-col items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#16A34A]" />
              <p className="mt-3 text-sm text-[#64748B] dark:text-gray-400">Loading reading lists...</p>
            </div>
          ) : collections.length === 0 ? (
            <PageState
              icon={Library}
              eyebrow="Reading Lists"
              title="No collections yet"
              description="Collections will appear here when the editorial team builds the first guided reading lists."
            />
          ) : (
            <div className="space-y-10">
              {featuredCollections.length > 0 && (
                <section>
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
                        Featured Collections
                      </p>
                      <h2 className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                        Stronger starting points into the archive
                      </h2>
                    </div>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <CollectionCardShell
                      collection={featuredCollections[0]}
                      detail={collectionDetails[featuredCollections[0].id]}
                      detailLoadingId={detailLoadingId}
                      onOpen={openCollection}
                      featured
                    />

                    <div className="grid gap-6">
                      {featuredCollections.slice(1).map((collection) => (
                        <CollectionCardShell
                          key={collection.id}
                          collection={collection}
                          detail={collectionDetails[collection.id]}
                          detailLoadingId={detailLoadingId}
                          onOpen={openCollection}
                        />
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {listCollections.length > 0 && (
                <section>
                  <div className="mb-6">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
                      All Lists
                    </p>
                    <h2 className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                      Browse the full shelf
                    </h2>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {listCollections.map((collection) => (
                      <CollectionCardShell
                        key={collection.id}
                        collection={collection}
                        detail={collectionDetails[collection.id]}
                        detailLoadingId={detailLoadingId}
                        onOpen={openCollection}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
