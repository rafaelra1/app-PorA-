-- Criar tabela de acomodações
CREATE TABLE IF NOT EXISTS accommodations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  image TEXT,
  rating NUMERIC(2,1),
  stars INTEGER CHECK (stars >= 1 AND stars <= 5),
  nights INTEGER,
  check_in DATE NOT NULL,
  check_in_time TIME,
  check_out DATE NOT NULL,
  check_out_time TIME,
  confirmation TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  type TEXT DEFAULT 'hotel' CHECK (type IN ('hotel', 'home', 'hostel', 'apartment')),
  city_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Validação: check_out deve ser após check_in
  CONSTRAINT valid_dates CHECK (check_out >= check_in)
);

-- Índices para performance
CREATE INDEX idx_accommodations_trip_id ON accommodations(trip_id);
CREATE INDEX idx_accommodations_user_id ON accommodations(user_id);
CREATE INDEX idx_accommodations_check_in ON accommodations(check_in);

-- Habilitar Row Level Security
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;

-- Política: usuários só veem/editam suas próprias acomodações
CREATE POLICY "Users can manage own accommodations" ON accommodations
  FOR ALL USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_accommodations_updated_at
  BEFORE UPDATE ON accommodations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
