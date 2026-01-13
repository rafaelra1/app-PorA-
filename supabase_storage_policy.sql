-- Política para permitir uploads no bucket 'trip-images'
-- Execute este comando no SQL Editor do seu Dashboard do Supabase

-- 1. Garante que a extensão de storage existe (instalação padrão do Supabase)
-- 2. Cria política de inserção (Upload)
CREATE POLICY "Permitir Uploads no bucket trip-images"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'trip-images');

-- 3. Cria política de visualização (Select) para que as imagens apareçam no app
CREATE POLICY "Permitir Visualização no bucket trip-images"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'trip-images');

-- 4. (Opcional) Política de Update/Delete se precisar substituir imagens
CREATE POLICY "Permitir Update no bucket trip-images"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'trip-images');
