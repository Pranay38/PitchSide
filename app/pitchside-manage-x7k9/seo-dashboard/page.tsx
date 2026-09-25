'use client';

import { useState } from 'react';
import { GSCClient, parseGSCExport, GSCQuery } from '@/lib/gsc-client';

export default function SEODashboard() {
  const [data, setData] = useState<GSCQuery[]>([]);
  const [client] = useState(() => new GSCClient({ siteUrl: 'https://www.thetouchlinedribble.in/' }));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const parsed = parseGSCExport(csv);
      client.loadFromJSON(parsed);
      setData(parsed);
    };
    reader.readAsText(file);
  };

  const strikingDistance = data.filter(q => q.position >= 8 && q.position <= 20).sort((a,b) => b.impressions - a.impressions).slice(0, 10);
  const lowCtrPages = data.filter(q => q.position >= 3 && q.position <= 10 && q.ctr < 0.05).sort((a,b) => b.impressions - a.impressions).slice(0, 10);

  const getPositionColor = (pos: number) => {
    if (pos <= 5) return 'text-green-500';
    if (pos <= 12) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">SEO Dashboard</h1>
      
      {data.length === 0 ? (
        <div className="p-8 border border-gray-800 rounded-lg bg-[#0F172A] text-center">
          <h2 className="text-xl mb-4">Upload GSC Export (Queries)</h2>
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileUpload} 
            className="block w-full max-w-sm mx-auto text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-[#0F172A] border border-gray-800 rounded-lg">
              <div className="text-gray-400 text-sm">Total Impressions</div>
              <div className="text-2xl font-bold text-white">{data.reduce((acc, q) => acc + q.impressions, 0)}</div>
            </div>
            <div className="p-4 bg-[#0F172A] border border-gray-800 rounded-lg">
              <div className="text-gray-400 text-sm">Total Clicks</div>
              <div className="text-2xl font-bold text-white">{data.reduce((acc, q) => acc + q.clicks, 0)}</div>
            </div>
            <div className="p-4 bg-[#0F172A] border border-gray-800 rounded-lg">
              <div className="text-gray-400 text-sm">Avg CTR</div>
              <div className="text-2xl font-bold text-white">{((data.reduce((acc, q) => acc + q.ctr, 0) / data.length) * 100).toFixed(2)}%</div>
            </div>
            <div className="p-4 bg-[#0F172A] border border-gray-800 rounded-lg">
              <div className="text-gray-400 text-sm">Avg Position</div>
              <div className="text-2xl font-bold text-white">{(data.reduce((acc, q) => acc + q.position, 0) / data.length).toFixed(1)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 bg-[#0F172A] border border-gray-800 rounded-lg overflow-x-auto">
              <h2 className="text-xl font-bold text-white mb-4">Striking Distance (Pos 8-20)</h2>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-800">
                    <th className="pb-2">Query</th>
                    <th className="pb-2">Pos</th>
                    <th className="pb-2">Impr.</th>
                  </tr>
                </thead>
                <tbody>
                  {strikingDistance.map((q, i) => (
                    <tr key={i} className="border-b border-gray-800/50">
                      <td className="py-2 text-gray-300">{q.query}</td>
                      <td className={`py-2 font-bold ${getPositionColor(q.position)}`}>{q.position.toFixed(1)}</td>
                      <td className="py-2 text-gray-400">{q.impressions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-[#0F172A] border border-gray-800 rounded-lg overflow-x-auto">
              <h2 className="text-xl font-bold text-white mb-4">CTR Opportunities (Pos 3-10, Low CTR)</h2>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-800">
                    <th className="pb-2">Query</th>
                    <th className="pb-2">Pos</th>
                    <th className="pb-2">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {lowCtrPages.map((q, i) => (
                    <tr key={i} className="border-b border-gray-800/50">
                      <td className="py-2 text-gray-300">{q.query}</td>
                      <td className="py-2 text-gray-400">{q.position.toFixed(1)}</td>
                      <td className="py-2 text-yellow-500 font-bold">{(q.ctr * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
