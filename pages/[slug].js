import prisma from "../lib/prisma";
import { extractCountryFromHeaders, isAfricanCountry } from "../lib/geo";
import SmartLinkPage from "../components/SmartLinkPage";

export default function SlugPage({ smartlink, isAfricanFan, fanCountry, ownerIsPro }) {
  return (
    <SmartLinkPage
      smartlink={smartlink}
      isAfricanFan={isAfricanFan}
      fanCountry={fanCountry}
      ownerIsPro={ownerIsPro}
    />
  );
}

export async function getServerSideProps({ params, req, query }) {
  const { slug } = params;

  const smartlink = await prisma.smartLink.findUnique({
    where: { slug },
    include: {
      user: {
        select: { is_pro: true },
      },
    },
  });

  if (!smartlink) {
    return { notFound: true };
  }

  // Real deployments resolve the fan's country from Vercel/Cloudflare edge
  // geo headers. A `?demo_country=NG` query param is supported for local
  // development / demoing the geo-targeting behavior without a real edge
  // network in front of the app.
  const headerCountry = extractCountryFromHeaders(req.headers);
  const fanCountry =
    headerCountry && headerCountry !== "UNKNOWN"
      ? headerCountry
      : (query.demo_country || "UNKNOWN").toString().toUpperCase();

  return {
    props: {
      smartlink: {
        id: smartlink.id,
        slug: smartlink.slug,
        artist_name: smartlink.artist_name,
        track_title: smartlink.track_title,
        release_date: smartlink.release_date.toISOString(),
        artwork_url: smartlink.artwork_url,
        artwork_urls: smartlink.artwork_urls
          ? smartlink.artwork_urls.split(",").filter(Boolean)
          : [smartlink.artwork_url],
        is_presave: smartlink.is_presave,
        url_audiomack: smartlink.url_audiomack,
        url_boomplay: smartlink.url_boomplay,
        url_spotify: smartlink.url_spotify,
        url_apple: smartlink.url_apple,
        url_youtube: smartlink.url_youtube,
      },
      isAfricanFan: isAfricanCountry(fanCountry),
      fanCountry,
      ownerIsPro: Boolean(smartlink.user.is_pro),
    },
  };
}
