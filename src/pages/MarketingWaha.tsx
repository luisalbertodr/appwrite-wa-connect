
import { CampaignsTab } from '@/components/CampaignsTab';

const MarketingWaha = () => {
  return (
    <div>
      <div className="mb-6">
          <h1 className="text-3xl font-bold">Marketing WhatsApp</h1>
          <p className="text-muted-foreground">
            Gestiona campañas de WhatsApp con segmentación avanzada.
          </p>
      </div>
      <CampaignsTab />
    </div>
  );
};

export default MarketingWaha;
