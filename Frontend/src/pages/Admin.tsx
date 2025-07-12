import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search,
  Users,
  Package,
  ShoppingCart,
  MoreHorizontal,
  Check,
  X,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  UserCheck,
  PackageCheck,
  Loader2
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [swaps, setSwaps] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const [statsResponse, usersResponse, itemsResponse, swapsResponse] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminItems(),
        api.getAdminSwaps()
      ]);

      setAdminStats(statsResponse.data);
      setUsers(usersResponse.data.users || []);
      setItems(itemsResponse.data.items || []);
      setSwaps(swapsResponse.data.swaps || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await api.updateUserStatus(userId, 'active');
      toast({
        title: "User approved",
        description: "User has been activated successfully",
      });
      fetchAdminData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve user",
        variant: "destructive",
      });
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      await api.updateUserStatus(userId, 'suspended');
      toast({
        title: "User suspended",
        description: "User has been suspended",
      });
      fetchAdminData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to suspend user",
        variant: "destructive",
      });
    }
  };

  const handleApproveItem = async (itemId: string) => {
    try {
      await api.approveItem(itemId);
      toast({
        title: "Item approved",
        description: "Item has been approved and is now active",
      });
      fetchAdminData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve item",
        variant: "destructive",
      });
    }
  };

  const handleRejectItem = async (itemId: string) => {
    try {
      await api.rejectItem(itemId, "Item does not meet community guidelines");
      toast({
        title: "Item rejected",
        description: "Item has been rejected",
      });
      fetchAdminData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject item",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.owner?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSwaps = swaps.filter(swap => 
    swap.recipientItem?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    swap.initiator?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    swap.recipient?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading admin data...</span>
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
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users, listings, and platform activity</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{adminStats?.stats?.users?.total || 0}</div>
                  <div className="text-muted-foreground">Total Users</div>
                  <div className="text-xs text-green-600">
                    {adminStats?.stats?.users?.active || 0} active, {adminStats?.stats?.users?.pending || 0} pending
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 rounded-full p-3">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{adminStats?.stats?.items?.total || 0}</div>
                  <div className="text-muted-foreground">Total Items</div>
                  <div className="text-xs text-green-600">
                    {adminStats?.stats?.items?.active || 0} active, {adminStats?.stats?.items?.pending || 0} pending
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 rounded-full p-3">
                  <ShoppingCart className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{adminStats?.stats?.swaps?.total || 0}</div>
                  <div className="text-muted-foreground">Total Swaps</div>
                  <div className="text-xs text-green-600">
                    {adminStats?.stats?.swaps?.completed || 0} completed, {adminStats?.stats?.swaps?.pending || 0} pending
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-orange-100 rounded-full p-3">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{adminStats?.stats?.points?.total || 0}</div>
                  <div className="text-muted-foreground">Total Points</div>
                  <div className="text-xs text-green-600">
                    Avg: {adminStats?.stats?.points?.avgPerUser || 0} per user
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Points Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Points Economy Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {adminStats?.stats?.points?.totalEarned || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Earned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {adminStats?.stats?.points?.totalSpent || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Spent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {adminStats?.stats?.points?.avgPerUser || 0}
                </div>
                <div className="text-sm text-muted-foreground">Average per User</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {adminStats?.stats?.points?.maxPoints || 0}
                </div>
                <div className="text-sm text-muted-foreground">Highest Balance</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users, listings, or orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Manage Users ({users.length})</TabsTrigger>
            <TabsTrigger value="listings">Manage Listings ({items.length})</TabsTrigger>
            <TabsTrigger value="swaps">Manage Swaps ({swaps.length})</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredUsers.length > 0 ? (
                  <div className="space-y-4">
                    {filteredUsers.map((user) => (
                      <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{user.name}</h4>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                                {user.status}
                              </Badge>
                              <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'}>
                                {user.role}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {user.status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => handleApproveUser(user._id)}>
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleRejectUser(user._id)}>
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No users found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Item Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredItems.length > 0 ? (
                  <div className="space-y-4">
                    {filteredItems.map((item) => (
                      <div key={item._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <img 
                            src={item.mainImage || (item.images?.[0]?.url || '/placeholder-item.jpg')} 
                            alt={item.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div>
                            <h4 className="font-medium">{item.title}</h4>
                            <p className="text-sm text-muted-foreground">by {item.owner?.name}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                                {item.status}
                              </Badge>
                              <Badge variant="outline">{item.category}</Badge>
                              <Badge variant="outline">{item.points} points</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {item.status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => handleApproveItem(item._id)}>
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleRejectItem(item._id)}>
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No items found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Swaps Tab */}
          <TabsContent value="swaps" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Swap Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredSwaps.length > 0 ? (
                  <div className="space-y-4">
                    {filteredSwaps.map((swap) => (
                      <div key={swap._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <img 
                              src={swap.recipientItem?.mainImage || '/placeholder-item.jpg'} 
                              alt={swap.recipientItem?.title}
                              className="w-12 h-12 object-cover rounded-lg mx-auto"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Item</p>
                          </div>
                          <div>
                            <h4 className="font-medium">{swap.recipientItem?.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {swap.initiator?.name} → {swap.recipient?.name}
                            </p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant={swap.status === 'completed' ? 'default' : 'secondary'}>
                                {swap.status}
                              </Badge>
                              <Badge variant="outline">{swap.points} points</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No swaps found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};