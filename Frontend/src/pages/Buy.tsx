import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api';
import { useToast } from '../hooks/use-toast';
import { Navigation } from '../components/Navigation';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Loader2, ArrowLeft, Coins, CheckCircle, AlertCircle, ShoppingCart } from 'lucide-react';

interface Item {
  _id: string;
  title: string;
  description: string;
  category: string;
  size: string;
  brand?: string;
  condition: string;
  material?: string;
  points: number;
  images: Array<{
    url: string;
    publicId: string;
    isMain: boolean;
  }>;
  tags: string[];
  owner: {
    _id: string;
    name: string;
    avatar?: string;
  };
  status: string;
  isRedeemable: boolean;
  views: number;
  likesCount: number;
  mainImage?: string;
  createdAt: string;
}

export const BuyPage = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!itemId) {
      navigate('/');
      return;
    }

    const fetchItem = async () => {
      try {
        setLoading(true);
        const response = await api.getItem(itemId);
        setItem(response.data.item);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load item",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId, navigate, toast]);

  const handlePurchase = async () => {
    if (!user || !item) return;

    try {
      setPurchasing(true);
      const response = await api.buyWithPoints(item._id);
      
      toast({
        title: "Purchase Successful!",
        description: `You've successfully purchased ${item.title} for ${response.data.pointsSpent} points!`,
      });

      // Navigate to purchase confirmation page
      navigate('/purchase-confirmation', { 
        state: { 
          purchaseData: {
            purchase: response.data.purchase,
            pointsSpent: response.data.pointsSpent,
            bonusEarned: response.data.bonusEarned
          }
        } 
      });
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to complete purchase",
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading item...</span>
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
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Item not found</h1>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const canPurchase = user && item.isRedeemable && item.status === 'active' && user.points >= item.points;
  const insufficientPoints = user && item.points > user.points;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/item/${item._id}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Item
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Item Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden shadow-lg">
              <img
                src={item.images[currentImageIndex]?.url || item.mainImage || '/placeholder-item.jpg'}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              
              {item.images.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={prevImage}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={nextImage}
                  >
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                </>
              )}
            </div>

            {item.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {item.images.map((image, index) => (
                  <button
                    key={image.publicId}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      index === currentImageIndex ? 'border-primary' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`${item.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Purchase Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
              <p className="text-muted-foreground mb-4">{item.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline">{item.category}</Badge>
                <Badge variant="outline">{item.size}</Badge>
                <Badge variant="outline">{item.condition}</Badge>
                {item.brand && <Badge variant="outline">{item.brand}</Badge>}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Listed by {item.owner.name}</span>
                <span>•</span>
                <span>{item.views} views</span>
                <span>•</span>
                <span>{item.likesCount} likes</span>
              </div>
            </div>

            <Separator />

            {/* Points Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-600" />
                  Purchase with Points
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Item Price:</span>
                  <span className="font-bold text-lg">{item.points} points</span>
                </div>
                
                {user && (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Your Balance:</span>
                      <span className="font-medium">{user.points} points</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <span>Remaining After Purchase:</span>
                      <span className={`font-bold ${user.points >= item.points ? 'text-green-600' : 'text-red-600'}`}>
                        {user.points - item.points} points
                      </span>
                    </div>
                  </>
                )}

                {insufficientPoints && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Insufficient Points</span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">
                      You need {item.points - user.points} more points to purchase this item.
                    </p>
                  </div>
                )}

                {!user && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Login Required</span>
                    </div>
                    <p className="text-sm text-blue-600 mt-1">
                      Please log in to purchase this item with points.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Purchase Button */}
            <div className="space-y-4">
              {canPurchase ? (
                <Button 
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full h-12 text-lg"
                  variant="hero"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing Purchase...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Buy Now for {item.points} Points
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  disabled 
                  className="w-full h-12 text-lg"
                  variant="outline"
                >
                  <AlertCircle className="h-5 w-5 mr-2" />
                  {!user ? 'Login to Purchase' : insufficientPoints ? 'Insufficient Points' : 'Not Available'}
                </Button>
              )}

              <div className="text-center text-sm text-muted-foreground">
                <p>• Purchase is immediate and final</p>
                <p>• Item will be marked as sold</p>
                <p>• Points will be transferred to the seller</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 