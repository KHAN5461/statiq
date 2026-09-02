export type ViewState = 'landing' | 'learner' | 'generator' | 'assessment' | 'admin';

export interface UserProfile {
  name: string;
  role: string;
  department: string;
  avatarUrl: string;
}
