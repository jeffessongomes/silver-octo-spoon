# Spec: Importacao de Painel via JSON (admin-import-painel)

**Branch:** `feat/checklist-obs-redesign`
**Data:** 2026-05-09
**Status:** Aguardando aprovacao

---

## Objetivo

Permitir que o admin importe um painel completo (fases, tarefas, materiais e observacoes) para um cliente via um formulario JSON na pagina do painel. O backend deve criar tudo atomicamente numa unica transacao, eliminando a necessidade de criar fases/tarefas uma a uma.

---

## Modelo de Dados

### Payload de importacao (enviado pelo frontend ao backend)

```typescript
interface ImportarPainelPayload {
  fases: ImportarFaseInput[]
}

interface ImportarFaseInput {
  numero?: string        // opcional, auto-gerado se ausente (sequencial)
  titulo: string         // obrigatorio, min 3 chars
  resumo?: string        // opcional, default ""
  tipo?: 'extra'         // opcional
  tarefas?: ImportarTarefaInput[]
  materiais?: ImportarMaterialInput[]
}

interface ImportarTarefaInput {
  texto: string          // obrigatorio, min 1 char
  observacao?: string    // opcional, cria registro em observacoes se presente
}

interface ImportarMaterialInput {
  nome: string           // obrigatorio
  tipo: 'PDF' | 'PNG' | 'DOC' | 'XLS' | 'LINK' | 'VIDEO'  // obrigatorio
  url: string            // obrigatorio
}
```

### Resposta do backend

```typescript
interface ImportarPainelResponse {
  importado: number      // quantidade de fases criadas
  fases: FaseAPI[]       // fases criadas com IDs gerados
}
```

### Tipos TypeScript frontend (novos)

```typescript
// src/features/panel/types.ts (adicionar)
export interface ImportarFaseInput {
  numero?: string
  titulo: string
  resumo?: string
  tipo?: FaseTipo
  tarefas?: { texto: string; observacao?: string }[]
  materiais?: { nome: string; tipo: MaterialTipo; url: string }[]
}

export interface ImportarPainelInput {
  fases: ImportarFaseInput[]
}

export interface ImportarPainelResponse {
  importado: number
  fases: FaseAPI[]
}

// Preview calculado no frontend antes de enviar
export interface ImportarPainelPreview {
  totalFases: number
  totalTarefas: number
  totalObservacoes: number
  totalMateriais: number
  fases: { titulo: string; tarefas: number; observacoes: number; materiais: number }[]
}
```

---

## Regras de Negocio

1. **Somente admin**: o formulario de importacao e visivel apenas quando `isAdmin === true`.
2. **Atomicidade**: se qualquer fase/tarefa/observacao falhar, toda a transacao e revertida (nenhuma fase parcial e criada).
3. **Numero de fase**: se `numero` nao for informado, o backend calcula como `String(fasesExistentes.length + i + 1)` para cada fase importada.
4. **Observacao**: criada via `ObservacaoRepository.upsertObservacao()` logo apos a tarefa ser inserida, dentro da mesma transacao.
5. **Validacao frontend**: antes de enviar, o frontend valida o JSON e exibe erros. O backend tambem valida e rejeita com 400 se invalido.
6. **Fases existentes nao sao sobrescritas**: a importacao apenas adiciona novas fases ao cliente; nao altera as fases existentes.
7. **Titulo obrigatorio**: toda fase importada deve ter `titulo` com minimo de 3 caracteres.
8. **Texto de tarefa obrigatorio**: toda tarefa importada deve ter `texto` com minimo de 1 caractere.
9. **Importacao vazia proibida**: `fases` deve ter ao menos 1 item.

---

## Criterios de Aceite

**Dado** que o admin esta na pagina de painel de um cliente  
**E** o modo admin esta ativo  
**Quando** o admin acessa a secao de importacao  
**Entao** deve ver um textarea com placeholder explicativo e um preview vazio

---

**Dado** que o admin colou um JSON valido no textarea  
**Quando** o JSON e parseado com sucesso  
**Entao** o preview deve exibir contagem de fases, tarefas, observacoes e materiais  
**E** o botao "Confirmar Importacao" deve ser habilitado

---

**Dado** que o preview esta visivel e correto  
**Quando** o admin clica em "Confirmar Importacao"  
**Entao** o botao deve ficar em estado loading ("Importando...")  
**E** ao concluir, o painel deve ser recarregado com as novas fases  
**E** um toast de sucesso deve ser exibido

---

**Dado** que o admin colou um JSON com sintaxe invalida  
**Quando** tenta qualquer interacao  
**Entao** deve ver mensagem de erro de parsing inline no formulario  
**E** o preview nao deve aparecer

---

**Dado** que o JSON esta estruturalmente invalido (ex: `fases` ausente, titulo vazio)  
**Quando** o JSON e parseado  
**Entao** deve ver lista de erros de validacao inline  
**E** o botao deve permanecer desabilitado

---

**Dado** que o backend retorna erro na importacao  
**Quando** a requisicao falha  
**Entao** deve ver mensagem de erro no formulario  
**E** o estado do painel nao deve mudar (nenhuma fase foi criada)

---

## Edge Cases

1. **JSON vazio `{}`**: exibe erro "Campo `fases` e obrigatorio".
2. **`fases: []`**: exibe erro "A importacao deve ter ao menos 1 fase".
3. **Fase sem `titulo`**: erro de validacao indica qual fase (por indice) esta com problema.
4. **Tarefa sem `texto`**: erro de validacao indica fase e indice da tarefa com problema.
5. **`tipo` invalido**: erro de validacao ("tipo deve ser 'extra' ou omitido").
6. **`MaterialTipo` invalido**: erro de validacao com valor recebido.
7. **JSON muito grande**: backend retorna 413 se payload > 512KB (limite de Express).
8. **Textarea em branco**: botao desabilitado, sem preview.
9. **Importacao apos fases existentes**: numeros de fase sao sequenciais a partir das fases ja existentes do cliente.
10. **Observacao vazia string `""`**: ignorada (nao cria registro em observacoes). Apenas strings com ao menos 1 caractere nao-whitespace criam observacao.

---

## UI

### Estados do formulario de importacao

| Estado | Descricao |
|---|---|
| **idle** | Textarea vazio. Preview nao exibido. Botao desabilitado. |
| **json-invalido** | Textarea com JSON sintaticamente invalido. Mensagem de erro de parsing. Botao desabilitado. |
| **validacao-erro** | JSON valido mas estruturalmente invalido. Lista de erros inline. Botao desabilitado. |
| **pronto** | JSON valido e estrutura correta. Preview visivel. Botao habilitado. |
| **enviando** | POST em andamento. Botao com texto "Importando..." e desabilitado. |
| **sucesso** | Toast exibido. Fases recarregadas. Textarea limpo. |
| **erro-api** | Mensagem de erro do backend exibida inline. |

### Layout do formulario (Opcao C)

```
[ Importar Painel via JSON ]

Textarea (monospace, altura ~200px):
  placeholder: 'Cole o JSON aqui. Exemplo: {"fases": [{"titulo": "Briefing", ...}]}'

[Erro de parsing / validacao — exibido abaixo do textarea]

Preview (visivel apenas quando JSON valido):
  "3 fases | 12 tarefas | 5 observacoes | 2 materiais"
  > Fase 1: Briefing (4 tarefas, 1 observacao)
  > Fase 2: Criacao (5 tarefas, 3 observacoes)
  > Fase 3: Entrega (3 tarefas, 1 observacao, 2 materiais)

[ Confirmar Importacao ]   <- habilitado somente quando pronto
```

### Posicao no Painel

Logo apos a secao "Nova fase" existente, dentro do bloco `{isAdmin && ...}`.

### data-testids

| Elemento | testid |
|---|---|
| Secao de importacao | `section-import-painel` |
| Textarea JSON | `input-import-json` |
| Mensagem de erro de parsing | `msg-import-json-error` |
| Container de preview | `preview-import-painel` |
| Botao confirmar | `btn-confirm-import` |

---

## Arquitetura

### Arquivos a criar

| Arquivo | Descricao |
|---|---|
| `src/features/panel/components/ImportarPainelForm.tsx` | Componente do formulario (textarea + preview + botao) |
| `src/features/panel/hooks/useImportarPainelAPI.ts` | Hook com logica de POST e estado |
| `src/features/panel/hooks/useImportarPainelAPI.test.ts` | Testes do hook |
| `src/features/panel/components/ImportarPainelForm.test.tsx` | Testes do componente |
| `backend/src/services/ImportarPainelService.ts` | Service que valida e orquestra insercao atomica |
| `backend/src/controllers/ImportarPainelController.ts` | Controller HTTP |

### Arquivos a modificar

| Arquivo | Mudanca |
|---|---|
| `src/features/panel/Painel.tsx` | Adicionar `<ImportarPainelForm>` na secao admin |
| `src/features/panel/types.ts` | Adicionar `ImportarFaseInput`, `ImportarPainelInput`, `ImportarPainelResponse`, `ImportarPainelPreview` |
| `backend/src/repositories/FaseRepository.ts` | Estender `createFaseWithTarefas` para aceitar observacoes por tarefa |
| `backend/src/routes/index.ts` | Registrar rota `POST /clientes/:clienteId/painel/importar` |

### Endpoint do backend

```
POST /api/clientes/:clienteId/painel/importar
Authorization: authClienteMiddleware (mesma auth das outras rotas)
Content-Type: application/json
Body: ImportarPainelPayload
Response 201: ImportarPainelResponse
Response 400: { error: string, detalhes?: string[] }
Response 404: { error: "Cliente nao encontrado" }
```

### Extensao de `FaseRepository.createFaseWithTarefas`

Adicionar campo `observacao?: string` em `CreateTarefaDTO`:

```typescript
export interface CreateTarefaDTO {
  texto: string
  observacao?: string  // novo campo opcional
}
```

Dentro da transacao, apos `INSERT INTO tarefas`, inserir em `observacoes` se `observacao` for string nao vazia.

### `ImportarPainelService`

```typescript
class ImportarPainelService {
  async importarPainel(
    clienteId: string,
    payload: ImportarPainelPayload
  ): Promise<ImportarPainelResponse>
}
```

Logica:
1. Verificar cliente existe (reusar `ClienteRepository.getCliente`)
2. Calcular proximo numero de fase (count das fases existentes)
3. Para cada `ImportarFaseInput`, montar `CreateFaseDTO` com tarefas e materiais
4. Chamar `faseRepo.createFaseWithTarefas()` (estendido) em sequencia
5. Retornar `{ importado: count, fases: [...] }`

### Hook `useImportarPainelAPI`

```typescript
interface UseImportarPainelAPIReturn {
  importar: (payload: ImportarPainelInput) => Promise<void>
  submitting: boolean
  error: string | null
}
```

Faz `POST /api/clientes/{clienteId}/painel/importar` e chama callback de sucesso.

### Componente `ImportarPainelForm`

Props:
```typescript
interface ImportarPainelFormProps {
  clienteId: string
  onSuccess: () => void  // callback para recarregar fases
}
```

Logica interna:
- Estado local: `jsonInput: string`, `parseError: string | null`, `validationErrors: string[]`, `preview: ImportarPainelPreview | null`
- `useEffect` ou `useMemo` para parsear e validar o JSON em tempo real sempre que `jsonInput` mudar
- Usa `useImportarPainelAPI` para envio
- Ao sucesso: limpa textarea, chama `onSuccess()`

---

## Dependencias de Infraestrutura

Nenhuma dependencia de infraestrutura identificada. Nao requer novas variaveis de ambiente, bibliotecas externas ou configuracoes de build.

---

## Estrategia de Testes

### Hook `useImportarPainelAPI`

- POST com sucesso: retorna response e chama callback
- POST com erro de rede: `error` populado, `submitting` falso
- POST com 400 do backend: `error` com mensagem do backend

### Componente `ImportarPainelForm`

| Cenario | Tipo |
|---|---|
| Textarea vazio — botao desabilitado | unit |
| JSON invalido — exibe erro de parsing | unit |
| JSON valido mas sem `fases` — erro de validacao | unit |
| JSON valido com 2 fases — preview exibido corretamente | unit |
| Clique em confirmar — estado "enviando" | unit |
| Sucesso — textarea limpo, callback chamado | integration |
| Erro da API — mensagem de erro exibida | integration |
| Recuperacao apos erro (retry) | integration |

### Backend `ImportarPainelService`

- Payload valido: cria todas as fases, tarefas, materiais e observacoes
- Fase sem tarefas: criada corretamente
- Tarefa com observacao: observacao criada em `observacoes`
- Tarefa com observacao vazia string: observacao nao criada
- Cliente inexistente: lanca `NotFoundError`
- Falha na transacao: nenhuma fase criada (rollback verificado)
- Numero de fase auto-calculado sequencialmente

### Cobertura de estados de UI (4 estados)

| Estado | Validado |
|---|---|
| idle (textarea vazio) | sim |
| validacao-erro | sim |
| pronto (preview) | sim |
| enviando (loading) | sim |
| sucesso | sim |
| erro-api | sim |

---

## Fora de Escopo

- Atualizar/sobrescrever fases existentes via importacao
- Importar via upload de arquivo `.json` (pode ser adicionado em sprint futuro)
- Validacao de duplicidade de numeros de fase
- Preview interativo com expansao de cada fase
- Importacao em lote de multiplos clientes
- Reversao (undo) de importacao
- Autenticacao adicional alem do `authClienteMiddleware` existente
