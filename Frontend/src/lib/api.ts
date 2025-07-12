import { config } from './config';

// API Base URL
const API_BASE_URL = config.api.baseUrl;

// API Response Types
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// User Types
interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  points: number;
  role: 'user' | 'admin';
  status: 'active' | 'pending' | 'suspended';
  stats: {
    itemsListed: number;
    swapsCompleted: number;
    totalPointsEarned: number;
    totalPointsSpent: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Item Types
interface ItemImage {
  url: string;
  publicId: string;
  isMain: boolean;
}

interface Item {
  _id: string;
  title: string;
  description: string;
  category: 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'shoes' | 'accessories';
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'One Size' | 'Custom';
  brand?: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  material?: string;
  points: number;
  images: ItemImage[];
  tags: string[];
  owner: User;
  status: 'active' | 'pending' | 'sold' | 'removed' | 'flagged';
  isSwappable: boolean;
  isRedeemable: boolean;
  views: number;
  likes: string[];
  likesCount: number;
  reportsCount: number;
  mainImage?: string;
  createdAt: string;
  updatedAt: string;
}

// Swap Types
interface Swap {
  _id: string;
  initiator: User;
  recipient: User;
  initiatorItem?: Item;
  recipientItem: Item;
  type: 'swap' | 'redeem';
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  points: number;
  message?: string;
  initiatorRating?: {
    rating: number;
    comment?: string;
    createdAt: string;
  };
  recipientRating?: {
    rating: number;
    comment?: string;
    createdAt: string;
  };
  shipping: {
    initiatorTracking?: string;
    recipientTracking?: string;
    initiatorShippedAt?: string;
    recipientShippedAt?: string;
    initiatorReceivedAt?: string;
    recipientReceivedAt?: string;
  };
  timeline: Array<{
    action: string;
    user?: User;
    timestamp: string;
    details: string;
  }>;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper function to handle API responses
const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  
  return data;
};

// API Client class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = getAuthToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    return handleResponse<T>(response);
  }

  // Authentication
  async register(userData: { name: string; email: string; password: string }) {
    return this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: { email: string; password: string }) {
    return this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser() {
    return this.request<{ user: User }>('/auth/me');
  }

  async updateProfile(profileData: Partial<User>) {
    return this.request<{ user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwords: { currentPassword: string; newPassword: string }) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwords),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(data: { token: string; password: string }) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Items
  async getItems(params?: {
    category?: string;
    size?: string;
    condition?: string;
    minPoints?: number;
    maxPoints?: number;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return this.request<PaginatedResponse<Item>>(`/items?${searchParams}`);
  }

  async getFeaturedItems() {
    return this.request<{ items: Item[] }>('/items/featured');
  }

  async getItem(id: string) {
    return this.request<{ item: Item }>(`/items/${id}`);
  }

  async createItem(itemData: Partial<Item>) {
    return this.request<{ item: Item }>('/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async updateItem(id: string, itemData: Partial<Item>) {
    return this.request<{ item: Item }>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  }

  async deleteItem(id: string) {
    return this.request(`/items/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleLike(id: string) {
    return this.request<{ isLiked: boolean; likesCount: number }>(`/items/${id}/like`, {
      method: 'POST',
    });
  }

  async buyWithPoints(id: string) {
    return this.request<{ purchase: Swap; pointsSpent: number; bonusEarned: number }>(`/items/${id}/buy`, {
      method: 'POST',
    });
  }

  async reportItem(id: string, reportData: { reason: string; description: string }) {
    return this.request(`/items/${id}/report`, {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async getUserItems(userId: string, params?: { status?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return this.request<PaginatedResponse<Item>>(`/items/user/${userId}?${searchParams}`);
  }

  // Swaps
  async getSwaps(params?: { status?: string; type?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return this.request<{ swaps: Swap[]; pagination: PaginatedResponse<Swap>['pagination'] }>(`/swaps?${searchParams}`);
  }

  async getPendingSwaps() {
    return this.request<{ swaps: Swap[] }>('/swaps/pending');
  }

  async getSwap(id: string) {
    return this.request<{ swap: Swap }>(`/swaps/${id}`);
  }

  async createSwap(swapData: {
    recipientItem: string;
    type: 'swap' | 'redeem';
    message?: string;
    initiatorItem?: string;
  }) {
    return this.request<{ swap: Swap }>('/swaps', {
      method: 'POST',
      body: JSON.stringify(swapData),
    });
  }

  async acceptSwap(id: string) {
    return this.request<{ swap: Swap }>(`/swaps/${id}/accept`, {
      method: 'PUT',
    });
  }

  async rejectSwap(id: string) {
    return this.request<{ swap: Swap }>(`/swaps/${id}/reject`, {
      method: 'PUT',
    });
  }

  async markShipped(id: string, trackingNumber?: string) {
    return this.request<{ swap: Swap }>(`/swaps/${id}/ship`, {
      method: 'PUT',
      body: JSON.stringify({ trackingNumber }),
    });
  }

  async markReceived(id: string) {
    return this.request<{ swap: Swap }>(`/swaps/${id}/receive`, {
      method: 'PUT',
    });
  }

  async rateSwap(id: string, ratingData: { rating: number; comment?: string }) {
    return this.request<{ swap: Swap }>(`/swaps/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify(ratingData),
    });
  }

  async raiseDispute(id: string, disputeData: { reason: string; description: string }) {
    return this.request<{ swap: Swap }>(`/swaps/${id}/dispute`, {
      method: 'POST',
      body: JSON.stringify(disputeData),
    });
  }

  // Users
  async getUserProfile(userId: string) {
    return this.request<{ user: User; items: Item[] }>(`/users/${userId}`);
  }

  async getUserSwaps(userId: string, params?: { status?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return this.request<PaginatedResponse<Swap>>(`/users/${userId}/swaps?${searchParams}`);
  }

  async getDashboard() {
    return this.request<{
      userItems: Item[];
      pendingSwaps: Swap[];
      recentSwaps: Swap[];
      stats: User['stats'];
      points: number;
    }>('/users/dashboard');
  }

  async searchUsers(params: { q: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<PaginatedResponse<User>>(`/users/search?${searchParams}`);
  }

  async getTopUsers(params?: { type?: string; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return this.request<{ users: User[] }>(`/users/top?${searchParams}`);
  }

  // Upload
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/upload/image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    return handleResponse(response);
  }

  async uploadImages(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/upload/images`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    return handleResponse(response);
  }

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/upload/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    return handleResponse(response);
  }

  async deleteImage(publicId: string) {
    return this.request(`/upload/image/${publicId}`, {
      method: 'DELETE',
    });
  }

  // Admin (only for admin users)
  async getAdminStats() {
    return this.request('/admin/stats');
  }

  async getAdminUsers(params?: { status?: string; role?: string; search?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return this.request<{ users: User[]; pagination: PaginatedResponse<User>['pagination'] }>(`/admin/users?${searchParams}`);
  }

  async updateUserStatus(userId: string, status: string) {
    return this.request<{ user: User }>(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getAdminItems(params?: { status?: string; category?: string; search?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return this.request<PaginatedResponse<Item>>(`/admin/items?${searchParams}`);
  }

  async approveItem(itemId: string) {
    return this.request<{ item: Item }>(`/admin/items/${itemId}/approve`, {
      method: 'PUT',
    });
  }

  async rejectItem(itemId: string, reason: string) {
    return this.request<{ item: Item }>(`/admin/items/${itemId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  async featureItem(itemId: string, featured: boolean, featuredUntil?: string) {
    return this.request<{ item: Item }>(`/admin/items/${itemId}/feature`, {
      method: 'PUT',
      body: JSON.stringify({ featured, featuredUntil }),
    });
  }

  async getFlaggedItems() {
    return this.request<{ items: Item[] }>('/admin/items/flagged');
  }

  async resolveReports(itemId: string, action: string, notes?: string) {
    return this.request<{ item: Item }>(`/admin/items/${itemId}/resolve-reports`, {
      method: 'PUT',
      body: JSON.stringify({ action, notes }),
    });
  }

  async getAdminSwaps(params?: { status?: string; type?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return this.request<{ swaps: Swap[]; pagination: PaginatedResponse<Swap>['pagination'] }>(`/admin/swaps?${searchParams}`);
  }

  async getDisputes() {
    return this.request<{ swaps: Swap[] }>('/admin/disputes');
  }

  async resolveDispute(swapId: string, resolution: string, notes: string) {
    return this.request<{ swap: Swap }>(`/admin/swaps/${swapId}/resolve-dispute`, {
      method: 'PUT',
      body: JSON.stringify({ resolution, notes }),
    });
  }
}

// Create and export API client instance
export const api = new ApiClient(API_BASE_URL);

// Export types
export type {
  ApiResponse,
  PaginatedResponse,
  User,
  Item,
  Swap,
  ItemImage,
}; 