
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Gift, History, Sparkles, Users, BarChart3, Briefcase, ShoppingCart, ArrowRight, CheckCircle, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

interface FeatureListItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureListItemProps) {
  return (
    <Card className="text-center bg-card shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1">
      <CardHeader className="items-center">
        <div className="p-4 bg-primary/10 rounded-full mb-3 inline-block">
         <Icon className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="font-headline text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base leading-relaxed">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Hero Section */}
      <section className="bg-card py-16 sm:py-24 shadow-lg rounded-lg overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <ShieldCheck className="h-20 w-20 sm:h-24 sm:w-24 text-primary mx-auto mb-6 opacity-80" />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-primary mb-6">
            Welcome to ATRA!
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Elevate your customer relationships and reward loyalty. ATRA is your all-in-one platform for digital loyalty programs, personalized rewards, and insightful analytics.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-3.5 w-full sm:w-auto">
              <Link href="/signup">Get Started for Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3.5 w-full sm:w-auto">
              <Link href="/login">Access Your Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* For Customers Section */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-headline font-semibold text-foreground mb-3">Transforming Loyalty for <span className="text-primary">Customers</span></h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Say goodbye to paper punch cards and hello to seamless digital rewards!</p>
          </div>
          <div className="grid md:grid-cols-2 gap-10 sm:gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-2xl sm:text-3xl font-headline font-semibold text-primary flex items-center gap-3">
                <Users className="h-8 w-8" /> Your Personalized Loyalty Hub
              </h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                With ATRA, managing your rewards across all your favorite enrolled businesses is effortless. Track points, redeem exciting rewards, and receive tailored offers, all in one place.
              </p>
              <ul className="space-y-3 text-lg">
                <li className="flex items-start gap-3"><CheckCircle className="h-6 w-6 text-accent flex-shrink-0 mt-1" /><span>Single account point collection.</span></li>
                <li className="flex items-start gap-3"><CheckCircle className="h-6 w-6 text-accent flex-shrink-0 mt-1" /><span>Unified tracking & redemptions.</span></li>
                <li className="flex items-start gap-3"><CheckCircle className="h-6 w-6 text-accent flex-shrink-0 mt-1" /><span>Personalized offers and deals.</span></li>
              </ul>
              <Button variant="secondary" size="lg" asChild className="mt-4 text-base">
                  <Link href="/loyalty">Explore Your Loyalty Hub <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
            <div className="rounded-xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <Image
                src="https://placehold.co/600x450.png"
                alt="Customer using ATRA app on phone"
                width={600}
                height={450}
                className="object-cover w-full h-full"
                data-ai-hint="customer interaction"
              />
            </div>
          </div>
        </div>
      </section>

      {/* For Businesses Section */}
      <section className="py-10 bg-card rounded-lg shadow-lg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-headline font-semibold text-foreground mb-3">Empowering <span className="text-primary">Businesses</span></h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Build stronger customer relationships and drive growth with our powerful platform.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-10 sm:gap-12 items-center">
            <div className="rounded-xl overflow-hidden shadow-2xl md:order-last transform hover:scale-105 transition-transform duration-300">
              <Image
                src="https://placehold.co/600x450.png"
                alt="Business dashboard analytics on ATRA"
                width={600}
                height={450}
                className="object-cover w-full h-full"
                data-ai-hint="business analytics"
              />
            </div>
            <div className="space-y-6 md:order-first">
              <h3 className="text-2xl sm:text-3xl font-headline font-semibold text-primary flex items-center gap-3">
                <Briefcase className="h-8 w-8" /> Tools for Growth & Engagement
              </h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                ATRA provides businesses with intuitive tools to create digital loyalty programs, manage customer activity, and gain valuable insights to tailor offers and boost retention.
              </p>
               <ul className="space-y-3 text-lg">
                <li className="flex items-start gap-3"><CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" /><span>Effortless loyalty program creation.</span></li>
                <li className="flex items-start gap-3"><CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" /><span>Track purchases & award points easily.</span></li>
                <li className="flex items-start gap-3"><CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" /><span>Comprehensive admin dashboard.</span></li>
              </ul>
              <Button variant="secondary" size="lg" asChild className="mt-4 text-base">
                  <Link href="/login">Access Business Portal <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section className="py-10">
        <div className="container mx-auto px-4">
            <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl font-headline font-semibold text-foreground">Key Features of ATRA</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                <FeatureCard icon={CreditCard} title="Unified Points" description="Collect and manage loyalty points from various businesses all in one digital wallet." />
                <FeatureCard icon={Gift} title="Exclusive Rewards" description="Unlock and redeem a wide range of exciting rewards offered by your favorite local businesses." />
                <FeatureCard icon={History} title="Track Activity" description="Keep a clear and consolidated history of all your transactions, points earned, and rewards redeemed." />
                <FeatureCard icon={BarChart3} title="Business Analytics" description="For businesses: Gain insights into customer behavior, track program performance, and make data-driven decisions." />
                <FeatureCard icon={Sparkles} title="Personalized Offers" description="Receive special offers and promotions tailored to your preferences and purchase history (Coming Soon!)." />
                <FeatureCard icon={Users} title="Easy Management" description="Simple setup for businesses and an intuitive interface for customers to manage their loyalty." />
            </div>
        </div>
      </section>


      {/* Call to Action Section */}
      <section className="py-12 sm:py-16 text-center bg-gradient-to-r from-primary via-blue-600 to-indigo-700 text-primary-foreground rounded-lg shadow-xl">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-headline font-semibold mb-4">Ready to Leap into Loyalty with ATRA?</h2>
          <p className="text-lg sm:text-xl opacity-90 max-w-xl mx-auto mb-8">
            Join users and businesses benefiting from a smarter, simpler way to manage loyalty.
          </p>
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-10 py-4">
            <Link href="/signup">Sign Up Today &rarr;</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
