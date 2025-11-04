import { Badge } from '@/components/ui/badge';

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'expired' | 'trialing';

interface SubscriptionBadgeProps {
  status: SubscriptionStatus;
  className?: string;
}

export function SubscriptionBadge({ status, className }: SubscriptionBadgeProps) {
  const variants: Record<SubscriptionStatus, { variant: any; label: string }> = {
    active: { variant: 'default', label: 'Active' },
    trialing: { variant: 'secondary', label: 'Trial' },
    past_due: { variant: 'destructive', label: 'Past Due' },
    cancelled: { variant: 'secondary', label: 'Cancelled' },
    expired: { variant: 'secondary', label: 'Expired' },
  };

  const config = variants[status] || variants.active;

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
