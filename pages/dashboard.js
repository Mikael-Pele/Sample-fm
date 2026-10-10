import Head from "next/head";
import prisma from "../lib/prisma";
import { getSessionFromRequest } from "../lib/auth";
import { ensurePlanCurrent, getAccessStatus, trialEndsAt } from "../lib/plans";
import Dashboard from "../components/Dashboard";
import { getLocalPrice, pricingCountryFromRequest } from "../lib/localPrice";

export default function DashboardPage({ user, price }) {
  return (
    <>
      <Head>
        <title>Creator Dashboard — Droppa.fm</title>
      </Head>
      <Dashboard initialUser={user} price={price} />
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

  return {
    props: {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        is_pro: dbUser.is_pro,
        email_verified: dbUser.email_verified,
        plan: dbUser.plan || "free",
        billing_interval: dbUser.billing_interval || null,
        plan_expires_at: dbUser.plan_expires_at ? dbUser.plan_expires_at.toISOString() : null,
        custom_domain: dbUser.custom_domain || null,
        created_at: dbUser.created_at.toISOString(),
        access_status: getAccessStatus(dbUser),
        trial_ends_at: trialEndsAt(dbUser).toISOString(),
      },
      price: getLocalPrice(pricingCountryFromRequest(req, query)),
    },
  };
}
