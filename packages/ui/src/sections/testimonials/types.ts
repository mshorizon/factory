export interface TestimonialItem {
  title: string;
  description: string;
  image?: string;
}

export interface TestimonialsGridProps {
  items: TestimonialItem[];
  className?: string;
  sectionTitle?: string;
  sectionDescription?: string;
}
