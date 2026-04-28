import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import ComparePage from './pages/ComparePage'
import CoveragePage from './pages/CoveragePage'
import LearnPage from './pages/LearnPage'
import NotFoundPage from './pages/NotFoundPage'
import RecommendPage from './pages/RecommendPage'



function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/coverage" element={<CoveragePage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="*" element={<NotFoundPage />} />
        <Route path="/recommend" element={<RecommendPage />} />
      </Routes>
    </div>
  )
}

export default App