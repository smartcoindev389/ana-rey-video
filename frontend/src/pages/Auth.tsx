import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import logoImage from "@/assets/logo-transparente.png";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, isAuthenticated } = useAuth();

  // Handle email from navigation state or localStorage
  useEffect(() => {
    const stateEmail = location.state?.email;
    const storedEmail = localStorage.getItem('signup_email');
    
    if (stateEmail) {
      setEmail(stateEmail);
      setIsLogin(false); // Switch to signup mode if email is provided
    } else if (storedEmail) {
      setEmail(storedEmail);
      setIsLogin(false); // Switch to signup mode if email is provided
      localStorage.removeItem('signup_email'); // Clean up
    }
  }, [location.state]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.is_admin) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== Form submitted ===');
    console.log('Is Login:', isLogin);
    console.log('Email:', email);
    setIsLoading(true);
    
    try {
      if (isLogin) {
        console.log('Calling login function...');
               const loginResponse = await login(email, password);
               console.log('Login successful!');
               toast.success("Login successful!");
               
               // Check if user is admin and redirect accordingly
               if (loginResponse?.is_admin) {
                 navigate("/admin");
               } else {
                 navigate("/");
               }
      } else {
        console.log('Redirecting to subscription page...');
        // Redirect to subscription page for signup
        navigate("/subscription", { state: { email, password, name } });
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : "Authentication failed";
      console.error('Error message:', errorMessage);
      toast.error(errorMessage);
    } finally {
      console.log('Form submission complete');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <Card className="w-full max-w-md p-8 space-y-6 animate-fade-in">
        <div className="text-center">
            <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
              <img 
                src={logoImage} 
                alt="SACRART Logo" 
                className="h-16 w-auto mx-auto mb-4"
              />
            </Link>
          <h2 className="text-2xl font-semibold mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-muted-foreground">
            {isLogin
              ? "Sign in to continue your learning journey"
              : "Join thousands of learners today"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button 
            type="submit" 
            variant="hero" 
            className="w-full" 
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Continue to Plans"}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
