import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowRightLeft, 
  Coins, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Package,
  User,
  Loader2,
  TrendingUp,
  Truck,
  Star,
  AlertTriangle,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, type Swap } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const SwapManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedSwap, setSelectedSwap] = useState<Swap | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");

  useEffect(() => {
    if (user) {
      fetchSwaps();
    }
  }, [user]);

  const fetchSwaps = async () => {
    try {
      setIsLoading(true);
      const response = await api.getSwaps();
      setSwaps(response.data?.swaps || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load swaps",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSwap = async (swapId: string) => {
    try {
      await api.acceptSwap(swapId);
      toast({
        title: "Swap accepted",
        description: "The swap has been accepted successfully",
      });
      fetchSwaps(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept swap",
        variant: "destructive",
      });
    }
  };

  const handleRejectSwap = async (swapId: string) => {
    try {
      await api.rejectSwap(swapId);
      toast({
        title: "Swap rejected",
        description: "The swap has been rejected",
      });
      fetchSwaps(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject swap",
        variant: "destructive",
      });
    }
  };

  const handleMarkShipped = async (swapId: string) => {
    try {
      await api.markShipped(swapId, trackingNumber);
      toast({
        title: "Item marked as shipped",
        description: "Your item has been marked as shipped",
      });
      setTrackingNumber("");
      setSelectedSwap(null);
      fetchSwaps(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark as shipped",
        variant: "destructive",
      });
    }
  };

  const handleMarkReceived = async (swapId: string) => {
    try {
      await api.markReceived(swapId);
      toast({
        title: "Item marked as received",
        description: "You have confirmed receiving the item",
      });
      fetchSwaps(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark as received",
        variant: "destructive",
      });
    }
  };

  const handleRateSwap = async (swapId: string) => {
    try {
      await api.rateSwap(swapId, { rating, comment });
      toast({
        title: "Swap rated",
        description: "Thank you for rating this swap",
      });
      setRating(5);
      setComment("");
      setSelectedSwap(null);
      fetchSwaps(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to rate swap",
        variant: "destructive",
      });
    }
  };

  const handleRaiseDispute = async (swapId: string) => {
    try {
      await api.raiseDispute(swapId, { reason: disputeReason, description: disputeDescription });
      toast({
        title: "Dispute raised",
        description: "Your dispute has been submitted for review",
      });
      setDisputeReason("");
      setDisputeDescription("");
      setSelectedSwap(null);
      fetchSwaps(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to raise dispute",
        variant: "destructive",
      });
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

  const filteredSwaps = swaps.filter(swap => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return swap.status === 'pending';
    if (activeTab === 'active') return swap.status === 'accepted';
    if (activeTab === 'completed') return swap.status === 'completed';
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading swaps...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Swap Management</h1>
          <p className="text-muted-foreground">Manage your swap requests and track their progress</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Swaps ({swaps.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({swaps.filter(s => s.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({swaps.filter(s => s.status === 'accepted').length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({swaps.filter(s => s.status === 'completed').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {filteredSwaps.length > 0 ? (
              <div className="space-y-4">
                {filteredSwaps.map((swap) => (
                  <Card key={swap._id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {getStatusIcon(swap.status)}
                            <div>
                              <h4 className="font-medium">
                                {swap.type === 'swap' ? 'Swap' : 'Redemption'} - {swap.recipientItem.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={getStatusBadgeVariant(swap.status)}>
                                  {swap.status}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {swap.points} points
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">
                                {swap.initiator._id === user?._id 
                                  ? `You → ${swap.recipient.name}` 
                                  : `${swap.initiator.name} → You`
                                }
                              </span>
                            </p>
                            
                            {swap.message && (
                              <p className="text-sm text-muted-foreground italic">
                                "{swap.message}"
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Created: {new Date(swap.createdAt).toLocaleDateString()}</span>
                              {swap.expiresAt && (
                                <span>Expires: {new Date(swap.expiresAt).toLocaleDateString()}</span>
                              )}
                              {swap.updatedAt && swap.updatedAt !== swap.createdAt && (
                                <span>Updated: {new Date(swap.updatedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {swap.status === 'pending' && swap.recipient._id === user?._id && (
                            <>
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => handleAcceptSwap(swap._id)}
                              >
                                Accept
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleRejectSwap(swap._id)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          
                          {swap.status === 'accepted' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setSelectedSwap(swap)}
                                >
                                  <Truck className="h-4 w-4 mr-1" />
                                  Mark Shipped
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Mark Item as Shipped</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="tracking">Tracking Number (optional)</Label>
                                    <Input
                                      id="tracking"
                                      placeholder="Enter tracking number..."
                                      value={trackingNumber}
                                      onChange={(e) => setTrackingNumber(e.target.value)}
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline" 
                                      onClick={() => {
                                        setTrackingNumber("");
                                        setSelectedSwap(null);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      onClick={() => handleMarkShipped(swap._id)}
                                    >
                                      Mark Shipped
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          
                          {swap.status === 'accepted' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleMarkReceived(swap._id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mark Received
                            </Button>
                          )}
                          
                          {swap.status === 'completed' && !swap.initiatorRating && swap.initiator._id === user?._id && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setSelectedSwap(swap)}
                                >
                                  <Star className="h-4 w-4 mr-1" />
                                  Rate Swap
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Rate This Swap</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Rating</Label>
                                    <div className="flex gap-1 mt-2">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          type="button"
                                          onClick={() => setRating(star)}
                                          className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                        >
                                          ★
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <Label htmlFor="comment">Comment (optional)</Label>
                                    <Textarea
                                      id="comment"
                                      placeholder="Share your experience..."
                                      value={comment}
                                      onChange={(e) => setComment(e.target.value)}
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline" 
                                      onClick={() => {
                                        setRating(5);
                                        setComment("");
                                        setSelectedSwap(null);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      onClick={() => handleRateSwap(swap._id)}
                                    >
                                      Submit Rating
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          
                          {swap.status === 'completed' && !swap.recipientRating && swap.recipient._id === user?._id && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setSelectedSwap(swap)}
                                >
                                  <Star className="h-4 w-4 mr-1" />
                                  Rate Swap
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Rate This Swap</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Rating</Label>
                                    <div className="flex gap-1 mt-2">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          type="button"
                                          onClick={() => setRating(star)}
                                          className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                        >
                                          ★
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <Label htmlFor="comment">Comment (optional)</Label>
                                    <Textarea
                                      id="comment"
                                      placeholder="Share your experience..."
                                      value={comment}
                                      onChange={(e) => setComment(e.target.value)}
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline" 
                                      onClick={() => {
                                        setRating(5);
                                        setComment("");
                                        setSelectedSwap(null);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      onClick={() => handleRateSwap(swap._id)}
                                    >
                                      Submit Rating
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          
                          {(swap.status === 'accepted' || swap.status === 'completed') && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setSelectedSwap(swap)}
                                >
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  Raise Dispute
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Raise a Dispute</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="reason">Reason</Label>
                                    <select
                                      id="reason"
                                      value={disputeReason}
                                      onChange={(e) => setDisputeReason(e.target.value)}
                                      className="w-full p-2 border rounded-md"
                                    >
                                      <option value="">Select a reason</option>
                                      <option value="item-not-as-described">Item not as described</option>
                                      <option value="damaged">Item damaged</option>
                                      <option value="not-received">Item not received</option>
                                      <option value="other">Other</option>
                                    </select>
                                  </div>
                                  <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                      id="description"
                                      placeholder="Please describe the issue..."
                                      value={disputeDescription}
                                      onChange={(e) => setDisputeDescription(e.target.value)}
                                      rows={4}
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline" 
                                      onClick={() => {
                                        setDisputeReason("");
                                        setDisputeDescription("");
                                        setSelectedSwap(null);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      onClick={() => handleRaiseDispute(swap._id)}
                                      disabled={!disputeReason || !disputeDescription}
                                    >
                                      Submit Dispute
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/swap-detail/${swap._id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No swaps found</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === 'all' 
                      ? "You haven't made any swaps yet. Start by browsing items or listing your own."
                      : `No ${activeTab} swaps found.`
                    }
                  </p>
                  {activeTab === 'all' && (
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => navigate("/")}>
                        Browse Items
                      </Button>
                      <Button variant="outline" onClick={() => navigate("/add-item")}>
                        List an Item
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}; 