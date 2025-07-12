import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  ArrowRightLeft, 
  Coins, 
  MessageSquare, 
  Loader2,
  Package,
  User,
  Calendar
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, type Item, type Swap } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const SwapPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [item, setItem] = useState<Item | null>(null);
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [swapType, setSwapType] = useState<"swap" | "redeem">("swap");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchData();
    }
  }, [id, user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [itemResponse, userItemsResponse] = await Promise.all([
        api.getItem(id!),
        api.getUserItems(user!._id, { status: 'active' })
      ]);

      const itemData = itemResponse.data.item;
      setItem(itemData);
      setUserItems(userItemsResponse.data.items || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load swap data",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to be logged in to create swaps",
        variant: "destructive",
      });
      return;
    }

    if (swapType === "swap" && !selectedItem) {
      toast({
        title: "Select an item",
        description: "Please select an item to swap",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const swapData = {
        recipientItem: item!._id,
        type: swapType,
        message: message.trim() || undefined,
        ...(swapType === "swap" && { initiatorItem: selectedItem })
      };

      await api.createSwap(swapData);

      toast({
        title: "Swap request sent!",
        description: swapType === "swap" 
          ? "Your swap request has been sent to the item owner" 
          : "Your redemption request has been sent",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create swap request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
              <span>Loading swap data...</span>
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
              The item you're trying to swap doesn't exist.
            </p>
            <Button onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Please login</h2>
            <p className="text-muted-foreground mb-4">
              You need to be logged in to create swap requests.
            </p>
            <Button onClick={() => navigate("/login")}>
              Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Swap Request</h1>
            <p className="text-muted-foreground">
              {swapType === "swap" 
                ? "Select an item to swap with this one" 
                : "Redeem this item with your points"
              }
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Item being swapped/redeemed */}
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
                    src={item.mainImage || (item.images?.[0]?.url || '/placeholder-item.jpg')} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-muted-foreground mb-2">{item.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="secondary">{item.category}</Badge>
                    <span>Size {item.size}</span>
                    <span>{item.condition}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary">{item.points} points</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Owner: {item.owner?.name}</span>
                </div>
              </CardContent>
            </Card>

            {/* Swap form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Swap Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Swap type selection */}
                  <div className="space-y-3">
                    <Label>Swap Type</Label>
                    <RadioGroup 
                      value={swapType} 
                      onValueChange={(value: "swap" | "redeem") => setSwapType(value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="swap" id="swap" />
                        <Label htmlFor="swap">Swap with my item</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="redeem" id="redeem" />
                        <Label htmlFor="redeem">Redeem with points</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Item selection for swaps */}
                  {swapType === "swap" && (
                    <div className="space-y-3">
                      <Label>Select your item to swap</Label>
                      {userItems.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {userItems.map((userItem) => (
                            <div
                              key={userItem._id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedItem === userItem._id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              }`}
                              onClick={() => setSelectedItem(userItem._id)}
                            >
                              <div className="flex items-center gap-3">
                                <img 
                                  src={userItem.mainImage || (userItem.images?.[0]?.url || '/placeholder-item.jpg')} 
                                  alt={userItem.title}
                                  className="w-12 h-12 object-cover rounded"
                                />
                                <div className="flex-1">
                                  <h4 className="font-medium">{userItem.title}</h4>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Badge variant="outline">{userItem.category}</Badge>
                                    <span>{userItem.points} points</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No items available for swap</p>
                          <p className="text-sm">List some items first to start swapping</p>
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="mt-2"
                            onClick={() => navigate("/add-item")}
                          >
                            List an Item
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Points check for redemption */}
                  {swapType === "redeem" && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span>Your points:</span>
                        <span className="font-medium">{user.points}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Item cost:</span>
                        <span className="font-medium">{item.points}</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex items-center justify-between">
                          <span>Remaining after swap:</span>
                          <span className={`font-medium ${user.points >= item.points ? 'text-green-600' : 'text-red-600'}`}>
                            {user.points - item.points}
                          </span>
                        </div>
                      </div>
                      {user.points < item.points && (
                        <p className="text-sm text-red-600 mt-2">
                          You don't have enough points for this item
                        </p>
                      )}
                    </div>
                  )}

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Message (optional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Add a personal message to the item owner..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Submit button */}
                  <div className="flex gap-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => navigate(`/item/${item._id}`)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      variant="hero" 
                      className="flex-1"
                      disabled={isSubmitting || (swapType === "swap" && !selectedItem) || (swapType === "redeem" && user.points < item.points)}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending Request...
                        </>
                      ) : (
                        <>
                          <ArrowRightLeft className="h-4 w-4 mr-2" />
                          {swapType === "swap" ? "Request Swap" : "Redeem Item"}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}; 