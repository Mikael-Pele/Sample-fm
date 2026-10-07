import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import SiteFooter from "../components/SiteFooter";
import { DroppaFmMark } from "../components/PlatformIcons";
import InstallAppPrompt from "../components/InstallAppPrompt";
import prisma from "../lib/prisma";
import { extractCountryFromHeaders } from "../lib/geo";
import { getRegionForCountry, REGION_PRICING } from "../lib/plans";

function getAppHost() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return null;
  try {
    return new URL(appUrl).host.toLowerCase();
  } catch {
    return null;
  }
}

export async function getServerSideProps({ req, query }) {
  const requestHost = (req.headers.host || "").toLowerCase().split(":")[0];
  const appHost = getAppHost();
  const isKnownAppHost =
    !appHost || requestHost === appHost || requestHost.endsWith(".vercel.app") || requestHost === "localhost";

  if (!isKnownAppHost) {
    const owner = await prisma.user.findFirst({ where: { custom_domain: requestHost } });

    if (owner) {
      const latestLink = await prisma.smartLink.findFirst({
        where: { user_id: owner.id },
        orderBy: { created_at: "desc" },
      });

      if (latestLink) {
        return { redirect: { destination: `/${latestLink.slug}`, permanent: false } };
      }
    }
  }

  const headerCountry = extractCountryFromHeaders(req.headers);
  const country =
    headerCountry && headerCountry !==
