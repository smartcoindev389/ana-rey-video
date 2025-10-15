import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

interface Course {
  id: number;
  title: string;
  image: string;
  duration: string;
}

interface CourseRowProps {
  title: string;
  courses: Course[];
}

const CourseRow = ({ title, courses }: CourseRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });

      setTimeout(() => {
        if (scrollRef.current) {
          setShowLeftArrow(scrollRef.current.scrollLeft > 0);
          setShowRightArrow(
            scrollRef.current.scrollLeft < scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 10
          );
        }
      }, 300);
    }
  };

  return (
    <div className="mb-8 md:mb-12 px-4 md:px-8 lg:px-12">
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-white font-montserrat">{title}</h2>
      
      <div className="relative group">
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-20 w-12 md:w-16 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/90"
          >
            <ChevronLeft className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </button>
        )}
        
        <div
          ref={scrollRef}
          className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {courses.map((course) => (
            <div
              key={course.id}
              className="min-w-[180px] md:min-w-[280px] lg:min-w-[320px] flex-shrink-0 group/card cursor-pointer"
            >
              <div className="relative aspect-video rounded-md overflow-hidden bg-gray-900 transition-all duration-300 group-hover/card:scale-110 group-hover/card:z-10 shadow-lg group-hover/card:shadow-2xl">
                {/* Main Image */}
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Dark overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover/card:opacity-80 transition-opacity" />
                
                {/* Play button overlay - appears on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white/90 rounded-full flex items-center justify-center shadow-2xl transform transition-transform duration-300 group-hover/card:scale-110">
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                
                {/* Content Info */}
                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 transform transition-transform duration-300 group-hover/card:translate-y-0">
                  <h3 className="font-semibold text-white text-sm md:text-base line-clamp-2 drop-shadow-lg mb-1">
                    {course.title}
                  </h3>
                  <p className="text-white/90 text-xs md:text-sm font-medium drop-shadow-md">{course.duration}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-20 w-12 md:w-16 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/90"
          >
            <ChevronRight className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseRow;
