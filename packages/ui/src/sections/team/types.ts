export interface TeamMember {
  name: string;
  role: string;
  image?: string;
  linkedin?: string;
}

export interface TeamGridProps {
  members: TeamMember[];
  className?: string;
}
