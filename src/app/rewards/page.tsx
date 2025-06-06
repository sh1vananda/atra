import { RewardCard } from '@/components/rewards/RewardCard';
import { Gift, Coffee, Percent, ShoppingBag } from 'lucide-react';

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
