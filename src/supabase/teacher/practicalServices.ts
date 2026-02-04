import { supabase } from "@/lib/supabase";
import { BatchPractical } from "@/types/database";

// Interface for the form values coming from the modal
export interface PracticalData {
  batch_id: string;
  experimentNumber: string;
  title: string;
  description: string;
  notes?: string;
  resourceLink?: string;
  deadline: string;
  practicalMode: 'code' | 'no-code' | 'both';
  rubrics: any[];
  totalPoints: number;
  teacherId: string;
}

export const practicalServices = {
  addPractical: async (data: PracticalData) => {
    const { data: result, error } = await supabase
      .from('batch_practicals') // Ensure this table name matches your DB
      .insert([{
        batch_id: data.batch_id,
        experiment_number: data.experimentNumber,
        title: data.title,
        description: data.description,
        notes: data.notes,
        resource_link: data.resourceLink,
        deadline: data.deadline,
        practical_mode: data.practicalMode,
        rubrics: data.rubrics, // Stored as JSONB
        total_points: data.totalPoints,
        created_by: data.teacherId,
      }])
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  getPracticalsByBatch: async (batchId: string) => {
    const { data, error } = await supabase
      .from('batch_practicals')
      .select('*')
      .eq('batch_id', batchId)
      .order('experiment_number', { ascending: true });

    if (error) throw error;
    return data;
  },

  deletePractical: async (id: string) => {
    const { error } = await supabase
      .from('batch_practicals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  updatePractical: async (id: string, data: Partial<PracticalData>) => {
    const { data: result, error } = await supabase
      .from('batch_practicals')
      .update({
        experiment_number: data.experimentNumber,
        title: data.title,
        description: data.description,
        notes: data.notes,
        resource_link: data.resourceLink,
        deadline: data.deadline,
        practical_mode: data.practicalMode,
        rubrics: data.rubrics,
        total_points: data.totalPoints,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }
};