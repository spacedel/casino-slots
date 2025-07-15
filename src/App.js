import { useState } from 'react';
import { shuffle } from 'lodash';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
// import '../src/assets/sounds/spin.mp3'
// import '../src/assets/sounds/prize.mp3'

const SYMBOLS = ['🍒', '🍋', '🍉', '🔔', '⭐', '7️⃣', '💎'];
const REEL_COUNT = 5;
const VISIBLE_SYMBOLS = 3;
const INITIAL_BALANCE = 1000;

// const spinSound = new Audio('../src/assets/sounds/spin.mp3');
// const winSound = new Audio('../src/assets/sounds/prize.mp3');

const PAYOUTS = {
  '🍒': {3: 1, 4: 3, 5: 5},       // Reduced payouts for common symbols
  '🍋': {3: 1, 4: 3, 5: 5},
  '🍉': {3: 2, 4: 4, 5: 8},
  '🔔': {3: 3, 4: 6, 5: 12},
  '⭐': {3: 5, 4: 15, 5: 30},      // Increased payouts for rarer symbols
  '7️⃣': {3: 10, 4: 25, 5: 75},
  '💎': {3: 50, 4: 150, 5: 500}   // Wild symbol with massive payouts
};

const SlotMachine = () => {
  const [reels, setReels] = useState(
    Array(REEL_COUNT).fill().map(() => 
      Array(VISIBLE_SYMBOLS * 3).fill().map(() => 
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      )
    )
  );
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState('');
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [winAmount, setWinAmount] = useState(0);
  const [wager, setWager] = useState(1.00);

  // useEffect(() => {
  //   spinSound.load();
  //   winSound.load();
    
  //   return () => {
  //     // Cleanup
  //     spinSound.pause();
  //     winSound.pause();
  //   };
  // }, []);

  const spinReels = () => {
    if (balance < wager) {
      setResult('Insufficient Balance!');
      return;
    }
    
    setBalance(prev => prev - wager);
    setSpinning(true);
    setResult('');
    setWinAmount(0);

    // Play spin sound
    // spinSound.currentTime = 0;
    // spinSound.play();

    const finalReels = Array(REEL_COUNT).fill().map(() => {
      const weightedSymbols = [];
      // More extreme weighting for higher volatility
      SYMBOLS.forEach((symbol, i) => {
        // Higher index symbols get much lower weight
        const weight = Math.max(1, Math.floor((SYMBOLS.length - i) / 2));
        for (let j = 0; j < weight; j++) {
          weightedSymbols.push(symbol);
        }
      });
      
      // Add some extra wilds to increase potential big wins
      if (Math.random() > 0.8) {
        weightedSymbols.push('💎', '💎');
      }
      
      return shuffle(weightedSymbols).slice(0, VISIBLE_SYMBOLS);
    });

    // Faster spin animation for more excitement
    const spinDurations = [150, 300, 450, 600, 750];
    
    finalReels.forEach((_, i) => {
      setTimeout(() => {
        setReels(prev => {
          const newReels = [...prev];
          newReels[i] = [...finalReels[i], ...finalReels[i], ...finalReels[i]];
          return newReels;
        });
        
        if (i === REEL_COUNT - 1) {
          setTimeout(() => {
            setSpinning(false);
            checkWin(finalReels);
          }, 200);
        }
      }, spinDurations[i]);
    });
  };

  const checkWin = (finalReels) => {
    const paylines = [
      finalReels.map(reel => reel[1]),
      finalReels.map(reel => reel[0]),
      finalReels.map(reel => reel[2]),
      finalReels.map((reel, i) => reel[i % VISIBLE_SYMBOLS]),
      finalReels.map((reel, i) => reel[(VISIBLE_SYMBOLS - 1 - (i % VISIBLE_SYMBOLS))])
    ];

    let totalWin = 0;
    
    paylines.forEach(line => {
      const isWild = (sym) => sym === '💎';
      let currentSymbol = line[0];
      let count = 1;
      
      for (let i = 1; i < line.length; i++) {
        if (line[i] === currentSymbol || isWild(line[i])) {
          count++;
        } else if (isWild(currentSymbol)) {
          currentSymbol = line[i];
          count++;
        } else {
          if (count >= 3) {
            totalWin += (PAYOUTS[currentSymbol]?.[count] || 0) * wager;
          }
          currentSymbol = line[i];
          count = 1;
        }
      }
      
      if (count >= 3) {
        totalWin += (PAYOUTS[currentSymbol]?.[count] || 0) * wager;
      }
    });

    if (totalWin > 0) {
      setWinAmount(totalWin);
      setBalance(prev => prev + totalWin);
      setResult(`WIN: $${totalWin.toFixed(2)}`);
      // Play win sound
      // winSound.currentTime = 0;
      // winSound.play();
    } else {
      setResult('TRY AGAIN');
    }
  };

  return (
    <div className="slot-machine">
      <div className="balance-display">
        <div>CREDITS: ${balance.toFixed(2)}</div>
        <div>BET: ${wager.toFixed(2)}</div>
        {winAmount > 0 && <div className="win-amount">WIN: ${winAmount.toFixed(2)}</div>}
      </div>

      <div className="reels-container">
        <div className="reels">
          {reels.map((reel, reelIndex) => (
            <motion.div 
              key={reelIndex}
              className="reel"
              animate={spinning ? { 
                y: [0, -20, -40, -60],
                transition: {
                  duration: 2 + (reelIndex * 0.2),
                  ease: "easeOut",
                  times: [0, 0.5, 0.7, 0.9]
                }
              } : { y: 0 }}
              style={{ height: `${VISIBLE_SYMBOLS * 100}px` }}
            >
              {reel.map((symbol, symbolIndex) => (
                <motion.div
                  key={symbolIndex}
                  className={`symbol ${symbol === '💎' ? 'wild' : ''}`}
                  style={{
                    height: `${100/VISIBLE_SYMBOLS}%`,
                    top: `${(symbolIndex % VISIBLE_SYMBOLS) * (100/VISIBLE_SYMBOLS)}%`
                  }}
                  animate={{
                    scale: spinning ? [1, 1.1, 1] : 1,
                    transition: { duration: 0.5 }
                  }}
                >
                  {symbol}
                </motion.div>
              ))}
            </motion.div>
          ))}
        </div>
        
        <div className="paylines">
          <div className="payline middle"></div>
          <div className="payline top"></div>
          <div className="payline bottom"></div>
        </div>
      </div>

      <div className="wager-selector">
        <div className="quick-wagers">
          {[1.00, 5.00, 10.00, 20.00, 50.00].map(amount => (
            <button
              key={amount}
              onClick={() => setWager(amount)}
              disabled={spinning}
              className={wager === amount ? 'active' : ''}
            >
              ${amount}
            </button>
          ))}
        </div>
      </div>
      
      <motion.button 
        onClick={spinReels} 
        disabled={spinning || balance < wager}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="spin-button"
      >
        {spinning ? 'SPINNING...' : `SPIN $${wager.toFixed(2)}`}
      </motion.button>
      
      <AnimatePresence>
        {result && (
          <motion.div
            className="result-message"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {result}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function App() {
  return (
    <div className="app">
      <h1>LUCKY SLOTS</h1>
      <SlotMachine />
    </div>
  );
}

export default App;