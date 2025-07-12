import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { ItemCard } from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Recycle, 
  Users, 
  Leaf, 
  ArrowRight, 
  Star,
  Shirt,
  ShoppingBag,
  Heart,
  TrendingUp,
  Loader2
} from "lucide-react";
import { api, type Item } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

import heroImage from "@/assets/hero-image.jpg";

const Index = () => {
  const [featuredItems, setFeaturedItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchFeaturedItems();
  }, []);

  const fetchFeaturedItems = async () => {
    try {
      setIsLoading(true);
      const response = await api.getFeaturedItems();
      setFeaturedItems(response.data.items || []);
    } catch (error: any) {
      console.error('Failed to fetch featured items:', error);
      toast({
        title: "Error",
        description: "Failed to load featured items",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navigation />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Leaf className="h-3 w-3 mr-1" />
                Sustainable Fashion Revolution
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                Swap, Share, 
                <span className="bg-gradient-primary bg-clip-text text-transparent"> Sustain</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Join the eco-friendly clothing exchange community. Give your unused clothes a new life 
                through our point-based swapping system.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="xl" className="group">
                Start Swapping
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="xl">
                Browse Items
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Happy Swappers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">2.5K</div>
                <div className="text-sm text-muted-foreground">Items Exchanged</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">89%</div>
                <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <img 
              src={heroImage} 
              alt="Community clothing exchange" 
              className="rounded-2xl shadow-hover w-full h-auto"
            />
            <div className="absolute -bottom-4 -right-4 bg-gradient-primary p-4 rounded-xl shadow-glow">
              <div className="text-primary-foreground text-center">
                <div className="text-2xl font-bold">3.2K</div>
                <div className="text-sm opacity-90">CO₂ Saved</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Items */}
      <section id="browse" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Featured Items</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover amazing pre-loved clothing from our community members
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading featured items...</span>
            </div>
          </div>
        ) : featuredItems.length > 0 ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {featuredItems.map((item) => (
                <ItemCard key={item._id} item={item} />
              ))}
            </div>
            
            <div className="text-center">
              <Button variant="outline" size="lg">
                View All Items
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No featured items yet</p>
            <p className="text-muted-foreground mb-4">
              Be the first to list an item and get featured!
            </p>
            <Button variant="hero">
              <Shirt className="h-4 w-4 mr-2" />
              List Your First Item
            </Button>
          </div>
        )}
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">How ReWear Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple steps to start your sustainable fashion journey
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <CardContent className="space-y-4">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <Shirt className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">List Your Items</h3>
                <p className="text-muted-foreground">
                  Upload photos and details of clothes you no longer wear
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6">
              <CardContent className="space-y-4">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Connect & Swap</h3>
                <p className="text-muted-foreground">
                  Browse items and connect with other community members
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6">
              <CardContent className="space-y-4">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <Recycle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Earn & Redeem</h3>
                <p className="text-muted-foreground">
                  Earn points for sharing and redeem them for new items
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Community Impact</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how our community is making a difference in sustainable fashion
          </p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8">
          <Card className="text-center p-6">
            <CardContent className="space-y-4">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary">500+</div>
              <p className="text-muted-foreground">Active Members</p>
            </CardContent>
          </Card>
          
          <Card className="text-center p-6">
            <CardContent className="space-y-4">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <Shirt className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary">2.5K</div>
              <p className="text-muted-foreground">Items Listed</p>
            </CardContent>
          </Card>
          
          <Card className="text-center p-6">
            <CardContent className="space-y-4">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <ArrowRight className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary">1.8K</div>
              <p className="text-muted-foreground">Successful Swaps</p>
            </CardContent>
          </Card>
          
          <Card className="text-center p-6">
            <CardContent className="space-y-4">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary">3.2K</div>
              <p className="text-muted-foreground">CO₂ Saved (kg)</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Start Your Sustainable Fashion Journey?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join thousands of eco-conscious fashion lovers who are already making a difference
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="xl">
              Join the Community
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button variant="outline" size="xl" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
