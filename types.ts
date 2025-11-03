export interface StudentProfile {
  grade: string;
  subject: string;
  topic: string;
  previousTopics: string;
  selectedCoreElements: string[];
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
  continuityNote: string;
  coreElementsInfluenceNote: string; // Added field for core elements influence
  skillsSuggestions: IopGoal[];
  knowledgeSuggestions: IopGoal[];
  overallBenefitSuggestion: IopGoal;
}


export interface CurriculumData {
  [subject: string]: {
    coreElements: string[];
    goals: string[];
  };
}


export type AppStatus = 'idle' | 'loading' | 'success' | 'error';