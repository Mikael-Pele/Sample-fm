import Link from "next/link";
import { ReportProblemTrigger } from "./ReportProblemModal";

export default function SiteFooter({ className = "" }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-base-muted ${className}`}
    >
      <Link href="/privacy" className="hover:text-white transition">
        Privacy Policy
      </Link>
      <Link href="/terms" className="hover:text-white transition">
        Terms of Use
      </Link>
      <Link href="/permissions" className="hover:text-white transition">
        Manage Permissions
      </Link>
      <ReportProblemTrigger className="hover:text-white transition" />
    </div>
  );
}
