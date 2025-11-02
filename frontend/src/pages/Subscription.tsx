import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
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
    (async () => {
      try {
        const res = await fetch(`/api/subscription-plans/public`);
        const data = await res.json();
        if (data?.success && Array.isArray(data.data)) {
          setBackendPlans(data.data);
        }
      } catch (e) {
        // non-blocking
        console.warn(t('subscription.failed_load_backend_plans'));
      }
    })();
  }, []);

  const handleSelectPlan = async (plan: Plan) => {
    console.log('=== Plan Selected ===');
    console.log('Plan:', plan.name, 'ID:', plan.id);
    console.log('Is from signup:', isFromSignup);
    console.log('Location state:', location.state);
    
    setSelectedPlan(plan.name);
    setIsLoading(true);
    
    try {
      if (isFromSignup) {
        // Complete registration
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
        
        await register(name, email, password, plan.id);
        console.log('Registration successful!');
        
        toast.success(`${t('subscription.account_created')} ${plan.name} ${t('subscription.plan_success')}`);
        // Navigate to home with locale prefix
        const locale = localStorage.getItem('i18nextLng') || 'en';
        navigate(`/${locale}`);
      } else {
        // For paid plans, start Stripe Checkout; freemium updates locally
        console.log('Updating subscription...');
        if (!isAuthenticated) {
          console.log('Not authenticated, redirecting to login');
          toast.error(t('subscription.please_login'));
          navigate("/auth");
          return;
        }
        if (plan.id === 'freemium') {
          const response = await api.updateSubscription(plan.id);
          updateUser(response.user);
          toast.success(`${t('subscription.updated')} ${plan.name}!`);
          // Navigate to home with locale prefix
          const locale = localStorage.getItem('i18nextLng') || 'en';
          navigate(`/${locale}`);
          return;
        }

        // Find corresponding plan in backend by name
        const match = backendPlans.find(p => (p.display_name || p.name || '').toLowerCase() === plan.name.toLowerCase());
        if (!match) {
          toast.error(t('subscription.not_available'));
          return;
        }

        const successUrl = `${window.location.origin}/?payment=success`;
        const cancelUrl = `${window.location.origin}/subscription?payment=cancel`;

        const res = await fetch('/api/payments/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ plan_id: match.id, success_url: successUrl, cancel_url: cancelUrl })
        });
        const data = await res.json();
        if (data?.success && data.url) {
          window.location.href = data.url;
          return;
        }
        throw new Error(data?.message || t('subscription.failed_start_checkout'));
      }
    } catch (error) {
      console.error('Subscription error:', error);
      const errorMessage = error instanceof Error ? error.message : t('subscription.failed_process');
      console.error('Error message:', errorMessage);
      toast.error(errorMessage);
    } finally {
      console.log('Subscription process complete');
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
                  <span className="text-4xl font-bold text-primary font-playfair">{plan.price}</span>
                  <span className="text-muted-foreground ml-1 font-montserrat">{plan.period}</span>
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

              <Button
                variant={plan.popular ? "hero" : "outline"}
                className="w-full"
                size="lg"
                onClick={() => handleSelectPlan(plan)}
                disabled={isLoading}
              >
                {isLoading && selectedPlan === plan.name 
                  ? t('subscription.processing')
                  : isFromSignup 
                    ? `${t('subscription.start_with')} ${plan.name}`
                    : plan.id === 'freemium' 
                      ? t('subscription.select_freemium')
                      : plan.id === 'basic'
                        ? t('subscription.select_basic')
                        : t('subscription.select_premium')}
              </Button>
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
