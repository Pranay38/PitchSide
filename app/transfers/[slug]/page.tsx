import type { Metadata } from "next";
import { TransferDossierPage as TransferDossierPageOriginal } from "@/app/pages/TransferDossierPage";

export const metadata: Metadata = {
  title: "Transfer Dossier",
  description:
    "In-depth transfer analysis with reliability ratings, contract details, and tactical fit assessment.",
};

export default function TransferDossierPage() {
  return <TransferDossierPageOriginal />;
}
