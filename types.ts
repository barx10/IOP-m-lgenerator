export interface CoreElement {
  name: string;
  description: string;
}

export interface CrossCurricularTheme {
  name: string;
  description: string;
}

export interface StudentProfile {
  grade: string;
  subject: string;
  topic: string;
  selectedCoreElement: string; // Changed from array to single string
  selectedCrossCurricularTheme: string; // Added for cross-curricular themes
  selectedSocialGoals?: string[]; // Added for social goals (max 3)
  selectedOtherNeeds?: string[]; // Added for other needs (ASK, syn, hørsel, vedlikehold, ADL)
}

export interface Framework {
  startDate: string;
  endDate: string;
}

export interface UploadedFile {
  name: string;
  content: string; // Base64 encoded content
}

export interface IopGoal {
  coreArea: 'Ferdigheter' | 'Kunnskap' | 'Samlet vurdering';
  goal: string;
  measures: string;
  anchoring: string;
  evaluation?: string;
}

export interface IopConstructionKit {
  coreElementsInfluenceNote: string; // Added field for core elements influence
  recommendations: string; // Concrete recommendations for the student
  learningActivities: string; // Concrete learning activities based on goals
  otherNeedsMeasures?: Record<string, string[]>; // AI-generated measures per selected need ID
  socialGoalDescriptions?: Record<string, { description: string, examples: string[] }>; // AI-generated descriptions and examples per selected social goal ID
  skillsSuggestions: IopGoal[];
  knowledgeSuggestions: IopGoal[];
  overallBenefitSuggestion: IopGoal;
}

// Define the Selections interface for storing selected IOP goals
export interface Selections {
  skills: IopGoal | null;
  knowledge: IopGoal | null;
}

// Saved subject with complete information
export interface SavedSubject {
  subject: string;
  profile: StudentProfile;
  framework: Framework;
  selections: {
    skills: IopGoal;
    knowledge: IopGoal;
  };
  overallBenefit: IopGoal;
  coreElementsNote: string;
  recommendations?: string;
  learningActivities?: string;
  editedSocialGoals?: Record<string, any>;
  editedOtherNeedsMeasures?: Record<string, string[]>;
}

export interface CurriculumData {
  [subject: string]: {
    coreElements: CoreElement[];
    crossCurricularThemes: CrossCurricularTheme[];
    goals: string[];
  };
}


export type AppStatus = 'idle' | 'loading' | 'success' | 'error';