// Miniature "attract mode" previews for the games shelf. Each card on the
// home page is styled like a small arcade cabinet: a dark screen (dark in
// both themes — screens are dark) showing real material from that game.

function CabinetScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid h-[150px] place-items-center overflow-hidden rounded-[16px] border border-[#2b2b30] bg-[#0b0b0e] transition-colors duration-300 group-hover:border-[#ff4b4d]/60">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,75,77,.13) 1px, transparent 1px), linear-gradient(90deg, rgba(255,75,77,.13) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      />
      <div className="relative">{children}</div>
      <div className="hero-scanline" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_36px_rgba(0,0,0,.7)]" />
    </div>
  )
}

function MiniHeart({ full }: { full: boolean }) {
  return (
    <svg viewBox="0 0 24 22" className="size-3" aria-hidden="true">
      <path
        d="M12 21 3.6 12.6a5.7 5.7 0 0 1 0-8.1 5.7 5.7 0 0 1 8.1 0l.3.3.3-.3a5.7 5.7 0 0 1 8.1 8.1Z"
        fill={full ? '#ff4b4d' : 'transparent'}
        stroke="#ff4b4d"
        strokeWidth="2"
        opacity={full ? 1 : 0.5}
      />
    </svg>
  )
}

export function SudokuPreview() {
  // 4x4 sample: white = givens, red = the player's entries.
  const cells: (string | { v: string; red?: boolean })[] = [
    '5', '', { v: '2', red: true }, '',
    '', '7', '', '1',
    '3', '', { v: '9', red: true }, '',
    '', { v: '4', red: true }, '', '8',
  ]
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="grid grid-cols-4 overflow-hidden rounded-md border border-white/25 bg-[#151518]">
        {cells.map((cell, i) => {
          const value = typeof cell === 'string' ? cell : cell.v
          const red = typeof cell === 'object' && cell.red
          return (
            <span key={i} className={`grid size-6 place-items-center border-[0.5px] border-white/10 font-mono text-[11px] font-bold ${red ? 'text-[#ff4b4d]' : 'text-white/85'}`}>
              {value}
            </span>
          )
        })}
      </div>
      <div className="flex gap-1"><MiniHeart full /><MiniHeart full /><MiniHeart full={false} /></div>
    </div>
  )
}

export function Preview2048() {
  const tiles = [
    { v: '2', bg: '#efe5db', color: '#776e65' },
    { v: '8', bg: '#f2b179', color: '#ffffff' },
    { v: '128', bg: '#edcf72', color: '#ffffff' },
    { v: '2048', bg: '#ff4b4d', color: '#ffffff' },
  ]
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {tiles.map((tile) => (
        <span key={tile.v} className="grid size-11 place-items-center rounded-md font-display text-xs font-bold" style={{ background: tile.bg, color: tile.color }}>
          {tile.v}
        </span>
      ))}
    </div>
  )
}

export function MemoryPreview() {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      <span className="grid size-11 place-items-center rounded-md border border-[#ff4b4d] bg-[#ff4b4d]/15 text-lg">🦈</span>
      <span className="grid size-11 place-items-center rounded-md border border-white/20 bg-[#1d1d21] font-display text-[10px] font-bold text-white/45">SG</span>
      <span className="grid size-11 place-items-center rounded-md border border-white/20 bg-[#1d1d21] font-display text-[10px] font-bold text-white/45">SG</span>
      <span className="grid size-11 place-items-center rounded-md border border-[#ff4b4d] bg-[#ff4b4d]/15 text-lg">🦈</span>
    </div>
  )
}

export function MinesweeperPreview() {
  // '' hidden · '.' revealed empty · digits colored · F flag · M mine
  const cells = [
    '1', '', 'F', '',
    '2', '3', '', '',
    '.', '1', 'M', '',
    '', '', '1', '.',
  ]
  const colors: Record<string, string> = { '1': '#38bdf8', '2': '#4ade80', '3': '#ff4b4d' }
  return (
    <div className="grid grid-cols-4 gap-[3px]">
      {cells.map((cell, i) => {
        if (cell === '') return <span key={i} className="size-6 rounded-[4px] border border-white/15 bg-[#1d1d21]" />
        if (cell === 'F') return <span key={i} className="grid size-6 place-items-center rounded-[4px] border border-white/15 bg-[#1d1d21] text-[10px]">🚩</span>
        if (cell === 'M') return <span key={i} className="grid size-6 place-items-center rounded-[4px] bg-[#ff4b4d]/50 text-[10px]">💣</span>
        return (
          <span key={i} className="grid size-6 place-items-center rounded-[4px] bg-white/10 font-mono text-[11px] font-bold" style={{ color: colors[cell] ?? 'transparent' }}>
            {cell === '.' ? '' : cell}
          </span>
        )
      })}
    </div>
  )
}

export function DurakPreview() {
  return (
    <div className="relative h-[76px] w-[92px]">
      <span className="absolute left-0 top-2 flex h-[64px] w-[46px] -rotate-12 flex-col items-center justify-center border-2 border-[#242321] bg-white font-display text-[11px] font-bold leading-none">
        <span className="text-[#242321]">A</span>
        <span className="text-base text-[#242321]">♠</span>
      </span>
      <span className="absolute left-10 top-0 flex h-[64px] w-[46px] rotate-12 flex-col items-center justify-center border-2 border-[#242321] bg-white font-display text-[11px] font-bold leading-none">
        <span className="text-[#e93131]">7</span>
        <span className="text-base text-[#e93131]">♥</span>
      </span>
    </div>
  )
}

export function TetrisPreview() {
  // A tiny well: settled rows with a T piece dropping in.
  const cells: (string | null)[] = [
    null, null, '#c084fc', null, null, null,
    null, '#c084fc', '#c084fc', '#c084fc', null, null,
    null, null, null, null, null, null,
    '#38bdf8', '#38bdf8', null, '#4ade80', '#facc15', '#facc15',
    '#38bdf8', '#38bdf8', '#ff4b4d', '#4ade80', '#facc15', '#facc15',
  ]
  return (
    <div className="grid grid-cols-6 gap-[2px] border-2 border-white/20 bg-[#151518] p-1">
      {cells.map((color, i) => (
        <span key={i} className="size-4" style={{ background: color ?? 'transparent', boxShadow: color ? 'inset -1px -1px 0 rgba(0,0,0,.4), inset 1px 1px 0 rgba(255,255,255,.25)' : undefined }} />
      ))}
    </div>
  )
}

export function ChessPreview() {
  // 4x4 corner of a board: white king+queen facing a black knight.
  const squares = [
    { p: '♞', c: '#17171a' }, null, { p: '♟', c: '#17171a' }, null,
    null, { p: '♙', c: '#fff' }, null, null,
    { p: '♕', c: '#fff' }, null, { p: '♔', c: '#fff' }, null,
    null, null, null, { p: '♗', c: '#fff' },
  ]
  return (
    <div className="grid grid-cols-4 overflow-hidden border-2 border-white/25">
      {squares.map((cell, i) => {
        const row = Math.floor(i / 4)
        const dark = (row + i) % 2 === 1
        return (
          <span key={i} className="grid size-8 place-items-center text-lg leading-none" style={{ background: dark ? '#9c4f53' : '#efe5db', color: cell?.c, textShadow: cell?.c === '#fff' ? '0 1px 1px rgba(0,0,0,.6)' : undefined }}>
            {cell?.p}
          </span>
        )
      })}
    </div>
  )
}

export default CabinetScreen
