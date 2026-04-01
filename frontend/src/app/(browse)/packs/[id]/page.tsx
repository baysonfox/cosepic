import { notFound } from "next/navigation";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { LazyImage } from "@/components/media/lazy-image";
import { PackDetailClient } from "@/components/pack/pack-detail-client";
import { serverThumbnailUrl } from "@/lib/api/assets";
import { serverFetch } from "@/lib/api/client";
import { listAssets } from "@/lib/api/assets";
import { getPack } from "@/lib/api/packs";

export default async function PackDetailPage(
  props: PageProps<"/packs/[id]">,
) {
  const { id } = await props.params;
  const packId = Number(id);

  if (!Number.isFinite(packId)) {
    notFound();
  }

  let pack;
  let assets;
  try {
    [pack, assets] = await Promise.all([
      getPack(packId, serverFetch),
      listAssets(packId, serverFetch),
    ]);
  } catch {
    notFound();
  }

  const coverSrc = pack.cover_asset_id
    ? serverThumbnailUrl(pack.cover_asset_id)
    : null;

  return (
    <div className="space-y-6">
      <BreadcrumbNav
        items={[
          { label: "Packs", href: "/packs" },
          { label: pack.title },
        ]}
      />

      {coverSrc && (
        <LazyImage
          src={coverSrc}
          alt={pack.title}
          className="w-full rounded-xl border border-border"
          aspectRatio="16 / 9"
        />
      )}

      <PackDetailClient pack={pack} assets={assets} />
    </div>
  );
}
