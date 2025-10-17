import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Star, Clock, Users, Award, ChevronRight } from 'lucide-react';

interface CourseHeroSectionProps {
  featuredCourse: {
    id: number;
    title: string;
    description: string;
    image: string;
    category: string;
    duration: string;
    rating: number;
    studentsCount: number;
    instructor: string;
    price: string;
    isFree: boolean;
    badge?: string;
  };
  courseCategories: Array<{
    id: number;
    title: string;
    image: string;
    courseCount: number;
    description: string;
    category: string;
  }>;
  featuredCourses: Array<{
    id: number;
    title: string;
    image: string;
    duration: string;
    rating: number;
    studentsCount: number;
    instructor: string;
    category: string;
  }>;
  onCourseClick: (courseId: number) => void;
  onCategoryClick: (categoryId: number) => void;
}

const CourseHeroSection: React.FC<CourseHeroSectionProps> = ({
  featuredCourse,
  courseCategories,
  featuredCourses,
  onCourseClick,
  onCategoryClick
}) => {
  const categoriesCarouselRef = useRef<HTMLDivElement>(null);
  const coursesCarouselRef = useRef<HTMLDivElement>(null);
  const [showCategoriesLeftArrow, setShowCategoriesLeftArrow] = useState(false);
  const [showCategoriesRightArrow, setShowCategoriesRightArrow] = useState(true);
  const [showCoursesLeftArrow, setShowCoursesLeftArrow] = useState(false);
  const [showCoursesRightArrow, setShowCoursesRightArrow] = useState(true);
  const [shouldCenterCategories, setShouldCenterCategories] = useState(false);
  const [shouldCenterCourses, setShouldCenterCourses] = useState(false);

  // Check if categories should be centered (when they all fit in viewport)
  useEffect(() => {
    const checkCenterCategories = () => {
      if (categoriesCarouselRef.current) {
        const container = categoriesCarouselRef.current;
        const containerWidth = container.clientWidth;
        const contentWidth = container.scrollWidth;
        
        // If content fits within container, center it
        setShouldCenterCategories(contentWidth <= containerWidth);
      }
    };

    const checkCenterCourses = () => {
      if (coursesCarouselRef.current) {
        const container = coursesCarouselRef.current;
        const containerWidth = container.clientWidth;
        const contentWidth = container.scrollWidth;
        
        // If content fits within container, center it
        setShouldCenterCourses(contentWidth <= containerWidth);
      }
    };

    checkCenterCategories();
    checkCenterCourses();
    
    // Check on window resize
    const handleResize = () => {
      checkCenterCategories();
      checkCenterCourses();
    };
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [courseCategories, featuredCourses]);

  const scrollCategoriesCarousel = (direction: 'left' | 'right') => {
    if (categoriesCarouselRef.current) {
      const scrollAmount = categoriesCarouselRef.current.clientWidth * 0.8;
      const newScrollLeft = categoriesCarouselRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      
      categoriesCarouselRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });

      setTimeout(() => {
        if (categoriesCarouselRef.current) {
          setShowCategoriesLeftArrow(categoriesCarouselRef.current.scrollLeft > 0);
          setShowCategoriesRightArrow(
            categoriesCarouselRef.current.scrollLeft < categoriesCarouselRef.current.scrollWidth - categoriesCarouselRef.current.clientWidth - 10
          );
        }
      }, 300);
    }
  };

  const scrollCoursesCarousel = (direction: 'left' | 'right') => {
    if (coursesCarouselRef.current) {
      const scrollAmount = coursesCarouselRef.current.clientWidth * 0.8;
      const newScrollLeft = coursesCarouselRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      
      coursesCarouselRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });

      setTimeout(() => {
        if (coursesCarouselRef.current) {
          setShowCoursesLeftArrow(coursesCarouselRef.current.scrollLeft > 0);
          setShowCoursesRightArrow(
            coursesCarouselRef.current.scrollLeft < coursesCarouselRef.current.scrollWidth - coursesCarouselRef.current.clientWidth - 10
          );
        }
      }, 300);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      // Handle categories carousel
      if (categoriesCarouselRef.current) {
        setShowCategoriesLeftArrow(categoriesCarouselRef.current.scrollLeft > 0);
        setShowCategoriesRightArrow(
          categoriesCarouselRef.current.scrollLeft < categoriesCarouselRef.current.scrollWidth - categoriesCarouselRef.current.clientWidth - 10
        );
      }
      
      // Handle courses carousel
      if (coursesCarouselRef.current) {
        setShowCoursesLeftArrow(coursesCarouselRef.current.scrollLeft > 0);
        setShowCoursesRightArrow(
          coursesCarouselRef.current.scrollLeft < coursesCarouselRef.current.scrollWidth - coursesCarouselRef.current.clientWidth - 10
        );
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, [courseCategories, featuredCourses]);
  return (
    <section className="py-16 lg:py-24 px-4 md:px-8 bg-[#141414]">
      <div className="container mx-auto max-w-7xl">
        
        {/* Part 1: Hero Section */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          
          {/* Left Side - Text and Logo */}
          <div className="flex flex-col justify-center space-y-6 lg:pr-8">
            
            {/* Main Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              {featuredCourse.title}
            </h1>
          </div>
          
          {/* Right Side - Featured Course Image */}
          <div className="relative">
            <div className="aspect-[16/10] rounded-lg overflow-hidden shadow-2xl">
              <img
                src={featuredCourse.image}
                alt={featuredCourse.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          </div>
        </div>
        
        {/* Part 2: Course Categories Carousel */}
        <div className="space-y-8">
          
          {/* Carousel Container */}
          <div className="relative group">
            {/* Left Arrow */}
            {showCategoriesLeftArrow && !shouldCenterCategories && (
              <button
                onClick={() => scrollCategoriesCarousel('left')}
                className="absolute left-0 top-0 bottom-0 z-20 w-12 md:w-16 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/90"
              >
                <ChevronRight className="w-8 h-8 md:w-10 md:h-10 text-white rotate-180" />
              </button>
            )}
            
            {/* Categories Carousel */}
            <div 
              ref={categoriesCarouselRef}
              className={`flex space-x-6 overflow-x-auto hide-scrollbar py-4 ${shouldCenterCategories ? 'justify-center' : ''}`}
            >
              {courseCategories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => onCategoryClick(category.id)}
                  className="group cursor-pointer transition-all duration-300 hover:scale-105 flex-shrink-0 w-80 md:w-96 lg:w-[400px]"
                >
                    <div className="aspect-[2/1] rounded-lg overflow-hidden shadow-lg relative">
                    <img
                      src={category.image}
                      alt={category.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Category Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="bg-white/20 text-white border-0">
                          {category.courseCount} courses
                        </Badge>
                      </div>
                      <h3 className="font-bold text-lg mb-1 group-hover:text-white transition-colors">
                        {category.title}
                      </h3>
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {category.description}
                      </p>
                    </div>
                    
                    {/* Hover Effect */}
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/30 rounded-lg transition-all duration-300" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Right Arrow */}
            {showCategoriesRightArrow && !shouldCenterCategories && (
              <button
                onClick={() => scrollCategoriesCarousel('right')}
                className="absolute right-0 top-0 bottom-0 z-20 w-12 md:w-16 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/90"
              >
                <ChevronRight className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Separate Featured Courses Section */}
      <section className="pt-48 pb-16 lg:pt-56 lg:pb-24 px-4 md:px-8 bg-[#141414]">
        <div className="container mx-auto max-w-7xl">
          <div className="space-y-12">
            {/* Section Title */}
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                Featured Courses
              </h2>
              <p className="text-gray-400 text-xl md:text-2xl">
                Handpicked courses from our expert instructors
              </p>
            </div>
            
            {/* Featured Courses Carousel Container */}
            <div className="relative group">
              {/* Left Arrow */}
              {showCoursesLeftArrow && !shouldCenterCourses && (
                <button
                  onClick={() => scrollCoursesCarousel('left')}
                  className="absolute left-0 top-0 bottom-0 z-20 w-12 md:w-16 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/90"
                >
                  <ChevronRight className="w-8 h-8 md:w-10 md:h-10 text-white rotate-180" />
                </button>
              )}
              
              {/* Featured Courses Carousel */}
              <div 
                ref={coursesCarouselRef}
                className={`flex space-x-8 overflow-x-auto hide-scrollbar py-4 ${shouldCenterCourses ? 'justify-center' : ''}`}
              >
                {featuredCourses.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => onCourseClick(course.id)}
                    className="group cursor-pointer transition-all duration-300 hover:scale-105 flex-shrink-0 w-56 md:w-64 lg:w-72"
                  >
                    <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-2xl relative">
                      <img
                        src={course.image}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Course Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="secondary" className="bg-blue-600/80 text-white border-0 px-3 py-1 text-sm font-semibold">
                            {course.category}
                          </Badge>
                          <div className="flex items-center space-x-1 text-sm">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="font-semibold">{course.rating}</span>
                          </div>
                        </div>
                        <h3 className="font-bold text-xl md:text-2xl mb-2 group-hover:text-white transition-colors line-clamp-2">
                          {course.title}
                        </h3>
                        <div className="flex items-center justify-between text-sm text-gray-300">
                          <span className="font-medium">{course.instructor}</span>
                          <span className="font-medium">{course.duration}</span>
                        </div>
                      </div>
                      
                      {/* Hover Effect */}
                      <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/30 rounded-xl transition-all duration-300" />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Right Arrow */}
              {showCoursesRightArrow && !shouldCenterCourses && (
                <button
                  onClick={() => scrollCoursesCarousel('right')}
                  className="absolute right-0 top-0 bottom-0 z-20 w-12 md:w-16 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/90"
                >
                  <ChevronRight className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
};

export default CourseHeroSection;
