import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ChessPage from './pages/Chess'
import Durak from './pages/Durak'
import FourInARow from './pages/FourInARow'
import Game2048 from './pages/Game2048'
import Home from './pages/Home'
import Cookies from './pages/legal/Cookies'
import Imprint from './pages/legal/Imprint'
import Privacy from './pages/legal/Privacy'
import Memory from './pages/Memory'
import Minesweeper from './pages/Minesweeper'
import Sudoku from './pages/Sudoku'
import Tetris from './pages/Tetris'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/sudoku" element={<Sudoku />} />
        <Route path="/2048" element={<Game2048 />} />
        <Route path="/memory" element={<Memory />} />
        <Route path="/minesweeper" element={<Minesweeper />} />
        <Route path="/durak" element={<Durak />} />
        <Route path="/tetris" element={<Tetris />} />
        <Route path="/chess" element={<ChessPage />} />
        <Route path="/four-in-a-row" element={<FourInARow />} />
        <Route path="/imprint" element={<Imprint />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/cookies" element={<Cookies />} />
      </Route>
    </Routes>
  )
}
