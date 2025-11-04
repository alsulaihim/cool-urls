import { Badge } from '@/components/ui/badge';

export type PaymentStatus = 'succeeded' | 'failed' | 'pending' | 'refunded';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const variants: Record<PaymentStatus, { variant: any; label: string; className?: string }> = {
    succeeded: { variant: 'default', label: 'Succeeded', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
    failed: { variant: 'destructive', label: 'Failed' },
    pending: { variant: 'secondary', label: 'Pending', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' },
    refunded: { variant: 'secondary', label: 'Refunded', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
  };

  const config = variants[status] || variants.pending;

  return (
    <Badge variant={config.variant} className={`${config.className || ''} ${className || ''}`}>
      {config.label}
    </Badge>
  );
}
