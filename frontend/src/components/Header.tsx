import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import logoTransparente from "@/assets/logo-transparente.png";

const Header = () => {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState("EN");

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    // Here you would typically implement language switching logic
    console.log("Language changed to:", language);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-nav transition-all duration-300">
      <div className="container mx-auto px-4 md:px-8 h-16 md:h-18 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <img 
            src={logoTransparente} 
            alt="SACRART" 
            className="h-12 md:h-14 w-auto cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
          />
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="/" className="text-sm font-medium text-white/90 hover:text-white transition-colors font-montserrat hover:scale-105 duration-300">
              Home
            </a>
            <a href="#series" className="text-sm font-medium text-white/90 hover:text-white transition-colors font-montserrat hover:scale-105 duration-300">
              Series
            </a>
            <a href="#pricing" className="text-sm font-medium text-white/90 hover:text-white transition-colors font-montserrat hover:scale-105 duration-300">
              Plans
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-16 h-8 bg-transparent border-white/20 text-white font-montserrat text-sm hover:border-white/40 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent 
              className="min-w-16 bg-black/95 border-white/20 text-white" 
              sideOffset={4} 
              align="end"
              position="popper"
              side="bottom"
              avoidCollisions={true}
              collisionPadding={10}
            >
              <SelectItem value="EN" className="hover:bg-white/10 focus:bg-white/10">EN</SelectItem>
              <SelectItem value="ES" className="hover:bg-white/10 focus:bg-white/10">ES</SelectItem>
              <SelectItem value="PT" className="hover:bg-white/10 focus:bg-white/10">PT</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="ghost" 
            onClick={() => navigate("/auth")}
            className="text-white/90 hover:text-white hover:bg-white/10 font-montserrat transition-all duration-300"
          >
            Sign In
          </Button>
          <Button 
            onClick={() => navigate("/auth")}
            className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
