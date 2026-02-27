# Documentação Técnica: App de Orçamento de Viagem (Travel Budget)

Este documento descreve a arquitetura, lógica de negócios e estrutura de dados desenvolvida para o projeto. Ele serve como base para a migração para qualquer outra linguagem ou framework.

## 1. Estrutura do Banco de Dados (Entidades e Relações)

A arquitetura foi desenhada para suportar **Multi-Tenancy** (múltiplas famílias/grupos isolados).

### Entidades Principais:

*   **Tenant (Família/Grupo):**
    *   `id` (PK)
    *   `name` (String): Nome do grupo ou família.
*   **Trip (Viagem):**
    *   `id` (PK)
    *   `tenant_id` (FK -> Tenant)
    *   `trip_name` (String): Ex: "Férias na Europa".
    *   `start_date` (Date): Data de início.
    *   `end_date` (Date): Data de fim (calculada como `start_date` + `total_days`).
    *   `total_days` (Integer): Duração em dias.
    *   `currency` (String): Sigla da moeda (BRL, USD, EUR, GBP).
*   **Person (Viajante):**
    *   `id` (PK)
    *   `tenant_id` (FK -> Tenant)
    *   `trip_id` (FK -> Trip)
    *   `name` (String): Nome do viajante.
*   **Category (Categoria de Gasto):**
    *   `id` (PK)
    *   `tenant_id` (FK -> Tenant)
    *   `trip_id` (FK -> Trip)
    *   `name` (String): Ex: "Alimentação".
    *   `budget_amount` (Numeric): Valor total destinado à categoria.
    *   `budget_type` (Enum): 'global' ou 'per_person'.
    *   `budget_details` (JSON): Mapeamento de `{ "NomeViajante": Valor }` para orçamentos individuais.
*   **Expense (Gasto Individual):**
    *   `id` (PK)
    *   `tenant_id` (FK -> Tenant)
    *   `category_id` (FK -> Category)
    *   `person_id` (FK -> Person, opcional): Quem realizou o gasto.
    *   `amount` (Numeric): Valor gasto.
    *   `date` (Date): Data do gasto.
    *   `description` (String): Descrição curta.

---

## 2. Lógica de Negócios e Cálculos

### Cálculo de Dias Restantes:
Essencial para o rateio do orçamento e metas diárias.
```python
hoje = data_atual()
# Se a viagem ainda não começou, usamos o período total
# Se já começou, usamos a diferença entre o fim e hoje
dias_restantes = (viagem.end_date - max(hoje, viagem.start_date)).days
dias_restantes = max(0, dias_restantes)
```

### Meta Diária por Categoria:
Informa quanto pode ser gasto por dia para não estourar o orçamento.
```python
meta_diaria = (categoria.budget_amount - categoria.total_gasto) / dias_restantes
```

### Orçamento "Por Pessoa":
Ao definir uma categoria como `per_person`, o sistema soma os budgets individuais definidos no `budget_details`. Os gastos vinculados a um `person_id` são subtraídos do saldo dessa categoria.

---

## 3. Fluxos de UX e Usabilidade

1.  **Dashboard de Viagem:** Visão geral com saldo total restante e "Saldo Diário Ideal" da viagem inteira.
2.  **Cards de Categoria:** Cada card exibe:
    *   Barra de progresso (Gasto vs. Orçamento).
    *   Meta diária atualizada em tempo real.
    *   Lista colapsável dos últimos gastos (com opção de editar/excluir).
3.  **Sincronização de Moeda:** Toda a interface deve formatar os valores dinamicamente com base no campo `currency` da viagem.
4.  **Edição de Viajantes:** Trocar o nome de uma pessoa deve disparar uma atualização no objeto JSON `budget_details` de todas as categorias para manter a integridade do rateio.

---

## 4. Recomendações de Segurança para a Nova Versão

*   **Autenticação Robusta:** Implementar login (o projeto atual usa um Tenant "mockado").
*   **JWT ou Sessão Segura:** Para garantir que um Tenant nunca acesse o `trip_id` de outro.
*   **Camada de Serviço (Service Layer):** Separar a lógica de cálculo (dias, metas) das rotas da API para facilitar testes unitários.
*   **Validação de Input:** Garantir que `amount` nunca seja negativo e que `start_date` seja válido.

---
**Status do Projeto Original:** Funcional com Python/Flask e Postgres (Neon.tech).
