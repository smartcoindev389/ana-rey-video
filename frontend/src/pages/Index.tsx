import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CourseRow from "@/components/CourseRow";

const popularCourses = [
  { id: 1, title: "Advanced React Development", image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop", duration: "12 hours" },
  { id: 2, title: "Python for Data Science", image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=450&fit=crop", duration: "15 hours" },
  { id: 3, title: "UI/UX Design Masterclass", image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop", duration: "10 hours" },
  { id: 4, title: "Machine Learning Basics", image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&h=450&fit=crop", duration: "20 hours" },
  { id: 5, title: "Digital Marketing Strategy", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop", duration: "8 hours" },
  { id: 6, title: "Business Analytics", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop", duration: "14 hours" },
];

const trendingCourses = [
  { id: 7, title: "Web3 and Blockchain", image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=450&fit=crop", duration: "18 hours" },
  { id: 8, title: "Cloud Architecture AWS", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=450&fit=crop", duration: "16 hours" },
  { id: 9, title: "Mobile App Development", image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=450&fit=crop", duration: "22 hours" },
  { id: 10, title: "Cybersecurity Fundamentals", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=450&fit=crop", duration: "12 hours" },
  { id: 11, title: "AI & Neural Networks", image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop", duration: "25 hours" },
  { id: 12, title: "Project Management Pro", image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop", duration: "10 hours" },
];

const newReleases = [
  { id: 13, title: "TypeScript Deep Dive", image: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&h=450&fit=crop", duration: "14 hours" },
  { id: 14, title: "DevOps Engineering", image: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&h=450&fit=crop", duration: "20 hours" },
  { id: 15, title: "Advanced SQL Queries", image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&h=450&fit=crop", duration: "8 hours" },
  { id: 16, title: "Leadership & Management", image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop", duration: "11 hours" },
  { id: 17, title: "Video Production Basics", image: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=800&h=450&fit=crop", duration: "9 hours" },
  { id: 18, title: "Financial Analysis", image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop", duration: "13 hours" },
];

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-[#141414]">
      <Header />
      <Hero />
      
      <section id="series" className="pb-12 md:pb-16 -mt-16 relative z-10">
        <CourseRow title="Popular on SACRART" courses={popularCourses} />
        <CourseRow title="Trending Now" courses={trendingCourses} />
        <CourseRow title="New Releases" courses={newReleases} />
      </section>

      <section id="pricing" className="py-16 md:py-24 px-4 md:px-8 bg-gradient-to-b from-transparent to-black/50">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white font-playfair">
            Ready to Get Started?
          </h2>
          <p className="text-lg md:text-xl text-gray-400 mb-8 font-montserrat">
            Join thousands of art enthusiasts discovering incredible sculpting content
          </p>
        </div>
      </section>

      <footer className="py-8 border-t border-white/10 px-4 md:px-8 bg-black">
        <div className="container mx-auto text-center text-gray-400 font-montserrat">
          <p>© 2025 <span className="text-white font-semibold">SACRART</span> by Ana Rey. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
