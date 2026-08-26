import dynamic from "next/dynamic";
const AdminGuard = dynamic(() => import("@/app/components/AdminGuard").then(m => ({ default: m.AdminGuard })));
export default function AdminPage() { return <AdminGuard />; }

export const metadata = {
  title: 'Pitchside Manage X7k9 | The Touchline Dribble',
  description: 'Explore Pitchside Manage X7k9 on The Touchline Dribble, your go-to pitch for the beautiful game.',
  robots: { index: false, follow: false },
};
