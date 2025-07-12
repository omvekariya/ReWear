import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, ArrowRightLeft, Coins, Eye } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, type Item } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ItemCardProps {
  item: Item;
  showActions?: boolean;
}

export const ItemCard = ({ item, showActions = true }: ItemCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(item?.likes?.includes(user?._id || ''));
  const [isLoading, setIsLoading] = useState(false);

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
      setIsLoading(true);
      await api.toggleLike(item._id);
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
      setIsLoading(false);
    }
  };

  const handleView = () => {
    navigate(`/item/${item._id}`);
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
    navigate(`/item/${item._id}`);
  };

  const mainImage = item.mainImage || (item.images.length > 0 ? item.images[0].url : '/placeholder-item.jpg');

  return (
    <Card className="group hover:scale-105 transition-all duration-300 ease-bounce overflow-hidden">
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={mainImage} 
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-2 right-2 flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm ${
              isLiked ? 'text-red-500' : 'text-muted-foreground'
            } hover:text-red-500`}
            onClick={handleLike}
            disabled={isLoading}
          >
            <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
          </Button>
        </div>
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            {item.category}
          </Badge>
        </div>
        {item.status !== 'active' && (
          <div className="absolute top-2 left-2">
            <Badge variant="destructive" className="bg-background/80 backdrop-blur-sm">
              {item.status}
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
          {item.title}
        </h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span>Size {item.size}</span>
          <span>•</span>
          <span>{item.condition}</span>
          {item.brand && (
            <>
              <span>•</span>
              <span>{item.brand}</span>
            </>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            <span className="font-medium text-primary">{item.points} points</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Eye className="h-3 w-3" />
            <span>{item.views}</span>
          </div>
        </div>
      </CardContent>
      
      {showActions && (
        <CardFooter className="p-4 pt-0 flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleView}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          {item.isSwappable && item.status === 'active' && (
            <Button 
              variant="swap" 
              size="sm" 
              className="flex-1"
              onClick={handleSwap}
            >
              <ArrowRightLeft className="h-4 w-4 mr-1" />
              Swap
            </Button>
          )}
          {item.isRedeemable && item.status === 'active' && (
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={() => navigate(`/buy/${item._id}`)}
            >
              <Coins className="h-4 w-4 mr-1" />
              Buy
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};