---
name: proj-spec
description: Gera especificacao tecnica a partir de uma descricao de ticket/feature. Para todos.
argument-hint: <ticket-id-ou-slug>
---

# Proj Spec -- Gerador de Especificacao Tecnica

Gera uma especificacao tecnica estruturada a partir de uma descricao de ticket/feature, enriquecida com analise do codebase.

## IMPORTANT

Esta skill e um orquestrador. Coleta contexto da descricao do ticket + codebase, propoe abordagens, gera a spec.

Nao gera codigo. Nao cria branch. Nao implementa.

## Language

Always respond in Portuguese (pt-BR).

## Phase 0 -- Preflight (automatico)

Rodar `proj-preflight` (mentalmente):
1. Verificar branch atual. Se em branch protegida (`main`, `master`, `develop`), alertar e perguntar se deseja criar feature branch a partir de `main`.
2. Verificar `node_modules/` instalado.

A spec descreve o que sera implementado -- a feature branch deve existir antes ou ser criada agora.

Convencao de branch: `feat/[ticket-id]-[descricao-curta]`, `fix/[ticket-id]-[descricao]`, etc.

## Phase 1 -- Coleta de Contexto

**1.1 Obter descricao do ticket**

Ticket ID = $ARGUMENTS (numerico ou slug).

Procurar em:
1. `docs/tickets/[ticket-id].md` (preferencial)
2. Se nao existir, perguntar ao usuario: "Cole aqui a descricao do ticket (titulo, contexto, criterios de aceite)."

**1.2 Validar campos minimos**

A descricao deve ter:
- Titulo
- Contexto / Problema
- Criterios de Aceite
- Fora de Escopo (opcional)
- Dependencias (opcional)

Para cada campo ausente, avisar e seguir.

**1.3 Explorar codebase**

Identificar:
- Quais arquivos serao tocados?
- Existe padrao similar ja implementado? (componente parecido, hook similar)
- Quais features/dominios estao envolvidos?
- Existem dependencias externas (libs nao instaladas)?

**1.4 Identificar dependencias de infraestrutura**

Se a feature exige:
- Variaveis de ambiente novas (`VITE_*`)
- Bibliotecas a instalar (TanStack Query, React Hook Form, Zod, etc.)
- Servicos externos (APIs, terceiros)
- Configuracao de build/CI

Registrar para incluir na spec.

## Phase 2 -- Geracao da Spec

Com o contexto da Phase 1, propor 2-3 abordagens tecnicas com trade-offs. O usuario escolhe uma.

A spec deve incluir TODAS as secoes abaixo, mesmo que o ticket seja sparse. Onde o ticket nao detalha, derive da exploracao do codebase. Nunca pule uma secao.

- **Objetivo** (o que e por que)
- **Modelo de dados** (entidades, tipos TypeScript, relacionamentos)
- **Regras de negocio** (logica, validacoes, restricoes)
- **Criterios de Aceite** (formato Dado/Quando/Entao)
- **Edge cases** (secao explicita com cenarios numerados)
- **UI** (estados visuais, comportamentos, componentes)
- **Arquitetura** (arquivos a criar/modificar, componentes, hooks, services)
- **Dependencias de infraestrutura** (variaveis de ambiente, libs a instalar; usar tabela. Se nenhuma: "Nenhuma dependencia de infraestrutura identificada.")
- **Estrategia de testes** (unit, integration, e2e -- quais cenarios cobrir; ver `.claude/rules/react-testing.md`)
- **Fora de escopo** (exclusoes explicitas)

## Phase 3 -- Salvar e Revisar

Salvar a spec em: `docs/specs/[ticket-id]-spec.md`

Apresentar:
> "Spec gerada em `docs/specs/[ticket-id]-spec.md`. Revise. Quando estiver satisfeito, esta spec sera o contrato para implementar usando /proj-impl."

## What this skill does NOT do

- Nao gera codigo
- Nao gera plano de implementacao (e o /proj-impl)
- Nao expande escopo alem do ticket
- Nao bloqueia em campos faltantes -- avisa e segue
