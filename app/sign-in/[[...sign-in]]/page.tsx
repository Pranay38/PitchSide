import dynamic from "next/dynamic";
const SignInPage = dynamic(() => import("@/app/components/ui/login-1"));
export default function SignIn() { return <SignInPage />; }

export const metadata = {
  title: '[[...Sign In]] | The Touchline Dribble',
  description: 'Explore [[...Sign In]] on The Touchline Dribble, your go-to pitch for the beautiful game.'
};
