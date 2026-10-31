import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppShell from './components/shell/AppShell'
import Landing from './pages/Landing'
import Darkroom from './pages/Darkroom'
import Album from './pages/Album'
import FrameDetail from './pages/FrameDetail'
import Stats from './pages/Stats'
import SettingsPage from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<AppShell />}>
          <Route path="/darkroom" element={<Darkroom />} />
          <Route path="/album" element={<Album />} />
          <Route path="/album/:id" element={<FrameDetail />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
