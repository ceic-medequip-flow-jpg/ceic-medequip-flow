-- Cria a tabela
CREATE TABLE IF NOT EXISTS catalogo_equipamentos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_oficial text NOT NULL,
  categoria text NOT NULL, -- 'GERAIS', 'VENTILATORIA', 'TRANSPORTE'
  subcategoria text
);

-- Limpa para permitir re-inserções caso já exista
TRUNCATE TABLE catalogo_equipamentos;

-- Inserir equipamentos GERAIS
INSERT INTO catalogo_equipamentos (nome_oficial, categoria, subcategoria) VALUES
('Compressor Vascular', 'GERAIS', NULL),
('Bomba de Terapia a Vácuo', 'GERAIS', NULL),
('Monitor Multiparamétrico', 'GERAIS', NULL),
('Monitor de Transporte', 'GERAIS', NULL),
('Ultrassom', 'GERAIS', NULL),
('Manovacuômetro', 'GERAIS', NULL),
('Ventilômetro', 'GERAIS', NULL),
('Cuffômetro', 'GERAIS', NULL),
('Oxímetro Portátil', 'GERAIS', NULL),
('Gerador de Marcapasso', 'GERAIS', NULL),
('Módulo de Capnografia + cabo', 'GERAIS', NULL),
('Módulo Auxiliar PHILLIPS', 'GERAIS', NULL),
('Monitor de Pressão Intracraniana (PIC)', 'GERAIS', NULL),
('Mochila de Transporte', 'GERAIS', NULL),
('Transdutor de Ultrassom', 'GERAIS', NULL),
('Processadora de Imagem', 'GERAIS', NULL),
('Gerador de Fluxo', 'GERAIS', NULL),
('Solicitar somente os acessórios', 'GERAIS', NULL);

-- Inserir equipamentos VENTILATORIA
INSERT INTO catalogo_equipamentos (nome_oficial, categoria, subcategoria) VALUES
('Ventilador Pulmonar', 'VENTILATORIA', 'VMI'),
('Ventilador Pulmonar Não Invasivo', 'VENTILATORIA', 'VMI'), -- Mantendo da estrutura original
('BLENDER PARA VENTILADOR PULMONAR', 'VENTILATORIA', 'VMI'),
('VMNI', 'VENTILATORIA', 'VMNI'),
('Alto Fluxo', 'VENTILATORIA', 'ALTO_FLUXO'),
('Óxido Nítrico', 'VENTILATORIA', 'OXIDO'),
('Apenas Acessórios (Ventilatório)', 'VENTILATORIA', 'APENAS_ACESSORIOS');

-- Inserir equipamentos TRANSPORTE
INSERT INTO catalogo_equipamentos (nome_oficial, categoria, subcategoria) VALUES
('Ventilador Pulmonar de Transporte', 'TRANSPORTE', NULL),
('Monitor Multiparamétrico (Transporte)', 'TRANSPORTE', NULL);
