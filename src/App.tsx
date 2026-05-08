import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import { Painel } from './features/panel/Painel'

const App = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/:clientId" element={<Painel isAdmin={false} />} />
          <Route path="/:clientId/admin" element={<Painel isAdmin={true} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
