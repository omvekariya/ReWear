import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { CheckCircle, ArrowRight, Home, ShoppingBag, Coins } from 'lucide-react';

interface PurchaseData {
  purchase: {
    _id: string;
    recipientItem: {
      _id: string;
      title: string;
      images: Array<{
        url: string;
        publicId: string;
        isMain: boolean;
      }>;
      points: number;
    };
    recipient: {
      name: string;
      avatar?: string;
    };
    createdAt: string;
  };
  pointsSpent: number;
  bonusEarned: number;
}

export const PurchaseConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const purchaseData = location.state?.purchaseData as PurchaseData;

  if (!purchaseData) {
    navigate('/');
    return null;
  }

  const { purchase, pointsSpent, bonusEarned } = purchaseData;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Purchase Successful!</h1>
            <p className="text-muted-foreground">
              Thank you for your purchase. Your item is now yours!
            </p>
          </div>

          {/* Purchase Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Purchase Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={purchase.recipientItem.images[0]?.url || '/placeholder-item.jpg'}
                  alt={purchase.recipientItem.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{purchase.recipientItem.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Purchased from {purchase.recipient.name}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-lg font-bold">
                    <Coins className="h-4 w-4 text-yellow-600" />
                    {pointsSpent}
                  </div>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Purchase ID:</span>
                  <span className="font-mono text-sm">{purchase._id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Purchase Date:</span>
                  <span>{new Date(purchase.createdAt).toLocaleDateString()}</span>
                </div>
                {bonusEarned > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>First Purchase Bonus:</span>
                    <span className="font-semibold">+{bonusEarned} points</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Contact the Seller</h4>
                  <p className="text-sm text-muted-foreground">
                    Reach out to {purchase.recipient.name} to arrange shipping or pickup details.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Track Your Purchase</h4>
                  <p className="text-sm text-muted-foreground">
                    View your purchase history in your dashboard.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Leave a Review</h4>
                  <p className="text-sm text-muted-foreground">
                    Share your experience and help other users.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate('/')}
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <Button 
              className="flex-1"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 