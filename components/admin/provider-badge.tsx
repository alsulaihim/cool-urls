import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';

interface ProviderBadgeProps {
  provider: 'stripe' | 'paypal' | 'none';
  className?: string;
}

export function ProviderBadge({ provider, className }: ProviderBadgeProps) {
  const config = {
    stripe: {
      label: 'Stripe',
      className: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
    },
    paypal: {
      label: 'PayPal',
      className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
    },
    none: {
      label: 'Free',
      className: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
    },
  };

  const providerConfig = config[provider] || config.none;

  return (
    <Badge className={`${providerConfig.className} ${className || ''}`}>
      <CreditCard className="w-3 h-3 mr-1" />
      {providerConfig.label}
    </Badge>
  );
}
