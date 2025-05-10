import songsList from './songs.js';
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

const FinalHipsterGame = () => {
  // States
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [guessHistory, setGuessHistory] = useState([]);
  
  // ניחושי השחקן - רק שנה
  const [yearGuess, setYearGuess] = useState('');
  
  // Load songs from CSV and shuffle them
  useEffect(() => {
    const loadSongs = async () => {
      try {
        const response = await window.fs.readFile('100_songs_verified.csv', { encoding: 'utf8' });
        const result = Papa.parse(response, {
          header: true,
          skipEmptyLines: true
        });
        
        // Format songs and convert year to number
        let formattedSongs = result.data.map(song => ({
          ...song,
          Year: parseInt(song.Year, 10)
        }));
        
        // Shuffle the songs array using Fisher-Yates algorithm
        for (let i = formattedSongs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [formattedSongs[i], formattedSongs[j]] = [formattedSongs[j], formattedSongs[i]];
        }
        
        setSongs(formattedSongs);
        setLoading(false);
      } catch (err) {
        console.error("Error loading songs:", err);
        setLoading(false);
      }
    };
    
    loadSongs();
  }, []);
  
  // Start game
  const startGame = () => {
    setGameStarted(true);
    setGameFinished(false);
    setCurrentSongIndex(0);
    setTotalScore(0);
    setGuessHistory([]);
    setYearGuess('');
    setShowAnswer(false);
  };
  
  // Handle year input change
  const handleYearChange = (e) => {
    setYearGuess(e.target.value);
  };
  
  // Check guess - updated scoring system
  const checkGuess = () => {
    if (!yearGuess) return;
    
    const currentSong = songs[currentSongIndex];
    const yearGuessNum = parseInt(yearGuess, 10);
    const yearDifference = Math.abs(yearGuessNum - currentSong.Year);
    
    // New scoring system
    let points = 0;
    if (yearDifference === 0) {
      points = 10; // Perfect guess
    } else if (yearDifference <= 1) {
      points = 7; // Within 1 year
    } else if (yearDifference <= 3) {
      points = 3; // Within 3 years
    }
    // 0 points for difference > 3 years
    
    const guessResult = {
      songName: currentSong.Song,
      artist: currentSong.Artist,
      correctYear: currentSong.Year,
      guessedYear: yearGuessNum,
      points: points,
      youtubeLink: currentSong.YouTube,
      yearDifference: yearDifference
    };
    
    setGuessHistory([...guessHistory, guessResult]);
    setTotalScore(totalScore + points);
    setShowAnswer(true);
  };
  
  // Next song
  const nextSong = () => {
    if (currentSongIndex < songs.length - 1) {
      setCurrentSongIndex(currentSongIndex + 1);
      setYearGuess('');
      setShowAnswer(false);
    } else {
      // End game
      setGameFinished(true);
    }
  };
  
  // End game
  const endGame = () => {
    setGameFinished(true);
  };
  
  // Calculate success rate
  const calculateSuccessRate = () => {
    const maxPossibleScore = (guessHistory.length) * 10;
    if (maxPossibleScore === 0) return 0;
    return ((totalScore / maxPossibleScore) * 100).toFixed(1);
  };
  
  // Timeline position calculation
  const getTimelinePosition = (year) => {
    const minYear = 1960;
    const maxYear = 2025; 
    const position = ((year - minYear) / (maxYear - minYear)) * 100;
    return Math.max(0, Math.min(100, position)); // Keep between 0-100
  };
  
  // Loading screen
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-xl">טוען משחק...</div>
      </div>
    );
  }
  
  // Start screen
  if (!gameStarted) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-3xl font-bold mb-6">משחק "היפסטר בזמן"</h1>
        <div className="bg-white p-6 rounded shadow-md mb-6">
          <p className="text-xl mb-4">נחשו את השנה של השירים ומקמו אותם בציר הזמן!</p>
          <p className="mb-4">ניקוד:</p>
          <ul className="list-disc list-inside mb-6 text-right">
            <li>10 נקודות - לניחוש שנה מדויק</li>
            <li>7 נקודות - לטעות של עד שנה</li>
            <li>3 נקודות - לטעות של עד 3 שנים</li>
            <li>0 נקודות - לטעות של יותר מ-3 שנים</li>
          </ul>
          <button 
            onClick={startGame}
            className="bg-blue-600 text-white px-6 py-3 rounded text-lg hover:bg-blue-700"
          >
            התחל משחק
          </button>
        </div>
      </div>
    );
  }
  
  // Game finished screen
  if (gameFinished) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">המשחק הסתיים!</h1>
        
        <div className="bg-white p-6 rounded shadow-md mb-6">
          <div className="text-center mb-6">
            <p className="text-xl mb-2">הניקוד הסופי שלך: <span className="font-bold text-blue-600">{totalScore}</span></p>
            <p className="text-lg">
              אחוז הצלחה: 
              <span className={`ml-2 font-bold ${
                parseFloat(calculateSuccessRate()) > 70 ? 'text-green-600' : 
                parseFloat(calculateSuccessRate()) > 40 ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {calculateSuccessRate()}%
              </span>
            </p>
          </div>
          
          <h2 className="text-xl font-bold mb-4">ציר הזמן:</h2>
          <div className="relative mb-8">
            <div className="h-2 bg-gray-300 w-full mb-8"></div>
            
            {/* Year markers */}
            {[1960, 1970, 1980, 1990, 2000, 2010, 2020].map(year => (
              <div 
                key={year} 
                className="absolute -mt-5" 
                style={{ left: `${getTimelinePosition(year)}%` }}
              >
                <div className="h-4 w-1 bg-black"></div>
                <span className="text-xs -ml-3">{year}</span>
              </div>
            ))}
            
            {/* Correct song years */}
            {guessHistory.map((item, index) => (
              <div 
                key={index} 
                className="group absolute -mt-3"
                style={{ left: `${getTimelinePosition(item.correctYear)}%` }}
              >
                <div 
                  className={`w-5 h-5 rounded-full ${
                    item.points === 10 ? 'bg-green-500' : 
                    item.points === 7 ? 'bg-blue-500' : 
                    item.points === 3 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}
                  title={`${item.songName} (${item.correctYear})`}
                ></div>
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-2 -left-24 w-48 bg-black text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <p className="font-bold">{item.songName}</p>
                  <p>{item.artist}</p>
                  <p>שנה: {item.correctYear}</p>
                  <p>הניחוש שלך: {item.guessedYear} ({item.points} נקודות)</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 mb-6">
            <h3 className="font-bold mb-2">מקרא:</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                <span>ניחוש מדויק (10 נק')</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                <span>טעות של עד שנה (7 נק')</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                <span>טעות של 2-3 שנים (3 נק')</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                <span>טעות של יותר מ-3 שנים (0 נק')</span>
              </div>
            </div>
          </div>
          
          <h2 className="text-xl font-bold mb-4">היסטוריית ניחושים:</h2>
          <div className="max-h-96 overflow-y-auto">
            {guessHistory.map((item, index) => (
              <div key={index} className={`mb-3 p-3 rounded ${
                item.points === 10 ? 'bg-green-50 border-green-200 border' : 
                item.points === 7 ? 'bg-blue-50 border-blue-200 border' : 
                item.points === 3 ? 'bg-yellow-50 border-yellow-200 border' : 
                'bg-red-50 border-red-200 border'
              }`}>
                <div className="flex justify-between mb-1">
                  <span className="font-bold">{index + 1}. {item.songName}</span>
                  <span>{item.points} נקודות</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>מבצע: {item.artist}</span>
                  <span>שנה נכונה: {item.correctYear} | הניחוש שלך: {item.guessedYear}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-6">
            <button 
              onClick={startGame}
              className="bg-blue-600 text-white px-6 py-3 rounded text-lg hover:bg-blue-700"
            >
              משחק חדש
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Main game screen
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">משחק "היפסטר בזמן"</h1>
        <div className="text-xl">ניקוד: {totalScore}</div>
      </div>
      
      <div className="bg-white p-6 rounded shadow-md mb-6">
        <div className="mb-2 text-lg">שיר {currentSongIndex + 1} מתוך {songs.length}</div>
        
        <div className="mb-6">
          <div className="mb-3 text-xl font-bold">האזינו לשיר:</div>
          
          <div className="flex flex-col md:flex-row items-center gap-6 justify-center">
            {/* YouTube Link */}
            <a 
              href={songs[currentSongIndex]?.YouTube} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-red-600 text-white px-6 py-3 rounded flex items-center justify-center hover:bg-red-700"
            >
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
              </svg>
              שמע ביוטיוב
            </a>
            
            {/* QR Code with explicit URL */}
            <div className="text-center">
              <div className="text-sm mb-1">או סרוק:</div>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(songs[currentSongIndex]?.YouTube || 'https://www.youtube.com')}`}
                alt="QR Code for YouTube link"
                className="w-24 h-24 border"
                onError={(e) => {
                  // Fallback on error
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div 
                className="w-24 h-24 border bg-white hidden items-center justify-center"
                style={{ display: 'none' }}
              >
                <span className="text-xs text-gray-500">קוד QR לא זמין</span>
              </div>
            </div>
          </div>
        </div>
        
        {!showAnswer ? (
          <div className="mb-6">
            <div className="mb-3 text-xl font-bold">נחשו את השנה:</div>
            <div className="flex items-end gap-4 mb-4">
              <div className="flex-1">
                <label className="block mb-1">שנת הוצאת השיר:</label>
                <input
                  type="number"
                  value={yearGuess}
                  onChange={handleYearChange}
                  className="border p-2 w-full rounded"
                  placeholder="הזינו שנה (למשל: 1985)"
                  min="1900"
                  max="2025"
                />
              </div>
              <button 
                onClick={checkGuess}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                disabled={!yearGuess}
              >
                בדוק
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6 border p-4 rounded bg-gray-50">
            <div className="mb-3 text-xl font-bold">התשובה:</div>
            <div className="flex flex-col md:flex-row gap-6 mb-4">
              <div className="flex-1">
                <h4 className="font-bold">השיר:</h4>
                <p className="text-lg">{songs[currentSongIndex].Song}</p>
                <p className="mb-2">מבצע: {songs[currentSongIndex].Artist}</p>
                <p className="text-xl font-bold">שנה: {songs[currentSongIndex].Year}</p>
              </div>
              
              <div className="flex-1">
                <h4 className="font-bold">הניחוש שלך:</h4>
                <p className="text-xl">שנה: {yearGuess}</p>
                
                {guessHistory.length > 0 && (
                  <div className="mt-4">
                    <div className={`inline-block px-4 py-2 rounded-full ${
                      guessHistory[guessHistory.length - 1].points === 10 ? 'bg-green-500 text-white' : 
                      guessHistory[guessHistory.length - 1].points === 7 ? 'bg-blue-500 text-white' : 
                      guessHistory[guessHistory.length - 1].points === 3 ? 'bg-yellow-500 text-white' : 
                      'bg-red-500 text-white'
                    }`}>
                      {guessHistory[guessHistory.length - 1].points === 10 && "ניחוש מדויק! +10 נקודות"}
                      {guessHistory[guessHistory.length - 1].points === 7 && "כמעט! +7 נקודות"}
                      {guessHistory[guessHistory.length - 1].points === 3 && "קרוב יחסית. +3 נקודות"}
                      {guessHistory[guessHistory.length - 1].points === 0 && "לא קרוב. 0 נקודות"}
                    </div>
                    <p className="mt-2">
                      {guessHistory[guessHistory.length - 1].yearDifference === 0
                        ? "ניחוש מושלם!"
                        : `טעות של ${guessHistory[guessHistory.length - 1].yearDifference} שנים.`}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <button 
              onClick={nextSong}
              className="bg-blue-600 text-white px-6 py-2 rounded w-full hover:bg-blue-700"
            >
              {currentSongIndex < songs.length - 1 ? 'לשיר הבא' : 'סיים משחק'}
            </button>
          </div>
        )}
      </div>
      
      {/* Timeline */}
      <div className="bg-white p-6 rounded shadow-md mb-6">
        <h2 className="text-xl font-bold mb-4">ציר הזמן:</h2>
        
        <div className="relative">
          <div className="h-2 bg-gray-300 w-full mb-8"></div>
          
          {/* Year markers */}
          {[1960, 1970, 1980, 1990, 2000, 2010, 2020].map(year => (
            <div 
              key={year} 
              className="absolute -mt-5" 
              style={{ left: `${getTimelinePosition(year)}%` }}
            >
              <div className="h-4 w-1 bg-black"></div>
              <span className="text-xs -ml-3">{year}</span>
            </div>
          ))}
          
          {/* Correct song years only */}
          {guessHistory.map((item, index) => (
            <div 
              key={index} 
              className="group absolute -mt-3"
              style={{ left: `${getTimelinePosition(item.correctYear)}%` }}
            >
              <div 
                className={`w-5 h-5 rounded-full ${
                  item.points === 10 ? 'bg-green-500' : 
                  item.points === 7 ? 'bg-blue-500' : 
                  item.points === 3 ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`}
                title={`${item.songName} (${item.correctYear})`}
              ></div>
              
              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-2 -left-24 w-48 bg-black text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <p className="font-bold">{item.songName}</p>
                <p>{item.artist}</p>
                <p>שנה: {item.correctYear}</p>
                <p>הניחוש שלך: {item.guessedYear}</p>
                <p>{item.points} נקודות</p>
              </div>
            </div>
          ))}
        </div>
        
        {guessHistory.length > 0 && (
          <div className="mt-8 pt-4 border-t">
            <h3 className="font-bold mb-2">מקרא:</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                <span>ניחוש מדויק (10 נק')</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                <span>טעות של עד שנה (7 נק')</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                <span>טעות של 2-3 שנים (3 נק')</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                <span>טעות של יותר מ-3 שנים (0 נק')</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom controls */}
      <div className="flex justify-between">
        <button 
          onClick={endGame}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          סיים משחק
        </button>
        
        <div>
          <p className="text-lg">
            אחוז הצלחה: 
            <span className={`font-bold ml-1 ${
              parseFloat(calculateSuccessRate()) > 70 ? 'text-green-600' : 
              parseFloat(calculateSuccessRate()) > 40 ? 'text-yellow-600' : 
              'text-red-600'
            }`}>
              {calculateSuccessRate()}%
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinalHipsterGame;
