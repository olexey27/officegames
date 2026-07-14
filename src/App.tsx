import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Game2048 from './pages/Game2048'
import Home from './pages/Home'
import Sudoku from './pages/Sudoku'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/sudoku" element={<Sudoku />} />
        <Route path="/2048" element={<Game2048 />} />
      </Route>
    </Routes>
  )
}
