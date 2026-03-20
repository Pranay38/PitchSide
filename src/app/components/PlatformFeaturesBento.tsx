import { Link } from "react-router";
import { BookOpen, Repeat2, Activity, Newspaper, Search } from "lucide-react";
import { GlowingEffect } from "./ui/glowing-effect";
import { cn } from "./ui/utils";

export function PlatformFeaturesBento() {
  return (
    <section className="mt-24 mb-24 w-full relative">
      <div className="mb-8">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A] mb-2">
          Explore Platform
        </p>
        <h2 className="text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
          Everything you need for the beautiful game.
        </h2>
      </div>

      <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2 p-0 m-0">
        <GridItem
          area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
          icon={<BookOpen className="h-5 w-5 text-[#16A34A]" />}
          title="Deep Reads & Narratives"
          description="Immersive longform stories built for slower reading. Step away from the breaking news cycle."
          href="/stories"
        />
        <GridItem
          area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
          icon={<Repeat2 className="h-5 w-5 text-[#16A34A]" />}
          title="Transfer Reliability Hub"
          description="Track the market with confidence. We vet rumors so you don't have to guess who to believe."
          href="/transfers"
        />
        <GridItem
          area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
          icon={<Activity className="h-5 w-5 text-[#16A34A]" />}
          title="Stadium Match Center"
          description="Experience games with live 2D pitch lineups, neon head-to-head stats, and real-time commentary timelines."
          href="/match-center/placeholder"
        />
        <GridItem
          area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
          icon={<Newspaper className="h-5 w-5 text-[#16A34A]" />}
          title="Daily Briefing"
          description="Get up to speed instantly with the News Ticker, Rumor Mill, and Manager Pressure gauges."
          href="/topic/premier-league"
        />
        <GridItem
          area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
          icon={<Search className="h-5 w-5 text-[#16A34A]" />}
          title="The Archive"
          description="Use the archive as the site's real search engine. Filter by club, topic, format, and era."
          href="/archive"
        />
      </ul>
    </section>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  href: string;
}

const GridItem = ({ area, icon, title, description, href }: GridItemProps) => {
  return (
    <li className={cn("min-h-[14rem] list-none", area)}>
      <Link to={href} className="block relative h-full rounded-[1.25rem] border-[0.75px] border-gray-200 dark:border-gray-800 p-2 md:rounded-[1.5rem] md:p-3 group">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] border-white/10 glass-card bg-white dark:bg-[#0F172A] p-6 shadow-sm dark:shadow-none md:p-6 transition-all duration-300 group-hover:bg-gray-50 dark:group-hover:bg-[#1E293B]">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-xl border-[0.75px] border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-white/5 p-2.5">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl font-black font-outfit text-balance text-[#0F172A] dark:text-white group-hover:text-[#16A34A] transition-colors">
                {title}
              </h3>
              <p className="font-sans text-sm leading-[1.375rem] text-gray-500 dark:text-gray-400">
                {description}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
};
