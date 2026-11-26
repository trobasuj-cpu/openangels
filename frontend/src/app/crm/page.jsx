import KanbanBoard from "@/components/crm/KanbanBoard";
import { absoluteUrl } from "@/seo";

export const metadata = {
  title: "Fundraising CRM | OpenAngels",
  description: "Manage your private startup fundraising pipeline and investor outreach.",
  alternates: { canonical: absoluteUrl('/crm') },
  robots: { index: false, follow: false },
};

export default function CRM() {
  return <KanbanBoard />;
}
