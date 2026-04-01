export interface TrustSignal {
  icon: string;
  text: string;
}

export interface GoogleRating {
  score: number;
  count: number;
}

export interface TrustBarProps {
  trustSignals?: TrustSignal[];
  googleRating?: GoogleRating;
  className?: string;
}

export interface ClientLogo {
  name: string;
  image: string;
}

export interface TrustBarLogosProps {
  clientLogos: ClientLogo[];
  className?: string;
}
