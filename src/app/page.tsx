import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Gift, History, Sparkles, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  const features = [
    {
      title: 'Digital Loyalty Card',
      description: 'Collect points and stamps digitally. Never lose your card again!',
      href: '/loyalty',
      icon: <CreditCard className="h-8 w-8 text-primary" />,
      image: 'https://placehold.co/600x400.png',
      imageHint: 'loyalty card',
    },
    {
      title: 'Rewards Catalog',
      description: 'Browse and redeem exciting rewards with your earned points.',
      href: '/rewards',
      icon: <Gift className="h-8 w-8 text-primary" />,
      image: 'https://placehold.co/600x400.png',
      imageHint: 'gift rewards',
    },
    {
      title: 'Purchase History',
      description: 'Track your points, redemptions, and past visits all in one place.',
      href: '/history',
      icon: <History className="h-8 w-8 text-primary" />,
      image: 'https://placehold.co/600x400.png',
      imageHint: 'transaction history',
    },
    {
      title: 'Personalized Offers',
      description: 'Get special offers and recommendations tailored just for you.',
      href: '/offers',
      icon: <Sparkles className="h-8 w-8 text-primary" />,
      image: 'https://placehold.co/600x400.png',
      imageHint: 'special offer',
    },
  ];

  return (
    <div className="space-y-12">
      <section className="text-center py-12 bg-card rounded-lg shadow-md">
        <h1 className="text-4xl font-headline font-bold text-primary mb-4">
          Welcome to Loyalty Leap!
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Your one-stop platform for digital loyalty cards, exciting rewards, and personalized offers. Start earning today!
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {features.map((feature) => (
          <Card key={feature.title} className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-start gap-4">
              {feature.icon}
              <div>
                <CardTitle className="font-headline text-2xl">{feature.title}</CardTitle>
                <CardDescription className="mt-1">{feature.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video overflow-hidden rounded-md">
                 <Image src={feature.image} alt={feature.title} width={600} height={400} className="object-cover w-full h-full" data-ai-hint={feature.imageHint}/>
              </div>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href={feature.href}>
                  Go to {feature.title} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
