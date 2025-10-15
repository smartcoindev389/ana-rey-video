import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

interface Plan {
  id: 'freemium' | 'basic' | 'premium';
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: "freemium",
    name: "Freemium",
    price: "Free",
    period: "",
    features: [
      "Access to limited content",
      "Basic video quality",
      "Watch on 1 device",
      "Community support",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    price: "$9.99",
    period: "/month",
    features: [
      "Access to intermediate level content",
      "HD streaming quality",
      "Watch on 2 devices",
      "Email support",
      "Progress tracking",
    ],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$19.99",
    period: "/month",
    features: [
      "Access to all content",
      "4K streaming quality",
      "Watch on 3 devices",
      "Priority support",
      "Downloadable content",
      "Certificates of completion",
      "Ad-free experience",
    ],
  },
];

const Subscription = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isAuthenticated, updateUser } = useAuth();
  const isFromSignup = location.state !== null;

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
        const { email, password, name } = location.state as { email: string; password: string; name: string };
        console.log('Registration data:', { name, email, subscription: plan.id });
        
        await register(name, email, password, plan.id);
        console.log('Registration successful!');
        
        toast.success(`Account created successfully with ${plan.name} plan!`);
        navigate("/");
      } else {
        // Update subscription
        console.log('Updating subscription...');
        if (!isAuthenticated) {
          console.log('Not authenticated, redirecting to login');
          toast.error("Please login first");
          navigate("/auth");
          return;
        }
        const response = await api.updateSubscription(plan.id);
        console.log('Subscription updated:', response);
        updateUser(response.user);
        toast.success(`Subscription updated to ${plan.name}!`);
        navigate("/");
      }
    } catch (error) {
      console.error('Subscription error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process subscription";
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
            Choose Your <span className="text-primary">Plan</span>
          </h1>
          <p className="text-xl text-muted-foreground font-montserrat">
            {isFromSignup
              ? "Select a plan to complete your registration"
              : "Upgrade your learning experience"}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`p-8 relative hover:shadow-2xl transition-all duration-300 animate-slide-up ${
                plan.popular ? "border-primary border-2 scale-105" : ""
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
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
                  ? "Processing..." 
                  : isFromSignup ? "Start with " + plan.name : "Select " + plan.name}
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-2 font-montserrat">All plans include a 14-day free trial</p>
          <button
            onClick={() => navigate(isFromSignup ? "/auth" : "/")}
            className="text-primary hover:underline font-montserrat"
          >
            {isFromSignup ? "Back to sign up" : "Maybe later"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
