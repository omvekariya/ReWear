import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { ItemCard } from "@/components/ItemCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Coins, 
  Package, 
  ArrowUpDown, 
  Plus, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Eye
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, type Item, type Swap } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [dashboardData, setDashboardData] = useState<{
    userItems: Item[];
    pendingSwaps: Swap[];
    recentSwaps: Swap[];
    stats: any;
    points: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login");
        return;
      }
      
      fetchDashboardData();
    }
  }, [user, authLoading, navigate]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await api.getDashboard();
      setDashboardData(response.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="animate-fade-in">
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-xl">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>{user.name}</CardTitle>
                <p className="text-muted-foreground">{user.bio || "Eco Fashion Enthusiast"}</p>
                <Badge variant="secondary" className="mt-2">
                  <Coins className="h-3 w-3 mr-1" />
                  {user.points} Points
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{user.stats.itemsListed}</div>
                    <div className="text-sm text-muted-foreground">Items Listed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{user.stats.swapsCompleted}</div>
                    <div className="text-sm text-muted-foreground">Swaps Made</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Achievements</h4>
                  <div className="space-y-2">
                    <Badge variant="outline" className="w-full justify-start">
                      <TrendingUp className="h-3 w-3 mr-2" />
                      Eco Warrior
                    </Badge>
                    <Badge variant="outline" className="w-full justify-start">
                      <User className="h-3 w-3 mr-2" />
                      Community Builder
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="hero" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate("/add-item")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  List New Item
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate("/")}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Browse Items
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="items">My Items</TabsTrigger>
                <TabsTrigger value="swaps">Swaps</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 rounded-full p-3">
                          <Coins className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{user.points}</div>
                          <div className="text-muted-foreground">Available Points</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 rounded-full p-3">
                          <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{user.stats.itemsListed}</div>
                          <div className="text-muted-foreground">Active Listings</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 rounded-full p-3">
                          <ArrowUpDown className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{user.stats.swapsCompleted}</div>
                          <div className="text-muted-foreground">Total Swaps</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData?.recentSwaps?.length ? (
                        dashboardData.recentSwaps.map((swap) => (
                          <div key={swap._id} className="flex items-center gap-4 p-4 rounded-lg border bg-muted/20">
                            <div className="flex-shrink-0">
                              {swap.status === 'completed' ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : swap.status === 'pending' ? (
                                <Clock className="h-5 w-5 text-yellow-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {swap.type === 'swap' ? 'Swap' : 'Redemption'} - {swap.recipientItem.title}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                with {swap.recipient.name} • {swap.points} points
                              </p>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(swap.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No recent activity</p>
                          <p className="text-sm">Start by listing an item or browsing the community</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* My Items Tab */}
              <TabsContent value="items" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">My Items</h3>
                  <Button onClick={() => navigate("/add-item")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                
                {dashboardData?.userItems?.length ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboardData.userItems.map((item) => (
                      <ItemCard key={item._id} item={item} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No items yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start building your sustainable wardrobe by listing your first item
                      </p>
                      <Button onClick={() => navigate("/add-item")}>
                        <Plus className="h-4 w-4 mr-2" />
                        List Your First Item
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Swaps Tab */}
              <TabsContent value="swaps" className="space-y-6">
                <h3 className="text-lg font-semibold">My Swaps</h3>
                
                {dashboardData?.pendingSwaps?.length ? (
                  <div className="space-y-4">
                    {dashboardData.pendingSwaps.map((swap) => (
                      <Card key={swap._id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">
                                  {swap.type === 'swap' ? 'Swap' : 'Redemption'} - {swap.recipientItem.title}
                                </h4>
                                <Badge variant={swap.status === 'pending' ? 'secondary' : 'default'}>
                                  {swap.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {swap.initiator._id === user._id 
                                  ? `You → ${swap.recipient.name}` 
                                  : `${swap.initiator.name} → You`
                                } • {swap.points} points
                              </p>
                              {swap.message && (
                                <p className="text-sm text-muted-foreground mb-3 italic">
                                  "{swap.message}"
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Created: {new Date(swap.createdAt).toLocaleDateString()}</span>
                                {swap.expiresAt && (
                                  <span>Expires: {new Date(swap.expiresAt).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {swap.status === 'pending' && swap.recipient._id === user._id && (
                                <>
                                  <Button size="sm" variant="default">
                                    Accept
                                  </Button>
                                  <Button size="sm" variant="destructive">
                                    Reject
                                  </Button>
                                </>
                              )}
                              <Button size="sm" variant="outline">
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
                      <ArrowUpDown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No swaps yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start swapping by browsing items or listing your own
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={() => navigate("/")}>
                          Browse Items
                        </Button>
                        <Button variant="outline" onClick={() => navigate("/add-item")}>
                          List an Item
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-6">
                <h3 className="text-lg font-semibold">Activity Feed</h3>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {dashboardData?.recentSwaps?.length ? (
                        dashboardData.recentSwaps.map((swap) => (
                          <div key={swap._id} className="flex items-center gap-4 p-4 rounded-lg border bg-muted/20">
                            <div className="flex-shrink-0">
                              {swap.status === 'completed' ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : swap.status === 'pending' ? (
                                <Clock className="h-5 w-5 text-yellow-500" />
                              ) : swap.status === 'accepted' ? (
                                <CheckCircle className="h-5 w-5 text-blue-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium">
                                  {swap.type === 'swap' ? 'Swap' : 'Redemption'} - {swap.recipientItem.title}
                                </p>
                                <Badge variant={swap.status === 'completed' ? 'default' : 'secondary'}>
                                  {swap.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {swap.initiator._id === user._id 
                                  ? `You → ${swap.recipient.name}` 
                                  : `${swap.initiator.name} → You`
                                } • {swap.points} points
                              </p>
                              {swap.message && (
                                <p className="text-sm text-muted-foreground mt-1 italic">
                                  "{swap.message}"
                                </p>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(swap.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No activity yet</p>
                          <p className="text-sm">Your swap activities will appear here</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};