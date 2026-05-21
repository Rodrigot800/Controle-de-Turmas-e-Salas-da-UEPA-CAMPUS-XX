INSERT INTO disciplinas (nome, carga_horaria) VALUES
-- 1º Bloco
('Introdução ao Cálculo para Engenharia', 60),
('Português Instrumental', 40),
('Química Geral', 60),
('Álgebra Linear e Geometria Analítica', 60),
('Métodos Computacionais para Engenharia', 60),
('Introdução à Engenharia Ambiental e Sanitária', 60),
('Sociologia e Meio Ambiente', 40),

-- 2º Bloco
('Cálculo Diferencial e Integral I', 60),
('Ecologia Aplicada à Engenharia', 60),
('Expressão Gráfica I', 60),
('Química Experimental', 60),
('Biologia e Microbiologia Ambiental', 60),
('Saúde e Meio Ambiente', 60),
('Cartografia e Topografia', 80),

-- 3º Bloco
('Cálculo Diferencial e Integral II', 60),
('Física Geral e Experimental I', 60),
('Expressão Gráfica II', 80),
('Ciências e Tecnologia dos Materiais', 60),
('Trabalhos Técnicos e Científicos em Eng. Ambiental e Sanitária', 40),
('Ecossistemas Aquáticos', 60),
('Mecânica Aplicada', 60),

-- 4º Bloco
('Cálculo Diferencial e Integral III', 60),
('Fenômenos do Transporte', 80),
('Física Geral e Experimental II', 60),
('Geologia', 60),
('Qualidade da Água', 80),
('Estatística Geral', 60),

-- 5º Bloco
('Física Geral e Experimental III', 60),
('Cálculo Numérico', 60),
('Hidráulica I', 80),
('Qualidade de Solo', 80),
('Resistência dos Materiais', 60),
('Gestão de Resíduos Sólidos', 60),
('Climatologia e Meteorologia', 60),

-- 6º Bloco
('Hidrologia', 60),
('Controle de Poluição Atmosférica', 80),
('Elementos de Projeto Estrutural', 60),
('Sistemas de Abastecimento de Água', 80),
('Hidráulica II', 60),
('Ecologia de Ecossistemas Amazônicos', 60),
('Fontes e Controle de Poluição Mineral', 60),

-- 7º Bloco
('Sistema de Informações Ambientais', 60),
('Avaliação de Impactos Ambientais I', 60),
('Gestão Ambiental e Legislação Aplicada', 80),
('Tratamento de águas Residuárias e Industriais', 80),
('Sistema de Esgotamento Sanitário', 40),
('Sistemas Elétricos', 60),

-- 8º Bloco
('Drenagem e Hidrologia Urbana', 60),
('Avaliação de Impactos Ambientais II', 80),
('Planejamento de Recursos Hídricos', 60),
('Economia e Administração Ambiental', 60),
('Saúde Ambiental e Vigilância Sanitária', 60),
('Tratamento e Disposição Final de Resíduos Sólidos', 60),

-- 9º Bloco
('Trabalho de Conclusão de Curso I (TCC I)', 40),
('Modelagem e Simulação de Sistemas Ambientais', 60),
('Auditoria e Certificação Ambiental', 40),
('Instalações Hidrossanitárias prediais', 40),
('Segurança do Trabalho e Ergonomia', 40),

-- 10º Bloco
('Trabalho de Conclusão de Curso II (TCC II)', 40),
('Ética, Deontologia e Prática Profissional', 40),

-- Disciplinas Optativas (Previstas no PPC)
('LIBRAS - Língua Brasileira de Sinais', 40),
('Introdução ao uso do programa R e RStudio', 40);

-- 1º Bloco
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 3, id, 1, false FROM disciplinas WHERE nome IN ('Introdução ao Cálculo para Engenharia', 'Português Instrumental', 'Química Geral', 'Álgebra Linear e Geometria Analítica', 'Métodos Computacionais para Engenharia', 'Introdução à Engenharia Ambiental e Sanitária', 'Sociologia e Meio Ambiente');

-- 2º Bloco
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 3, id, 2, false FROM disciplinas WHERE nome IN ('Cálculo Diferencial e Integral I', 'Ecologia Aplicada à Engenharia', 'Expressão Gráfica I', 'Química Experimental', 'Biologia e Microbiologia Ambiental', 'Saúde e Meio Ambiente', 'Cartografia e Topografia');

-- 3º Bloco
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 3, id, 3, false FROM disciplinas WHERE nome IN ('Cálculo Diferencial e Integral II', 'Física Geral e Experimental I', 'Expressão Gráfica II', 'Ciências e Tecnologia dos Materiais', 'Trabalhos Técnicos e Científicos em Eng. Ambiental e Sanitária', 'Ecossistemas Aquáticos', 'Mecânica Aplicada');

-- 4º Bloco
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 3, id, 4, false FROM disciplinas WHERE nome IN ('Cálculo Diferencial e Integral III', 'Fenômenos do Transporte', 'Física Geral e Experimental II', 'Geologia', 'Qualidade da Água', 'Estatística Geral');

-- 5º Bloco
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 3, id, 5, false FROM disciplinas WHERE nome IN ('Física Geral e Experimental III', 'Cálculo Numérico', 'Hidráulica I', 'Qualidade de Solo', 'Resistência dos Materiais', 'Gestão de Resíduos Sólidos', 'Climatologia e Meteorologia');

-- 6º Bloco
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 3, id, 6, false FROM disciplinas WHERE nome IN ('Hidrologia', 'Controle de Poluição Atmosférica', 'Elementos de Projeto Estrutural', 'Sistemas de Abastecimento de Água', 'Hidráulica II', 'Ecologia de Ecossistemas Amazônicos', 'Fontes e Controle de Poluição Mineral');

-- 7º Bloco
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 3, id, 7, false FROM disciplinas WHERE nome IN ('Sistema de Informações Ambientais', 'Avaliação de Impactos Ambientais I', 'Gestão Ambiental e Legislação Aplicada', 'Tratamento de águas Residuárias e Industriais', 'Sistema de Esgotamento Sanitário', 'Sistemas Elétricos');

-- 8º Bloco
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 3, id, 8, false FROM disciplinas WHERE nome IN ('Drenagem e Hidrologia Urbana', 'Avaliação de Impactos Ambientais II', 'Planejamento de Recursos Hídricos', 'Economia e Administração Ambiental', 'Saúde Ambiental e Vigilância Sanitária', 'Tratamento e Disposição Final de Resíduos Sólidos');

-- 9º Bloco
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 3, id, 9, false FROM disciplinas WHERE nome IN ('Trabalho de Conclusão de Curso I (TCC I)', 'Modelagem e Simulação de Sistemas Ambientais', 'Auditoria e Certificação Ambiental', 'Instalações Hidrossanitárias prediais', 'Segurança do Trabalho e Ergonomia');

-- 10º Bloco
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 3, id, 10, false FROM disciplinas WHERE nome IN ('Trabalho de Conclusão de Curso II (TCC II)', 'Ética, Deontologia e Prática Profissional');

-- Disciplinas Optativas (Eletivas - cadastradas sem semestre fixo)
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 3, id, NULL, true FROM disciplinas WHERE nome IN ('LIBRAS - Língua Brasileira de Sinais', 'Introdução ao uso do programa R e RStudio');


-- BES -------------

INSERT INTO disciplinas (nome, carga_horaria) VALUES
-- 1º Semestre
('Matemática Discreta', 80),
('Fundamentos de Sistemas de Informação', 60),
('Fundamentos de Sistemas Operacionais', 60),
('Linguagens Formais', 80),
('Programação Estruturada', 80),
('Inglês Instrumental', 40),

-- 2º Semestre
('Estatística Aplicada a Informática', 60),
('Análise Orientada à Objetos', 80),
('Modelagem de Dados', 60),
('Estrutura de Dados, Pesquisa e Ordenação', 80),
('Programação Web', 80),

-- 3º Semestre
('Fundamentos de Engenharia de Software', 60),
('Programação Orientada a Objetos I', 80),
('Banco de Dados I', 80),
('Análise e Projeto de Algoritmos', 80),
('Microcontroladores e Microprocessadores', 80),
('Inovação Tecnológica e Empreendedorismo', 60),

-- 4º Semestre
('Programação Orientada a Objetos II', 80),
('Análise e Projeto de Software', 80),
('Banco de Dados II', 80),
('Sistemas Multirobóticos', 60),
('Projeto Integrado I', 80),

-- 5º Semestre
('Desenvolvimento de Processos de Software', 80),
('Arquitetura de Software', 60),
('Gerência de Projetos', 80),
('Robótica Móvel', 60),
('Cultura, Sociedade e Tecnologia', 60),
('Fundamentos de Redes de Computadores', 80),

-- 6º Semestre
('Fundamentos de Sistemas Embarcados', 60),
('Gestão de Infraestrutura de Redes', 60),
('Governança de TIC', 80),
('Programação Mobile', 60),
('Compiladores e Interpretadores', 80),
('Projeto Integrado II', 80),

-- 7º Semestre
('Projeto de Redes e Segurança', 80),
('Estimativa de Software', 80),
('Realidade Virtual', 60),
('Interação Humano Computador', 80),

-- 8º Semestre
('Design de Produtos Interativos Com Internet das Coisas', 40),
('Teste de Software', 80),
('Análise e Visualização de Dados', 80),
('Mineração de Dados', 80),
('Trabalho de Conclusão de Curso', 120),

-- Disciplinas Optativas (Previstas na Matriz Curricular)
('Educação Sócio Ambiental', 80),
('Linguagem Brasileira de Sinais', 80),
('Direitos Humanos e dos Povos Tradicionais', 80),
('Acessibilidade e Inclusão Digital', 80),
('Tecnologia em Contexto Social', 80),
('Tópicos Especiais em Redes de Computadores', 80),
('Tópicos Especiais em Banco de Dados', 80),
('Tópicos Especiais em Engenharia de Software', 80),
('Inteligência Computacional', 80),
('Multimídia e Interatividade', 80),
('Marketing Relacional', 80),
('Agilidade em Software', 80),
('Gerência da Conectividade Computacional', 80),
('Introdução em Desenvolvimento de Jogos Digitais', 80),
('Tópicos Especiais em Computação', 80),
('Logistica e Supply Chain', 80),
('Tecnologias Assistivas', 80);

-- 1º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 4, id, 1, false FROM disciplinas WHERE nome IN ('Matemática Discreta', 'Fundamentos de Sistemas de Informação', 'Fundamentos de Sistemas Operacionais', 'Linguagens Formais', 'Programação Estruturada', 'Inglês Instrumental');

-- 2º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 4, id, 2, false FROM disciplinas WHERE nome IN ('Estatística Aplicada a Informática', 'Análise Orientada à Objetos', 'Modelagem de Dados', 'Estrutura de Dados, Pesquisa e Ordenação', 'Programação Web');

-- 3º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 4, id, 3, false FROM disciplinas WHERE nome IN ('Fundamentos de Engenharia de Software', 'Programação Orientada a Objetos I', 'Banco de Dados I', 'Análise e Projeto de Algoritmos', 'Microcontroladores e Microprocessadores', 'Inovação Tecnológica e Empreendedorismo');

-- 4º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 4, id, 4, false FROM disciplinas WHERE nome IN ('Programação Orientada a Objetos II', 'Análise e Projeto de Software', 'Banco de Dados II', 'Sistemas Multirobóticos', 'Projeto Integrado I');

-- 5º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 4, id, 5, false FROM disciplinas WHERE nome IN ('Desenvolvimento de Processos de Software', 'Arquitetura de Software', 'Gerência de Projetos', 'Robótica Móvel', 'Cultura, Sociedade e Tecnologia', 'Fundamentos de Redes de Computadores');

-- 6º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 4, id, 6, false FROM disciplinas WHERE nome IN ('Fundamentos de Sistemas Embarcados', 'Gestão de Infraestrutura de Redes', 'Governança de TIC', 'Programação Mobile', 'Compiladores e Interpretadores', 'Projeto Integrado II');

-- 7º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 4, id, 7, false FROM disciplinas WHERE nome IN ('Projeto de Redes e Segurança', 'Estimativa de Software', 'Realidade Virtual', 'Interação Humano Computador');

-- 8º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 4, id, 8, false FROM disciplinas WHERE nome IN ('Design de Produtos Interativos Com Internet das Coisas', 'Teste de Software', 'Análise e Visualização de Dados', 'Mineração de Dados', 'Trabalho de Conclusão de Curso');

-- Bloco Eletivo (Disciplinas Optativas - Semestre Definido como NULL na nova regra estrutural)
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 4, id, NULL, true FROM disciplinas WHERE nome IN ('Educação Sócio Ambiental', 'Linguagem Brasileira de Sinais', 'Direitos Humanos e dos Povos Tradicionais', 'Acessibilidade e Inclusão Digital', 'Tecnologia em Contexto Social', 'Tópicos Especiais em Redes de Computadores', 'Tópicos Especiais em Banco de Dados', 'Tópicos Especiais em Engenharia de Software', 'Inteligência Computacional', 'Multimídia e Interatividade', 'Marketing Relacional', 'Agilidade em Software', 'Gerência da Conectividade Computacional', 'Introdução em Desenvolvimento de Jogos Digitais', 'Tópicos Especiais em Computação', 'Logistica e Supply Chain', 'Tecnologias Assistivas');

--TA -----------------

INSERT INTO disciplinas (nome, carga_horaria) VALUES
-- 1º Semestre
('Cálculo diferencial e integral - TA', 60),
('Química geral e inorgânica', 60),
('Biologia celular', 60),
('Português instrumental - TA', 60),
('Introdução à tecnologia de alimentos', 60),
('Ética e deontologia - TA', 30),

-- 2º Semestre
('Probabilidade e estatística - TA', 60),
('Química orgânica', 60),
('Bioquímica de alimentos', 60),
('Física aplicada à tecnologia de alimentos', 60),
('Micromicrobiologia geral - TA', 60),
('Metodologia do trabalho científico', 60),

-- 3º Semestre
('Microbiologia de alimentos', 60),
('Química analítica - TA', 60),
('Fisico-química', 60),
('Princípios de nutrição', 45),
('Higiene e legislação de alimentos', 60),
('Análise sensorial', 60),

-- 4º Semestre
('Análise de alimentos', 90),
('Fenômenos de transporte - TA', 60),
('Operações unitárias na indústria de alimentos I', 60),
('Tecnologia de produtos de origem vegetal I', 60),
('Tecnologia de produtos de origem animal I', 60),
('Embalagens de alimentos', 45),

-- 5º Semestre
('Operações unitárias na indústria de alimentos II', 60),
('Tecnologia de produtos de origem vegetal II', 60),
('Tecnologia de produtos de origem animal II', 60),
('Engenharia de processos na indústria de alimentos', 60),
('Controle de qualidade na indústria de alimentos', 60),
('Gestão ambiental e tratamento de resíduos', 60);

INSERT INTO disciplinas (nome, carga_horaria) VALUES
-- 6º Semestre
('Tecnologia de bebidas', 60),
('Tecnologia de óleos e gorduras', 60),
('Tecnologia de panificação e confeitaria', 60),
('Desenvolvimento de novos produtos', 60),
('Planejamento e projetos agroindustriais', 60),
('Higiene e segurança na indústria de alimentos', 45),

-- 7º Semestre
('Trabalho de conclusão de curso (TCC) - TA', 60),
('Estágio supervisionado - TA', 180),
('Gestão da produção e custos industriais', 60),
('Inovação e empreendedorismo na indústria de alimentos', 45);

-- 1º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 7, id, 1, false FROM disciplinas WHERE nome IN ('Cálculo diferencial e integral - TA', 'Química geral e inorgânica', 'Biologia celular', 'Português instrumental - TA', 'Introdução à tecnologia de alimentos', 'Ética e deontologia - TA');

-- 2º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 7, id, 2, false FROM disciplinas WHERE nome IN ('Probabilidade e estatística - TA', 'Química orgânica', 'Bioquímica de alimentos', 'Física aplicada à tecnologia de alimentos', 'Micromicrobiologia geral - TA', 'Metodologia do trabalho científico');

-- 3º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 7, id, 3, false FROM disciplinas WHERE nome IN ('Microbiologia de alimentos', 'Química analítica - TA', 'Fisico-química', 'Princípios de nutrição', 'Higiene e legislação de alimentos', 'Análise sensorial');

-- 4º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 7, id, 4, false FROM disciplinas WHERE nome IN ('Análise de alimentos', 'Fenômenos de transporte - TA', 'Operações unitárias na indústria de alimentos I', 'Tecnologia de produtos de origem vegetal I', 'Tecnologia de produtos de origem animal I', 'Embalagens de alimentos');

-- 5º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 7, id, 5, false FROM disciplinas WHERE nome IN ('Operações unitárias na indústria de alimentos II', 'Tecnologia de produtos de origem vegetal II', 'Tecnologia de produtos de origem animal II', 'Engenharia de processos na indústria de alimentos', 'Controle de qualidade na indústria de alimentos', 'Gestão ambiental e tratamento de resíduos');

-- 6º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 7, id, 6, false FROM disciplinas WHERE nome IN (
  'Tecnologia de bebidas', 
  'Tecnologia de óleos e gorduras', 
  'Tecnologia de panificação e confeitaria', 
  'Desenvolvimento de novos produtos', 
  'Planejamento e projetos agroindustriais', 
  'Higiene e segurança na indústria de alimentos'
);

-- 7º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 7, id, 7, false FROM disciplinas WHERE nome IN (
  'Trabalho de conclusão de curso (TCC) - TA', 
  'Estágio supervisionado - TA', 
  'Gestão da produção e custos industriais', 
  'Inovação e empreendedorismo na indústria de alimentos'
);

-- GEOGRAFIA ----------
INSERT INTO disciplinas (nome, carga_horaria) VALUES
-- 1º Semestre
('Introdução à Geografia - GEO', 60),
('Geologia Geral', 60),
('Cartografia Geral', 60),
('Fundamentos da Filosofia', 60),
('Leitura e Produção de Textos - GEO', 60),
('Matemática Aplicada à Geografia', 60),

-- 2º Semestre
('Teoria e Método em Geografia', 60),
('Geomorfologia I', 60),
('Climatologia Geral', 60),
('Cartografia Temática', 60),
('Antropologia e Cultura', 60),
('Psicologia da Educação - GEO', 60),

-- 3º Semestre
('Geografia Econômica', 60),
('Geomorfologia II', 60),
('Climatologia Aplicada', 60),
('Geografia Geral da População', 60),
('Estatística Aplicada à Geografia', 60),
('Didática Geral - GEO', 60),

-- 4º Semestre
('Geografia Política e Geopolítica', 60),
('Hidrologia Geral', 60),
('Biogeografia', 60),
('Geografia Urbana', 60),
('Sensoriamento Remoto', 60),
('Estrutura e Funcionamento da Educação Básica', 60),

-- 5º Semestre
('Pensamento Geográfico Brasileiro', 60),
('Pedologia', 60),
('Geoprocessamento', 60),
('Geografia Agrária', 60),
('Metodologia do Ensino de Geografia', 60),
('Prática Pedagógica I', 60),

-- 6º Semestre
('Organização do Espaço Mundial', 60),
('Geografia do Pará', 60),
('Planejamento Ambiental', 60),
('Geografia Regional e Planejamento', 60),
('Prática Pedagógica II', 60),
('Estágio Supervisionado I - GEO', 100),

-- 7º Semestre
('Organização do Espaço Brasileiro', 60),
('Geografia e Ensino para Populações Tradicionais', 60),
('Trabalho de Conclusão de Curso I (TCC I) - GEO', 60),
('Prática Pedagógica III', 60),
('Estágio Supervisionado II - GEO', 100),

-- 8º Semestre
('Novas Tecnologias Aplicadas ao Ensino de Geografia', 60),
('Trabalho de Conclusão de Curso II (TCC II) - GEO', 60),
('Prática Pedagógica IV', 60),
('Estágio Supervisionado III - GEO', 100),

-- Disciplinas Optativas (Previstas no PPP da UEPA)
('LIBRAS - Língua Brasileira de Sinais - GEO', 60),
('Geografia Cultural', 60),
('Geografia do Turismo', 60),
('Análise de Impactos Ambientais - GEO', 60),
('Geografia e Relações Étnico-Raciais', 60);

-- 1º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 6, id, 1, false FROM disciplinas WHERE nome IN ('Introdução à Geografia - GEO', 'Geologia Geral', 'Cartografia Geral', 'Fundamentos da Filosofia', 'Leitura e Produção de Textos - GEO', 'Matemática Aplicada à Geografia');

-- 2º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 6, id, 2, false FROM disciplinas WHERE nome IN ('Teoria e Método em Geografia', 'Geomorfologia I', 'Climatologia Geral', 'Cartografia Temática', 'Antropologia e Cultura', 'Psicologia da Educação - GEO');

-- 3º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 6, id, 3, false FROM disciplinas WHERE nome IN ('Geografia Econômica', 'Geomorfologia II', 'Climatologia Aplicada', 'Geografia Geral da População', 'Estatística Aplicada à Geografia', 'Didática Geral - GEO');

-- 4º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 6, id, 4, false FROM disciplinas WHERE nome IN ('Geografia Política e Geopolítica', 'Hidrologia Geral', 'Biogeografia', 'Geografia Urbana', 'Sensoriamento Remoto', 'Estrutura e Funcionamento da Educação Básica');

-- 5º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 6, id, 5, false FROM disciplinas WHERE nome IN ('Pensamento Geográfico Brasileiro', 'Pedologia', 'Geoprocessamento', 'Geografia Agrária', 'Metodologia do Ensino de Geografia', 'Prática Pedagógica I');

-- 6º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 6, id, 6, false FROM disciplinas WHERE nome IN ('Organização do Espaço Mundial', 'Geografia do Pará', 'Planejamento Ambiental', 'Geografia Regional e Planejamento', 'Prática Pedagógica II', 'Estágio Supervisionado I - GEO');

-- 7º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 6, id, 7, false FROM disciplinas WHERE nome IN ('Organização do Espaço Brasileiro', 'Geografia e Ensino para Populações Tradicionais', 'Trabalho de Conclusão de Curso I (TCC I) - GEO', 'Prática Pedagógica III', 'Estágio Supervisionado II - GEO');

-- 8º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 6, id, 8, false FROM disciplinas WHERE nome IN ('Novas Tecnologias Aplicadas ao Ensino de Geografia', 'Trabalho de Conclusão de Curso II (TCC II) - GEO', 'Prática Pedagógica IV', 'Estágio Supervisionado III - GEO');

-- Bloco Eletivo (Disciplinas Optativas)
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 6, id, NULL, true FROM disciplinas WHERE nome IN ('LIBRAS - Língua Brasileira de Sinais - GEO', 'Geografia Cultural', 'Geografia do Turismo', 'Análise de Impactos Ambientais - GEO', 'Geografia e Relações Étnico-Raciais');

-- Engenharia de Produção
INSERT INTO disciplinas (nome, carga_horaria) VALUES
-- 1º Semestre
('Química Geral - EP', 80),
('Introdução a Engenharia de Produção', 60),
('Desenho Técnico I', 80),
('Português Instrumental - EP', 60),
('Geometria Analítica e Álgebra Linear - EP', 80),
('Introdução a Cálculo para Engenharia - EP', 60),
('Métodos Computacionais para Engenharia - EP', 80),

-- 2º Semestre
('Física Geral e Experimental I', 80),
('Química Experimental - EP', 80),
('Gestão e Organização Empresarial', 80),
('Desenho Técnico II', 60),
('Estatística e Probabilidade para Engenharia I', 80),
('Cálculo Diferencial e Integral I - EP', 80),
('Psicologia e Relações Humanas', 80),

-- 3º Semestre
('Física Geral e Experimental II', 80),
('Práticas de Pesquisa Científica em Eng. de Produção', 60),
('Mecânica Aplicada - EP', 80),
('Gerenciamento da Produção', 80),
('Introdução à Ciência dos Materiais', 80),
('Cálculo Numérico - EP', 80),
('Cálculo Diferencial e Integral II - EP', 80),
('Estatística e Probabilidade para Engenharia II', 80),

-- 4º Semestre
('Física Geral e Experimental III', 80),
('Economia da Empresa', 80),
('Engenharia de Métodos', 80),
('Fenômenos de Transporte - EP', 120),
('Resistência dos Materiais - EP', 80),
('Cálculo Diferencial e Integral III', 80),

-- 5º Semestre
('Física Geral e Experimental IV', 80),
('Análise de Demandas Regionais', 60),
('Engenharia Econômica I', 80),
('Metodologia de Elaboração de Projetos Científicos', 60),
('Planejamento e Controle da Produção I', 80),
('Higiene e Segurança do Trabalho', 80),
('Pesquisa Operacional I', 80),
('Ergonomia Aplicada', 80),

-- 6º Semestre
('Gestão de Custos I', 80),
('Gestão de Projetos - EP', 80),
('Gerência da Qualidade', 80),
('Planejamento e Controle da Produção II', 80),
('Energia e Projetos Elétricos', 80),
('Pesquisa Operacional II', 80),
('Engenharia do Produto e do Processo', 80),

-- 7º Semestre
('Organização do Trabalho', 60),
('Análise e Gestão Econômica de Projetos', 80),
('Engenharia e Gestão do Conhecimento', 80),
('Marketing', 80),
('Gestão e Sustentabilidade', 80),
('Projeto de Instalações', 60),
('Introdução à Automação Industrial', 80),
('Modelagem e Simulação de Sistemas de Produção', 80),

-- 8º Semestre
('Gerência de Materiais', 80),
('Empreendedorismo - EP', 60),
('Legislação Social', 60),
('Gestão de Custos II', 80),
('Gerenciamento Ambiental na Indústria', 80),
('Tecnologia e Sistemas de Informação', 80),
('Logística e Supply Chain - EP', 80),

-- 9º Semestre
('Consumo e Produção Sustentável', 60),
('Gestão de Pessoas e de Conflitos', 80),
('Projeto de TCC em Engenharia de Produção', 80),
('Controle Estatístico do Processo', 60),
('Gerência de Operações em Serviços', 60),
('Engenharia de Manutenção', 60),
('Processo e Gestão da Inovação', 60),

-- 10º Semestre
('Ética e Deontologia - EP', 60),
('Trabalho de Conclusão de Curso (TCC) - EP', 80),
('Estágio Supervisionado - EP', 240),

-- Componentes de Atividades Complementares (AFCs) e Optativas
('Atividade de Formação Complementar I', 40),
('Atividade de Formação Complementar II', 40),
('Atividade de Formação Complementar III', 40),
('Atividades de Formação Complementar IV', 20),
('LIBRAS - Língua Brasileira de Sinais - EP', 60);


-- 1º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 2, id, 1, false FROM disciplinas WHERE nome IN ('Química Geral - EP', 'Introdução a Engenharia de Produção', 'Desenho Técnico I', 'Português Instrumental - EP', 'Geometria Analítica e Álgebra Linear - EP', 'Introdução a Cálculo para Engenharia - EP', 'Métodos Computacionais para Engenharia - EP');

-- 2º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 2, id, 2, false FROM disciplinas WHERE nome IN ('Física Geral e Experimental I', 'Química Experimental - EP', 'Gestão e Organização Empresarial', 'Desenho Técnico II', 'Estatística e Probabilidade para Engenharia I', 'Cálculo Diferencial e Integral I - EP', 'Psicologia e Relações Humanas', 'Atividade de Formação Complementar I');

-- 3º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 2, id, 3, false FROM disciplinas WHERE nome IN ('Física Geral e Experimental II', 'Práticas de Pesquisa Científica em Eng. de Produção', 'Mecânica Aplicada - EP', 'Gerenciamento da Produção', 'Introdução à Ciência dos Materiais', 'Cálculo Numérico - EP', 'Cálculo Diferencial e Integral II - EP', 'Estatística e Probabilidade para Engenharia II');

-- 4º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 2, id, 4, false FROM disciplinas WHERE nome IN ('Física Geral e Experimental III', 'Economia da Empresa', 'Engenharia de Métodos', 'Fenômenos de Transporte - EP', 'Resistência dos Materiais - EP', 'Cálculo Diferencial e Integral III', 'Atividade de Formação Complementar II');

-- 5º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 2, id, 5, false FROM disciplinas WHERE nome IN ('Física Geral e Experimental IV', 'Análise de Demandas Regionais', 'Engenharia Econômica I', 'Metodologia de Elaboração de Projetos Científicos', 'Planejamento e Controle da Produção I', 'Higiene e Segurança do Trabalho', 'Pesquisa Operacional I', 'Ergonomia Aplicada');

-- 6º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 2, id, 6, false FROM disciplinas WHERE nome IN ('Gestão de Custos I', 'Gestão de Projetos - EP', 'Gerência da Qualidade', 'Planejamento e Controle da Produção II', 'Energia e Projetos Elétricos', 'Pesquisa Operacional II', 'Engenharia do Produto e do Processo', 'Atividade de Formação Complementar III');

-- 7º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 2, id, 7, false FROM disciplinas WHERE nome IN ('Organização do Trabalho', 'Análise e Gestão Econômica de Projetos', 'Engenharia e Gestão do Conhecimento', 'Marketing', 'Gestão e Sustentabilidade', 'Projeto de Instalações', 'Introdução à Automação Industrial', 'Modelagem e Simulação de Sistemas de Produção');

-- 8º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 2, id, 8, false FROM disciplinas WHERE nome IN ('Gerência de Materiais', 'Empreendedorismo - EP', 'Legislação Social', 'Gestão de Custos II', 'Gerenciamento Ambiental na Indústria', 'Tecnologia e Sistemas de Informação', 'Logística e Supply Chain - EP', 'Atividades de Formação Complementar IV');

-- 9º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 2, id, 9, false FROM disciplinas WHERE nome IN ('Consumo e Produção Sustentável', 'Gestão de Pessoas e de Conflitos', 'Projeto de TCC em Engenharia de Produção', 'Controle Estatístico do Processo', 'Gerência de Operações em Serviços', 'Engenharia de Manutenção', 'Processo e Gestão da Inovação');

-- 10º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 2, id, 10, false FROM disciplinas WHERE nome IN ('Ética e Deontologia - EP', 'Trabalho de Conclusão de Curso (TCC) - EP', 'Estágio Supervisionado - EP');

-- Bloco de Optativas (Definidas com semestre como NULL e flag true)
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 2, id, NULL, true FROM disciplinas WHERE nome IN ('LIBRAS - Língua Brasileira de Sinais - EP');

-- Fisica

INSERT INTO disciplinas (nome, carga_horaria) VALUES
-- 1º Semestre
('Introdução à Física', 80),
('Vetores e Geometria Analítica - FIS', 60),
('Tópicos de Matemática Aplicada à Física I', 80),
('Produção de Gêneros Acadêmicos - FIS', 80),
('Psicologia da Educação - FIS', 80),
('TIDIAE - Tecnologias da Informação e Comunicação no Ensino de Física', 80),
('Metodologia Científica - FIS', 80),

-- 2º Semestre
('Tópicos de Física I', 80),
('Tópicos de Matemática Aplicada à Física II', 80),
('Estatística Aplicada - FIS', 60),
('Epistemologia e História da Ciência I', 80),
('Didática Geral e Especial - FIS', 80),
('Teoria e Prática de Ensino de Física I', 80),
('Políticas Públicas e Educação', 80),

-- 3º Semestre
('Tópicos de Física II', 80),
('Métodos Matemáticos da Física Teórica I', 80),
('Laboratório de Física I', 40),
('Fundamentos Teóricos e Metodológicos da Educação Especial', 80),
('Introdução à Astronomia', 80),
('Teoria e Prática de Ensino de Física II', 80),
('Fundamentos Teóricos e Metodológicos da EJA', 80),

-- 4º Semestre
('Tópicos de Física III', 100),
('Sociologia da Educação', 80),
('Laboratório de Física II', 40),
('Princípios da Mecânica Clássica', 80),
('Filosofia da Educação', 80),
('Teoria e Prática de Ensino de Física III', 80),
('Gestão Educacional', 80),

-- 5º Semestre
('Tópicos de Física IV', 100),
('Termodinâmica e Introdução à Física Estatística', 80),
('Métodos Matemáticos da Física Teórica II', 80),
('Laboratório de Física III', 40),
('Estágio Supervisionado I: Aspectos Gerais da Realidade Escolar', 120),
('Teoria e Prática de Ensino de Física IV', 80),

-- 6º Semestre
('Mecânica Quântica I', 80),
('Eletromagnetismo I', 80),
('Física Computacional', 60),
('Laboratório de Física IV', 40),
('Estágio Supervisionado II: O Ensino de Física no Ensino Médio Regular', 120),
('Epistemologia e História da Ciência II', 80),

-- 7º Semestre
('Física Moderna', 80),
('Eletromagnetismo II', 80),
('Estrutura da Matéria', 80),
('Laboratório de Física V', 40),
('Estágio Supervisionado III: O Ensino de Física em Outros Contextos', 120),
('Trabalho de Conclusão de Curso I (TCC I) - FIS', 60),

-- 8º Semestre
('Instrumentação para o Ensino de Física', 80),
('Física do Estado Sólido', 80),
('Trabalho de Conclusão de Curso II (TCC II) - FIS', 60),
('Estágio Supervisionado IV: Gestão de Projetos e Práticas Educativas', 120),

-- Disciplinas Optativas (Previstas no PPC)
('LIBRAS - Língua Brasileira de Sinais - FIS', 60),
('Física Ambiental', 60),
('Tópicos de Física Contemporânea', 60),
('Introdução à Relatividade Restrita', 60),
('Relações Étnico-Raciais e Afrodescendência no Ensino de Ciências', 60);


-- 1º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 5, id, 1, false FROM disciplinas WHERE nome IN ('Introdução à Física', 'Vetores e Geometria Analítica - FIS', 'Tópicos de Matemática Aplicada à Física I', 'Produção de Gêneros Acadêmicos - FIS', 'Psicologia da Educação - FIS', 'TIDIAE - Tecnologias da Informação e Comunicação no Ensino de Física', 'Metodologia Científica - FIS');

-- 2º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 5, id, 2, false FROM disciplinas WHERE nome IN ('Tópicos de Física I', 'Tópicos de Matemática Aplicada à Física II', 'Estatística Aplicada - FIS', 'Epistemologia e História da Ciência I', 'Didática Geral e Especial - FIS', 'Teoria e Prática de Ensino de Física I', 'Políticas Públicas e Educação');

-- 3º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 5, id, 3, false FROM disciplinas WHERE nome IN ('Tópicos de Física II', 'Métodos Matemáticos da Física Teórica I', 'Laboratório de Física I', 'Fundamentos Teóricos e Metodológicos da Educação Especial', 'Introdução à Astronomia', 'Teoria e Prática de Ensino de Física II', 'Fundamentos Teóricos e Metodológicos da EJA');

-- 4º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 5, id, 4, false FROM disciplinas WHERE nome IN ('Tópicos de Física III', 'Sociologia da Educação', 'Laboratório de Física II', 'Princípios da Mecânica Clássica', 'Filosofia da Educação', 'Teoria e Prática de Ensino de Física III', 'Gestão Educacional');

-- 5º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 5, id, 5, false FROM disciplinas WHERE nome IN ('Tópicos de Física IV', 'Termodinâmica e Introdução à Física Estatística', 'Métodos Matemáticos da Física Teórica II', 'Laboratório de Física III', 'Estágio Supervisionado I: Aspectos Gerais da Realidade Escolar', 'Teoria e Prática de Ensino de Física IV');

-- 6º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 5, id, 6, false FROM disciplinas WHERE nome IN ('Mecânica Quântica I', 'Eletromagnetismo I', 'Física Computacional', 'Laboratório de Física IV', 'Estágio Supervisionado II: O Ensino de Física no Ensino Médio Regular', 'Epistemologia e História da Ciência II');

-- 7º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 5, id, 7, false FROM disciplinas WHERE nome IN ('Física Moderna', 'Eletromagnetismo II', 'Estrutura da Matéria', 'Laboratório de Física V', 'Estágio Supervisionado III: O Ensino de Física em Outros Contextos', 'Trabalho de Conclusão de Curso I (TCC I) - FIS');

-- 8º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 5, id, 8, false FROM disciplinas WHERE nome IN ('Instrumentação para o Ensino de Física', 'Física do Estado Sólido', 'Trabalho de Conclusão de Curso II (TCC II) - FIS', 'Estágio Supervisionado IV: Gestão de Projetos e Práticas Educativas');

-- Bloco Eletivo (Disciplinas Optativas)
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 5, id, NULL, true FROM disciplinas WHERE nome IN ('LIBRAS - Língua Brasileira de Sinais - FIS', 'Física Ambiental', 'Tópicos de Física Contemporânea', 'Introdução à Relatividade Restrita', 'Relações Étnico-Raciais e Afrodescendência no Ensino de Ciências');

-- Engenharia Florestal

INSERT INTO disciplinas (nome, carga_horaria) VALUES
-- 1º Semestre
('Introdução à Engenharia Florestal', 30),
('Matemática Instrumental', 60),
('Química Geral e Analítica', 60),
('Biologia Celular e Tecidual', 60),
('Metodologia do Trabalho Científico - EFL', 60),
('Desenho Técnico - EFL', 60),
('Expressão Gráfica', 45),

-- 2º Semestre
('Cálculo Diferencial e Integral - EFL', 60),
('Química Orgânica e Bioquímica', 60),
('Física Geral - EFL', 60),
('Botânica Morfológica', 60),
('Geologia Geral e de Solos', 60),
('Sociologia e Extensão Rural', 45),

-- 3º Semestre
('Cálculo Aplicado e Numérico', 60),
('Física Aplicada - EFL', 60),
('Botânica Sistemática Florestal', 60),
('Gênese e Morfologia do Solo', 60),
('Topografia Geral', 60),
('Estatística Geral - EFL', 60),

-- 4º Semestre
('Bioestatística e Experimentação Florestal', 60),
('Cartografia e Geodésia', 60),
('Fisiologia Vegetal Florestal', 60),
('Física e Mecânica do Solo', 60),
('Meteorologia e Climatologia', 60),
('Zoologia e Entomologia Florestal', 60),

-- 5º Semestre
('Dendrologia', 60),
('Sensoriamento Remoto e Fotogrametria', 60),
('Química e Fertilidade do Solo', 60),
('Ecologia Florestal', 60),
('Hidrologia e Manejo de Bacias Hidrográficas', 60),
('Genética e Melhoramento Florestal', 60),

-- 6º Semestre
('Dendrometria', 60),
('Sistemas de Informação Geográfica (SIG)', 60),
('Nutrição de Árvores Florestais', 60),
('Patologia Florestal', 60),
('Incêndios Florestais', 45),
('Mecanização e Transporte Florestal', 60),

-- 7º Semestre
('Inventário Florestal', 60),
('Sementes e Viveiros Florestais', 60),
('Silvicultura de Espécies Nativas', 60),
('Silvicultura de Espécies Introduzidas', 60),
('Proteção Florestal', 60),
('Construções Florestais', 45),

-- 8º Semestre
('Manejo de Florestas Nativas', 60),
('Manejo de Florestas Plantadas', 60),
('Anatomia e Identificação da Madeira', 60),
('Colheita Florestal', 60),
('Economia Florestal', 60),
('Agrossilvicultura', 60),

-- 9º Semestre
('Propriedades Físicas e Mecânicas da Madeira', 60),
('Tecnologia e Utilização de Produtos Florestais', 60),
('Secagem e Preservação da Madeira', 45),
('Planejamento Florestal', 60),
('Legislação e Perícia Ambiental', 45),
('Avaliação de Impactos Ambientais - EFL', 45),
('Trabalho de Conclusão de Curso I (TCC I) - EFL', 60),

-- 10º Semestre
('Trabalho de Conclusão de Curso II (TCC II) - EFL', 60),
('Estágio Supervisionado - EFL', 300),
('Ética e Deontologia - EFL', 30),
('Administração e Empreendedorismo Florestal', 45),

-- Disciplinas Optativas (Previstas na Matriz)
('LIBRAS - Língua Brasileira de Sinais - EFL', 60),
('Certificação Florestal', 45),
('Recuperação de Áreas Degradadas', 45),
('Produtos Florestais Não-Madeireiros', 45),
('Arborização e Paisagismo Urbano', 45);

-- 1º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 1, id, 1, false FROM disciplinas WHERE nome IN ('Introdução à Engenharia Florestal', 'Matemática Instrumental', 'Química Geral e Analítica', 'Biologia Celular e Tecidual', 'Metodologia do Trabalho Científico - EFL', 'Desenho Técnico - EFL', 'Expressão Gráfica');

-- 2º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 1, id, 2, false FROM disciplinas WHERE nome IN ('Cálculo Diferencial e Integral - EFL', 'Química Orgânica e Bioquímica', 'Física Geral - EFL', 'Botânica Morfológica', 'Geologia Geral e de Solos', 'Sociologia e Extensão Rural');

-- 3º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 1, id, 3, false FROM disciplinas WHERE nome IN ('Cálculo Aplicado e Numérico', 'Física Aplicada - EFL', 'Botânica Sistemática Florestal', 'Gênese e Morfologia do Solo', 'Topografia Geral', 'Estatística Geral - EFL');

-- 4º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 1, id, 4, false FROM disciplinas WHERE nome IN ('Bioestatística e Experimentação Florestal', 'Cartografia e Geodésia', 'Fisiologia Vegetal Florestal', 'Física e Mecânica do Solo', 'Meteorologia e Climatologia', 'Zoologia e Entomologia Florestal');

-- 5º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 1, id, 5, false FROM disciplinas WHERE nome IN ('Dendrologia', 'Sensoriamento Remoto e Fotogrametria', 'Química e Fertilidade do Solo', 'Ecologia Florestal', 'Hidrologia e Manejo de Bacias Hidrográficas', 'Genética e Melhoramento Florestal');

-- 6º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 1, id, 6, false FROM disciplinas WHERE nome IN ('Dendometria', 'Sistemas de Informação Geográfica (SIG)', 'Nutrição de Árvores Florestais', 'Patologia Florestal', 'Incêndios Florestais', 'Mecanização e Transporte Florestal');

-- 7º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 1, id, 7, false FROM disciplinas WHERE nome IN ('Inventário Florestal', 'Sementes e Viveiros Florestais', 'Silvicultura de Espécies Nativas', 'Silvicultura de Espécies Introduzidas', 'Proteção Florestal', 'Construções Florestais');

-- 8º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 1, id, 8, false FROM disciplinas WHERE nome IN ('Manejo de Florestas Nativas', 'Manejo de Florestas Plantadas', 'Anatomia e Identificação da Madeira', 'Colheita Florestal', 'Economia Florestal', 'Agrossilvicultura');

-- 9º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 1, id, 9, false FROM disciplinas WHERE nome IN ('Propriedades Físicas e Mecânicas da Madeira', 'Tecnologia e Utilização de Produtos Florestais', 'Secagem e Preservação da Madeira', 'Planejamento Florestal', 'Legislação e Perícia Ambiental', 'Avaliação de Impactos Ambientais - EFL', 'Trabalho de Conclusão de Curso I (TCC I) - EFL');

-- 10º Semestre
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 1, id, 10, false FROM disciplinas WHERE nome IN ('Trabalho de Conclusão de Curso II (TCC II) - EFL', 'Estágio Supervisionado - EFL', 'Ética e Deontologia - EFL', 'Administração e Empreendedorismo Florestal');

-- Bloco Eletivo (Disciplinas Optativas)
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 1, id, NULL, true FROM disciplinas WHERE nome IN ('LIBRAS - Língua Brasileira de Sinais - EFL', 'Certificação Florestal', 'Recuperação de Áreas Degradadas', 'Produtos Florestais Não-Madeireiros', 'Arborização e Paisagismo Urbano');

-- Engenharia de ambiental e sanitária 

INSERT INTO disciplinas (nome, carga_horaria) VALUES
-- 1º Bloco
('Introdução ao Cálculo para Engenharia - EAS', 60),
('Português Instrumental - EAS', 40),
('Química Geral - EAS', 60),
('Álgebra Linear e Geometria Analítica - EAS', 60),
('Métodos Computacionais para Engenharia - EAS', 60),
('Introdução à Engenharia Ambiental e Sanitária', 60),
('Sociologia e Meio Ambiente', 40),

-- 2º Bloco
('Cálculo Diferencial e Integral I - EAS', 60),
('Ecologia Aplicada à Engenharia', 60),
('Expressão Gráfica I - EAS', 60),
('Química Experimental - EAS', 60),
('Biologia e Microbiologia Ambiental', 60),
('Saúde e Meio Ambiente - EAS', 60),
('Cartografia e Topografia', 80),

-- 3º Bloco
('Cálculo Diferencial e Integral II - EAS', 60),
('Física Geral e Experimental I - EAS', 60),
('Expressão Gráfica II - EAS', 80),
('Ciências e Tecnologia dos Materiais - EAS', 60),
('Trabalhos Técnicos e Científicos em Eng. Ambiental e Sanitária', 40),
('Ecossistemas Aquáticos', 60),
('Mecânica Aplicada - EAS', 60),

-- 4º Bloco
('Cálculo Diferencial e Integral III - EAS', 60),
('Fenômenos do Transporte - EAS', 80),
('Física Geral e Experimental II - EAS', 60),
('Geologia - EAS', 60),
('Qualidade da Água', 80),
('Estatística Geral - EAS', 60),

-- 5º Bloco
('Física Geral e Experimental III - EAS', 60),
('Cálculo Numérico - EAS', 60),
('Hidráulica I', 80),
('Qualidade de Solo', 80),
('Resistência dos Materiais - EAS', 60),
('Gestão de Resíduos Sólidos', 60),
('Climatologia e Meteorologia - EAS', 60),

-- 6º Bloco
('Hidrologia - EAS', 60),
('Controle de Poluição Atmosférica', 80),
('Elementos de Projeto Estrutural', 60),
('Sistemas de Abastecimento de Água', 80),
('Hidráulica II', 60),
('Ecologia de Ecossistemas Amazônicos', 60),
('Fontes e Controle de Poluição Mineral', 60),

-- 7º Bloco
('Sistema de Informações Ambientais', 60),
('Avaliação de Impactos Ambientais I', 60),
('Gestão Ambiental e Legislação Aplicada', 80),
('Tratamento de águas Residuárias e Industriais', 80),
('Sistema de Esgotamento Sanitário', 40),
('Sistemas Elétricos - EAS', 60),

-- 8º Bloco
('Drenagem e Hidrologia Urbana', 60),
('Avaliação de Impactos Ambientais II', 80),
('Planejamento de Recursos Hídricos', 60),
('Economia e Administração Ambiental', 60),
('Saúde Ambiental e Vigilância Sanitária', 60),
('Tratamento e Disposição Final de Resíduos Sólidos', 60),

-- 9º Bloco
('Trabalho de Conclusão de Curso I (TCC I) - EAS', 40),
('Modelagem e Simulação de Sistemas Ambientais', 60),
('Auditoria e Certificação Ambiental', 40),
('Instalações Hidrossanitárias Prediais', 40),
('Segurança do Trabalho e Ergonomia - EAS', 40),

-- 10º Bloco
('Trabalho de Conclusão de Curso II (TCC II) - EAS', 40),
('Ética, Deontologia e Prática Profissional - EAS', 40),

-- Disciplinas Optativas (Previstas nas Ementas Oficiais)
('LIBRAS - Língua Brasileira de Sinais - EAS', 40),
('Introdução ao uso do programa R e RStudio', 40);

-- 1º Bloco
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 3, id, 1, false FROM disciplinas WHERE nome IN ('Introdução ao Cálculo para Engenharia - EAS', 'Português Instrumental - EAS', 'Química Geral - EAS', 'Álgebra Linear e Geometria Analítica - EAS', 'Métodos Computacionais para Engenharia - EAS', 'Introdução à Engenharia Ambiental e Sanitária', 'Sociologia e Meio Ambiente');

-- 2º Bloco
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 3, id, 2, false FROM disciplinas WHERE nome IN ('Cálculo Diferencial e Integral I - EAS', 'Ecologia Aplicada à Engenharia', 'Expressão Gráfica I - EAS', 'Química Experimental - EAS', 'Biologia e Microbiologia Ambiental', 'Saúde e Meio Ambiente - EAS', 'Cartografia e Topografia');

-- 3º Bloco
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 3, id, 3, false FROM disciplinas WHERE nome IN ('Cálculo Diferencial e Integral II - EAS', 'Física Geral e Experimental I - EAS', 'Expressão Gráfica II - EAS', 'Ciências e Tecnologia dos Materiais - EAS', 'Trabalhos Técnicos e Científicos em Eng. Ambiental e Sanitária', 'Ecossistemas Aquáticos', 'Mecânica Aplicada - EAS');

-- 4º Bloco
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 3, id, 4, false FROM disciplinas WHERE nome IN ('Cálculo Diferencial e Integral III - EAS', 'Fenômenos do Transporte - EAS', 'Física Geral e Experimental II - EAS', 'Geologia - EAS', 'Qualidade da Água', 'Estatística Geral - EAS');

-- 5º Bloco
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 3, id, 5, false FROM disciplinas WHERE nome IN ('Física Geral e Experimental III - EAS', 'Cálculo Numérico - EAS', 'Hidráulica I', 'Qualidade de Solo', 'Resistência dos Materiais - EAS', 'Gestão de Resíduos Sólidos', 'Climatologia e Meteorologia - EAS');

-- 6º Bloco
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 3, id, 6, false FROM disciplinas WHERE nome IN ('Hidrologia - EAS', 'Controle de Poluição Atmosférica', 'Elementos de Projeto Estrutural', 'Sistemas de Abastecimento de Água', 'Hidráulica II', 'Ecologia de Ecossistemas Amazônicos', 'Fontes e Controle de Poluição Mineral');

-- 7º Bloco
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 3, id, 7, false FROM disciplinas WHERE nome IN ('Sistema de Informações Ambientais', 'Avaliação de Impactos Ambientais I', 'Gestão Ambiental e Legislação Aplicada', 'Tratamento de águas Residuárias e Industriais', 'Sistema de Esgotamento Sanitário', 'Sistemas Elétricos - EAS');

-- Correção do 8º Bloco de Engenharia Ambiental e Sanitária
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 3, id, 8, false FROM disciplinas WHERE nome IN (
    'Drenagem e Hidrologia Urbana', 
    'Avaliação de Impactos Ambientais II', 
    'Planejamento de Recursos Hídricos', 
    'Economia e Administração Ambiental', 
    'Saúde Ambiental e Vigilância Sanitária', 
    'Tratamento e Disposição Final de Resíduos Sólidos'
);

-- 9º Bloco
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 3, id, 9, false FROM disciplinas WHERE nome IN ('Trabalho de Conclusão de Curso I (TCC I) - EAS', 'Modelagem e Simulação de Sistemas Ambientais', 'Auditoria e Certificação Ambiental', 'Instalações Hidrossanitárias Prediais', 'Segurança do Trabalho e Ergonomia - EAS');

-- 10º Bloco
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 3, id, 10, false FROM disciplinas WHERE nome IN ('Trabalho de Conclusão de Curso II (TCC II) - EAS', 'Ética, Deontologia e Prática Profissional - EAS');

-- Bloco de Eletivas / Optativas (Definidas com semestre como NULL e flag true)
INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa)
SELECT 3, id, NULL, true FROM disciplinas WHERE nome IN ('LIBRAS - Língua Brasileira de Sinais - EAS', 'Introdução ao uso do programa R e RStudio');



-- Inserindo Professores
INSERT INTO professores (nome) VALUES 
('ADRIANO CESAR CALANDRINI BRAGA'),
('ALAN MARCEL FERNANDES DE SOUZA'),
('ALESSANDRA JACKELINE GUEDES DE MORAES'),
('ALINE SOUZA SARDINHA'),
('ANTONIO MARCOS CARDOSO SILVA'),
('BRUNA ALMEIDA DA SILVA'),
('CHRISTINE DA SILVA MACEDO'),
('CLAUDIO MACIEL DE SOUZA COUTINHO'),
('DENILSON RICARDO DE LUCENA NUNES'),
('GUSTAVO NOGUEIRA DIAS'),
('HENRIQUETA DA CONCEICAO BRITO NUNES'),
('IGOR DE JESUS LOBATO POMPEU GAMMARANO'),
('IGOR RAMON SINIMBU MIRANDA'),
('JAIRO FADUL DE LIMA'),
('JAIR SOUZA DA SILVA'),
('JOAO HAMILTON PINHEIRO DE SOUZA'),
('JOAO RODRIGO COIMBRA NOBRE'),
('JOSE FERNANDO PEREIRA LEAL'),
('JUCIANA NUNES CARDOSO'),
('LENO RODRIGUES MARTINS'),
('LEONY LUIS LOPES NEGRAO'),
('LETICIA FARIA TEIXEIRA'),
('LUCAS ARAUJO DE OLIVEIRA'),
('LUIZ FERNANDES SILVA DIONISIO'),
('MARTA DE OLIVEIRA BARREIROS'),
('MAURO EMILIO COSTA SILVA'),
('REGINALDO DE OLIVEIRA CORREA JUNIOR'),
('RUBENS CARDOSO DA SILVA'),
('SAUL RODRIGO DA COSTA BARRETO'),
('VANDERSON VASCONCELOS DANTAS');

-- Vinculando Professores aos Cursos (aproximado pelo departamento)
-- TECNOLOGIA DE ALIMENTOS = 7
INSERT INTO professor_cursos (professor_id, curso_id) SELECT id, 7 FROM professores WHERE nome IN ('ADRIANO CESAR CALANDRINI BRAGA', 'BRUNA ALMEIDA DA SILVA', 'CHRISTINE DA SILVA MACEDO', 'JOAO HAMILTON PINHEIRO DE SOUZA', 'VANDERSON VASCONCELOS DANTAS');

-- ENGENHARIA FLORESTAL = 1
INSERT INTO professor_cursos (professor_id, curso_id) SELECT id, 1 FROM professores WHERE nome IN ('ALESSANDRA JACKELINE GUEDES DE MORAES', 'HENRIQUETA DA CONCEICAO BRITO NUNES', 'JOAO RODRIGO COIMBRA NOBRE', 'LUIZ FERNANDES SILVA DIONISIO');

-- ENGENHARIA AMBIENTAL = 3
INSERT INTO professor_cursos (professor_id, curso_id) SELECT id, 3 FROM professores WHERE nome IN ('ALINE SOUZA SARDINHA', 'ANTONIO MARCOS CARDOSO SILVA');

-- ENGENHARIA DE SOFTWARE = 4
INSERT INTO professor_cursos (professor_id, curso_id) SELECT id, 4 FROM professores WHERE nome IN ('CLAUDIO MACIEL DE SOUZA COUTINHO', 'JAIRO FADUL DE LIMA', 'LENO RODRIGUES MARTINS', 'MARTA DE OLIVEIRA BARREIROS');

-- ENGENHARIA DE PRODUÇÃO = 2
INSERT INTO professor_cursos (professor_id, curso_id) SELECT id, 2 FROM professores WHERE nome IN ('DENILSON RICARDO DE LUCENA NUNES', 'IGOR DE JESUS LOBATO POMPEU GAMMARANO', 'JUCIANA NUNES CARDOSO', 'LEONY LUIS LOPES NEGRAO', 'RUBENS CARDOSO DA SILVA');

-- LICENCIATURA EM FÍSICA = 5
INSERT INTO professor_cursos (professor_id, curso_id) SELECT id, 5 FROM professores WHERE nome IN ('IGOR RAMON SINIMBU MIRANDA', 'JOSE FERNANDO PEREIRA LEAL', 'REGINALDO DE OLIVEIRA CORREA JUNIOR');

-- LICENCIATURA EM GEOGRAFIA = 6
INSERT INTO professor_cursos (professor_id, curso_id) SELECT id, 6 FROM professores WHERE nome IN ('JAIR SOUZA DA SILVA', 'MAURO EMILIO COSTA SILVA');