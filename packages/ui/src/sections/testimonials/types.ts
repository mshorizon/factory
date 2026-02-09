export interface TestimonialItem {
  title: string;
  description: string;
}

export interface TestimonialsGridProps {
  items: TestimonialItem[];
  className?: string;
}
