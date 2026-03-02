import { Trophy } from "lucide-react";

const API_KEY = "7bbf2fad2c61ebe166e1633b964fcae3";

export function FixturesWidget() {
    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                    <Trophy className="w-4.5 h-4.5 text-[#16A34A]" />
                    Scores & Fixtures
                </h3>
            </div>

            {/* Iframe — loads standalone widget page */}
            <iframe
                src={`/widgets.html?key=${API_KEY}`}
                title="Scores & Fixtures"
                className="w-full border-0"
                style={{ minHeight: "550px", height: "550px" }}
                sandbox="allow-scripts allow-same-origin allow-popups"
            />
        </div>
    );
}
