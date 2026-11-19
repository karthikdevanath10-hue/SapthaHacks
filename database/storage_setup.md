# Supabase Storage Configuration for TruthLens

To support evidence storage and PDF forensic report retrieval, configure two storage buckets in your Supabase dashboard:

## 1. Storage Buckets

1. **`truthlens-media`**
   - **Type**: Private
   - **File size limit**: 20MB
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`, `image/tiff`
   - **Purpose**: Stores original forensic evidence images preserving original binary structure.

2. **`truthlens-reports`**
   - **Type**: Private
   - **File size limit**: 10MB
   - **Allowed MIME types**: `application/pdf`
   - **Purpose**: Stores generated forensic evidence PDF reports.

## 2. Storage Bucket Policies (RLS)

In Supabase Dashboard -> **Storage** -> **Policies**:

### For `truthlens-media`:
- **SELECT**: Authenticated users can view objects where `bucket_id = 'truthlens-media' AND (storage.foldername(name))[1] = auth.uid()::text`
- **INSERT**: Authenticated users can upload objects where `bucket_id = 'truthlens-media' AND (storage.foldername(name))[1] = auth.uid()::text`
- **DELETE**: Authenticated users can delete objects where `bucket_id = 'truthlens-media' AND (storage.foldername(name))[1] = auth.uid()::text`

### For `truthlens-reports`:
- **SELECT**: Authenticated users can view reports where `bucket_id = 'truthlens-reports' AND (storage.foldername(name))[1] = auth.uid()::text`
- **INSERT**: Authenticated users can upload reports where `bucket_id = 'truthlens-reports' AND (storage.foldername(name))[1] = auth.uid()::text`
- **DELETE**: Authenticated users can delete reports where `bucket_id = 'truthlens-reports' AND (storage.foldername(name))[1] = auth.uid()::text`

*(Note: In local or demo mode without Supabase connection, TruthLens includes local file storage fallback so you can demo without cloud credentials!)*
