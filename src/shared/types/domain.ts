export type Entity = {
  id: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};
export type Tenant = Entity & {
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  active: boolean;
};
export type Location = Entity & {
  tenantId: string;
  name: string;
  address?: string;
  timezone: string;
  active: boolean;
};
export type Service = Entity & {
  tenantId: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  active: boolean;
  publicVisible: boolean;
};
export type Resource = Entity & {
  tenantId: string;
  locationId: string;
  name: string;
  type: "STAFF" | "SPACE" | "ASSET" | "CAPACITY";
  capacity: number;
  active: boolean;
  imageUrl?: string;
  bio?: string;
};
export type Slot = { startAt: string; endAt: string; resourceId: string };
export type BookingStatus =
  "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
export type Booking = Entity & {
  tenantId: string;
  locationId: string;
  serviceId: string;
  resourceId: string;
  customerId: string;
  startAt: string;
  endAt: string;
  status: BookingStatus;
  source: string;
  notes?: string;
  publicToken: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  couponCode?: string;
};
export type ProblemDetails = {
  type?: string;
  title: string;
  status: number;
  detail: string;
  timestamp?: string;
  correlationId?: string;
};
export type Plan = "FREE" | "BASIC" | "PLUS" | "PREMIUM";
export type Role =
  | "PLATFORM_ADMIN"
  | "TENANT_OWNER"
  | "TENANT_ADMIN"
  | "TENANT_STAFF"
  | "PENDING_COMPANY";
export type Checkout = {
  id: string;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
  plan: Plan;
  amount: number;
  currency: string;
  checkoutUrl?: string;
  paymentInProgress?: boolean;
};
export type DirectPaymentResult = {
  paymentId: string;
  status: string;
  statusDetail: string;
  checkout: Checkout;
};
export type PlanPrice = { plan: Plan; amount: number; currency: string };
export type Session = {
  accessToken?: string;
  expiresIn?: number;
  userId: string;
  fullName: string;
  email: string;
  tenant: Tenant | null;
  role: Role;
  plan: Plan;
  subscriptionStatus:
    | "TRIAL"
    | "TRIAL_PAYMENT_REQUIRED"
    | "ACTIVE"
    | "PENDING_PAYMENT"
    | "SUSPENDED"
    | "NONE";
  canCustomizeDesign: boolean;
  checkout?: Checkout;
};
export type Branding = Entity & {
  tenantId: string;
  primaryColor: string;
  accentColor: string;
  fontPreset: "CLASSIC" | "MODERN" | "FRIENDLY";
  themePreset: "EDITORIAL" | "MINIMAL" | "BOLD";
  heroTitle?: string;
  heroDescription?: string;
  logoUrl?: string;
  coverUrl?: string;
  backgroundType: "COLOR" | "IMAGE";
  backgroundColor: string;
  backgroundImageUrl?: string;
  buttonStyle: "ROUNDED" | "PILL" | "SQUARE";
};
export type PlanCapabilities = {
  showCustomerAds: boolean;
  showAdminAds: boolean;
  canCustomizeDesign: boolean;
  canAutomateWhatsapp: boolean;
  hasWhatsappReminder: boolean;
  canAdvertise: boolean;
  canUseCustomerLoyalty: boolean;
  canExportAccounting: boolean;
};
export type Subscription = {
  plan: Plan;
  status: string;
  canCustomizeDesign: boolean;
  premiumDesign: boolean;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialStartedAt?: string;
  trialEndsAt?: string;
  paymentDueAt?: string;
  daysRemaining: number;
  renewalEligible: boolean;
  pendingCheckout?: Checkout;
  capabilities: PlanCapabilities;
};
export type PublicSite = {
  tenant: Tenant;
  plan: Plan;
  customized: boolean;
  branding: Omit<
    Branding,
    "id" | "tenantId" | "createdAt" | "updatedAt" | "version"
  >;
  capabilities: PlanCapabilities;
};
export type Advertisement = {
  id: string;
  advertiserName: string;
  title: string;
  description: string;
  ctaLabel: string;
  destinationUrl: string;
  imageUrl?: string;
  logoUrl?: string;
  coverUrl?: string;
  contentMode: "DESIGNED" | "HTML" | "COMBO";
  htmlContent?: string;
  layoutPreset: "CARD" | "HERO" | "SPLIT";
  adminDisplaySeconds: number;
  active: boolean;
};
export type NotificationJob = Entity & {
  tenantId: string;
  bookingId: string;
  type: "BOOKING_CONFIRMATION" | "BOOKING_REMINDER";
  scheduledAt: string;
  status: "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "SKIPPED";
  attempts: number;
  providerReference?: string;
  lastError?: string;
  sentAt?: string;
};
export type AvailabilityRule = Entity & {
  tenantId: string;
  resourceId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
};

export type CreateBooking = {
  locationId: string;
  serviceId: string;
  resourceId: string;
  startAt: string;
  notes?: string;
  couponCode?: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    whatsappOptIn: boolean;
  };
};

export type Coupon = {
  id: string;
  code: string;
  description?: string;
  discountPercent: number;
  maxUses: number;
  usedCount: number;
  validUntil?: string;
  assignedCustomerId?: string;
  active: boolean;
};
export type CommercialStatus = {
  status: string;
  count: number;
  amount: number;
};
export type CommercialBooking = {
  id: string;
  startAt: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceName: string;
  staffName: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  couponCode?: string;
};
export type CommercialCustomer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  bookingCount: number;
  completedCount: number;
  accumulatedAmount: number;
  recurring: boolean;
};
export type CommercialDashboard = {
  totalBookings: number;
  potentialRevenue: number;
  completedRevenue: number;
  byStatus: CommercialStatus[];
  recent: CommercialBooking[];
  customers: CommercialCustomer[];
};
export type CouponValidation = {
  code: string;
  discountPercent: number;
  discountAmount: number;
  total: number;
};
