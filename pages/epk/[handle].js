import Head from "next/head";
import Link from "next/link";
import prisma from "../../lib/prisma";
import { computeVerifiedStats, serializeEpk } from "../../lib/epk";
import EpkPublicView from "../../components/EpkPublicView";
import ThemeToggle from "../../components/ThemeToggle";
import { DroppaFmMark } from "../../components/PlatformIcons";

export default function EpkPage({ epk, stats }) {
  const name = epk.display_name || "Artist";
  return (
    <div className="min-h-[100dvh] bg-base-bg text-fg">
      <Head>
        <title>{`${name} — Press Kit | Droppa.fm`}</title>
        <meta name="description" content={epk.bio ? epk.bio.slice(0, 155) : `Electronic press kit for ${name}.`} />
        {epk.photo_url && <meta property="og:image" content={epk.photo_url} />}
      </Head>
      <ThemeToggle className="absolute top-4 right-4 z-20" />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <EpkPublicView epk={epk} stats={stats} />
        <footer className="mt-14 pt-6 border-t border-base-border flex items-center justify-center gap-2 text-xs text-base-muted">
          <DroppaFmMark size={16} className="rounded" />
          <Link href="/" className="hover:text-fg transition">
            Press kit made with Droppa.fm
          </Link>
        </footer>
      </main>
    </div>
  );
}

export async function getServerSideProps({ params }) {
  const handle = String(params.handle || "").toLowerCase();
  const profile = await prisma.epkProfile.findUnique({ where: { handle } });
  if (!profile || !profile.published) return { notFound: true };

  const stats = await computeVerifiedStats(prisma, profile.user_id);
  return { props: { epk: serializeEpk(profile), stats } };
}
