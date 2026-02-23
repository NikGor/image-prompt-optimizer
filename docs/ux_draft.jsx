import React, { useState, useEffect, useRef } from 'react';
import { Settings, Image as ImageIcon, Sparkles, Check, Copy, RefreshCw, ChevronRight, Play, AlertCircle } from 'lucide-react';

export default function App() {
  // Состояния приложения: 0-Input, 1-PromptEdit, 2-FirstImage, 3-Processing, 4-Result
  const [step, setStep] = useState(0);
  
  // Данные проекта
  const [userInput, setUserInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('openai');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [iterations, setIterations] = useState(3);
  
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [feedback, setFeedback] = useState('');
  const [images, setImages] = useState([]); // Массив сгенерированных картинок
  
  // UI состояния
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [copied, setCopied] = useState(false);

  // Мокинг бэкенда
  const handleGeneratePrompt = () => {
    if (!userInput.trim()) return;
    setIsProcessing(true);
    setLoadingText('Анализ запроса и формирование промпта через gpt-4.1...');
    
    setTimeout(() => {
      setGeneratedPrompt(`A highly detailed, cinematic shot of ${userInput}, soft volumetric lighting, 8k resolution, masterpiece.`);
      setIsProcessing(false);
      setStep(1);
    }, 1500);
  };

  const handleGenerateFirstImage = () => {
    setIsProcessing(true);
    setLoadingText(`Генерация первого изображения через ${selectedModel}...`);
    
    setTimeout(() => {
      // Плейсхолдер первой картинки
      setImages([{
        id: 1,
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
        prompt: generatedPrompt,
        tag: 'Черновик'
      }]);
      setIsProcessing(false);
      setStep(2);
    }, 2000);
  };

  const handleStartLoop = () => {
    setIsProcessing(true);
    setStep(3);
    
    // Имитация цикла работы LLM-as-judge
    let currentIter = 1;
    const interval = setInterval(() => {
      setLoadingText(`Итерация ${currentIter} из ${iterations}: оценка gpt-5.2 и перегенерация...`);
      currentIter++;
      
      if (currentIter > iterations + 1) {
        clearInterval(interval);
        // Добавляем финальную картинку
        setImages(prev => [
          ...prev,
          {
            id: prev.length + 1,
            url: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=2574&auto=format&fit=crop',
            prompt: `${generatedPrompt} High contrast, enhanced vivid colors, perfectly aligned composition based on user feedback: ${feedback}`,
            tag: 'Финал'
          }
        ]);
        setIsProcessing(false);
        setStep(4);
        setFeedback(''); // Очищаем поле для возможных новых правок
      }
    }, 2500);
  };

  const handleContinueRefining = () => {
    if (!feedback.trim()) return;
    setIsProcessing(true);
    setStep(3);

    let currentIter = 1;
    const interval = setInterval(() => {
      setLoadingText(`Доработка результата: оценка gpt-5.2 и генерация...`);
      currentIter++;

      if (currentIter > 2) {
        clearInterval(interval);
        setImages(prev => {
          const lastImg = prev[prev.length - 1];
          return [
            ...prev,
            {
              id: prev.length + 1,
              // Новая картинка для демонстрации изменений
              url: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=2574&auto=format&fit=crop',
              prompt: `${lastImg.prompt}. Учтены новые правки: ${feedback}`,
              tag: `Доработка ${prev.length}`
            }
          ];
        });
        setIsProcessing(false);
        setStep(4);
        setFeedback('');
      }
    }, 2000);
  };

  const copyToClipboard = () => {
    const finalPrompt = images[images.length - 1]?.prompt || generatedPrompt;
    navigator.clipboard.writeText(finalPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      // Изящный fallback для iframe
      const textArea = document.createElement("textarea");
      textArea.value = finalPrompt;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const resetApp = () => {
    setStep(0);
    setUserInput('');
    setGeneratedPrompt('');
    setFeedback('');
    setImages([]);
  };

  // Компоненты UI
  const Logo = () => (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10 flex items-center justify-center rounded-full bg-gray-900 border border-gray-700 overflow-hidden shadow-[0_0_15px_rgba(138,43,226,0.5)]">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-cyan-400 opacity-20 blur-sm"></div>
        <Sparkles className="w-6 h-6 text-cyan-400 z-10" />
      </div>
      <span className="text-2xl font-bold tracking-widest text-white">
        SFUMATO
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-gray-200 font-sans selection:bg-purple-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0a0a0c]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          {step > 0 && (
             <button onClick={resetApp} className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
               <RefreshCw className="w-4 h-4" /> Новый проект
             </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Секция контента (Левая часть на десктопе) */}
          <div className="flex-1 space-y-6">
            
            {/* ШАГ 0: Ввод запроса */}
            {step === 0 && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-3xl font-bold text-white mb-2">Создать шедевр</h1>
                <p className="text-gray-400 mb-6">Опишите идею своими словами, а нейросеть Sfumato доведет её до идеала.</p>
                
                <textarea
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all resize-none min-h-[120px]"
                  placeholder="Например: киберпанк город в дождливую ночь, неоновые вывески отражаются в лужах..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                />
                
                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={handleGeneratePrompt}
                    disabled={!userInput.trim() || isProcessing}
                    className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                  >
                    {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    Создать базовый промпт
                  </button>
                </div>
              </div>
            )}

            {/* ШАГ 1: Редактирование промпта */}
            {step === 1 && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-purple-500/20 text-purple-400 text-xs font-bold px-2 py-1 rounded">Шаг 1</span>
                  <h2 className="text-xl font-bold text-white">Базовый промпт от gpt-4.1</h2>
                </div>
                <p className="text-sm text-gray-400 mb-4">Вы можете внести правки вручную или сразу приступить к генерации первого черновика.</p>
                
                <textarea
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all resize-y min-h-[150px] font-mono text-sm leading-relaxed"
                  value={generatedPrompt}
                  onChange={(e) => setGeneratedPrompt(e.target.value)}
                />
                
                <div className="mt-6 flex flex-wrap gap-4 justify-end">
                  <button 
                    onClick={handleGenerateFirstImage}
                    disabled={isProcessing}
                    className="bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-all"
                  >
                    <ImageIcon className="w-5 h-5" />
                    Сгенерировать черновик
                  </button>
                </div>
              </div>
            )}

            {/* ШАГ 2: Первая картинка и Фидбек */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-cyan-500/20 text-cyan-400 text-xs font-bold px-2 py-1 rounded">Черновик</span>
                      <h2 className="text-xl font-bold text-white">Оценка результата</h2>
                    </div>
                  </div>
                  
                  <div className="aspect-square md:aspect-video rounded-xl overflow-hidden bg-gray-950 border border-gray-800 relative group">
                    <img src={images[0]?.url} alt="Draft" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <p className="text-xs text-gray-300 font-mono line-clamp-2">{images[0]?.prompt}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(138,43,226,0.05)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full"></div>
                  
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-purple-400" />
                    Что нужно исправить?
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">Опишите, что не так. LLM-судья использует это для автоматического улучшения в цикле.</p>
                  
                  <textarea
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all resize-none min-h-[100px] mb-4 relative z-10"
                    placeholder="Цвета слишком тусклые, добавьте больше неона, уберите дерево на заднем плане..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                  
                  <div className="flex justify-end relative z-10">
                    <button 
                      onClick={handleStartLoop}
                      disabled={!feedback.trim()}
                      className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
                    >
                      <Play className="w-5 h-5" />
                      Запустить цикл Sfumato
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ШАГ 3: Обработка (Лоадер) */}
            {step === 3 && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px] animate-in fade-in zoom-in-95 duration-500">
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-t-purple-500 border-r-cyan-400 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 text-center">Работает магия</h2>
                <p className="text-gray-400 text-center font-mono text-sm max-w-md animate-pulse">
                  {loadingText}
                </p>
              </div>
            )}

            {/* ШАГ 4: Результат */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                
                {/* Финальная картинка крупно */}
                <div className="bg-gray-900/50 border border-green-500/30 rounded-2xl p-6 shadow-[0_0_40px_rgba(34,197,94,0.05)]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                        <Check className="w-3 h-3" /> Идеал достигнут
                      </span>
                    </div>
                  </div>
                  <img src={images[images.length - 1]?.url} alt="Final Result" className="w-full h-auto rounded-xl border border-gray-700 shadow-2xl" />
                </div>

                {/* Инсайты и Промпт */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 relative group">
                    <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Финальный промпт</h3>
                    <p className="text-sm text-gray-200 font-mono mb-4 pr-8 line-clamp-4 group-hover:line-clamp-none transition-all">
                      {images[images.length - 1]?.prompt}
                    </p>
                    <button 
                      onClick={copyToClipboard}
                      className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                      title="Скопировать промпт"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wider">Выводы судьи (gpt-5.2)</h3>
                    <ul className="text-sm text-gray-300 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-0.5">•</span>
                        Добавление "High contrast" решило проблему тусклых цветов.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-0.5">•</span>
                        Уточнение композиции помогло сфокусировать внимание на главном объекте.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* История (До/После) */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">История генераций</h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                    {images.map((img, idx) => (
                      <div key={idx} className="min-w-[200px] sm:min-w-[250px] snap-start relative group rounded-xl overflow-hidden border border-gray-800">
                         <img src={img.url} alt={`Version ${idx}`} className="w-full aspect-square object-cover" />
                         <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs text-white">
                           {img.tag}
                         </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* НОВЫЙ БЛОК: Доработка финального результата */}
                <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(138,43,226,0.05)]">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Нет предела совершенству
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">Если хотите что-то изменить в этом варианте, напишите правки ниже, и Sfumato доработает изображение.</p>
                  
                  <textarea
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all resize-none min-h-[100px] mb-4"
                    placeholder="Сделать освещение более драматичным, изменить цвет фона на темный..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                  
                  <div className="flex justify-end">
                    <button 
                      onClick={handleContinueRefining}
                      disabled={!feedback.trim() || isProcessing}
                      className="bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                      Отправить на доработку
                    </button>
                  </div>
                </div>

              </div>
            )}
            
          </div>

          {/* Сайдбар с настройками (Правая часть на десктопе) */}
          <div className="w-full md:w-72 shrink-0">
            <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 sticky top-24 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-800">
                <Settings className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold text-white">Параметры</h3>
              </div>
              
              <div className="space-y-6">
                {/* Выбор модели */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Нейросеть (Картинки)</label>
                  <select 
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={step > 0}
                    className="w-full bg-gray-950 border border-gray-700 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 appearance-none disabled:opacity-50"
                  >
                    <option value="openai">OpenAI (DALL-E 3)</option>
                    <option value="grok">Grok</option>
                    <option value="nanobanana">Nano Banana</option>
                  </select>
                </div>

                {/* Пропорции */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Пропорции</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['1:1', '16:9', '9:16'].map(ratio => (
                      <button
                        key={ratio}
                        disabled={step > 0}
                        onClick={() => setAspectRatio(ratio)}
                        className={`py-2 text-sm rounded-lg border transition-all disabled:opacity-50 ${
                          aspectRatio === ratio 
                            ? 'bg-purple-500/20 border-purple-500 text-white' 
                            : 'bg-gray-950 border-gray-700 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Итерации */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Макс. итераций</label>
                    <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{iterations}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    value={iterations}
                    onChange={(e) => setIterations(parseInt(e.target.value))}
                    disabled={step > 0}
                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1 px-1">
                    <span>1</span>
                    <span>5</span>
                  </div>
                </div>

                {/* Инфо-блок */}
                <div className="mt-8 p-3 bg-gray-950/50 rounded-lg border border-gray-800 text-xs text-gray-500 leading-relaxed">
                  Лингвистика промптов базируется на gpt-4.1. Оценка качества в цикле выполняется через gpt-5.2 (LLM-as-judge).
                </div>

              </div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}