import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trophy, RotateCcw, Play, Pause } from 'lucide-react';

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION: Direction = 'UP';
const BASE_SPEED = 150;

const App: React.FC = () => {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(Number(localStorage.getItem('snake-highscore')) || 0);
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const generateFood = useCallback((): Point => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!snake.some(segment => segment.x === newFood!.x && segment.y === newFood!.y)) break;
    }
    return newFood;
  }, [snake]);

  const moveSnake = useCallback(() => {
    if (isGameOver || isPaused) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (direction) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setIsGameOver(true);
        return prevSnake;
      }

      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      if (newHead.x === food.x && newHead.y === food.y) {
        const newScore = score + 10;
        setScore(newScore);
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('snake-highscore', newScore.toString());
        }
        setFood(generateFood());
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, generateFood, isGameOver, isPaused, score, highScore]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsPaused(prev => !prev);
      switch (e.key) {
        case 'ArrowUp': if (direction !== 'DOWN') setDirection('UP'); break;
        case 'ArrowDown': if (direction !== 'UP') setDirection('DOWN'); break;
        case 'ArrowLeft': if (direction !== 'RIGHT') setDirection('LEFT'); break;
        case 'ArrowRight': if (direction !== 'LEFT') setDirection('RIGHT'); break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction]);

  useEffect(() => {
    const currentSpeed = Math.max(70, BASE_SPEED - Math.floor(score / 50) * 10);
    gameLoopRef.current = setInterval(moveSnake, currentSpeed);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake, score]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setIsGameOver(false);
    setIsPaused(false);
    setScore(0);
    setFood(generateFood());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white font-sans w-full p-4">
      <div className="mb-6 w-full max-w-[400px] flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-400 tracking-tighter">SNAKE.PRO</h1>
          <p className="text-slate-400 flex items-center gap-2">
            <Trophy size={16} className="text-amber-400" />
            Best: {highScore}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400 uppercase tracking-widest">Score</div>
          <div className="text-4xl font-mono font-bold text-white leading-none">{score}</div>
        </div>
      </div>

      <div 
        className="relative bg-slate-800 border-8 border-slate-700 rounded-xl shadow-2xl overflow-hidden cursor-none"
        style={{ width: GRID_SIZE * 20, height: GRID_SIZE * 20 }}
      >
        {snake.map((segment, i) => (
          <div
            key={i}
            className={`absolute rounded-sm ${i === 0 ? 'bg-emerald-400 z-10 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-emerald-600'}`}
            style={{
              width: 18,
              height: 18,
              left: segment.x * 20 + 1,
              top: segment.y * 20 + 1,
              transition: 'all 0.1s linear'
            }}
          />
        ))}

        <div
          className="absolute bg-rose-500 rounded-full animate-bounce shadow-[0_0_15px_rgba(244,63,94,0.6)]"
          style={{
            width: 14,
            height: 14,
            left: food.x * 20 + 3,
            top: food.y * 20 + 3,
          }}
        />

        {(isGameOver || isPaused) && (
          <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center backdrop-blur-sm z-20">
            {isGameOver ? (
              <>
                <h2 className="text-4xl font-black text-rose-500 mb-2">CRASHED!</h2>
                <p className="text-slate-300 mb-6">Final Score: {score}</p>
                <button 
                  onClick={resetGame}
                  className="flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-full font-bold transition-all transform hover:scale-105 active:scale-95"
                >
                  <RotateCcw size={20} />
                  TRY AGAIN
                </button>
              </>
            ) : (
              <>
                <h2 className="text-4xl font-black text-amber-400 mb-6 flex items-center gap-3 uppercase">
                  PAUSED
                </h2>
                <button 
                  onClick={() => setIsPaused(false)}
                  className="flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-full font-bold transition-all"
                >
                  <Play size={20} fill="currentColor" />
                  RESUME
                </button>
              </>
            ) }
          </div>
        )}
      </div>
      
      <div className="mt-8 grid grid-cols-2 gap-8 text-slate-500 text-xs uppercase font-semibold tracking-widest">
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-1">
            <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700">UP</kbd>
          </div>
          <div className="flex gap-1">
            <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700">LEFT</kbd>
            <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700">DOWN</kbd>
            <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700">RIGHT</kbd>
          </div>
          <span>Move Snake</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <kbd className="px-6 py-1 bg-slate-800 rounded border border-slate-700">SPACE</kbd>
          <span>Pause Game</span>
        </div>
      </div>
    </div>
  );
};

export default App;
