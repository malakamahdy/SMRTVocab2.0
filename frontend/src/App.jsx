import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import MenuPage from './pages/MenuPage'
import ChoicePage from './pages/ChoicePage'
import TextPage from './pages/TextPage'
import ReviewPage from './pages/ReviewPage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'
import AboutPage from './pages/AboutPage'
import GuidedReadingModePage from './pages/GuidedReadingModePage'
import ShortStoryPage from './pages/ShortStoryPage'
import TopicalPassagePage from './pages/TopicalPassagePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/choice" element={<ChoicePage />} />
      <Route path="/text" element={<TextPage />} />
      <Route path="/review" element={<ReviewPage />} />
      <Route path="/guided-reading" element={<GuidedReadingModePage />} />
      <Route path="/guided-reading/short-story" element={<ShortStoryPage />} />
      <Route path="/guided-reading/topical-passage" element={<TopicalPassagePage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  )
}

export default App


