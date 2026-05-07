interface ProgressBarProps {
  concluidas: number
  total: number
  percentual: number
}

export const ProgressBar = ({ concluidas, total, percentual }: ProgressBarProps) => {
  return (
    <div className="progress">
      <div className="progress-header">
        <span className="progress-label">Progresso geral</span>
        <div className="progress-stats" data-testid="progress-stats">
          {concluidas}
          <span>/{total} tarefas</span>
        </div>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          data-testid="progress-fill"
          style={{ width: `${percentual}%` }}
        />
      </div>
    </div>
  )
}
