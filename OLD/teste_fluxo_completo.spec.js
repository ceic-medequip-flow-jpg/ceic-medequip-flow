import { test, expect } from '@playwright/test';

test.describe('Teste Funcional Avançado: Ciclo de Vida do Equipamento', () => {

  // Gera uma TAG única para não conflitar com o banco de dados real
  const num = Math.floor(1000 + Math.random() * 9000); // Garante exatos 4 dígitos
  const tagTeste = `AUTO${num}`;

  test('Fluxo Completo: Criar, Solicitar, Entregar, Devolver e Limpar', async ({ page }) => {
    await page.goto('http://127.0.0.1:8081/index.html');

    // ==========================================
    // 1. ADMIN: Cadastrar Equipamento Novo
    // ==========================================
    await test.step('Admin cadastra equipamento na frota', async () => {
      await page.getByPlaceholder('Digite seu login').fill('TESTE');
      await page.getByPlaceholder('Sua senha').fill('tQ4#vB8!nZp7');
      await page.getByRole('button', { name: 'Entrar' }).click();

      await page.getByRole('button', { name: 'Gestão da Frota' }).click();
      await page.getByRole('button', { name: /Adicionar Equipamento/i }).click();

      await page.getByPlaceholder('Ex: EVEN0001').fill(tagTeste);
      await page.getByPlaceholder('Ex: Bennett 840').fill('RoboTest Pro');
      await page.getByPlaceholder('Ex: VMI').fill('MANOVACUOMETRO');

      await page.getByRole('button', { name: /Salvar Dados/i }).click();
      await expect(page.getByText(/inserido na frota/i)).toBeVisible({ timeout: 10000 });

      await page.getByRole('button', { name: /Sair/i }).click();
    });

    // ==========================================
    // 2. ASSISTENCIAL: Solicita o Equipamento
    // ==========================================
    await test.step('Assistencial solicita o equipamento', async () => {
      await page.getByPlaceholder('Digite seu login').fill('04CC');
      await page.getByPlaceholder('Sua senha').fill('4001');
      await page.getByRole('button', { name: 'Entrar' }).click();

      await page.locator('label:has-text("Nome Solicitante *") + input').fill('Robô Solicitante');
      await page.locator('label:has-text("Matrícula *") + input').fill('11111');
      await page.locator('label:has-text("Ramal *") + input').fill('2222');

      await page.getByPlaceholder('Ex: MV458512').fill('MV123456');
      await page.locator('label:has-text("Nome do Paciente *") + input').fill('Paciente Auto');
      await page.getByPlaceholder('Ex: 05').fill('10');

      await page.getByText(/Selecione a categoria/i).click();
      await page.getByText(/Equipamentos Gerais/i).click();

      await page.getByText(/Buscar e selecionar equipamento/i).click();
      await page.getByPlaceholder('Digite para buscar...').pressSequentially('MANO', { delay: 100 });
      await page.waitForTimeout(500); // Aguarda o React renderizar o Dropdown
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');

      await page.waitForTimeout(500); // Garante que o estado do React atualizou antes de confirmar
      await page.getByRole('button', { name: /Confirmar Solicitação/i }).click();
      await expect(page.getByText(/Solicitação enviada com sucesso/i)).toBeVisible();

      await page.getByRole('button', { name: /Sair/i }).click();
    });

    // ==========================================
    // 3. OPERACIONAL: Atende o pedido e entrega
    // ==========================================
    await test.step('Operacional aprova e vincula a TAG', async () => {
      // Força a recarga da página para garantir que o Supabase entregue o equipamento recém-criado
      // e o novo pedido, evitando falhas de "Nenhum item encontrado" caso o Realtime atrase.
      await page.reload();
      await page.getByPlaceholder('Digite seu login').fill('EQUIPE_OPERACIONAL');
      await page.getByPlaceholder('Sua senha').fill('oP9!wK3@jRz5');
      await page.getByRole('button', { name: 'Entrar' }).click();

      // Acha o card do pedido recém-criado
      const pedidoCard = page.locator('.border-b.border-gray-100', { hasText: /MANOVACUOMETRO/i }).first();
      
      await pedidoCard.getByText(/Buscar e selecionar TAG/i).click();
      await page.getByPlaceholder('Digite para buscar...').pressSequentially(tagTeste);
      await page.waitForTimeout(500); // Aguarda o React renderizar o Dropdown
      await page.getByText(new RegExp(tagTeste, 'i')).last().click({ force: true });

      await page.screenshot({ path: 'erro-transporte.png' });
      await pedidoCard.locator('button:has-text("Confirmar")').click({ force: true });
      await expect(page.getByText(new RegExp(`Equipamento ${tagTeste} vinculado com sucesso`, 'i'))).toBeVisible();
    });

    // ==========================================
    // 4. OPERACIONAL: Recebe de volta e Limpa
    // ==========================================
    await test.step('Operacional faz triagem e expurgo', async () => {
      await page.getByRole('button', { name: 'Triagem / Devolução' }).click();
      await page.getByText(/Pesquisar TAG/i).click();
      await page.getByPlaceholder('Digite para buscar...').pressSequentially(tagTeste);
      await page.waitForTimeout(500); // Aguarda o React renderizar o Dropdown
      await page.getByText(new RegExp(tagTeste, 'i')).last().click({ force: true });
      await page.getByRole('button', { name: /Avançar para Triagem/i }).click();
      
      // SIM (Acessórios) e NÃO (Defeito)
      await page.locator('button', { hasText: /^SIM$/ }).click();
      await page.locator('button', { hasText: 'NÃO Vai para Higienização' }).click();
      await page.getByRole('button', { name: /Confirmar Check-in/i }).click();
      
      // Expurgo
      await page.getByRole('button', { name: 'Expurgo / Limpeza' }).click();
      await page.getByPlaceholder('Buscar por TAG').fill(tagTeste);
      await page.getByRole('button', { name: /Liberar Item/i }).click();
      await page.getByRole('button', { name: /Sair/i }).click();
    });

    // ==========================================
    // 5. ADMIN: Limpa a base (Deleta TAG)
    // ==========================================
    await test.step('Admin exclui o equipamento de teste', async () => {
      await page.getByPlaceholder('Digite seu login').fill('TESTE');
      await page.getByPlaceholder('Sua senha').fill('tQ4#vB8!nZp7');
      await page.getByRole('button', { name: 'Entrar' }).click();
      
      await page.getByRole('button', { name: 'Gestão da Frota' }).click();
      await page.getByPlaceholder('Buscar por TAG').fill(tagTeste);

      // Aceita o alerta de exclusão do navegador automaticamente
      page.once('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: /Remover da Frota/i }).click();
      await expect(page.getByText(/removido da frota/i)).toBeVisible({ timeout: 10000 });
    });
  });
});