import { ToastProvider } from './components/Toast'
import { Painel } from './features/panel/Painel'

const App = () => {
  return (
    <ToastProvider>
      <Painel />
    </ToastProvider>
  )
}

export default App
