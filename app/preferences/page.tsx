import type { Metadata } from "next";
import PreferencesPage from "@/app/preferences/page";

export const metadata: Metadata = {
  title: "Email preferences",
  robots: { index: false, follow: false },
};

export default PreferencesPage;
