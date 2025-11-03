export interface StudentProfile {
  grade: string;
  subject: string;
  topic: string;
  previousTopics: string;
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
  coreArea: 'Ferdigheter' | 'Kunnskap' | 'Samlet utbytte';
  goal: string;
  measures: string;
  anchoring: string;
  evaluation?: string;
}

export interface CurriculumData {
  [subject: string]: {
    coreElements: string;
    goals: string[];
  };
}


export type AppStatus = 'idle' | 'loading' | 'success' | 'error';