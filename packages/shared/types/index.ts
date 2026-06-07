// ─── Existing Enums ─────────────────────────────────────────────────────────

export type UserPlan = 'free' | 'pro' | 'business';
export type ProductType = 'solid_color' | 'design' | 'custom';

export type OrderStatus =
  | 'pending_payment'
  | 'payment_failed'
  | 'pending_production'
  | 'in_production'
  | 'dispatched'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type CardStatus =
  | 'provisioned'
  | 'active'
  | 'deactivated'
  | 'reassigned';

// ─── New Enums ───────────────────────────────────────────────────────────────

export type ProfileStatus = 'active' | 'inactive' | 'draft';
export type LinkCategory  = 'social' | 'payment' | 'website' | 'custom';
export type LeadStatus    = 'new' | 'contacted' | 'following_up' | 'converted' | 'lost' | 'spam';
export type FeedType      = 'image' | 'video' | 'text' | 'link';

// ─── Plan Limits ─────────────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<UserPlan, {
  profilesPerCard:  number;
  socialLinks:      number;
  paymentLinks:     number;
  hasLeads:         boolean;
  hasProducts:      boolean;
  hasFeeds:         boolean;
  hasGeoAnalytics:  boolean;
  hasCsvExport:     boolean;
}> = {
  free: {
    profilesPerCard: 1,
    socialLinks:     5,
    paymentLinks:    3,
    hasLeads:        false,
    hasProducts:     false,
    hasFeeds:        false,
    hasGeoAnalytics: false,
    hasCsvExport:    false,
  },
  pro: {
    profilesPerCard: 5,
    socialLinks:     Infinity,
    paymentLinks:    Infinity,
    hasLeads:        true,
    hasProducts:     true,
    hasFeeds:        true,
    hasGeoAnalytics: true,
    hasCsvExport:    true,
  },
  business: {
    profilesPerCard: Infinity,
    socialLinks:     Infinity,
    paymentLinks:    Infinity,
    hasLeads:        true,
    hasProducts:     true,
    hasFeeds:        true,
    hasGeoAnalytics: true,
    hasCsvExport:    true,
  },
};

export function isPro(plan: UserPlan): boolean {
  return plan === 'pro' || plan === 'business';
}

export function getPlanLimit<K extends keyof typeof PLAN_LIMITS['free']>(
  plan: UserPlan,
  feature: K
): (typeof PLAN_LIMITS)['free'][K] {
  return PLAN_LIMITS[plan][feature];
}

// ─── Personalisation (order-time) ────────────────────────────────────────────

export interface SolidColorPersonalisation {
  colorName: string; colorHex: string; title?: string; name?: string;
  tagline?: string; titleColor?: string; titleFont?: string; titleSize?: string;
  taglineColor?: string; tagColor?: string; tagcolor?: string; taglineFont?: string; taglineSize?: string;
}

export interface DesignPersonalisation {
  designName: string; title?: string; name?: string; tagline?: string;
  titleColor?: string; titleFont?: string; titleSize?: string;
  taglineColor?: string; tagColor?: string; tagcolor?: string; taglineFont?: string; taglineSize?: string;
}

export interface CustomPersonalisation {
  backgroundUrl?: string; backgroundImageUrl?: string; brandName?: string;
  title?: string; name?: string; tagline?: string;
  logoUrl?: string; logoImageUrl?: string; logoHeight?: number;
  logoPlacement?: 'top-left' | 'center'; logoplacement?: 'top-left' | 'center';
  titleColor?: string; titleFont?: string; titleSize?: string;
  taglineColor?: string; tagColor?: string; tagcolor?: string; taglineFont?: string; taglineSize?: string;
}

export type PersonalisationDetails = any;

// ─── Core Existing Types ──────────────────────────────────────────────────────

export interface Account {
  id: string; email: string; full_name: string | null;
  plan: UserPlan; plan_expires_at: string | null;
  created_at: string; updated_at: string;
}

export interface CardColor { name: string; hex: string; }

export interface CardProduct {
  id: string; name: string; slug: string; product_type: ProductType;
  price_inr: number; material: string; description: string | null;
  is_active: boolean; available_colors: CardColor[]; image_url: string | null; created_at: string;
}

export interface Order {
  id: string; order_number: string; account_id: string | null; status: OrderStatus;
  total_inr: number; subtotal_inr: number; gst_inr: number; plan_charge_inr: number;
  shipping_address: { fullName: string; email: string; phone: string; addressLine1: string; addressLine2?: string; city: string; state: string; pincode: string; };
  contact_phone: string; contact_email: string;
  razorpay_order_id: string | null; razorpay_payment_id: string | null;
  invoice_number: string | null; invoice_url: string | null;
  paid_at: string | null; dispatched_at: string | null; delivered_at: string | null;
  courier_name: string | null; tracking_number: string | null; tracking_url: string | null;
  admin_notes: string | null; created_at: string; updated_at: string;
}

export interface OrderItem {
  id: string; order_id: string; product_name: string; product_type: ProductType;
  material: string; quantity: number; price_inr: number;
  personalisation: PersonalisationDetails; created_at: string;
}

export interface NfcCard {
  id: string; order_item_id: string | null; account_id: string | null;
  slug: string; card_url: string; qr_code_url: string | null;
  status: CardStatus; card_nickname: string | null;
  tap_count: number; provisioned_at: string; activated_at: string | null;
}

export interface AdminUser { id: string; email: string; role: string; created_at: string; }
export interface AdminNotification { id: string; type: string; body: string; is_read: boolean; created_at: string; }

// ─── NEW: Card Profiles ──────────────────────────────────────────────────────

export interface CardProfile {
  id: string; card_id: string; account_id: string;
  profile_name: string; display_name: string;
  title: string | null; bio: string | null;
  avatar_url: string | null; bg_image_url: string | null;
  status: ProfileStatus; is_active: boolean; sort_order: number;
  created_at: string; updated_at: string;
}

// ─── NEW: vCard Details ──────────────────────────────────────────────────────

export interface PhoneEntry { label: string; number: string; is_primary: boolean; }
export interface EmailEntry { label: string; email: string; is_primary: boolean; }
export interface CustomField { key: string; value: string; }

export interface VcardDetails {
  id: string; profile_id: string;
  first_name: string | null; last_name: string | null;
  organization: string | null; job_title: string | null;
  phones: PhoneEntry[]; emails: EmailEntry[];
  street: string | null; city: string | null; state: string | null;
  postal_code: string | null; country: string; website: string | null;
  custom_fields: CustomField[]; created_at: string; updated_at: string;
}

// ─── NEW: Social & Payment Links ─────────────────────────────────────────────

export interface SocialLink {
  id: string; profile_id: string; account_id: string;
  category: LinkCategory; platform: string; label: string | null;
  url: string; icon_slug: string | null; is_active: boolean;
  sort_order: number; click_count: number; created_at: string;
}

// ─── NEW: Lead Forms ─────────────────────────────────────────────────────────

export type LeadFieldType = 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';

export interface LeadFormField {
  id: string; type: LeadFieldType; label: string;
  placeholder?: string; required: boolean; options?: string[];
}

export interface LeadForm {
  id: string; profile_id: string; account_id: string;
  title: string; subtitle: string | null; button_label: string; is_active: boolean;
  fields: LeadFormField[];
  capture_name: boolean; capture_email: boolean; capture_phone: boolean;
  created_at: string; updated_at: string;
}

// ─── NEW: Lead Submissions ───────────────────────────────────────────────────

export interface LeadSubmission {
  id: string; form_id: string; profile_id: string; account_id: string;
  lead_name: string | null; lead_email: string | null;
  lead_phone: string | null; company: string | null;
  data: Record<string, any>; status: LeadStatus; notes: string | null;
  tap_id: string | null; submitted_at: string; updated_at: string;
}

// ─── NEW: Card Taps (Analytics) ──────────────────────────────────────────────

export interface CardTap {
  id: string; card_id: string; profile_id: string | null;
  ip_address: string | null; country: string | null; region: string | null; city: string | null;
  latitude: number | null; longitude: number | null;
  user_agent: string | null; device_type: 'mobile' | 'tablet' | 'desktop' | null;
  os: string | null; browser: string | null; referrer: string | null; tapped_at: string;
}

// ─── NEW: Link Clicks ────────────────────────────────────────────────────────

export interface LinkClick {
  id: string; link_id: string; profile_id: string; tap_id: string | null; clicked_at: string;
}

// ─── NEW: Profile Products ───────────────────────────────────────────────────

export interface ProfileProduct {
  id: string; profile_id: string; account_id: string;
  name: string; description: string | null;
  price_inr: number | null; currency: string;
  image_url: string | null; link_url: string | null;
  is_active: boolean; sort_order: number;
  click_count: number; view_count: number;
  created_at: string; updated_at: string;
}

// ─── NEW: Profile Feeds ──────────────────────────────────────────────────────

export interface ProfileFeed {
  id: string; profile_id: string; account_id: string;
  feed_type: FeedType; caption: string | null;
  media_url: string | null; thumbnail_url: string | null;
  link_url: string | null; link_title: string | null;
  is_published: boolean; sort_order: number; created_at: string;
}

// ─── NEW: Analytics Summary (from DB views) ──────────────────────────────────

export interface CardTapSummary {
  card_id: string; total_taps: number; active_days: number;
  taps_30d: number; taps_7d: number; unique_visitors: number;
  top_device_type: string | null; top_country: string | null;
}

export interface ProfileTapSummary {
  profile_id: string; card_id: string;
  total_taps: number; taps_30d: number; taps_7d: number; unique_visitors: number;
}
