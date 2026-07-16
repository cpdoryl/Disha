export type CityTier = 'tier_1' | 'tier_2' | 'tier_3';
export type BoardType = 'cbse' | 'icse' | 'ib' | 'state' | 'other';

export interface School {
  id: string;
  organizationId: string | null;
  name: string;
  district: string;
  state: string | null;
  city: string | null;
  cityTier: CityTier | null;
  boardType: BoardType | null;
  studentCount: number | null;
  staffCount: number | null;
  udiseCode: string | null;
  latitude: number | null;
  longitude: number | null;
  principalName: string | null;
  principalPhone: string | null;
  principalEmail: string | null;
  address: string | null;
  pinCode: string | null;
  isActive: boolean;
  onboardedDate: string | null;
  lastAssessmentDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSchoolInput {
  name: string;
  district: string;
  state?: string;
  city?: string;
  cityTier?: CityTier;
  boardType?: BoardType;
  studentCount?: number;
  staffCount?: number;
  udiseCode?: string;
  principalName?: string;
  principalPhone?: string;
  principalEmail?: string;
}
