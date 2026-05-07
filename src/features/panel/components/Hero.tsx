import { ProgressBar } from './ProgressBar'

interface HeroProps {
  totalConcluidas: number
  totalTarefas: number
  percentual: number
}

export const Hero = ({ totalConcluidas, totalTarefas, percentual }: HeroProps) => {
  return (
    <section className="hero">
      <div className="hero-eyebrow">Roadmap · 6 meses</div>
      <h1 className="hero-title">
        Da arrumação da casa à <em>escala consolidada</em>.
      </h1>
      <p className="hero-description">
        Este é seu mapa de operação. Cada fase tem tarefas, materiais e espaço pra você anotar como
        foi. Marque conforme avança. O sistema lembra de tudo.
      </p>
      <ProgressBar concluidas={totalConcluidas} total={totalTarefas} percentual={percentual} />
    </section>
  )
}
