import type { EducationTeacher } from "@/types";

export interface EducationPageContent {
  teachersVisible: boolean;
  teachers: EducationTeacher[];
}

export const EDUCATION_SETTING_KEYS = {
  teachersVisible: "education_teachers_visible",
  teachers: "education_teachers",
} as const;
