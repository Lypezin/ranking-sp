-- Adiciona colunas para detalhamento dos pontos na tabela ranking_entregadores
ALTER TABLE ranking_entregadores
ADD COLUMN IF NOT EXISTS total_pontos_entregas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_bonus_online INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_bonus_data_especial INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_bonus_meta INTEGER DEFAULT 0;

-- Comentário para documentar as colunas
COMMENT ON COLUMN ranking_entregadores.total_pontos_entregas IS 'Pontos acumulados apenas por entregas realizadas';
COMMENT ON COLUMN ranking_entregadores.total_bonus_online IS 'Pontos acumulados pelo bônus de 90% online';
COMMENT ON COLUMN ranking_entregadores.total_bonus_data_especial IS 'Pontos acumulados pelo bônus de datas especiais';
COMMENT ON COLUMN ranking_entregadores.total_bonus_meta IS 'Pontos acumulados pelo bônus de meta diária (20 ou 30 entregas)';
