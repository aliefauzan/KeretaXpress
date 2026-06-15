import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

class SupabaseService {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_KEY;
    this.bucket = process.env.SUPABASE_BUCKET || 'payment-proofs';
    
    this.client = createClient(this.supabaseUrl, this.supabaseKey);
  }

  // Get all records from a table
  async getAll(table) {
    try {
      const { data, error } = await this.client
        .from(table)
        .select('*');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching from ${table}:`, error);
      throw error;
    }
  }

  // Insert record into table
  async insert(table, data) {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select();
      
      if (error) throw error;
      return result;
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error);
      throw error;
    }
  }

  // Upload file to storage
  async uploadFile(bucket, path, file) {
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Get public URL for a file
  getPublicUrl(bucket, path) {
    const { data } = this.client.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  // Call RPC function
  async rpc(functionName, params = {}) {
    try {
      const { data, error } = await this.client
        .rpc(functionName, params);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error calling RPC ${functionName}:`, error);
      throw error;
    }
  }

  // Get client instance
  getClient() {
    return this.client;
  }
}

export default new SupabaseService();
