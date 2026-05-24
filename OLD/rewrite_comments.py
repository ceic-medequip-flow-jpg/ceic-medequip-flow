import sys

with open("c:\\Users\\jesus.cavalcante\\Desktop\\CEIC_App\\index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip_next = 0

for i, line in enumerate(lines):
    if skip_next > 0:
        skip_next -= 1
        continue
    
    stripped = line.strip()
    
    if "ATENÇÃO: O assistente precisou recriar o cabeçalho" in stripped:
        new_lines.append(line.replace("ATENÇÃO: O assistente precisou recriar o cabeçalho.", "Configuração de conexão com o Supabase (banco de dados em nuvem)."))
        skip_next = 3
        continue
    elif "EXPLICANDO: Aqui nós deixamos pré-configuradas as opções" in stripped:
        new_lines.append(line.replace("EXPLICANDO: Aqui nós deixamos pré-configuradas as opções que não mudam no sistema.", "Definição de constantes e opções estáticas do sistema (perfil de usuários, setores, etc)."))
        skip_next = 1
        continue
    elif "EXPLICANDO: Estas são pequenas ferramentas e atalhos" in stripped:
        new_lines.append(line.replace("EXPLICANDO: Estas são pequenas ferramentas e atalhos de bastidores.", "Funções utilitárias (helpers) compartilhadas."))
        skip_next = 1
        continue
    elif "EXPLICANDO: Estes são os \"blocos de montar\"" in stripped:
        new_lines.append(line.replace("EXPLICANDO: Estes são os \"blocos de montar\" do sistema (cores, etiquetas, etc).", "Componentes visuais da interface (UI) compartilhados."))
        skip_next = 1
        continue
    elif "EXPLICANDO: Daqui para baixo, cada bloco" in stripped:
        new_lines.append(line.replace("EXPLICANDO: Daqui para baixo, cada bloco destes representa uma TELA ou uma ABA inteira que as pessoas veem.", "Definição das Views e Telas do sistema."))
        continue
    elif "TELA DE LOGIN: É a porta de entrada" in stripped:
        new_lines.append(line.replace("TELA DE LOGIN: É a porta de entrada. Pergunta \"Quem é você?\" e valida senhas.", "View: Tela de Login."))
        continue
    elif "TELA DO OPERACIONAL: É o telão que a equipe" in stripped:
        new_lines.append(line[:line.find("//")] + "// View: Dashboard da Equipe Operacional (Fila e Atendimento).\n")
        continue
    elif "CARTÃO DO PEDIDO (OPERACIONAL): É o desenho quadrado" in stripped:
        new_lines.append(line[:line.find("//")] + "// Componente: Card de Pedido da fila operacional.\n")
        continue
    elif "TELA DE ESTOQUE CENTRAL: Aba que mostra" in stripped:
        new_lines.append(line[:line.find("//")] + "// View: Estoque Central (Lista de equipamentos disponíveis).\n")
        continue
    elif "TELA DE MEUS PEDIDOS (ASSISTENCIAL): Onde o enfermeiro" in stripped:
        new_lines.append(line[:line.find("//")] + "// View: Meus Pedidos (Acompanhamento de requisições do colaborador).\n")
        continue
    elif "TELA DE NOVA SOLICITAÇÃO (ASSISTENCIAL): Formulário" in stripped:
        new_lines.append(line[:line.find("//")] + "// View: Nova Solicitação (Formulário de requisição de equipamentos).\n")
        continue
    elif "TELA DE DEVOLUÇÃO/TRIAGEM (OPERACIONAL): Onde o equipamento volta" in stripped:
        new_lines.append(line[:line.find("//")] + "// View: Devolução e Triagem de equipamentos recolhidos.\n")
        continue
    elif "TELA DE LIMPEZA/EXPURGO (OPERACIONAL): Fila dos equipamentos" in stripped:
        new_lines.append(line[:line.find("//")] + "// View: Limpeza e Expurgo (Fila de higienização).\n")
        continue
    elif "TELA DE MANUTENÇÃO (OPERACIONAL): Fila de aparelhos quebrados" in stripped:
        new_lines.append(line[:line.find("//")] + "// View: Manutenção (Fila de equipamentos em reparo/engenharia).\n")
        continue
    elif "TELA DE EQUIPAMENTOS NA ÁREA (ASSISTENCIAL): Visão que mostra" in stripped:
        new_lines.append(line[:line.find("//")] + "// View: Equipamentos na Área (Aparelhos alocados no setor logado).\n")
        continue
    elif "TELAS ADMINISTRATIVAS / LIDERANÇA: Daqui para baixo" in stripped:
        new_lines.append(line[:line.find("//")] + "// Views Administrativas / Liderança (Dashboards de gestão).\n")
        continue
    elif "O CORAÇÃO DO APLICATIVO (COMPONENTE APP)" in stripped:
        new_lines.append(line[:line.find("//")] + "// Componente App: Gerenciamento principal de estado, rotas e integração com o Supabase.\n")
        skip_next = 2
        continue
    elif "EXPLICANDO: Estas são as nossas \"Ordens\"" in stripped:
        new_lines.append(line.replace("EXPLICANDO: Estas são as nossas \"Ordens\". Quando damos um comando aqui, ele vai lá na internet gravar ou apagar a informação permanentemente.", "Abstração de banco de dados para operações CRUD unificadas no Supabase."))
        continue
    elif "EXPLICANDO: Quando você abre o aplicativo pela primeira vez" in stripped:
        new_lines.append(line.replace("EXPLICANDO: Quando você abre o aplicativo pela primeira vez, nós carregamos o cenário puxando todos os dados salvos da nuvem.", "Carrega os dados iniciais do inventário e requisições ao iniciar a aplicação."))
        continue
    elif "ISTO É MÁGICA: Aqui o app fica com os \"ouvidos ligados\"" in stripped:
        new_lines.append(line[:line.find("//")] + "// Subscrição do Supabase Realtime para sincronização das tabelas instântaneamente entre os clientes.\n")
        skip_next = 2
        continue
    elif "O \"Tradutor\" para lidar com as colunas antigas" in stripped:
        new_lines.append(line.replace("O \"Tradutor\" para lidar com as colunas antigas do CSV", "Mapeamento de propriedades legadas da base para o formato da aplicação atual."))
        continue
    elif "Daqui até o final, temos as Ações que os usuários podem" in stripped:
        new_lines.append(line[:line.find("//")] + "// Manipuladores de eventos (Handlers) para ações de interface dos usuários.\n")
        skip_next = 1
        continue
    elif "Atualização Otimista: Arranca o card da tela na hora!" in stripped:
        new_lines.append(line.replace("Atualização Otimista: Arranca o card da tela na hora!", "Atualização otimista do estado local para resposta imediata na UI."))
        continue
    elif "Atualização Otimista\n" in line:
        new_lines.append(line.replace("Atualização Otimista", "Atualização otimista do estado local para resposta imediata na UI."))
        continue
    elif "Descobre o que o pedido realmente exige" in stripped:
        new_lines.append(line.replace("Descobre o que o pedido realmente exige para podermos comparar", "Extrai e normaliza os tipos de equipamento requeridos para validação estrutural."))
        continue
    elif "Trava 1: TAG repetida no mesmo formulário" in stripped:
        new_lines.append(line.replace("Trava 1: TAG repetida no mesmo formulário", "Validação de Segurança: Impede a inserção de TAG idêntica em múltiplas posições."))
        continue
    elif "Trava 2: O tipo da máquina bate com o que foi pedido?" in stripped:
        new_lines.append(line.replace("Trava 2: O tipo da máquina bate com o que foi pedido?", "Validação de Segurança: Assegura correspondência exata entre equipamento escaneado e requisito."))
        continue
    elif "VERIFICAÇÃO DE SEGURANÇA: Se o ID for null" in stripped:
        new_lines.append(line.replace("VERIFICAÇÃO DE SEGURANÇA: Se o ID for null, o banco vai dar erro 400", "Validação de integridade: Garante a presença do ID para evitar falha na requisição ao banco (HTTP 400)."))
        continue
    
    new_lines.append(line)

with open("c:\\Users\\jesus.cavalcante\\Desktop\\CEIC_App\\index.html", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
print("done")
