export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    earned: boolean;
    earnedAt?: string;
}