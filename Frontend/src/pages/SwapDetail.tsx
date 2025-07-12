import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  User,
  Loader2,
  Truck,
  Star,
  MessageSquare,
  Calendar,
  Coins
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, type Swap } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const SwapDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [swap, setSwap] = useState<Swap | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      fetchSwap();
    }
  }, [id, user]);

  const fetchSwap = async () => {
    try {
      setIsLoading(true);
      const response = await api.getSwap(id!);
      setSwap(response.data.swap);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load swap details",
        variant: "destructive",
      });
      navigate("/swaps");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'rejected':
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'accepted':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading swap details...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!swap) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Swap not found</h2>
            <p className="text-muted-foreground mb-4">
              The swap you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate("/swaps")}>
              Back to Swaps
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isInitiator = swap.initiator._id === user?._id;
  const isRecipient = swap.recipient._id === user?._id;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/swaps")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Swaps
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Swap Details</h1>
              <p className="text-muted-foreground">
                {swap.type === 'swap' ? 'Item Swap' : 'Point Redemption'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(swap.status)}
              <Badge variant={getStatusBadgeVariant(swap.status)}>
                {swap.status}
              </Badge>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Items Section */}
            <div className="space-y-6">
              {/* Recipient Item */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Item You Want
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-square rounded-lg overflow-hidden">
                    <img 
                      src={swap.recipientItem.mainImage || (swap.recipientItem.images?.[0]?.url || '/placeholder-item.jpg')} 
                      alt={swap.recipientItem.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{swap.recipientItem.title}</h3>
                    <p className="text-muted-foreground mb-2">{swap.recipientItem.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="secondary">{swap.recipientItem.category}</Badge>
                      <span>Size {swap.recipientItem.size}</span>
                      <span>{swap.recipientItem.condition}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Coins className="h-4 w-4 text-primary" />
                      <span className="font-medium text-primary">{swap.recipientItem.points} points</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Owner: {swap.recipient.name}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Initiator Item (for swaps) */}
              {swap.type === 'swap' && swap.initiatorItem && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Your Item
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="aspect-square rounded-lg overflow-hidden">
                      <img 
                        src={swap.initiatorItem.mainImage || (swap.initiatorItem.images?.[0]?.url || '/placeholder-item.jpg')} 
                        alt={swap.initiatorItem.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{swap.initiatorItem.title}</h3>
                      <p className="text-muted-foreground mb-2">{swap.initiatorItem.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="secondary">{swap.initiatorItem.category}</Badge>
                        <span>Size {swap.initiatorItem.size}</span>
                        <span>{swap.initiatorItem.condition}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Coins className="h-4 w-4 text-primary" />
                        <span className="font-medium text-primary">{swap.initiatorItem.points} points</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              {/* Swap Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Swap Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <p className="font-medium">{swap.type === 'swap' ? 'Item Swap' : 'Point Redemption'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Points:</span>
                      <p className="font-medium">{swap.points}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <p className="font-medium">{formatDate(swap.createdAt)}</p>
                    </div>
                    {swap.expiresAt && (
                      <div>
                        <span className="text-muted-foreground">Expires:</span>
                        <p className="font-medium">{formatDate(swap.expiresAt)}</p>
                      </div>
                    )}
                  </div>
                  
                  {swap.message && (
                    <div>
                      <span className="text-muted-foreground text-sm">Message:</span>
                      <p className="mt-1 p-3 bg-muted rounded-lg italic">"{swap.message}"</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shipping Information */}
              {(swap.status === 'accepted' || swap.status === 'completed') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Shipping Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {swap.shipping.initiatorTracking && (
                      <div>
                        <span className="text-muted-foreground text-sm">Initiator Tracking:</span>
                        <p className="font-medium">{swap.shipping.initiatorTracking}</p>
                        {swap.shipping.initiatorShippedAt && (
                          <p className="text-xs text-muted-foreground">
                            Shipped: {formatDate(swap.shipping.initiatorShippedAt)}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {swap.shipping.recipientTracking && (
                      <div>
                        <span className="text-muted-foreground text-sm">Recipient Tracking:</span>
                        <p className="font-medium">{swap.shipping.recipientTracking}</p>
                        {swap.shipping.recipientShippedAt && (
                          <p className="text-xs text-muted-foreground">
                            Shipped: {formatDate(swap.shipping.recipientShippedAt)}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {swap.shipping.initiatorReceivedAt && (
                      <div>
                        <span className="text-muted-foreground text-sm">Initiator Received:</span>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(swap.shipping.initiatorReceivedAt)}
                        </p>
                      </div>
                    )}
                    
                    {swap.shipping.recipientReceivedAt && (
                      <div>
                        <span className="text-muted-foreground text-sm">Recipient Received:</span>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(swap.shipping.recipientReceivedAt)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Ratings */}
              {swap.status === 'completed' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Ratings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {swap.initiatorRating && (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Initiator Rating:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className={`text-lg ${star <= swap.initiatorRating!.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        {swap.initiatorRating.comment && (
                          <p className="text-sm text-muted-foreground mt-1 italic">
                            "{swap.initiatorRating.comment}"
                          </p>
                        )}
                      </div>
                    )}
                    
                    {swap.recipientRating && (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Recipient Rating:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className={`text-lg ${star <= swap.recipientRating!.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        {swap.recipientRating.comment && (
                          <p className="text-sm text-muted-foreground mt-1 italic">
                            "{swap.recipientRating.comment}"
                          </p>
                        )}
                      </div>
                    )}
                    
                    {!swap.initiatorRating && !swap.recipientRating && (
                      <p className="text-sm text-muted-foreground">No ratings yet</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Timeline */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {swap.timeline?.map((event, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="font-medium">{event.details}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 