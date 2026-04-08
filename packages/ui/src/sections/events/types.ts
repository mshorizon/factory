export interface EventItem {
  title: string;
  description: string;
  image?: string;
  dateStart?: string;
  dateEnd?: string;
  href?: string;
}

export interface EventsDefaultProps {
  items: EventItem[];
  className?: string;
}
