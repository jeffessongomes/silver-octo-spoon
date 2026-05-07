import { AgendaSemana } from './AgendaSemana'
import { Biblioteca } from './Biblioteca'

interface SidebarProps {
  agenda: readonly string[]
}

export const Sidebar = ({ agenda }: SidebarProps) => {
  return (
    <aside className="sidebar" data-testid="sidebar">
      <AgendaSemana itens={agenda} />
      <Biblioteca />
    </aside>
  )
}
