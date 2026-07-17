import AssetDetail from '../../../_components/assets/asset-detail';

export const metadata = { title: 'Asset Detail' };

export default async function Page({ params }) {
  const { id } = await params;
  return <AssetDetail assetId={id} />;
}
