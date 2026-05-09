# Guia: Importação de Painel via JSON

## O que é

A importação via JSON permite que o admin crie todas as fases, tarefas, materiais e observações de um painel de uma só vez, em vez de adicioná-los um a um pela interface.

Útil para:
- Onboarding de novos clientes com estrutura de projeto já definida
- Duplicar um painel modelo para diferentes clientes
- Carregar templates pré-elaborados

---

## Como usar

1. Acesse a página do painel de um cliente no modo admin
2. Role até o final da página — você verá a seção **"Importar painel via JSON"**
3. Cole o JSON no campo de texto
4. Verifique o preview que aparece automaticamente (contagem de fases, tarefas, observações e materiais)
5. Clique em **"Confirmar Importação"**
6. As fases serão adicionadas ao painel do cliente

> As fases já existentes **não são alteradas**. A importação apenas adiciona novas fases.

---

## Estrutura do JSON

```json
{
  "fases": [
    {
      "numero": "01",
      "titulo": "Título da fase",
      "resumo": "Descrição resumida da fase",
      "tipo": "extra",
      "tarefas": [
        {
          "texto": "Descrição da tarefa",
          "observacao": "Nota interna sobre esta tarefa"
        }
      ],
      "materiais": [
        {
          "nome": "Nome do material",
          "tipo": "PDF",
          "url": "https://link-do-material.com"
        }
      ]
    }
  ]
}
```

### Campos da fase

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `numero` | string | Não | Rótulo da fase (ex: `"01"`, `"Fase 01 · Mês 1"`). Se omitido, gerado automaticamente em sequência. |
| `titulo` | string | **Sim** | Nome da fase. Mínimo de 3 caracteres. |
| `resumo` | string | Não | Descrição curta do que será entregue nesta fase. |
| `tipo` | `"extra"` | Não | Use `"extra"` para fases complementares. Omita para fases padrão. |
| `tarefas` | array | Não | Lista de tarefas da fase. |
| `materiais` | array | Não | Lista de materiais da fase. |

### Campos da tarefa

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `texto` | string | **Sim** | Descrição da tarefa. Mínimo de 1 caractere. |
| `observacao` | string | Não | Nota interna visível apenas no painel. Se vazia ou omitida, nenhuma observação é criada. |

### Campos do material

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `nome` | string | **Sim** | Nome de exibição do material. |
| `tipo` | string | **Sim** | Um de: `PDF`, `PNG`, `DOC`, `XLS`, `LINK`, `VIDEO` |
| `url` | string | **Sim** | Link do material. |

---

## Exemplo completo: Curso de Inglês — Professora Sarah Oliveira

Painel de acompanhamento de aulas particulares de inglês do nível intermediário (B1) ao avançado (B2).

```json
{
  "fases": [
    {
      "numero": "01",
      "titulo": "Avaliação Inicial",
      "resumo": "Diagnóstico do nível atual da aluna e definição de metas de aprendizado",
      "tarefas": [
        {
          "texto": "Aplicar teste de nivelamento oral",
          "observacao": "Aluna tem sotaque português forte, com dificuldade nas vogais curtas do inglês americano — priorizar exercícios de /ɪ/ vs /iː/ nas primeiras semanas"
        },
        {
          "texto": "Aplicar teste de nivelamento escrito"
        },
        {
          "texto": "Identificar pontos de dificuldade gramatical e vocabulário"
        },
        {
          "texto": "Definir metas de aprendizado com a aluna (prazo, objetivo)"
        },
        {
          "texto": "Apresentar cronograma do curso e metodologia"
        }
      ],
      "materiais": [
        {
          "nome": "Teste de Nivelamento B1",
          "tipo": "PDF",
          "url": "https://drive.google.com/file/nivelamento-b1"
        }
      ]
    },
    {
      "numero": "02",
      "titulo": "Fonética e Pronúncia",
      "resumo": "Trabalho focado em fonemas, ritmo e entonação do inglês americano",
      "tarefas": [
        {
          "texto": "Praticar os fonemas /θ/, /ð/ (th), /v/ e /w/"
        },
        {
          "texto": "Trabalhar ritmo e entonação de frases afirmativas, negativas e interrogativas"
        },
        {
          "texto": "Exercícios de listening com técnica de shadowing",
          "observacao": "A aluna tem preferência por músicas pop americanas — usar Taylor Swift e Olivia Rodrigo como base para os exercícios de shadowing e aumentar engajamento"
        },
        {
          "texto": "Gravar falas da aluna e revisar pronúncia com feedback comparativo"
        },
        {
          "texto": "Praticar minimal pairs (ship/sheep, live/leave, pool/pull)"
        }
      ],
      "materiais": [
        {
          "nome": "Playlist de Shadowing",
          "tipo": "LINK",
          "url": "https://open.spotify.com/playlist/shadowing-ingles"
        },
        {
          "nome": "Tabela de Fonemas IPA",
          "tipo": "PDF",
          "url": "https://drive.google.com/file/fonemas-ipa"
        }
      ]
    },
    {
      "numero": "03",
      "titulo": "Gramática Essencial",
      "resumo": "Revisão e consolidação dos tempos verbais, condicionais e estruturas avançadas",
      "tarefas": [
        {
          "texto": "Revisar tempos verbais simples: Present Simple, Past Simple e Future"
        },
        {
          "texto": "Praticar Present Perfect vs Simple Past com contextos reais"
        },
        {
          "texto": "Estudar condicionais tipo 1, 2 e 3 (If clauses)"
        },
        {
          "texto": "Trabalhar preposições de tempo e lugar e phrasal verbs comuns",
          "observacao": "A aluna confunde sistematicamente 'on time' e 'in time' — criar lista personalizada com exemplos do cotidiano dela para fixar a diferença de uso"
        },
        {
          "texto": "Aplicar simulado gramatical com correção comentada"
        }
      ],
      "materiais": [
        {
          "nome": "Lista de Phrasal Verbs Essenciais",
          "tipo": "PDF",
          "url": "https://drive.google.com/file/phrasal-verbs"
        },
        {
          "nome": "Exercícios Present Perfect",
          "tipo": "DOC",
          "url": "https://drive.google.com/file/exercicios-present-perfect"
        }
      ]
    },
    {
      "numero": "04",
      "titulo": "Conversação e Fluência",
      "resumo": "Prática oral intensiva com situações reais, debate e role plays",
      "tarefas": [
        {
          "texto": "Role play: situações do cotidiano (restaurante, aeroporto, médico)"
        },
        {
          "texto": "Debate em inglês sobre temas atuais (15 minutos)"
        },
        {
          "texto": "Apresentação oral de 5 minutos sobre um tema escolhido pela aluna",
          "observacao": "A aluna demonstra ansiedade ao apresentar para a câmera — sugerir técnica de respiração 4-7-8 antes de começar e começar com apresentações sem câmera ligada até ganhar confiança"
        },
        {
          "texto": "Praticar small talk, expressões idiomáticas e gírias americanas"
        },
        {
          "texto": "Simular entrevista de emprego em inglês com feedback detalhado"
        }
      ],
      "materiais": [
        {
          "nome": "Roteiros de Role Play",
          "tipo": "PDF",
          "url": "https://drive.google.com/file/role-play-situacoes"
        },
        {
          "nome": "Aula: Entrevistas em Inglês",
          "tipo": "VIDEO",
          "url": "https://youtube.com/watch?v=entrevista-ingles"
        }
      ]
    },
    {
      "numero": "05",
      "titulo": "Avaliação Final e Próximos Passos",
      "resumo": "Prova de proficiência, feedback consolidado e planejamento de continuidade",
      "tarefas": [
        {
          "texto": "Aplicar prova escrita final com estrutura Cambridge B2"
        },
        {
          "texto": "Realizar avaliação oral final (speaking + listening)"
        },
        {
          "texto": "Corrigir as provas e preparar relatório de desempenho",
          "observacao": "Iniciar o feedback com os pontos positivos antes das correções — a aluna é sensível a críticas diretas e o reforço positivo aumenta significativamente seu engajamento"
        },
        {
          "texto": "Apresentar certificado de conclusão do módulo B1-B2"
        },
        {
          "texto": "Definir plano de estudos para o próximo nível (C1) com metas e prazo"
        }
      ],
      "materiais": [
        {
          "nome": "Modelo de Relatório de Desempenho",
          "tipo": "DOC",
          "url": "https://drive.google.com/file/relatorio-desempenho"
        },
        {
          "nome": "Certificado de Conclusão",
          "tipo": "PDF",
          "url": "https://drive.google.com/file/certificado-b2"
        }
      ]
    }
  ]
}
```

---

## Erros comuns

| Mensagem | Causa | Solução |
|---|---|---|
| `JSON inválido: verifique a sintaxe` | O texto colado não é JSON válido | Valide o JSON em [jsonlint.com](https://jsonlint.com) antes de colar |
| `Campo fases é obrigatório` | O JSON não tem a chave `fases` | Adicione `{ "fases": [...] }` como raiz |
| `A importação deve ter ao menos 1 fase` | `fases` está vazio (`[]`) | Adicione pelo menos uma fase |
| `Fase N: título é obrigatório e deve ter ao menos 3 caracteres` | Fase sem `titulo` ou com nome muito curto | Verifique o campo `titulo` da fase indicada |
| `Fase N, Tarefa M: texto é obrigatório` | Tarefa sem campo `texto` | Verifique o campo `texto` da tarefa indicada |
| `Fase N, Material M: tipo 'X' inválido` | Tipo de material não reconhecido | Use um dos tipos válidos: `PDF`, `PNG`, `DOC`, `XLS`, `LINK`, `VIDEO` |
