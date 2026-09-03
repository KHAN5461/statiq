export type ViewState = 
  | 'landing' 
  | 'learner' 
  | 'learner_assessments' 
  | 'learner_workshops' 
  | 'learner_profile' 
  | 'generator' 
  | 'assessment' 
  | 'admin' 
  | 'admin_library';

export interface UserProfile {
  name: string;
  role: string;
  department: string;
  avatarUrl: string;
}
