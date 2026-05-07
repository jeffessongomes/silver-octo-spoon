import type { DadosPainel } from './types'

export const TAREFAS_PRE_CONCLUIDAS = [
  't0-1',
  't0-2',
  't0-3',
  't0-4',
  't0-5',
  't1-1',
  't1-2',
  't1-3',
] as const

export const FASE_INICIAL_EXPANDIDA = 'fase-1'

export const dadosPainel: DadosPainel = {
  cliente: 'estefania',
  fases: [
    {
      id: 'fase-0',
      numero: 'Fase 00',
      titulo: 'Identidade Mínima',
      resumo: 'Base da presença digital e da marca pessoal',
      status: 'done',
      tarefas: [
        { id: 't0-1', texto: 'Foto de perfil profissional no Instagram' },
        { id: 't0-2', texto: 'Brand Kit no Canva (cores, fontes, assinatura)' },
        { id: 't0-3', texto: 'Bio do Instagram atualizada' },
        { id: 't0-4', texto: 'WhatsApp Business configurado' },
        { id: 't0-5', texto: 'Primeiros posts publicados' },
      ],
      materiais: [{ nome: 'Identidade Visual completa', tipo: 'PDF', url: '' }],
    },
    {
      id: 'fase-1',
      numero: 'Fase 01 · Mês 1',
      titulo: 'Arrumar a Casa',
      resumo: 'Meta de receita: R$2.000/mês',
      status: 'active',
      tarefas: [
        { id: 't1-1', texto: '+4 alunos novos fechados (6 → 10 alunos)' },
        { id: 't1-2', texto: 'WhatsApp Business ativo' },
        { id: 't1-3', texto: 'Primeiros relatórios de progresso estruturados' },
        { id: 't1-4', texto: 'Regra de preço protegida — novos alunos a R$200' },
        { id: 't1-5', texto: 'Coletar 2-3 depoimentos dos alunos atuais' },
        { id: 't1-6', texto: 'Planilha de alunos preenchida com os 10 ativos' },
      ],
      materiais: [
        { nome: 'Política de Alunos Fundadores', tipo: 'PDF', url: '' },
        { nome: 'Planilha de Alunos', tipo: 'XLS', url: '' },
        { nome: 'Template de Relatório Mensal', tipo: 'DOC', url: '' },
      ],
    },
    {
      id: 'fase-2',
      numero: 'Fase 02 · Mês 2',
      titulo: 'Ativar Indicação',
      resumo: 'Meta: 12-14 alunos · R$2.400-R$2.800/mês',
      status: 'pending',
      tarefas: [
        { id: 't2-1', texto: 'Script de indicação enviado pra pais atuais' },
        { id: 't2-2', texto: 'Conversa com diretor da escola' },
        { id: 't2-3', texto: 'Conversa com Ivana (mesma abordagem)' },
        { id: 't2-4', texto: 'Primeiro relatório de progresso enviado a todos os pais' },
        { id: 't2-5', texto: '2 posts por semana no Instagram' },
        { id: 't2-6', texto: '1 story por dia (bastidor ou dica rápida)' },
      ],
      materiais: [
        { nome: 'Scripts de Abordagem', tipo: 'PDF', url: '' },
        { nome: 'Script de Follow-up', tipo: 'PDF', url: '' },
      ],
    },
    {
      id: 'fase-extra-cartoes',
      tipo: 'extra',
      numero: 'Ação extra',
      titulo: 'Cartões pros pais',
      resumo: 'Encantamento e fortalecimento de vínculo',
      status: 'pending',
      tarefas: [
        { id: 'tex-1', texto: 'Ler o script e adaptar a mensagem pro tom dela' },
        { id: 'tex-2', texto: 'Imprimir os cartões (gráfica ou em casa)' },
        { id: 'tex-3', texto: 'Escrever à mão o nome de cada aluno e a mensagem' },
        { id: 'tex-4', texto: 'Entregar pessoalmente na próxima aula' },
        { id: 'tex-5', texto: 'Anotar reação dos pais que mais engajaram' },
      ],
      materiais: [
        { nome: 'Script da mensagem do cartão', tipo: 'PDF', url: '' },
        { nome: 'Arte do cartão para impressão', tipo: 'PNG', url: '' },
      ],
    },
    {
      id: 'fase-3',
      numero: 'Fase 03 · Mês 3',
      titulo: 'Conteúdo que Converte',
      resumo: 'Meta: 15 alunos · R$3.000/mês',
      status: 'pending',
      tarefas: [
        { id: 't3-1', texto: 'Primeiro Reel publicado (câmera parada, simples)' },
        { id: 't3-2', texto: '2-3 depoimentos em vídeo ou áudio coletados' },
        { id: 't3-3', texto: 'Posts de prova social publicados' },
        { id: 't3-4', texto: 'Calendário editorial do mês definido' },
        { id: 't3-5', texto: 'Script de DM refinado com aprendizados do mês 2' },
      ],
      materiais: [{ nome: 'Calendário Editorial Mês 1', tipo: 'PDF', url: '' }],
    },
    {
      id: 'fase-4',
      numero: 'Fase 04 · Meses 4 a 6',
      titulo: 'Escalar o que Funciona',
      resumo: 'Meta: 30-40 alunos · R$6.000-R$8.000/mês',
      status: 'pending',
      tarefas: [
        { id: 't4-1', texto: 'Avaliação de KPIs: qual canal trouxe mais alunos?' },
        { id: 't4-2', texto: 'Abertura de nova turma quando necessário' },
        { id: 't4-3', texto: 'ENEM intensivo ativado (agosto-novembro)' },
        { id: 't4-4', texto: 'Decisão informada sobre tráfego pago' },
      ],
      materiais: [{ nome: 'Estrutura de Turmas', tipo: 'PDF', url: '' }],
    },
  ],
  biblioteca: [
    { nome: 'Roadmap completo', tipo: 'DOC', url: '' },
    { nome: 'Identidade Visual', tipo: 'PDF', url: '' },
    { nome: 'Estrutura de Turmas', tipo: 'PDF', url: '' },
    { nome: 'Calendário Editorial', tipo: 'PDF', url: '' },
    { nome: 'Scripts de Abordagem', tipo: 'PDF', url: '' },
    { nome: 'Script de Follow-up', tipo: 'PDF', url: '' },
    { nome: 'Política de Preço', tipo: 'PDF', url: '' },
    { nome: 'Planilha de Alunos', tipo: 'XLS', url: '' },
    { nome: 'Template Relatório Mensal', tipo: 'DOC', url: '' },
  ],
}

export const AGENDA_SEMANA = [
  'Preencher a planilha de alunos com os 10 ativos',
  'Registrar os 3 alunos fundadores como exceção privada',
  'Mandar relatório de progresso pra todos os pais',
] as const

export const HEADER_INFO = {
  brand: 'Azilab',
  brandSubtitle: 'Painel de Operação',
  date: 'Atualizado em 28 de abril, 2026',
  client: 'Estefânia · Reforço de Inglês',
} as const
