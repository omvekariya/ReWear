import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Heart, 
  Star, 
  ArrowRightLeft, 
  Coins, 
  MapPin, 
  Calendar,
  Share2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, type Item } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [item, setItem] = useState<Item | null>(null);
  const [relatedItems, setRelatedItems] = useState<Item[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchItemData();
    }
  }, [id]);

  const fetchItemData = async () => {
    try {
      setIsLoading(true);
      const itemResponse = await api.getItem(id!);
      const itemData = itemResponse.data.item;
      setItem(itemData);
      setIsLiked(itemData?.likes?.includes(user?._id || '') || false);

      // Fetch related items from the same owner
      if (itemData?.owner?._id) {
        try {
          const relatedResponse = await api.getItems({ limit: 4 });
          const allItems = relatedResponse.data.items || [];
          const ownerItems = allItems.filter((relatedItem: Item) => 
            relatedItem.owner._id === itemData.owner._id && relatedItem._id !== itemData._id
          );
          setRelatedItems(ownerItems.slice(0, 4));
        } catch (error) {
          console.error('Failed to fetch related items:', error);
          setRelatedItems([]);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load item details",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to be logged in to like items",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLikeLoading(true);
      await api.toggleLike(item!._id);
      setIsLiked(!isLiked);
      toast({
        title: isLiked ? "Removed from favorites" : "Added to favorites",
        description: isLiked ? "Item removed from your favorites" : "Item added to your favorites",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update like",
        variant: "destructive",
      });
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleSwap = () => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to be logged in to swap items",
        variant: "destructive",
      });
      return;
    }
    navigate(`/swap/${item!._id}`);
  };

  const handleRedeem = () => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to be logged in to redeem items",
        variant: "destructive",
      });
      return;
    }
    navigate(`/redeem/${item!._id}`);
  };

  const handleBuyWithPoints = () => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to be logged in to buy items",
        variant: "destructive",
      });
      return;
    }
    navigate(`/buy/${item!._id}`);
  };

  const nextImage = () => {
    if (item?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
    }
  };

  const prevImage = () => {
    if (item?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + item.images.length) % item.images.length);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading item details...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Item not found</h2>
            <p className="text-muted-foreground mb-4">
              The item you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const itemImages = item.images || [];
  const mainImage = item.mainImage || (itemImages.length > 0 ? itemImages[0].url : '/placeholder-item.jpg');

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          <span className="mx-2 text-muted-foreground">/</span>
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            Browse Items
          </Link>
          <span className="mx-2 text-muted-foreground">/</span>
          <span className="text-foreground">{item.title}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="relative aspect-square">
                <img 
                  src={itemImages.length > 0 ? itemImages[currentImageIndex].url : mainImage} 
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                
                {itemImages.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}

                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`bg-background/80 backdrop-blur-sm ${
                      isLiked ? 'text-red-500' : 'text-muted-foreground'
                    }`}
                    onClick={handleLike}
                    disabled={isLikeLoading}
                  >
                    <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-background/80 backdrop-blur-sm text-muted-foreground"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Thumbnail Gallery */}
            {itemImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {itemImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      currentImageIndex === index 
                        ? 'border-primary shadow-glow' 
                        : 'border-transparent hover:border-border'
                    }`}
                  >
                    <img 
                      src={image.url} 
                      alt={`View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <Badge variant="secondary">{item.category}</Badge>
                    <span>Size {item.size}</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>4.8</span>
                      <span>({item.likesCount || 0} likes)</span>
                    </div>
                  </div>
                </div>
                <Badge 
                  variant={item.status === 'active' ? 'outline' : 'destructive'} 
                  className={item.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                >
                  {item.status === 'active' ? 'Available' : item.status}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-lg">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">{item.points} points</span>
                </div>
                {item.isSwappable && (
                  <>
                    <Separator orientation="vertical" className="h-6" />
                    <span className="text-muted-foreground">or swap directly</span>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Owner Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={item.owner?.avatar} />
                    <AvatarFallback>{item.owner?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.owner?.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>Location not specified</span>
                      <Separator orientation="vertical" className="h-3" />
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>4.9 ({item.owner?.stats?.swapsCompleted || 0} swaps)</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-3">Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Item Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Item Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {item.brand && (
                    <div>
                      <span className="text-muted-foreground">Brand:</span>
                      <span className="ml-2 font-medium">{item.brand}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Size:</span>
                    <span className="ml-2 font-medium">{item.size}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Condition:</span>
                    <span className="ml-2 font-medium">{item.condition}</span>
                  </div>
                  {item.material && (
                    <div>
                      <span className="text-muted-foreground">Material:</span>
                      <span className="ml-2 font-medium">{item.material}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Listed {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              {item.isSwappable && item.status === 'active' && (
                <Button variant="hero" size="lg" className="flex-1" onClick={handleSwap}>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Request Swap
                </Button>
              )}
              {item.isRedeemable && item.status === 'active' && (
                <Button variant="default" size="lg" className="flex-1" onClick={handleBuyWithPoints}>
                  <Coins className="h-4 w-4 mr-2" />
                  Buy with Points
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Related Items */}
        {relatedItems.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">From the Same Owner</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedItems.map((relatedItem) => (
                <Card key={relatedItem._id} className="group hover:scale-105 transition-all duration-300 cursor-pointer" onClick={() => navigate(`/item/${relatedItem._id}`)}>
                  <div className="aspect-square overflow-hidden rounded-t-lg">
                    <img 
                      src={relatedItem.mainImage || (relatedItem.images?.[0]?.url || '/placeholder-item.jpg')} 
                      alt={relatedItem.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2">{relatedItem.title}</h3>
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4 text-primary" />
                      <span className="text-primary font-medium">{relatedItem.points} points</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};