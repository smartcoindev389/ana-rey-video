import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import heroImage from "@/assets/hero-education.jpg";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative h-screen flex items-center overflow-hidden">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Netflix-style gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/30 z-[1]" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#141414] via-[#141414]/80 to-transparent z-[1]" />
      
      <div className="container mx-auto px-4 md:px-8 lg:px-12 relative z-10 flex items-center">
        <div className="animate-fade-in max-w-2xl lg:max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight text-white drop-shadow-2xl font-playfair">
            Unlimited series, videos and more
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-4 drop-shadow-lg font-montserrat leading-relaxed">
            Watch anywhere. Cancel anytime.
          </p>
          
          <p className="text-base md:text-lg text-white/80 mb-8 drop-shadow-lg font-montserrat">
            Ready to watch? Enter your email to create or restart your membership.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <Button 
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg md:text-xl px-8 md:px-12 py-6 md:py-7 bg-primary text-white hover:bg-primary/90 font-semibold shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <Play className="mr-2 h-5 w-5 md:h-6 md:w-6" fill="currentColor" />
              Get Started
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate("/explore")}
              className="text-lg md:text-xl px-8 md:px-12 py-6 md:py-7 bg-white/10 text-white border-2 border-white/60 hover:bg-white/20 hover:border-white font-semibold backdrop-blur-sm transition-all duration-300"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
