import Head from "next/head";
import prisma from "../lib/prisma";
import { getSessionFromRequest } from "../lib/auth";
import Dashboard from "../components/Dashboard";

export default function DashboardPage({ user }) {
  return (
    <>
      <Head>
        <title>Creator Dashboard — Sample.fm</title>
      </Head>
      <Dashboard initialUser={user} />
    </>
  );
}

export async function getServerSideProps({ req }) {
  const session = getSessionFromRequest(req);

  if (!session || !session.userId) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const dbUser = await prisma.user.findUnique({ where: { id: session.userId } });

  if (!dbUser) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        is_pro: dbUser.is_pro,
        custom_domain: dbUser.custom_domain || null,
        created_at: dbUser.created_at.toISOString(),
      },
    },
  };
}
