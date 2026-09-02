import Head from "next/head";
import prisma from "../lib/prisma";
import { getSessionFromRequest } from "../lib/auth";
import { ensurePlanCurrent, getRegionForCountry } from "../lib/plans";
import { extractCountryFromHeaders } from "../lib/geo";
import Dashboard from "../components/Dashboard";

export default function DashboardPage({ user, pricingRegion }) {
  return (
    <>
      <Head>
        <title>Creator Dashboard — Sample.fm</title>
      </Head>
      <Dashboard initialUser={user} pricingRegion={pricingRegion} />
    </>
  );
}

export async function getServerSideProps({ req, query }) {
  const session = getSessionFromRequest(req);

  if (!session || !session.userId) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  let dbUser = await prisma.user.findUnique({ where: { id: session.userId } });

  if (!dbUser) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  dbUser = await ensurePlanCurrent(prisma, dbUser);

  // Regional (PPP-style) pricing: detected from the visitor's IP-geo header
  // in production. `?demo_country=` is supported for local dev/testing,
  // same pattern used on the fan-facing SmartLink page.
  const headerCountry = extractCountryFromHeaders(req.headers);
  const country =
    headerCountry && headerCountry !== "UNKNOWN"
      ? headerCountry
      : (query.demo_country || "").toString().toUpperCase() || null;
  // Someone who already paid keeps seeing the price they actually paid,
  // regardless of where they're browsing from today.
  const pricingRegion = dbUser.pricing_region || getRegionForCountry(country);

  return {
    props: {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        is_pro: dbUser.is_pro,
        plan: dbUser.plan || "free",
        billing_interval: dbUser.billing_interval || null,
        plan_expires_at: dbUser.plan_expires_at ? dbUser.plan_expires_at.toISOString() : null,
        custom_domain: dbUser.custom_domain || null,
        created_at: dbUser.created_at.toISOString(),
      },
      pricingRegion,
    },
  };
}
