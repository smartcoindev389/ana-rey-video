import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { subscriptionPlanApi } from "@/services/subscriptionPlanApi";
import { useTranslation } from "react-i18next";

interface Plan {
  id: 'freemium' | 'basic' | 'premium';
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
}

// Note: Plans are now generated dynamically with translations
const getPlans = (t: any): Plan[] => [
  {
    id: "freemium",
    name: t('subscription.plan_names.freemium'),
    price: t('subscription.plan_prices.free'),
    period: "",
    features: [
      t('subscription.plan_features.freemium.access_limited_content'),
      t('subscription.plan_features.freemium.basic_video_quality'),
      t('subscription.plan_features.freemium.watch_one_device'),
      t('subscription.plan_features.freemium.community_support'),
    ],
  },
  {
    id: "basic",
    name: t('subscription.plan_names.basic'),
    price: "$9.99", // Price comes from backend, but keeping format for now
    period: t('subscription.plan_prices.monthly_period'),
    features: [
      t('subscription.plan_features.basic.access_intermediate_content'),
      t('subscription.plan_features.basic.hd_streaming_quality'),
      t('subscription.plan_features.basic.watch_two_devices'),
      t('subscription.plan_features.basic.email_support'),
      t('subscription.plan_features.basic.progress_tracking'),
    ],
    popular: true,
  },
  {
    id: "premium",
    name: t('subscription.plan_names.premium'),
    price: "$19.99", // Price comes from backend, but keeping format for now
    period: t('subscription.plan_prices.monthly_period'),
    features: [
      t('subscription.plan_features.premium.access_all_content'),
      t('subscription.plan_features.premium.4k_streaming_quality'),
      t('subscription.plan_features.premium.watch_three_devices'),
      t('subscription.plan_features.premium.priority_support'),
      t('subscription.plan_features.premium.downloadable_content'),
      t('subscription.plan_features.premium.certificates_completion'),
      t('subscription.plan_features.premium.ad_free_experience'),
    ],
  },
];

const Subscription = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backendPlans, setBackendPlans] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isAuthenticated, updateUser } = useAuth();
  const { t } = useTranslation();
  // Check if state contains signup data (email, password, name)
  const isFromSignup = location.state !== null && 
    location.state !== undefined && 
    typeof location.state === 'object' && 
    'email' in location.state && 
    'password' in location.state && 
    'name' in location.state;

  useEffect(() => {
    // Load active plans from backend so we can map to Stripe price via plan id
    const loadPlans = async () => {
      try {
        const response = await subscriptionPlanApi.getPublic();
        if (response?.success && Array.isArray(response.data)) {
          setBackendPlans(response.data);
          console.log('✅ Loaded subscription plans from backend:', response.data);
          console.log('Plans with Stripe config:', response.data.map(p => ({
            id: p.id,
            name: p.name,
            display_name: p.display_name,
            price: p.price,
            has_stripe: !!p.stripe_price_id,
            stripe_price_id: p.stripe_price_id
          })));
        } else {
          console.warn('⚠️ Backend plans response format unexpected:', response);
        }
      } catch (e) {
        // non-blocking
        console.error('❌ Failed to load backend plans:', e);
        toast.error(t('subscription.failed_load_backend_plans') || 'Failed to load subscription plans');
      }
    };
    loadPlans();
  }, [t]);

  const handleSelectPlan = async (plan: Plan) => {
    console.log('=== Plan Selected ===');
    console.log('Plan:', plan.name, 'ID:', plan.id);
    console.log('Is from signup:', isFromSignup);
    console.log('Location state:', location.state);
    
    setSelectedPlan(plan.name);
    setIsLoading(true);
    
    try {
      if (isFromSignup) {
        // Complete registration first
        console.log('Processing registration...');
        const state = location.state as { email: string; password: string; name: string };
        
        if (!state.email || !state.password || !state.name) {
          console.error('Missing registration data in state:', state);
          toast.error(t('subscription.missing_info'));
          navigate("/auth");
          return;
        }
        
        const { email, password, name } = state;
        console.log('Registration data:', { name, email, subscription: plan.id });
        
        // Register user first (always freemium, then upgrade via Stripe if paid)
        console.log('📝 Registering user as freemium...');
        await register(name, email, password, 'freemium');
        console.log('✅ Registration successful! User is now authenticated.');
        
        // Wait a moment to ensure auth state is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // If it's a paid plan, trigger Stripe checkout after registration
        if (plan.id !== 'freemium') {
          console.log('💳 Paid plan selected, preparing Stripe checkout...');
          console.log('Backend plans available:', backendPlans.length);
          
          // Ensure backend plans are loaded
          if (backendPlans.length === 0) {
            console.warn('⚠️ Backend plans not loaded yet, fetching now...');
            try {
              const response = await subscriptionPlanApi.getPublic();
              if (response?.success && Array.isArray(response.data)) {
                setBackendPlans(response.data);
                console.log('✅ Backend plans loaded:', response.data);
              }
            } catch (e) {
              console.error('❌ Failed to load backend plans:', e);
              toast.error('Failed to load subscription plans. Please try again.');
              const locale = localStorage.getItem('i18nextLng') || 'en';
              navigate(`/${locale}`);
              return;
            }
          }
          
          // Find corresponding plan in backend
          const match = backendPlans.find(p => p.name?.toLowerCase() === plan.id.toLowerCase());
          console.log('🔍 Looking for plan match:', {
            searchingFor: plan.id,
            availablePlans: backendPlans.map(p => ({ id: p.id, name: p.name, display_name: p.display_name }))
          });
          
          if (!match) {
            console.error('❌ Plan not found in backend during signup:', {
              planId: plan.id,
              planName: plan.name,
              availablePlans: backendPlans.map(p => ({ id: p.id, name: p.name, display_name: p.display_name }))
            });
            toast.error(t('subscription.not_available') + ` - Plan "${plan.name}" not found. Please contact support.`);
            // Still navigate to home since registration succeeded
            const locale = localStorage.getItem('i18nextLng') || 'en';
            navigate(`/${locale}`);
            return;
          }

          console.log('✅ Plan found:', match);

          // Check if plan has Stripe price ID configured
          if (!match.stripe_price_id) {
            console.error('❌ Plan does not have Stripe price ID configured:', {
              planId: match.id,
              planName: match.name,
              stripe_price_id: match.stripe_price_id
            });
            toast.error(t('subscription.stripe_not_configured') || 'This plan is not configured for payment. Please contact support.');
            const locale = localStorage.getItem('i18nextLng') || 'en';
            navigate(`/${locale}`);
            return;
          }

          console.log('✅ Plan has Stripe price ID:', match.stripe_price_id);

          // Trigger Stripe checkout for paid plan
          const locale = localStorage.getItem('i18nextLng') || 'en';
          const successUrl = `${window.location.origin}/${locale}?payment=success&session_id={CHECKOUT_SESSION_ID}`;
          const cancelUrl = `${window.location.origin}/${locale}/subscription?payment=cancel`;

          console.log('🚀 Creating Stripe checkout session...', {
            planId: match.id,
            successUrl,
            cancelUrl
          });

          try {
            const data = await api.createStripeCheckoutSession(match.id, successUrl, cancelUrl);
            console.log('📦 Stripe checkout response:', data);
            
            if (data?.success && data.url) {
              console.log('✅ Stripe checkout URL received, redirecting...', data.url);
              // Redirect to Stripe Checkout
              window.location.href = data.url;
              return;
            } else {
              console.error('❌ Stripe checkout failed:', data);
              throw new Error(data?.message || t('subscription.failed_start_checkout'));
            }
          } catch (stripeError) {
            console.error('❌ Error creating Stripe checkout session:', stripeError);
            throw stripeError;
          }
        } else {
          // Freemium plan - just show success and navigate
          console.log('✅ Freemium plan selected, no payment needed');
          toast.success(`${t('subscription.account_created')} ${plan.name} ${t('subscription.plan_success')}`);
          const locale = localStorage.getItem('i18nextLng') || 'en';
          navigate(`/${locale}`);
        }
      } else {
        // For existing users upgrading subscription
        console.log('🔄 Updating subscription for existing user...');
        if (!isAuthenticated) {
          console.log('❌ Not authenticated, redirecting to login');
          toast.error(t('subscription.please_login'));
          navigate("/auth");
          return;
        }
        
        if (plan.id === 'freemium') {
          console.log('✅ Freemium plan selected, updating locally...');
          const response = await api.updateSubscription(plan.id);
          updateUser(response.user);
          toast.success(`${t('subscription.updated')} ${plan.name}!`);
          const locale = localStorage.getItem('i18nextLng') || 'en';
          navigate(`/${locale}`);
          return;
        }

        console.log('💳 Paid plan selected for upgrade, preparing Stripe checkout...');
        console.log('Backend plans available:', backendPlans.length);

        // Ensure backend plans are loaded
        if (backendPlans.length === 0) {
          console.warn('⚠️ Backend plans not loaded yet, fetching now...');
          try {
            const response = await subscriptionPlanApi.getPublic();
            if (response?.success && Array.isArray(response.data)) {
              setBackendPlans(response.data);
              console.log('✅ Backend plans loaded:', response.data);
            }
          } catch (e) {
            console.error('❌ Failed to load backend plans:', e);
            toast.error('Failed to load subscription plans. Please try again.');
            return;
          }
        }

        // Find corresponding plan in backend by plan ID (freemium, basic, premium)
        // Backend plans have 'name' field that matches plan.id
        const match = backendPlans.find(p => p.name?.toLowerCase() === plan.id.toLowerCase());
        console.log('🔍 Looking for plan match:', {
          searchingFor: plan.id,
          availablePlans: backendPlans.map(p => ({ id: p.id, name: p.name, display_name: p.display_name }))
        });

        if (!match) {
          console.error('❌ Plan not found in backend:', {
            planId: plan.id,
            planName: plan.name,
            availablePlans: backendPlans.map(p => ({ id: p.id, name: p.name, display_name: p.display_name }))
          });
          toast.error(t('subscription.not_available') + ` - Plan "${plan.name}" not found. Please contact support.`);
          return;
        }

        console.log('✅ Plan found:', match);

        // Check if plan has Stripe price ID configured
        if (!match.stripe_price_id) {
          console.error('❌ Plan does not have Stripe price ID configured:', {
            planId: match.id,
            planName: match.name,
            stripe_price_id: match.stripe_price_id
          });
          toast.error(t('subscription.stripe_not_configured') || 'This plan is not configured for payment. Please contact support.');
          return;
        }

        console.log('✅ Plan has Stripe price ID:', match.stripe_price_id);

        // Get current locale for proper URL construction
        const locale = localStorage.getItem('i18nextLng') || 'en';
        const successUrl = `${window.location.origin}/${locale}?payment=success&session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${window.location.origin}/${locale}/subscription?payment=cancel`;

        console.log('🚀 Creating Stripe checkout session...', {
          planId: match.id,
          successUrl,
          cancelUrl
        });

        // Use API client method with authentication
        try {
          const data = await api.createStripeCheckoutSession(match.id, successUrl, cancelUrl);
          console.log('📦 Stripe checkout response:', data);
          
          if (data?.success && data.url) {
            console.log('✅ Stripe checkout URL received, redirecting...', data.url);
            // Redirect to Stripe Checkout
            window.location.href = data.url;
            return;
          } else {
            console.error('❌ Stripe checkout failed - no URL in response:', data);
            throw new Error(data?.message || t('subscription.failed_start_checkout'));
          }
        } catch (stripeError) {
          console.error('❌ Error creating Stripe checkout session:', stripeError);
          throw stripeError;
        }
      }
    } catch (error) {
      console.error('❌ Subscription error:', error);
      let errorMessage = t('subscription.failed_process');
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      } else if (typeof error === 'object' && error !== null) {
        console.error('Error object:', error);
        errorMessage = (error as any).message || JSON.stringify(error);
      }
      
      toast.error(errorMessage);
    } finally {
      console.log('✅ Subscription process complete');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-playfair">
            {t('subscription.choose_plan')} <span className="text-primary">{t('subscription.plan')}</span>
          </h1>
          <p className="text-xl text-muted-foreground font-montserrat">
            {isFromSignup
              ? t('subscription.select_plan_complete')
              : t('subscription.upgrade_learning')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {getPlans(t).map((plan, index) => (
            <Card
              key={plan.name}
              className={`p-8 relative hover:shadow-2xl transition-all duration-300 animate-slide-up ${
                plan.popular ? "border-primary border-2 scale-105" : ""
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  {t('subscription.most_popular')}
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2 font-playfair">{plan.name}</h3>
                <div className="flex items-baseline justify-center">
                  {(() => {
                    // Try to get price from backend plan, fallback to frontend price
                    const backendPlan = backendPlans.find(p => p.name?.toLowerCase() === plan.id.toLowerCase());
                    let displayPrice = plan.price;
                    
                    if (backendPlan && backendPlan.price !== null && backendPlan.price !== undefined) {
                      // Convert to number and format safely
                      const priceNum = typeof backendPlan.price === 'string' 
                        ? parseFloat(backendPlan.price) 
                        : Number(backendPlan.price);
                      
                      if (!isNaN(priceNum) && priceNum > 0) {
                        displayPrice = `$${priceNum.toFixed(2)}`;
                      }
                    }
                    
                    return (
                      <>
                        <span className="text-4xl font-bold text-primary font-playfair">{displayPrice}</span>
                        <span className="text-muted-foreground ml-1 font-montserrat">{plan.period}</span>
                      </>
                    );
                  })()}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/80 font-montserrat">{feature}</span>
                  </li>
                ))}
              </ul>

              {(() => {
                // Check if this plan has Stripe configured
                const backendPlan = backendPlans.find(p => p.name?.toLowerCase() === plan.id.toLowerCase());
                const hasStripe = backendPlan?.stripe_price_id || plan.id === 'freemium';
                const isStripeReady = plan.id === 'freemium' || hasStripe;
                
                return (
                  <>
                    {!isStripeReady && plan.id !== 'freemium' && (
                      <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                          ⚠️ Payment not configured. This plan requires Stripe setup.
                        </p>
                      </div>
                    )}
                    <Button
                      variant={plan.popular ? "hero" : "outline"}
                      className="w-full"
                      size="lg"
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isLoading || (!isStripeReady && plan.id !== 'freemium')}
                    >
                      {isLoading && selectedPlan === plan.name 
                        ? t('subscription.processing')
                        : !isStripeReady && plan.id !== 'freemium'
                          ? 'Payment Not Available'
                          : isFromSignup 
                            ? `${t('subscription.start_with')} ${plan.name}`
                            : plan.id === 'freemium' 
                              ? t('subscription.select_freemium')
                              : plan.id === 'basic'
                                ? t('subscription.select_basic')
                                : t('subscription.select_premium')}
                    </Button>
                  </>
                );
              })()}
            </Card>
          ))}
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-2 font-montserrat">{t('subscription.all_plans_trial')}</p>
          <button
            onClick={() => navigate(isFromSignup ? "/auth" : "/")}
            className="text-primary hover:underline font-montserrat"
          >
            {isFromSignup ? t('subscription.back_signup') : t('subscription.maybe_later')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
