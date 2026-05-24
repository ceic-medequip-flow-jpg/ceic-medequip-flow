# Histórico de Correções, Melhorias e Erros — CEIC App v2.0


> Documento gerado para registrar, em um só lugar, o histórico do que foi diagnosticado e alterado no **CEIC App v2.0** (arquivo único `index.html`) e no **Supabase** (tabela `pedidos`).
>
> Data de geração: 17/04/2026 23:11 (GMT-03)

---

## 1) Contexto rápido

O projeto roda como **um único arquivo HTML** contendo React/JSX no browser + Supabase, com Tailwind via CDN e Babel em tempo de execução. Isso é ótimo para prototipar/testar rápido, mas aumenta a chance de:

- “tela branca” por erros de sintaxe/duplicação de variáveis no JSX;
- avisos do navegador (Tailwind CDN e Babel in-browser) — avisos de produção, não necessariamente falhas;
- erros HTTP **400** no Supabase quando o payload enviado não bate com o schema real do banco.

---

## 2) Lista de erros relatados (baseline)

**Relatos operacionais/assistenciais** (base para testes):

- Notificação do Operacional não aparece no Assistencial em “Meus pedidos”.
- Triagem/Devolução não encontra equipamento ao digitar nome.
- Retorno de manutenção não responde / não volta para liberados.
- Entrega/Transporte não lista todos equipamentos disponíveis.
- Cancelamento não abre modal de identificação e não remove da fila.
- Estoque central não mostra “Monitor de Transporte” no filtro.
- Triagem: EVNI não lista TAGs (V60).
- Validação de TAG: EMMP0904 não aceita.
- Alerta sonoro para nova solicitação (melhoria “muito importante”).
- Assistencial: “Devolver” não dá feedback (gerais vs ventilatória).
- Devolução ventilatória deve aparecer como retirada pendente no operacional.
- Remanejamento sem modal de confirmação no destino (aceitar/recusar).
- Ventilação passiva/ativa ausente em “Ventilador pulmonar”.
- Solicitação de Transporte não aparece no Operacional.

> Observação: esta seção registra o *baseline* de bugs para testes. As correções abaixo abordam principalmente: estabilidade (tela branca), integração com banco (400) e consistência de schema.

---

## 3) Diagnósticos e correções no BANCO (Supabase)

### 3.1) Diagnóstico do schema da tabela `pedidos`

Foi extraído o metadata da tabela e identificado:

- `id` é **TEXT** e **PRIMARY KEY**.
- RLS (Row Level Security) da tabela `pedidos` está **desligado**.
- Existem colunas duplicadas com nomes em formatos diferentes, por exemplo:
  - `equipmenttype` (minúsculo, sem underscore)
  - `equipmentType` (camelCase)

Isso causou inconsistência: os pedidos recentes estavam gravando o tipo em `equipmentType`, enquanto `equipmenttype` ficava `NULL`.

### 3.2) Correção de dados históricos (backfill)

Foi executado UPDATE para preencher `equipmenttype` usando `"equipmentType"` (apenas quando `equipmenttype` estava nulo):

```sql
UPDATE pedidos
SET equipmenttype = COALESCE(equipmenttype, "equipmentType")
WHERE equipmenttype IS NULL
  AND "equipmentType" IS NOT NULL;
```

Após o backfill, a contagem mostrou todos os registros com `equipmenttype` preenchido.

### 3.3) Prevenção: trigger de sincronização entre colunas duplicadas

Para impedir que o problema volte (novos pedidos preenchendo só um dos campos), foi criada uma função `plpgsql` e um trigger **BEFORE INSERT OR UPDATE** para sincronizar:

- se chegar apenas `"equipmentType"`, preencher `equipmenttype`;
- se chegar apenas `equipmenttype`, preencher `"equipmentType"`.

> Resultado: ao inserir um pedido de teste com apenas `"equipmentType"`, o banco passou a preencher `equipmenttype` automaticamente.

---

## 4) Diagnósticos e correções no FRONT (index.html)

### 4.1) Correção de “tela branca” (Babel / redeclaração)

Aconteceu erro clássico do Babel/React: **variável redeclarada** (`soundEnabled`) quando:

- `OperatorDashboard` recebia `soundEnabled/setSoundEnabled` por props
- e também declarava `const [soundEnabled, setSoundEnabled] = useState(...)` localmente.

Correção aplicada: manter `soundEnabled/setSoundEnabled` como estado no `App` e repassar por props, removendo a redeclaração local.

### 4.2) Logs de integração Supabase (melhoria de diagnóstico)

No bloco `db.pedidos.insert/update`, foram adicionados logs úteis para localizar o motivo real do 400:

- `message`, `details`, `hint`, `code` do erro;
- `Object.keys(payload)` para saber quais campos foram enviados.

Além disso:

- `hasUndefined(payload)` foi adicionado para detectar valores `undefined` no payload.

### 4.3) Controle de “spam” no console

Foi criado o toggle:

```js
const DEBUG_LOGS = false;
```

E os `console.log` principais foram encapsulados em `if (DEBUG_LOGS) ...`.

### 4.4) Tratamento de erro nos handlers (try/catch)

Durante validação do código, foi detectado que alguns handlers ainda estavam sem `try/catch` apesar do checklist afirmar o contrário.

Foram adicionados try/catch nos handlers críticos (ex.: criação de pedido, confirmação de recebimento e solicitação de retirada), exibindo `showNotification('error', ...)` com mensagem amigável.

### 4.5) Ponto crítico: conversão de chaves (evitar underscore snake_case)

O schema do banco **não possui** colunas no padrão `snake_case` com underscore (ex.: `equipment_type`). Em vez disso, usa `equipmenttype` (minúsculo colado) e `equipmentType` (camelCase).

Portanto, conversão automática `equipmentType → equipment_type` pode gerar 400 (coluna inexistente). O recomendado é:

- converter camelCase para **minúsculo sem underscore**, ex.: `equipmentType → equipmenttype`, `fulfilledAt → fulfilledat`;
- ou, melhor ainda, **padronizar e eliminar duplicidade de colunas** no banco a médio prazo.

---

## 5) Avisos (não são erros bloqueantes)

Durante testes em Netlify e local:

- Aviso do Tailwind CDN “não usar em produção”;
- Aviso do Babel in-browser “pré-compilar para produção”;
- Em testes via `file://`, o navegador bloqueia recursos por segurança (origem única). Para rodar corretamente, usar `http://localhost` (Live Server / http-server / python http.server).

---

## 6) Checklist de verificação (o que conferir antes de passar para testes)

### Banco
- [ ] `equipmenttype` preenchido nos pedidos recentes.
- [ ] Trigger `trg_sync_equipmenttype` ativo.

### Front
- [ ] Sem redeclaração de `soundEnabled`.
- [ ] `db.pedidos.insert/update` loga detalhes do erro e keys do payload.
- [ ] `DEBUG_LOGS` desligado em produção/teste.
- [ ] Handlers críticos com try/catch e mensagens amigáveis.

---

## 7) Evidências (IDs de referência)

> Esta seção aponta os IDs de referência dos artefatos usados durante o diagnóstico.

- Metadata de colunas da tabela `pedidos` (mostrando duplicidade `equipmenttype` vs `equipmentType`): turn148search1
- RLS desativado (`pedidos,false`): turn150search2
- Primary key (`PRIMARY KEY (id)`): turn150search1
- Contagem total vs ids únicos: turn151search1
- Select mostrando `equipmenttype=null` e `equipmentType` preenchido: turn153search1
- Trecho do `index.html` com db.pedidos.convertKeysToSnake e logs: turn171search54
- Checagem automática do index.html (sound ok, try/catch faltando em alguns handlers): turn171file53

