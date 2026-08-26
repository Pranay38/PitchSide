import dynamic from "next/dynamic";
const SignUpPage = dynamic(() => import("@/app/components/ui/login-1"));
export default function SignUp() { return <SignUpPage />; }

export const metadata = {
  title: '[[...Sign Up]] | The Touchline Dribble',
  description: 'Explore [[...Sign Up]] on The Touchline Dribble, your go-to pitch for the beautiful game.',
  robots: { index: false, follow: false },
};
