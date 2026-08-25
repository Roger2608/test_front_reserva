export type Entity = { id: string; createdAt: string; updatedAt: string; version: number };
export type Tenant = Entity & { name: string; slug: string; timezone: string; currency: string; active: boolean };
export type Location = Entity & { tenantId: string; name: string; address?: string; timezone: string; active: boolean };
export type Service = Entity & { tenantId: string; name: string; description?: string; durationMinutes: number; price: number; active: boolean; publicVisible: boolean };
export type Resource = Entity & { tenantId: string; locationId: string; name: string; type: "STAFF" | "SPACE" | "ASSET" | "CAPACITY"; capacity: number; active: boolean };
export type Slot = { startAt: string; endAt: string; resourceId: string };
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
export type Booking = Entity & {
  tenantId: string; locationId: string; serviceId: string; resourceId: string; customerId: string;
  startAt: string; endAt: string; status: BookingStatus; source: string; notes?: string; publicToken: string;
};
export type ProblemDetails = { type?: string; title: string; status: number; detail: string; timestamp?: string; correlationId?: string };
export type Plan = "FREE" | "BASIC" | "PLUS" | "PREMIUM";
export type Role = "PLATFORM_ADMIN"|"TENANT_OWNER"|"TENANT_ADMIN"|"TENANT_STAFF"|"PENDING_COMPANY";
export type Checkout = { id:string;status:"PENDING"|"PAID"|"FAILED";plan:Plan;amount:number;currency:string;checkoutUrl?:string };
export type PlanPrice = { plan:Plan;amount:number;currency:string };
export type Session = { accessToken?: string; expiresIn?: number; userId: string; fullName: string; email: string; tenant: Tenant|null; role: Role; plan: Plan; canCustomizeDesign: boolean; checkout?:Checkout };
export type Branding = Entity & { tenantId:string;primaryColor:string;accentColor:string;fontPreset:"CLASSIC"|"MODERN"|"FRIENDLY";themePreset:"EDITORIAL"|"MINIMAL"|"BOLD";heroTitle?:string;heroDescription?:string;logoUrl?:string;coverUrl?:string;buttonStyle:"ROUNDED"|"PILL"|"SQUARE" };
export type PlanCapabilities = { showCustomerAds:boolean;showAdminAds:boolean;canCustomizeDesign:boolean;canAutomateWhatsapp:boolean;hasWhatsappReminder:boolean;canAdvertise:boolean };
export type Subscription = { plan:Plan;status:string;canCustomizeDesign:boolean;premiumDesign:boolean;currentPeriodStart?:string;currentPeriodEnd?:string;pendingCheckout?:Checkout;capabilities:PlanCapabilities };
export type PublicSite = { tenant:Tenant;plan:Plan;customized:boolean;branding:Omit<Branding,"id"|"tenantId"|"createdAt"|"updatedAt"|"version">;capabilities:PlanCapabilities };
export type Advertisement = { id:string;advertiserName:string;title:string;description:string;ctaLabel:string;destinationUrl:string;imageUrl?:string;adminDisplaySeconds:number;active:boolean };
export type NotificationJob = Entity & { tenantId:string;bookingId:string;type:"BOOKING_CONFIRMATION"|"BOOKING_REMINDER";scheduledAt:string;status:"PENDING"|"SENT"|"FAILED";attempts:number;providerReference?:string;lastError?:string;sentAt?:string };
export type AvailabilityRule = Entity & { tenantId:string;resourceId:string;dayOfWeek:number;startTime:string;endTime:string;active:boolean };

export type CreateBooking = {
  locationId: string; serviceId: string; resourceId: string; startAt: string; notes?: string;
  customer: { name: string; phone: string; email?: string; whatsappOptIn: boolean };
};
