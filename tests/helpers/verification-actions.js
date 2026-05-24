export async function loginAs(page, users, profile) {
  const user = users.find(u => u.perfil === profile);
  await page.goto('/');
  await page.getByTestId('login-input').fill(user.login);
  await page.getByTestId('password-input').fill(user.senha);
  await page.getByTestId('login-submit').click();
  await page.waitForTimeout(1000);
}

export async function logout(page) {
  const logoutBtn = page.getByTestId('logout-button');
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForTimeout(1000);
  }
}

export async function fillRequestData(page) {
  await page.getByTestId('request-requester-name').fill('VERIFICACAO CEIC');
  await page.getByTestId('request-requester-badge').fill('VERIF001');
  await page.getByTestId('request-extension').fill('9999');
  await page.getByTestId('request-patient-mv').fill('MV-VERIF');
  await page.getByTestId('request-patient-name').fill('PACIENTE VERIFICACAO');
  await page.getByTestId('request-patient-bed').fill('98');
}