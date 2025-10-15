// Mock data service for admin panel
export interface MockUser {
  id: number;
  name: string;
  email: string;
  subscription: 'freemium' | 'basic' | 'premium';
  status: 'active' | 'suspended' | 'inactive';
  joinDate: string;
  lastLogin: string;
  progress: number;
  totalSpent: number;
  avatar?: string;
}

export interface MockSeries {
  id: number;
  title: string;
  description: string;
  videoCount: number;
  totalDuration: string;
  visibility: 'freemium' | 'basic' | 'premium';
  status: 'published' | 'draft' | 'archived';
  createdAt: string;
  thumbnail?: string;
  category: string;
}

export interface MockVideo {
  id: number;
  title: string;
  series: string;
  seriesId: number;
  duration: string;
  views: number;
  visibility: 'freemium' | 'basic' | 'premium';
  status: 'published' | 'draft' | 'archived';
  uploadedAt: string;
  thumbnail?: string;
  description: string;
  completionRate: number;
  rating: number;
}

export interface MockSubscriptionPlan {
  id: number;
  name: 'freemium' | 'basic' | 'premium';
  displayName: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  duration: number | null;
  features: string[];
  maxDevices: number;
  videoQuality: 'SD' | 'HD' | '4K';
  downloadableContent: boolean;
  certificates: boolean;
  prioritySupport: boolean;
  adFree: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface MockTransaction {
  id: string;
  user: string;
  userEmail: string;
  subscription: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  type: 'subscription' | 'upgrade' | 'refund';
  paymentMethod: string;
  cardLastFour: string;
  gateway: string;
  transactionId: string;
  paidAt: string | null;
  subscriptionPeriod: string;
  createdAt: string;
}

export interface MockCoupon {
  id: number;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minAmount: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  applicablePlans: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface MockSupportTicket {
  id: string;
  user: string;
  userEmail: string;
  subject: string;
  message: string;
  category: 'technical' | 'billing' | 'content' | 'account' | 'feature_request';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo: string;
  createdAt: string;
  lastReply: string | null;
  replies: number;
  relatedVideo: string | null;
}

export interface MockFeedback {
  id: string;
  user: string;
  userEmail: string;
  type: 'suggestion' | 'feedback';
  subject: string;
  message: string;
  category: string;
  rating: number;
  status: 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'archived';
  createdAt: string;
  relatedVideo: string | null;
  priority: 'low' | 'medium' | 'high';
}

// Mock data generators
export const generateMockUsers = (): MockUser[] => [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    subscription: 'premium',
    status: 'active',
    joinDate: '2024-01-15',
    lastLogin: '2024-01-20',
    progress: 85,
    totalSpent: 59.97,
    avatar: '/avatars/john.jpg'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    subscription: 'basic',
    status: 'active',
    joinDate: '2024-01-10',
    lastLogin: '2024-01-19',
    progress: 62,
    totalSpent: 29.97,
    avatar: '/avatars/jane.jpg'
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike@example.com',
    subscription: 'freemium',
    status: 'active',
    joinDate: '2024-01-05',
    lastLogin: '2024-01-18',
    progress: 23,
    totalSpent: 0,
    avatar: '/avatars/mike.jpg'
  },
  {
    id: 4,
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    subscription: 'premium',
    status: 'suspended',
    joinDate: '2023-12-20',
    lastLogin: '2024-01-15',
    progress: 91,
    totalSpent: 119.94,
    avatar: '/avatars/sarah.jpg'
  },
  {
    id: 5,
    name: 'David Brown',
    email: 'david@example.com',
    subscription: 'basic',
    status: 'active',
    joinDate: '2024-01-08',
    lastLogin: '2024-01-20',
    progress: 45,
    totalSpent: 19.98,
    avatar: '/avatars/david.jpg'
  },
  {
    id: 6,
    name: 'Emily Davis',
    email: 'emily@example.com',
    subscription: 'freemium',
    status: 'active',
    joinDate: '2024-01-12',
    lastLogin: '2024-01-19',
    progress: 15,
    totalSpent: 0,
    avatar: '/avatars/emily.jpg'
  },
  {
    id: 7,
    name: 'Robert Miller',
    email: 'robert@example.com',
    subscription: 'premium',
    status: 'active',
    joinDate: '2024-01-03',
    lastLogin: '2024-01-20',
    progress: 78,
    totalSpent: 79.96,
    avatar: '/avatars/robert.jpg'
  },
  {
    id: 8,
    name: 'Lisa Garcia',
    email: 'lisa@example.com',
    subscription: 'basic',
    status: 'active',
    joinDate: '2024-01-14',
    lastLogin: '2024-01-18',
    progress: 34,
    totalSpent: 9.99,
    avatar: '/avatars/lisa.jpg'
  }
];

export const generateMockSeries = (): MockSeries[] => [
  {
    id: 1,
    title: 'React Fundamentals',
    description: 'Learn the basics of React development',
    videoCount: 12,
    totalDuration: '4h 30m',
    visibility: 'premium',
    status: 'published',
    createdAt: '2024-01-15',
    thumbnail: '/thumbnails/react-series.jpg',
    category: 'Web Development'
  },
  {
    id: 2,
    title: 'JavaScript Advanced',
    description: 'Advanced JavaScript concepts and patterns',
    videoCount: 8,
    totalDuration: '3h 15m',
    visibility: 'basic',
    status: 'published',
    createdAt: '2024-01-10',
    thumbnail: '/thumbnails/js-series.jpg',
    category: 'Programming'
  },
  {
    id: 3,
    title: 'CSS Mastery',
    description: 'Master CSS with modern techniques',
    videoCount: 15,
    totalDuration: '5h 45m',
    visibility: 'freemium',
    status: 'published',
    createdAt: '2024-01-05',
    thumbnail: '/thumbnails/css-series.jpg',
    category: 'Web Design'
  },
  {
    id: 4,
    title: 'Node.js Backend',
    description: 'Build robust backend applications',
    videoCount: 10,
    totalDuration: '6h 20m',
    visibility: 'premium',
    status: 'draft',
    createdAt: '2024-01-18',
    thumbnail: '/thumbnails/node-series.jpg',
    category: 'Backend Development'
  },
  {
    id: 5,
    title: 'Python Basics',
    description: 'Introduction to Python programming',
    videoCount: 20,
    totalDuration: '8h 15m',
    visibility: 'freemium',
    status: 'published',
    createdAt: '2024-01-02',
    thumbnail: '/thumbnails/python-series.jpg',
    category: 'Programming'
  }
];

export const generateMockVideos = (): MockVideo[] => [
  {
    id: 1,
    title: 'Introduction to Components',
    series: 'React Fundamentals',
    seriesId: 1,
    duration: '25:30',
    views: 1234,
    visibility: 'premium',
    status: 'published',
    uploadedAt: '2024-01-15',
    thumbnail: '/thumbnails/react-intro.jpg',
    description: 'Learn the basics of React components',
    completionRate: 85,
    rating: 4.9
  },
  {
    id: 2,
    title: 'State and Props',
    series: 'React Fundamentals',
    seriesId: 1,
    duration: '32:15',
    views: 987,
    visibility: 'premium',
    status: 'published',
    uploadedAt: '2024-01-16',
    thumbnail: '/thumbnails/react-state.jpg',
    description: 'Understanding state and props in React',
    completionRate: 78,
    rating: 4.8
  },
  {
    id: 3,
    title: 'Event Handling',
    series: 'React Fundamentals',
    seriesId: 1,
    duration: '28:45',
    views: 876,
    visibility: 'premium',
    status: 'published',
    uploadedAt: '2024-01-17',
    thumbnail: '/thumbnails/react-events.jpg',
    description: 'How to handle events in React',
    completionRate: 82,
    rating: 4.7
  },
  {
    id: 4,
    title: 'JavaScript Closures',
    series: 'JavaScript Advanced',
    seriesId: 2,
    duration: '35:20',
    views: 654,
    visibility: 'basic',
    status: 'published',
    uploadedAt: '2024-01-10',
    thumbnail: '/thumbnails/js-closures.jpg',
    description: 'Deep dive into JavaScript closures',
    completionRate: 75,
    rating: 4.6
  },
  {
    id: 5,
    title: 'CSS Grid Basics',
    series: 'CSS Mastery',
    seriesId: 3,
    duration: '22:10',
    views: 432,
    visibility: 'freemium',
    status: 'published',
    uploadedAt: '2024-01-05',
    thumbnail: '/thumbnails/css-grid.jpg',
    description: 'Learn CSS Grid layout',
    completionRate: 88,
    rating: 4.5
  },
  {
    id: 6,
    title: 'Flexbox Fundamentals',
    series: 'CSS Mastery',
    seriesId: 3,
    duration: '18:30',
    views: 567,
    visibility: 'freemium',
    status: 'published',
    uploadedAt: '2024-01-06',
    thumbnail: '/thumbnails/css-flexbox.jpg',
    description: 'Master CSS Flexbox',
    completionRate: 92,
    rating: 4.8
  }
];

export const generateMockPlans = (): MockSubscriptionPlan[] => [
  {
    id: 1,
    name: 'freemium',
    displayName: 'Free Plan',
    description: 'Access to limited content with basic features',
    price: 0,
    billingCycle: 'monthly',
    duration: null,
    features: [
      'Access to limited content',
      'Basic video quality',
      'Watch on 1 device',
      'Community support'
    ],
    maxDevices: 1,
    videoQuality: 'SD',
    downloadableContent: false,
    certificates: false,
    prioritySupport: false,
    adFree: false,
    isActive: true,
    sortOrder: 1
  },
  {
    id: 2,
    name: 'basic',
    displayName: 'Basic Plan',
    description: 'Intermediate level content with enhanced features',
    price: 9.99,
    billingCycle: 'monthly',
    duration: 30,
    features: [
      'Access to intermediate level content',
      'HD streaming quality',
      'Watch on 2 devices',
      'Email support',
      'Progress tracking'
    ],
    maxDevices: 2,
    videoQuality: 'HD',
    downloadableContent: false,
    certificates: false,
    prioritySupport: false,
    adFree: true,
    isActive: true,
    sortOrder: 2
  },
  {
    id: 3,
    name: 'premium',
    displayName: 'Premium Plan',
    description: 'Full access to all content with premium features',
    price: 19.99,
    billingCycle: 'monthly',
    duration: 30,
    features: [
      'Access to all content',
      '4K streaming quality',
      'Watch on 3 devices',
      'Priority support',
      'Downloadable content',
      'Certificates of completion',
      'Ad-free experience'
    ],
    maxDevices: 3,
    videoQuality: '4K',
    downloadableContent: true,
    certificates: true,
    prioritySupport: true,
    adFree: true,
    isActive: true,
    sortOrder: 3
  }
];

export const generateMockTransactions = (): MockTransaction[] => [
  {
    id: 'txn_001',
    user: 'John Doe',
    userEmail: 'john@example.com',
    subscription: 'Premium',
    amount: 19.99,
    currency: 'USD',
    status: 'completed',
    type: 'subscription',
    paymentMethod: 'card',
    cardLastFour: '4242',
    gateway: 'stripe',
    transactionId: 'pi_1234567890',
    paidAt: '2024-01-20 14:30:00',
    subscriptionPeriod: '2024-01-20 to 2024-02-20',
    createdAt: '2024-01-20 14:30:00'
  },
  {
    id: 'txn_002',
    user: 'Jane Smith',
    userEmail: 'jane@example.com',
    subscription: 'Basic',
    amount: 9.99,
    currency: 'USD',
    status: 'completed',
    type: 'subscription',
    paymentMethod: 'card',
    cardLastFour: '5555',
    gateway: 'stripe',
    transactionId: 'pi_0987654321',
    paidAt: '2024-01-19 09:15:00',
    subscriptionPeriod: '2024-01-19 to 2024-02-19',
    createdAt: '2024-01-19 09:15:00'
  },
  {
    id: 'txn_003',
    user: 'Mike Johnson',
    userEmail: 'mike@example.com',
    subscription: 'Premium',
    amount: 19.99,
    currency: 'USD',
    status: 'pending',
    type: 'subscription',
    paymentMethod: 'card',
    cardLastFour: '1234',
    gateway: 'stripe',
    transactionId: 'pi_1122334455',
    paidAt: null,
    subscriptionPeriod: 'Pending',
    createdAt: '2024-01-18 16:20:00'
  },
  {
    id: 'txn_004',
    user: 'Sarah Wilson',
    userEmail: 'sarah@example.com',
    subscription: 'Premium',
    amount: 19.99,
    currency: 'USD',
    status: 'failed',
    type: 'subscription',
    paymentMethod: 'card',
    cardLastFour: '9876',
    gateway: 'stripe',
    transactionId: 'pi_5566778899',
    paidAt: null,
    subscriptionPeriod: 'Failed',
    createdAt: '2024-01-17 11:45:00'
  },
  {
    id: 'txn_005',
    user: 'David Brown',
    userEmail: 'david@example.com',
    subscription: 'Basic',
    amount: 9.99,
    currency: 'USD',
    status: 'completed',
    type: 'subscription',
    paymentMethod: 'card',
    cardLastFour: '4321',
    gateway: 'stripe',
    transactionId: 'pi_9988776655',
    paidAt: '2024-01-16 14:10:00',
    subscriptionPeriod: '2024-01-16 to 2024-02-16',
    createdAt: '2024-01-16 14:10:00'
  }
];

export const generateMockCoupons = (): MockCoupon[] => [
  {
    id: 1,
    code: 'WELCOME20',
    name: 'Welcome Discount',
    description: '20% off for new users',
    type: 'percentage',
    value: 20,
    minAmount: 0,
    maxDiscount: 50,
    usageLimit: 100,
    usedCount: 45,
    applicablePlans: ['basic', 'premium'],
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    isActive: true,
    createdAt: '2024-01-01'
  },
  {
    id: 2,
    code: 'SAVE10',
    name: 'Fixed Discount',
    description: '$10 off any plan',
    type: 'fixed',
    value: 10,
    minAmount: 20,
    maxDiscount: 10,
    usageLimit: 50,
    usedCount: 23,
    applicablePlans: ['basic', 'premium'],
    startDate: '2024-01-15',
    endDate: '2024-06-15',
    isActive: true,
    createdAt: '2024-01-15'
  },
  {
    id: 3,
    code: 'STUDENT50',
    name: 'Student Scholarship',
    description: '50% off for students',
    type: 'percentage',
    value: 50,
    minAmount: 0,
    maxDiscount: 100,
    usageLimit: 25,
    usedCount: 25,
    applicablePlans: ['basic', 'premium'],
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    isActive: false,
    createdAt: '2024-01-01'
  },
  {
    id: 4,
    code: 'EARLYBIRD',
    name: 'Early Bird Special',
    description: '30% off for early subscribers',
    type: 'percentage',
    value: 30,
    minAmount: 0,
    maxDiscount: 30,
    usageLimit: 200,
    usedCount: 156,
    applicablePlans: ['premium'],
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    isActive: true,
    createdAt: '2024-01-01'
  }
];

export const generateMockSupportTickets = (): MockSupportTicket[] => [
  {
    id: 'TKT-001',
    user: 'John Doe',
    userEmail: 'john@example.com',
    subject: 'Video playback issues',
    message: 'I am having trouble playing videos on my mobile device. The video keeps buffering and sometimes stops completely. This is very frustrating when trying to learn.',
    category: 'technical',
    priority: 'high',
    status: 'open',
    assignedTo: 'Support Team',
    createdAt: '2024-01-20 14:30:00',
    lastReply: '2024-01-20 15:45:00',
    replies: 2,
    relatedVideo: 'React Fundamentals - Episode 3'
  },
  {
    id: 'TKT-002',
    user: 'Jane Smith',
    userEmail: 'jane@example.com',
    subject: 'Subscription billing question',
    message: 'I was charged twice for my premium subscription this month. Can you help me resolve this billing issue?',
    category: 'billing',
    priority: 'medium',
    status: 'in_progress',
    assignedTo: 'Billing Team',
    createdAt: '2024-01-19 09:15:00',
    lastReply: '2024-01-19 10:30:00',
    replies: 3,
    relatedVideo: null
  },
  {
    id: 'TKT-003',
    user: 'Mike Johnson',
    userEmail: 'mike@example.com',
    subject: 'Content request',
    message: 'Would it be possible to add more advanced JavaScript topics? I have completed the current series and would like to continue learning.',
    category: 'content',
    priority: 'low',
    status: 'resolved',
    assignedTo: 'Content Team',
    createdAt: '2024-01-18 16:20:00',
    lastReply: '2024-01-19 09:00:00',
    replies: 1,
    relatedVideo: null
  },
  {
    id: 'TKT-004',
    user: 'Sarah Wilson',
    userEmail: 'sarah@example.com',
    subject: 'Account access problem',
    message: 'I cannot log into my account. I keep getting an error message saying my credentials are incorrect, but I know they are right.',
    category: 'account',
    priority: 'high',
    status: 'open',
    assignedTo: 'Technical Team',
    createdAt: '2024-01-17 11:45:00',
    lastReply: null,
    replies: 0,
    relatedVideo: null
  },
  {
    id: 'TKT-005',
    user: 'David Brown',
    userEmail: 'david@example.com',
    subject: 'Feature suggestion',
    message: 'It would be great to have a dark mode option for the platform. This would help reduce eye strain during night-time learning sessions.',
    category: 'feature_request',
    priority: 'low',
    status: 'closed',
    assignedTo: 'Product Team',
    createdAt: '2024-01-16 14:10:00',
    lastReply: '2024-01-17 08:30:00',
    replies: 2,
    relatedVideo: null
  }
];

export const generateMockFeedback = (): MockFeedback[] => [
  {
    id: 'FB-001',
    user: 'John Doe',
    userEmail: 'john@example.com',
    type: 'suggestion',
    subject: 'Dark mode feature request',
    message: 'It would be great to have a dark mode option for the platform. This would help reduce eye strain during night-time learning sessions and improve the overall user experience.',
    category: 'UI/UX',
    rating: 5,
    status: 'new',
    createdAt: '2024-01-20 14:30:00',
    relatedVideo: null,
    priority: 'medium'
  },
  {
    id: 'FB-002',
    user: 'Jane Smith',
    userEmail: 'jane@example.com',
    type: 'feedback',
    subject: 'Video quality feedback',
    message: 'The video quality is excellent, but I noticed some audio sync issues in the React Fundamentals series. The content is very helpful though!',
    category: 'Technical',
    rating: 4,
    status: 'reviewed',
    createdAt: '2024-01-19 09:15:00',
    relatedVideo: 'React Fundamentals - Episode 5',
    priority: 'high'
  },
  {
    id: 'FB-003',
    user: 'Mike Johnson',
    userEmail: 'mike@example.com',
    type: 'suggestion',
    subject: 'Downloadable content request',
    message: 'Would it be possible to add downloadable PDFs for the course materials? This would be very helpful for offline study and reference.',
    category: 'Content',
    rating: 5,
    status: 'in_progress',
    createdAt: '2024-01-18 16:20:00',
    relatedVideo: null,
    priority: 'medium'
  },
  {
    id: 'FB-004',
    user: 'Sarah Wilson',
    userEmail: 'sarah@example.com',
    type: 'feedback',
    subject: 'Mobile app suggestion',
    message: 'The mobile experience is good, but could you add swipe gestures for video navigation? This would make it more intuitive and user-friendly.',
    category: 'Mobile',
    rating: 4,
    status: 'new',
    createdAt: '2024-01-17 11:45:00',
    relatedVideo: null,
    priority: 'low'
  },
  {
    id: 'FB-005',
    user: 'David Brown',
    userEmail: 'david@example.com',
    type: 'feedback',
    subject: 'Course structure feedback',
    message: 'The course progression is well-structured, but I think adding more practical exercises would enhance the learning experience significantly.',
    category: 'Content',
    rating: 4,
    status: 'resolved',
    createdAt: '2024-01-16 14:10:00',
    relatedVideo: 'JavaScript Advanced - Episode 3',
    priority: 'medium'
  }
];

// Analytics mock data
export const generateAnalyticsData = () => ({
  overview: {
    totalUsers: 1234,
    activeUsers: 892,
    totalRevenue: 18450,
    totalViews: 45678,
    averageSessionTime: '24:15',
    conversionRate: 12.5,
    churnRate: 3.2
  },
  userGrowth: [
    { month: 'Jan', users: 800, newUsers: 120, churnedUsers: 25 },
    { month: 'Feb', users: 920, newUsers: 150, churnedUsers: 30 },
    { month: 'Mar', users: 1050, newUsers: 180, churnedUsers: 50 },
    { month: 'Apr', users: 1180, newUsers: 200, churnedUsers: 70 },
    { month: 'May', users: 1234, newUsers: 220, churnedUsers: 66 }
  ],
  revenue: [
    { month: 'Jan', revenue: 12500, subscriptions: 45 },
    { month: 'Feb', revenue: 14200, subscriptions: 52 },
    { month: 'Mar', revenue: 16800, subscriptions: 65 },
    { month: 'Apr', revenue: 17500, subscriptions: 68 },
    { month: 'May', revenue: 18450, subscriptions: 72 }
  ],
  subscriptionStats: {
    freemium: { count: 450, percentage: 36.5 },
    basic: { count: 520, percentage: 42.1 },
    premium: { count: 264, percentage: 21.4 }
  },
  deviceStats: {
    desktop: { count: 680, percentage: 55.0 },
    mobile: { count: 420, percentage: 34.0 },
    tablet: { count: 134, percentage: 11.0 }
  },
  geographicStats: [
    { country: 'United States', users: 456, percentage: 37.0 },
    { country: 'United Kingdom', users: 234, percentage: 19.0 },
    { country: 'Canada', users: 178, percentage: 14.4 },
    { country: 'Australia', users: 123, percentage: 10.0 },
    { country: 'Germany', users: 98, percentage: 7.9 },
    { country: 'Others', users: 145, percentage: 11.7 }
  ]
});
