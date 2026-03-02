# Documentação Técnica: App de Orçamento de Viagem (Travel Budget)

Este documento descreve a arquitetura, lógica de negócios e estrutura de dados atualizada para o projeto. Ele serve como base para entendimento do sistema e futuras expansões.

## 1. Estrutura do Banco de Dados (Entidades e Relações)

A arquitetura utiliza o framework NestJS com Prisma ORM, suportando isolamento de dados por usuário e viagens.

### Entidades Principais:

*   **User (Usuário):**
    *   `id` (PK), `email`, `password`, `name`.
*   **Trip (Viagem):**
    *   `id` (PK)
    *   `userId` (FK -> User)
    *   `name` (String): Ex: "Eurotrip 2026".
    *   `startDate` (Date) / `endDate` (Date).
    *   `currency` (String): Moeda base (USD, BRL, EUR, GBP).
    *   `status` (Enum): 'PLANNING', 'ACTIVE', 'COMPLETED'.
*   **Person (Viajante):**
    *   `id` (PK)
    *   `tripId` (FK -> Trip)
    *   `name` (String): Nome do participante.
*   **Category (Categoria de Orçamento):**
    *   `id` (PK)
    *   `tripId` (FK -> Trip)
    *   `name` (String): Ex: "Hospedagem".
    *   `budgetType` (Enum): 'GLOBAL' ou 'PER_PERSON'.
    *   `budgetGoal` (Numeric): Valor total da categoria.
    *   `budgetDetails` (JSON): Mapeamento de `{ "id_viajante": valor }` para metas individuais.
*   **City (Destino):**
    *   `id` (PK)
    *   `geonameId` (Integer): ID externo da API GeoNames.
    *   `name` (String), `countryName` (String).
*   **Saving (Reserva/Depósito):**
    *   Registro de dinheiro guardado antes da viagem para cada categoria.
*   **Expense (Gasto):**
    *   Gastos reais realizados durante a viagem.

---

## 2. Tecnologias e Frontend

### Core Stack:
*   **Backend:** NestJS (Node.js) + Prisma + PostgreSQL.
*   **Frontend:** Next.js (App Router) + TypeScript.
*   **Estilização:** CSS Modules com variáveis nativas (Vanilla CSS).

### Sistema de Internacionalização (i18n):
Implementado via `LanguageContext` no React, permitindo troca dinâmica entre:
*   **Português (PT)**
*   **Inglês (EN)**
*   **Espanhol (ES)**
As traduções são persistidas no `localStorage` do usuário.

### UI/UX Design:
*   **Glassmorphism:** Uso intensivo de transparências (`glass` class), `backdrop-filter` e bordas semitransparentes.
*   **Dark Theme:** Toda a interface utiliza variáveis de CSS (`--background`, `--card-bg`) para um tema escuro consistente.
*   **Tipografia Dinâmica:** Títulos com gradientes `linear-gradient` e sombras de texto (`text-shadow`) para máxima legibilidade sobre fundos complexos.

---

## 3. Lógica de Negócios e Orçamentos

### Autocomplete de Cidades:
Integração com a API **GeoNames** para busca de cidades e países em tempo real, permitindo adicionar destinos específicos ao roteiro da viagem.

### Orçamento Híbrido:
1.  **Global:** Uma meta única para a categoria (ex: "Aluguel de Carro").
2.  **Por Pessoa:** Metas individuais que somam o total da categoria. Isso permite controlar quanto cada viajante deve contribuir ou gastar (ex: "Passagens Aéreas").

### Rastreamento Financeiro (Finances):
*   **Goal vs Saved:** Comparação entre a meta estabelecida e o que já foi guardado (Savings) na fase de planejamento.
*   **Available vs Spent:** Durante a viagem (Active), o sistema calcula o saldo real disponível subtraindo os gastos das reservas.

---

## 4. Segurança e Integridade

*   **Autenticação:** JWT (JSON Web Tokens) para todas as rotas protegidas.
*   **Isolamento:** Cada consulta garante que o `userId` do token pertença à viagem ou categoria acessada.
*   **Tratamento de Longos Textos:** Nomes de participantes e cidades utilizam `text-overflow: ellipsis` para manter a integridade do layout em telas menores.

---
**Última Atualização:** Março de 2026.
