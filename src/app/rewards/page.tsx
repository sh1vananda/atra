
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { RewardCard } from '@/components/rewards/RewardCard';
import { Gift, Coffee, Percent, ShoppingBag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const mockRewards = [
  {
    id: '1',
    title: 'Free Coffee',
    description: 'Enjoy a complimentary cup of our signature blend coffee.',
    pointsCost: 100,
    icon: <Coffee className="h-12 w-12 text-primary" />,
    image: 'https://placehold.co/400x300.png',
    imageHint: 'coffee cup',
    category: 'Beverages'
  },
  {
    id: '2',
    title: '10% Off Next Purchase',
    description: 'Get 10% off your entire next purchase in-store.',
    pointsCost: 250,
    icon: <Percent className="h-12 w-12 text-primary" />,
    image: 'https://placehold.co/400x300.png',
    imageHint: 'discount tag',
    category: 'Discounts'
  },
  {
    id: '3',
    title: 'Exclusive Tote Bag',
    description: 'A stylish and reusable tote bag, exclusive for members.',
    pointsCost: 500,
    icon: <ShoppingBag className="h-12 w-12 text-primary" />,
    image: 'https://placehold.co/400x300.png',
    imageHint: 'tote bag',
    category: 'Merchandise'
  },
  {
    id: '4',
    title: '$5 Voucher',
    description: 'A $5 voucher applicable on any item in the store.',
    pointsCost: 300,
    icon: <Gift className="h-12 w-12 text-primary" />,
    image: 'https://placehold.co/400x300.png',
    imageHint: 'gift voucher',
    category: 'Vouchers'
  },
];

export default function RewardsPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/rewards');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <Skeleton className="h-10 w-1/2 mx-auto mb-2" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Rewards Catalog</h1>
        <p className="text-lg text-muted-foreground">Redeem your hard-earned points for amazing rewards!</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockRewards.map((reward) => (
          <RewardCard key={reward.id} reward={reward} />
        ))}
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="flex flex-col space-y-3 p-4 border rounded-lg shadow">
      <Skeleton className="h-[125px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
      <Skeleton className="h-8 w-[100px] self-end" />
    </div>
  );
}
