
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Gift, History, Sparkles, Users, BarChart3, Briefcase, ShoppingCart, ArrowRight, CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface FeatureListItemProps {
  icon: React.ElementType;
  text: string;
}

function FeatureListItem({ icon: Icon, text }: FeatureListItemProps) {
  return (
    <li className="flex items-start gap-3">
      <Icon className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
      <span className="text-muted-foreground">{text}</span>
    </li>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section - Full Width Background */}
      <section className="bg-card py-16 shadow-lg rounded-lg">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4">
            Welcome to Loyalty Leap!
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Elevate your customer relationships and reward loyalty. Loyalty Leap is your all-in-one platform for digital loyalty programs, personalized rewards, and insightful analytics.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link href="/signup">Get Started for Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Access Your Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* For Customers Section */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline font-semibold text-foreground mb-2">Transforming Loyalty for Customers</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Say goodbye to paper punch cards and hello to seamless digital rewards!</p>
          </div>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <h3 className="text-2xl font-headline font-semibold text-primary flex items-center gap-2">
                <Users className="h-7 w-7" /> Your Personalized Loyalty Hub
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                With Loyalty Leap, managing your rewards across all your favorite enrolled businesses is effortless:
              </p>
              <ul className="space-y-4">
                <FeatureListItem icon={CreditCard} text="Single account point collection across businesses." />
                <FeatureListItem icon={Gift} text="Redeem exciting rewards from any participating partner." />
                <FeatureListItem icon={History} text="Unified tracking for all purchases, points, and redemptions." />
                <FeatureListItem icon={Sparkles} text="Receive personalized offers and deals tailored to you." />
              </ul>
              <Button variant="secondary" asChild>
                  <Link href="/loyalty">Explore Your Loyalty Hub <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="rounded-lg overflow-hidden shadow-xl">
              <Image 
                src="https://placehold.co/600x450.png" 
                alt="Customer using Loyalty Leap app on phone" 
                width={600} 
                height={450} 
                className="object-cover w-full h-full"
                data-ai-hint="mobile app user" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* For Businesses Section - Full Width Background for Card */}
      <section className="py-10 bg-card rounded-lg shadow-lg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline font-semibold text-foreground mb-2">Empowering Businesses</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Build stronger customer relationships and drive growth with our powerful platform.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="rounded-lg overflow-hidden shadow-xl md:order-last">
              <Image 
                src="https://placehold.co/600x450.png" 
                alt="Business dashboard analytics on Loyalty Leap" 
                width={600} 
                height={450} 
                className="object-cover w-full h-full"
                data-ai-hint="business dashboard computer"
              />
            </div>
            <div className="space-y-6 md:order-first">
              <h3 className="text-2xl font-headline font-semibold text-primary flex items-center gap-2">
                <Briefcase className="h-7 w-7" /> Tools for Growth
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Loyalty Leap provides businesses with the tools to:
              </p>
              <ul className="space-y-4">
                <FeatureListItem icon={BarChart3} text="Effortlessly create and manage digital loyalty programs." />
                <FeatureListItem icon={ShoppingCart} text="Identify customers, record purchases, and award points." />
                <FeatureListItem icon={Users} text="Access a dashboard to view enrolled users and their activity." />
                <FeatureListItem icon={Sparkles} text="Gain insights to understand customer behavior and tailor offers." />
              </ul>
              <Button variant="secondary" asChild>
                  <Link href="/admin/login">Access Business Portal <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-12 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-headline font-semibold text-foreground mb-4">Ready to Leap into Loyalty?</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Join users and businesses benefiting from a smarter way to manage loyalty.
          </p>
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/signup">Sign Up Today &rarr;</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
