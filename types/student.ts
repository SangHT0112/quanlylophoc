export interface Student {
  student_id: number;
  full_name: string;
  desk_number: number;
  class_id: number;
  participation_count: number;
  mouth_score: number | null;
  last_participation: string | null;
  total_participations: number;
}

export interface ParticipationStats {
  student_id: number;
  full_name: string;
  desk_number: number;
  total_participations: number;
  last_participation: string | null;
}

export interface ScoreData {
  student_id: number;
  score_type: string;
  score_value: number;
  teacher_note: string;
  subject_id: number;
}