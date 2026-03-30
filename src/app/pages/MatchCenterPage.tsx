import { useParams } from "@/lib/router-compat";
import { StadiumMatchCenter } from "../components/StadiumMatchCenter";
import { MatchPredictorWidget } from "../components/MatchPredictorWidget";
import { SEO } from "../components/SEO";

export function MatchCenterPage() {
  const { id } = useParams();

  if (!id) return <div>Match ID required</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <SEO 
        title="Live Match Center" 
        description="Follow the match live with the Stadium Experience center." 
      />
      
      <div className="mb-8">
        <h1 className="text-3xl font-black font-outfit text-[#0F172A] dark:text-white">Match Center</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Live tactical analysis, stats, and momentum.</p>
      </div>

      <StadiumMatchCenter matchId={id} />

      <div className="mt-16 mb-6">
        <h2 className="text-2xl font-black font-outfit text-[#0F172A] dark:text-white">Predict & Win</h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Test your knowledge against other fans in the predictor gameweek league.</p>
      </div>
      <MatchPredictorWidget />
    </div>
  );
}
