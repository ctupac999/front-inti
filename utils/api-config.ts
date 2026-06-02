export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const API_ROUTES = {
  // Health
  ping: '/ping',

  // Auth
  login: '/auth/login',
  register: '/auth/register',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',

  // Users
  me: '/users/me',
  updateMe: '/users/me',
  meLegalConsent: '/users/me/legal-consent',
  meAvatar: '/users/me/avatar',
  meLocations: '/users/me/locations',

  // Products
  products: '/products',
  myProducts: '/products/user/mine',

  // Trades
  trades: '/trades',
  myTrades: '/trades/mine',

  // Admin
  adminDashboard: '/admin/dashboard',
  adminUsers: '/admin/users',
  adminProducts: '/admin/products',
  adminTrades: '/admin/trades',

  // Site Config
  siteConfig: '/site-config',

  // Email Templates
  emailTemplates: '/email-templates',
  emailTemplatesBcc: '/email-templates/admin/bcc',

  // Product Classification
  productClassification: '/product-classification',

  // Notifications
  notifications: '/notifications',
  notificationsUnreadCount: '/notifications/unread-count',
  notificationsMarkRead: (id: string) => `/notifications/${id}/read`,
  notificationsReadAll: '/notifications/read-all',

  // Trade contact
  tradeContact: (id: string) => `/trades/${id}/contact`,

  // Legal
  legalVersion: '/legal/version',

  // Contact
  contact: '/contact',
}
