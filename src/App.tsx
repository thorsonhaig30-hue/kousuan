import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Award, 
  Clock, 
  Zap, 
  Trophy, 
  ChevronRight, 
  Check, 
  X, 
  Star, 
  Smile, 
  AlertCircle, 
  HelpCircle,
  TrendingUp,
  Flame
} from 'lucide-react';
import { generateQuestionSet, Question, QuestionType } from './utils/mathGenerator';
import { playClickSound, playCorrectSound, playWrongSound, playVictorySound } from './utils/audio';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  emoji: string;
}

const PARTICLE_COLORS = [
  'bg-[#FFB7B2]', // Macaron Pink
  'bg-[#FFDAC1]', // Macaron Orange
  'bg-[#E2F0D9]', // Macaron Green
  'bg-[#D9E1F2]', // Macaron Blue
  'bg-[#FFF2CC]', // Macaron Yellow
  'bg-[#F3CCFF]', // Macaron Purple
];

const FRUIT_EMOJIS = ['🍓', '🍬', '🍩', '🍌', '🍒', '🍪', '🍨', '🍿', '🧁', '⭐'];

export default function App() {
  // Game States
  const [gameState, setGameState] = useState<'welcome' | 'playing' | 'completed'>('welcome');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  
  // Scoring & Stats
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [score, setScore] = useState(0); // number of questions answered correctly on the very first try
  const [wrongAttempts, setWrongAttempts] = useState<Record<number, number>>({}); // tracks mistakes per question index
  const [mistakeFreeQuestionsCount, setMistakeFreeQuestionsCount] = useState(0);

  // Time & Animation
  const [timeStarted, setTimeStarted] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isCorrectAnimating, setIsCorrectAnimating] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [confetti, setConfetti] = useState<Particle[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // sound wrappers
  const triggerSound = (type: 'click' | 'correct' | 'wrong' | 'victory') => {
    if (!isSoundEnabled) return;
    try {
      if (type === 'click') playClickSound();
      if (type === 'correct') playCorrectSound();
      if (type === 'wrong') playWrongSound();
      if (type === 'victory') playVictorySound();
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  };

  // Start a fresh challenge of 20 randomized questions
  const startChallenge = () => {
    triggerSound('click');
    const questionList = generateQuestionSet();
    setQuestions(questionList);
    setCurrentIndex(0);
    setSelectedAnswers([]);
    setStreak(0);
    setMaxStreak(0);
    setScore(0);
    setWrongAttempts({});
    setMistakeFreeQuestionsCount(0);
    setElapsedTime(0);
    setGameState('playing');
    setTimeStarted(Date.now());
  };

  // Restart to Welcome screen
  const gotoWelcome = () => {
    triggerSound('click');
    setGameState('welcome');
  };

  // Keep track of time spent during playing
  useEffect(() => {
    if (gameState === 'playing' && timeStarted !== null) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - timeStarted) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeStarted]);

  // Create a beautiful splash of confetti on correct answer
  const spawnConfetti = () => {
    const newConfetti: Particle[] = [];
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 140 + 40;
      newConfetti.push({
        id: Date.now() + i + Math.random(),
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 20,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        size: Math.random() * 12 + 8,
        emoji: FRUIT_EMOJIS[Math.floor(Math.random() * FRUIT_EMOJIS.length)]
      });
    }
    setConfetti(newConfetti);
    // Clear confetti after animation
    setTimeout(() => {
      setConfetti([]);
    }, 1200);
  };

  // Handle option click
  const handleSelectOption = (option: number) => {
    if (isCorrectAnimating) return; // ignore clicks during correct transition

    const currentQuestion = questions[currentIndex];
    const isCorrect = option === currentQuestion.answer;

    if (isCorrect) {
      // Correct!
      triggerSound('correct');
      spawnConfetti();
      setIsCorrectAnimating(true);

      const hasPreviousMistakes = (wrongAttempts[currentIndex] || 0) > 0;
      
      // Update score and streaks
      if (!hasPreviousMistakes) {
        setScore(prev => prev + 1);
        setStreak(prev => {
          const next = prev + 1;
          if (next > maxStreak) setMaxStreak(next);
          return next;
        });
        setMistakeFreeQuestionsCount(prev => prev + 1);
      } else {
        setStreak(0); // reset streak if they made mistakes before guessing correctly
      }

      // Progress automatically to next question after 1000ms
      setTimeout(() => {
        setIsCorrectAnimating(false);
        setSelectedAnswers([]);
        
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          // Finished the entire set!
          triggerSound('victory');
          setGameState('completed');
        }
      }, 1100);

    } else {
      // Incorrect!
      triggerSound('wrong');
      setShakeTrigger(prev => prev + 1);
      setStreak(0); // Break current streak

      // Mark option as selected wrong
      if (!selectedAnswers.includes(option)) {
        setSelectedAnswers(prev => [...prev, option]);
        setWrongAttempts(prev => ({
          ...prev,
          [currentIndex]: (prev[currentIndex] || 0) + 1
        }));
      }
    }
  };

  // Progress helper for rendering macaron candy trail
  const getProgressStyles = (idx: number) => {
    if (idx === currentIndex) {
      return 'bg-amber-400 scale-125 ring-4 ring-amber-200 border-2 border-white shadow-md animate-bounce';
    }
    if (idx < currentIndex) {
      // check if answered with 0 mistakes
      const attempts = wrongAttempts[idx] || 0;
      if (attempts === 0) {
        return 'bg-[#C5E1A5] border-2 border-white shadow-sm flex items-center justify-center text-[10px] text-[#33691E] font-bold';
      } else {
        return 'bg-[#FFCC80] border-2 border-white shadow-sm flex items-center justify-center text-[10px] text-[#E65100] font-bold';
      }
    }
    return 'bg-[#E0E0E0] opacity-60';
  };

  const getMacaronLabelColor = (type: QuestionType) => {
    switch (type) {
      case 'add': return { bg: 'bg-[#FFECEF]', text: 'text-[#FF6B8B]', border: 'border-[#FFD1DA]', name: '加减法 ➕' };
      case 'sub': return { bg: 'bg-[#E6F3FF]', text: 'text-[#4A90E2]', border: 'border-[#C2E0FF]', name: '趣味减法 ➖' };
      case 'mul': return { bg: 'bg-[#FFF9E6]', text: 'text-[#FFA100]', border: 'border-[#FFE8A3]', name: '乘法口诀 ✖️' };
      case 'div': return { bg: 'bg-[#EBFBF5]', text: 'text-[#10B981]', border: 'border-[#A3F3D5]', name: '高能除法 ➗' };
    }
  };

  // Format elapsed seconds to mm:ss
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`;
  };

  // Render Star score based on mistakes free count
  const renderCompletionStars = (scoreCount: number) => {
    let starCount = 1;
    let message = '加油练习，你一定行！💪';
    
    if (scoreCount === 20) {
      starCount = 3;
      message = '👑 满分小天才！口算之神！🍓';
    } else if (scoreCount >= 16) {
      starCount = 3;
      message = '🌟 超级棒！对题如流，太厉害啦！🧁';
    } else if (scoreCount >= 10) {
      starCount = 2;
      message = '✨ 表现很赞！继续加油，冲击满分！🍿';
    }
    
    return { starCount, message };
  };

  return (
    <div id="math-trainer-container" className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#E8F5E9] to-[#EBF3FE] flex flex-col justify-between p-4 md:p-6 select-none relative overflow-hidden">
      
      {/* Dynamic Ambient Background Sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          animate={{ y: [0, -25, 0], x: [0, 15, 0], rotate: [0, 360] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-24 h-24 bg-[#FFD1DA]/30 rounded-full blur-xl"
        />
        <motion.div 
          animate={{ y: [0, 30, 0], x: [0, -20, 0], rotate: [360, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-10 w-32 h-32 bg-[#C2E0FF]/30 rounded-full blur-xl"
        />
        <motion.div 
          animate={{ y: [0, -20, 0], x: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-2/3 w-28 h-28 bg-[#FFF9E6]/40 rounded-full blur-lg"
        />
        <motion.p
          animate={{ scale: [1, 1.1, 1], rotate: [-5, 5, -5] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-24 right-20 text-4xl opacity-10"
        >
          🧁
        </motion.p>
        <motion.p
          animate={{ scale: [1, 1.15, 1], rotate: [5, -5, 5] }}
          transition={{ duration: 9, repeat: Infinity }}
          className="absolute bottom-32 left-16 text-5xl opacity-10"
        >
          🍦
        </motion.p>
      </div>

      {/* --- TOP HEADER NAVIGATION --- */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between bg-white/70 backdrop-blur-md px-5 py-3 rounded-2xl border-2 border-pink-100/50 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 10 }}
            className="w-10 h-10 bg-[#FFECEF] rounded-full flex items-center justify-center border border-pink-200"
          >
            <span className="text-xl">🍓</span>
          </motion.div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-800 tracking-tight flex items-center gap-1.5 font-sans">
              甜心马卡龙 <span className="text-[#FF6B8B]">口算屋</span>
            </h1>
            <p className="text-xs text-gray-500 font-medium hidden sm:block">适合10岁儿童的趣味数学练习</p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <motion.button
            id="audio-toggle-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsSoundEnabled(!isSoundEnabled);
              triggerSound('click');
            }}
            className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
              isSoundEnabled 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                : 'bg-rose-50 text-rose-400 border-rose-100 hover:bg-rose-100'
            }`}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4 md:w-5 md:h-5" /> : <VolumeX className="w-4 h-4 md:w-5 md:h-5" />}
          </motion.button>

          {/* Reset button only in play */}
          {gameState === 'playing' && (
            <motion.button
              id="reset-challenge-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={gotoWelcome}
              className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs md:text-sm text-gray-600 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>返回</span>
            </motion.button>
          )}
        </div>
      </header>

      {/* --- CORE INTERFACE CONTENT AREA --- */}
      <main className="flex-1 flex items-center justify-center my-4 md:my-6 z-10 w-full max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          
          {/* 1. WELCOME SCREEN */}
          {gameState === 'welcome' && (
            <motion.div
              id="welcome-card"
              key="welcome"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="bg-white/90 backdrop-blur-md rounded-[32px] p-6 md:p-10 border-4 border-[#FFA100]/20 shadow-xl max-w-xl w-full text-center relative"
            >
              {/* Decorative badges */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#FFF3C4] border-2 border-[#FFA100] px-6 py-2 rounded-full shadow-md">
                <span className="text-sm font-bold text-amber-800 tracking-wider flex items-center gap-1.5">
                  ⭐ 欢迎光临
                </span>
              </div>

              <div className="mt-4 mb-6">
                <span className="text-6xl filter drop-shadow">🍦</span>
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold text-[#4A355A] tracking-wider leading-tight mb-3">
                跟甜心马卡龙一起挑战吧！
              </h2>
              
              <p className="text-gray-600 leading-relaxed text-sm md:text-base max-w-md mx-auto mb-8 font-medium">
                我们将进行 <span className="font-bold text-[#FF6B8B]">20道</span> 口算闯关！ 
                包含 <span className="font-bold text-[#FF6B8B]">加法、减法、乘法和除法各5道题</span>。
                答对可以解锁美味礼物，看看谁能拿到最高星级！🍦
              </p>

              {/* Instructions */}
              <div className="bg-[#E8F4F8]/80 rounded-2xl p-4 mb-8 text-left border border-sky-100/70">
                <h3 className="text-xs font-bold text-sky-700 tracking-wider uppercase mb-2">⭐ 口算规则：</h3>
                <ul className="text-xs text-sky-900 font-medium space-y-1.5 list-disc list-inside">
                  <li>所有题目结果都在 <span className="text-[#FF6B8B] font-bold">100以内</span>。</li>
                  <li>每次点击选项，选对会自动跳到下一题。</li>
                  <li>选错的话屏幕会像果冻一样「震动」提示，别气馁，可以继续选择！</li>
                  <li>一气呵成、不犯错的题目越多，通关星数越高哦！</li>
                </ul>
              </div>

              {/* Action play button */}
              <motion.button
                id="start-challenge-action-btn"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={startChallenge}
                className="w-full md:w-2/3 py-4 md:py-5 bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 hover:from-pink-500 hover:to-amber-500 text-white font-extrabold text-xl rounded-2xl shadow-lg border-b-4 border-rose-600/40 relative overflow-hidden group"
              >
                {/* Visual glow overlay */}
                <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity macaron-shimmer duration-1000" />
                <span className="flex items-center justify-center gap-2">
                  🎈 开始挑战 
                  <ChevronRight className="w-5 h-5 stroke-[3]" />
                </span>
              </motion.button>
            </motion.div>
          )}

          {/* 2. PLAYING SCREEN */}
          {gameState === 'playing' && questions.length > 0 && (
            <div key="playing" className="w-full flex flex-col gap-6 items-center">
              
              {/* Macro stats & progress candy trail */}
              <div className="w-full flex flex-col gap-3">
                <div className="flex justify-between items-center px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#8E7970] flex items-center gap-1.5 bg-white/60 px-3 py-1.5 rounded-full border border-orange-100">
                      第 {currentIndex + 1} / {questions.length} 题
                    </span>
                    {streak > 0 && (
                      <motion.span 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: [1, 1.2, 1] }}
                        className="text-xs font-black text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm border border-amber-200"
                      >
                        <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
                        连对 {streak} 题
                      </motion.span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-bold text-gray-500 flex items-center gap-1 bg-white/60 px-3 py-1.5 rounded-full border border-sky-100">
                      <Clock className="w-3.5 h-3.5 text-sky-500" />
                      <span>{formatTime(elapsedTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Candy Pins */}
                <div className="w-full bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-pink-100/40 flex items-center justify-between gap-1 overflow-x-auto min-h-[50px]">
                  {Array.from({ length: questions.length }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-6 h-6 flex-shrink-0 rounded-full transition-all duration-300 font-sans text-[10px] font-bold flex items-center justify-center ${getProgressStyles(idx)}`}
                    >
                      {idx < currentIndex ? (
                        (wrongAttempts[idx] || 0) === 0 ? <Check className="w-3 h-3 text-[#33691E]" /> : <Smile className="w-3 h-3 text-[#E65100]" />
                      ) : (
                        idx === currentIndex ? '🧁' : idx + 1
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* --- CENTRAL BIG MATHEMATICAL QUESTION CARD --- */}
              <motion.div
                id="main-question-card"
                animate={{
                  x: shakeTrigger ? [-12, 12, -10, 10, -5, 5, 0] : 0,
                  rotate: shakeTrigger ? [-1.5, 1.5, -1, 1, 0] : 0
                }}
                transition={{ type: "tween", duration: 0.4 }}
                className="w-full bg-white rounded-[36px] border-[5px] border-[#D9E1F2] shadow-2xl p-8 md:p-12 text-center relative overflow-hidden"
              >
                {/* Beautiful dynamic backgrounds */}
                {confetti.map((particle) => (
                  <motion.div
                    key={particle.id}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                    animate={{ 
                      x: particle.x, 
                      y: particle.y, 
                      scale: [1, 1.2, 0.8], 
                      opacity: [1, 1, 0],
                      rotate: [0, Math.random() * 360]
                    }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="absolute left-1/2 top-1/2 -ml-3 -mt-3 pointer-events-none z-30"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-2xl">{particle.emoji}</span>
                      <div className={`w-3.5 h-3.5 rounded-full ${particle.color} mt-1`} />
                    </div>
                  </motion.div>
                ))}

                {/* Tag describing the question type */}
                <div className="flex justify-center mb-6">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold border-2 tracking-wide shadow-sm flex items-center gap-1.5 ${getMacaronLabelColor(questions[currentIndex].type).bg} ${getMacaronLabelColor(questions[currentIndex].type).text} ${getMacaronLabelColor(questions[currentIndex].type).border}`}>
                    <span>{getMacaronLabelColor(questions[currentIndex].type).name}</span>
                  </span>
                </div>

                {/* Equation Expression */}
                <div className="relative inline-block py-6 px-10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      id="equation-text"
                      key={questions[currentIndex].id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="text-5xl md:text-7xl font-extrabold text-[#4A355A] font-sans tracking-normal leading-none select-none flex items-center justify-center gap-4"
                    >
                      <span>{questions[currentIndex].operand1}</span>
                      <span className="text-[#FF6B8B] transform scale-105 mx-1">{questions[currentIndex].operatorSymbol}</span>
                      <span>{questions[currentIndex].operand2}</span>
                      <span className="text-gray-400 mx-1">=</span>
                      <span className="text-amber-500 bg-amber-50 border-4 border-dashed border-amber-300 rounded-2xl w-20 md:w-28 h-20 md:h-24 flex items-center justify-center shadow-inner animate-pulse">
                        ?
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Awesome validation bubble popup */}
                <AnimatePresence>
                  {isCorrectAnimating && (
                    <motion.div
                      id="success-banner"
                      initial={{ opacity: 0, scale: 0.3 }}
                      animate={{ opacity: 1, scale: 1.15 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-6xl md:text-7xl mb-4"
                      >
                        🎉
                      </motion.div>
                      <h3 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-amber-500 tracking-widest animate-bounce">
                        太棒了！
                      </h3>
                      <p className="text-[#4A355A] text-sm md:text-base font-bold mt-2">
                        答得非常正确！自动为您切换到下一题...
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* --- NATIVE 4 OPTIONS CHOICE BUTTONS GRID --- */}
              <div className="w-full grid grid-cols-2 gap-4">
                {questions[currentIndex].options.map((option, index) => {
                  const isWrongSelected = selectedAnswers.includes(option);
                  
                  // Unique macaron color styling per options grid index
                  let colorClasses = '';
                  switch (index) {
                    case 0: // Pastel Pink/Strawberry
                      colorClasses = 'bg-[#FFF0F2] border-[#FFB7B2] hover:bg-[#FFE5E8] text-rose-700';
                      break;
                    case 1: // Pastel Sky Blue
                      colorClasses = 'bg-[#F2F6FC] border-[#B4C6E7] hover:bg-[#EAF0FA] text-blue-700';
                      break;
                    case 2: // Pastel Mint Green
                      colorClasses = 'bg-[#F0F9EA] border-[#C5E1A5] hover:bg-[#E6F4DC] text-emerald-800';
                      break;
                    case 3: // Pastel Lemon Yellow
                      colorClasses = 'bg-[#FFFDF0] border-[#FFE299] hover:bg-[#FFFAD6] text-amber-700';
                      break;
                  }

                  const foodIcons = ['🍇', '🥝', '🍒', '🍉'];

                  return (
                    <motion.button
                      id={`option-btn-${index}`}
                      key={option}
                      disabled={isWrongSelected || isCorrectAnimating}
                      whileHover={isWrongSelected ? {} : { scale: 1.04 }}
                      whileTap={isWrongSelected ? {} : { scale: 0.96 }}
                      onClick={() => handleSelectOption(option)}
                      className={`py-4 md:py-6 rounded-[24px] border-4 border-b-8 font-extrabold text-2xl md:text-3xl shadow-md transition-all flex flex-col sm:flex-row items-center justify-center gap-2 relative ${
                        isWrongSelected 
                          ? 'bg-gray-100/80 border-gray-300 text-gray-400 opacity-50 cursor-not-allowed line-through' 
                          : colorClasses
                      }`}
                    >
                      <span className="text-sm md:text-base opacity-75 hidden sm:block">
                        {foodIcons[index]}
                      </span>
                      <span className="font-sans font-bold leading-none">{option}</span>
                      
                      {isWrongSelected && (
                        <span className="absolute top-2 right-2 text-rose-500 font-bold bg-white w-5 h-5 rounded-full flex items-center justify-center border border-rose-300 shadow text-xs">
                          ❌
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

            </div>
          )}

          {/* 3. COMPLETED SCREEN */}
          {gameState === 'completed' && (
            <motion.div
              id="report-card"
              key="completed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white/95 backdrop-blur-md rounded-[32px] p-6 md:p-10 border-4 border-emerald-200 shadow-2xl max-w-2xl w-full text-center relative overflow-hidden"
            >
              {/* Confetti streams in final */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-pink-300 via-sky-300 to-amber-300" />
              
              {/* Star rating crown */}
              <div className="flex justify-center gap-2 mb-4 mt-2">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.2, type: "spring" }}
                  >
                    <Star 
                      className={`w-12 h-12 filter drop-shadow ${
                        idx < renderCompletionStars(score).starCount 
                          ? 'fill-amber-400 text-amber-500 animate-bounce' 
                          : 'text-gray-200 fill-gray-100'
                      }`}
                      style={{ animationDelay: `${idx * 150}ms` }}
                    />
                  </motion.div>
                ))}
              </div>

              <h2 className="text-3xl md:text-4xl font-extrabold text-[#4A355A] tracking-wider leading-none mb-2">
                闯关大成功！
              </h2>
              <p className="text-md font-bold text-[#FF6B8B] mb-8">
                {renderCompletionStars(score).message}
              </p>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#FFF0F2] border-2 border-[#FFD1DA] p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                  <span className="text-xs font-bold text-rose-500 mb-1 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> 首次答对
                  </span>
                  <span className="text-2xl font-black text-rose-700 font-sans">{score} <span className="text-xs text-rose-500">/ 20</span></span>
                </div>
                
                <div className="bg-[#E6F3FF] border-2 border-[#C2E0FF] p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                  <span className="text-xs font-bold text-sky-500 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> 总用时
                  </span>
                  <span className="text-xl font-black text-sky-700 font-sans">{elapsedTime}秒</span>
                </div>

                <div className="bg-[#FFF9E6] border-2 border-[#FFE8A3] p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                  <span className="text-xs font-bold text-amber-500 mb-1 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> 平均答题
                  </span>
                  <span className="text-xl font-black text-amber-700 font-sans">
                    {Math.max(1, Math.round((elapsedTime / 20) * 10) / 10)}秒/题
                  </span>
                </div>

                <div className="bg-[#EBFBF5] border-2 border-[#A3F3D5] p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                  <span className="text-xs font-bold text-emerald-500 mb-1 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-emerald-500" /> 最高连对
                  </span>
                  <span className="text-xl font-black text-emerald-700 font-sans">{maxStreak}题</span>
                </div>
              </div>

              {/* Subject details progress analysis */}
              <div className="bg-gray-50 rounded-2xl p-4 text-left border border-gray-100 mb-8">
                <h3 className="text-xs font-extrabold text-gray-500 tracking-wider uppercase mb-3 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> 各项口算表现分析：
                </h3>
                
                <div className="space-y-2 text-xs">
                  {/* Category Math item helpers */}
                  {[
                    { type: 'add', name: '加法运算 ➕', color: 'text-[#FF6B8B] bg-[#FFECEF] border-[#FFD1DA]' },
                    { type: 'sub', name: '减法运算 ➖', color: 'text-[#4A90E2] bg-[#E6F3FF] border-[#C2E0FF]' },
                    { type: 'mul', name: '乘法运算 ✖️', color: 'text-[#FFA100] bg-[#FFF9E6] border-[#FFE8A3]' },
                    { type: 'div', name: '除法运算 ➗', color: 'text-[#10B981] bg-[#EBFBF5] border-[#A3F3D5]' }
                  ].map((category) => {
                    // count total error attempts for this category
                    const listIdxs = questions.map((q, qidx) => q.type === category.type ? qidx : -1).filter(idx => idx !== -1);
                    const mistakesCount = listIdxs.reduce((sum, idx) => sum + (wrongAttempts[idx] || 0), 0);
                    const correctFirstTry = listIdxs.filter(idx => (wrongAttempts[idx] || 0) === 0).length;

                    return (
                      <div key={category.type} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-100 shadow-xs">
                        <span className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${category.color}`}>
                          {category.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-700">一次做对: <span className="text-emerald-500 font-extrabold">{correctFirstTry} / 5</span></span>
                          <span className="text-gray-400">|</span>
                          <span className="text-gray-500">失误: <span className={`font-bold ${mistakesCount > 0 ? 'text-rose-500' : 'text-gray-400'}`}>{mistakesCount}次</span></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  id="restart-set-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startChallenge}
                  className="px-8 py-3.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-extrabold text-lg rounded-2xl shadow-md border-b-4 border-emerald-600/30 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>再试一次</span>
                </motion.button>

                <motion.button
                  id="back-welcome-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={gotoWelcome}
                  className="px-8 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-lg rounded-2xl border-b-4 border-gray-300 shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>回到主页</span>
                </motion.button>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* --- CUTE KIDS STYLE FOOTER --- */}
      <footer className="w-full text-center py-4 bg-white/20 backdrop-blur-xs z-10 border-t border-dashed border-gray-200/50 mt-4 md:mt-6">
        <p className="text-xs text-gray-500 font-semibold tracking-wide flex items-center justify-center gap-1">
          <span>🍨 快乐口算屋 © 2026</span>
          <span className="text-gray-300">•</span>
          <span>纯净安全，无广告无任何额外收费</span>
          <span className="text-gray-300">•</span>
          <span>🍰 守护孩子专注成长 🍓</span>
        </p>
      </footer>
    </div>
  );
}
