import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Search, Loader2, AlertCircle, CheckCircle, ThumbsUp, ThumbsDown, Info, Shield, Target, Newspaper, Brain, BarChart3 } from 'lucide-react';

export default function StockAnalysisApp() {
  const [stockName, setStockName] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState(null);
  const [rateLimit, setRateLimit] = useState(null);
  const [countdown, setCountdown] = useState(0);

  React.useEffect(() => {
    checkBackendHealth();
    checkRateLimit();
  }, []);

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            checkRateLimit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://stock-backend-l55g.onrender.com';

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${API_URL}/health`);
      const data = await response.json();
      setBackendStatus(data);
    } catch (err) {
      setBackendStatus({ status: 'offline', error: err.message });
    }
  };

  const checkRateLimit = async () => {
    try {

      const response = await fetch(`${API_URL}/rate-limit`);
      const data = await response.json();
      setRateLimit(data);
      if (data.is_limited && data.seconds_remaining) {
        setCountdown(data.seconds_remaining);
      }
    } catch (err) {
      console.error('Rate limit check failed:', err);
      setRateLimit({ is_limited: false, message: 'Rate limit check unavailable' });
    }
  };




  const analyzeStock = async () => {
    if (!stockName.trim()) {
      setError('Please enter a stock name');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_name: stockName })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) await checkRateLimit();
        throw new Error(errorData.detail || 'Analysis failed');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      let errorMessage = 'Analysis error occurred. ';
      if (err.message.includes('Failed to fetch')) {
        errorMessage = '⚠️ Cannot connect to backend server. Is backend running?';
      } else if (err.message.includes('API key')) {
        errorMessage = '⚠️ API key not configured.';
      } else {
        errorMessage += err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && backendStatus?.status === 'healthy' && !rateLimit?.is_limited) {
      analyzeStock();
    }
  };

  const getRecommendationStyle = (rec) => {
    if (rec === 'BUY' || rec === 'HOLD') {
      return { color: 'text-green-400', bg: 'bg-green-500/20', icon: ThumbsUp };
    } else if (rec === 'SELL') {
      return { color: 'text-red-400', bg: 'bg-red-500/20', icon: ThumbsDown };
    }
    return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Info };
  };

  const recStyle = analysis ? getRecommendationStyle(analysis.consensus_recommendation) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <BarChart3 className="w-12 h-12 text-blue-400" />
            Smart Stock Analysis
            <TrendingUp className="w-12 h-12 text-green-400" />
          </h1>
          <p className="text-xl text-purple-200">Complete AI-Powered Analysis</p>
        </div>

        {rateLimit?.is_limited && (
          <div className="mb-6 p-6 rounded-xl backdrop-blur-lg border bg-yellow-500/10 border-yellow-400/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-400 mb-2">⏰ Rate Limit Active</h3>
                <p className="text-yellow-200 mb-3">{rateLimit.message}</p>
                {countdown > 0 && (
                  <div className="bg-yellow-500/20 rounded-lg p-4 border border-yellow-400/30">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-300 mb-2">
                        {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                  </div>
                )}
                <button onClick={checkRateLimit} className="mt-3 px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition-all text-sm">
                  🔄 Refresh Status
                </button>
              </div>
            </div>
          </div>
        )}

        {backendStatus && (
          <div className={`mb-6 p-4 rounded-xl backdrop-blur-lg border ${backendStatus.status === 'healthy' ? 'bg-green-500/10 border-green-400/30' : 'bg-red-500/10 border-red-400/30'
            }`}>
            <div className="flex items-center gap-2">
              {backendStatus.status === 'healthy' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-semibold">Backend Connected ✓</span>
                  {backendStatus.api_key_configured && (
                    <span className="text-green-300 text-sm ml-2">(API Key Configured)</span>
                  )}
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-semibold">Backend Offline</span>
                </>
              )}
            </div>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 shadow-2xl border border-white/20">
          <div className="flex gap-4">
            <input
              type="text"
              value={stockName}
              onChange={(e) => setStockName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter stock name (e.g., TCS, Apple, Tesla)"
              className="flex-1 px-6 py-4 text-lg rounded-xl bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-400"
              disabled={loading}
            />
            <button
              onClick={analyzeStock}
              disabled={loading || backendStatus?.status !== 'healthy' || rateLimit?.is_limited}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : rateLimit?.is_limited ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  Rate Limited
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Analyze
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-start gap-2 text-red-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">{error}</div>
            </div>
          )}
        </div>

        {analysis && (
          <div className="space-y-6">
            <div className={`${recStyle?.bg} backdrop-blur-lg rounded-2xl p-8 shadow-2xl border-2 ${analysis.consensus_recommendation === 'BUY' || analysis.consensus_recommendation === 'HOLD'
                ? 'border-green-400/50' : 'border-red-400/50'
              }`}>
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  {recStyle && <recStyle.icon className={`w-16 h-16 ${recStyle.color}`} />}
                  <h2 className={`text-6xl font-bold ${recStyle?.color}`}>
                    {analysis.consensus_recommendation}
                  </h2>
                </div>

                <div className="max-w-2xl mx-auto mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/70">Analysis Score</span>
                    <span className={`text-xl font-bold ${recStyle?.color}`}>
                      {analysis.consensus_confidence}/100
                    </span>
                  </div>
                  <div className="h-6 bg-white/10 rounded-full overflow-hidden border border-white/20">
                    <div
                      className={`h-full transition-all duration-1000 ${analysis.consensus_confidence >= 75 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                          analysis.consensus_confidence >= 60 ? 'bg-gradient-to-r from-yellow-500 to-green-400' :
                            analysis.consensus_confidence >= 45 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                              'bg-gradient-to-r from-red-500 to-orange-400'
                        }`}
                      style={{ width: `${analysis.consensus_confidence}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-white/50 mt-1">
                    <span>0 (Sell)</span>
                    <span>50 (Neutral)</span>
                    <span>100 (Buy)</span>
                  </div>
                </div>

                <div className={`inline-block px-6 py-3 ${recStyle?.bg} rounded-full border-2 mb-4 ${analysis.consensus_recommendation === 'BUY' || analysis.consensus_recommendation === 'HOLD'
                    ? 'border-green-400/50' : 'border-red-400/50'
                  }`}>
                  <p className={`text-xl font-bold ${recStyle?.color}`}>
                    {analysis.consensus_confidence >= 75 ? '🔥 STRONG' :
                      analysis.consensus_confidence >= 60 ? '✅ MODERATE-STRONG' :
                        analysis.consensus_confidence >= 45 ? '⚠️ MODERATE' :
                          analysis.consensus_confidence >= 30 ? '⚠️ WEAK' : '❌ STRONG CAUTION'}
                    {' '}Recommendation
                  </p>
                </div>

                <h3 className="text-3xl font-bold text-white mb-2">{analysis.stockName}</h3>
                <p className="text-2xl text-purple-200">{analysis.currentPrice}</p>
                <p className="text-sm text-white/60 mt-2">
                  📊 {analysis.consensus_confidence}% confidence
                </p>
              </div>

              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Info className="w-6 h-6" />
                  🎯 Clear Recommendation for You
                </h4>

                <div className="mb-4 p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-white/70 mb-2">📊 Score Breakdown:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Fundamentals:</span>
                      <span className="text-white font-semibold">45 points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">News Sentiment:</span>
                      <span className="text-white font-semibold">20 points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">AI Analysis:</span>
                      <span className="text-white font-semibold">20 points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Price Trends:</span>
                      <span className="text-white font-semibold">15 points</span>
                    </div>
                  </div>
                </div>

                {analysis.consensus_confidence >= 75 && analysis.consensus_recommendation === 'BUY' && (
                  <div className="space-y-2 text-white">
                    <p className="text-lg font-bold text-green-400">🚀 STRONG BUY - Excellent opportunity!</p>
                    <p className="text-sm text-white/80">• {analysis.consensus_confidence}% confidence - Very strong signal</p>
                    <p className="text-sm text-white/80">• Consider buying if you don't own it</p>
                    <p className="text-sm text-white/80">• Best for long-term investment</p>
                  </div>
                )}

                {analysis.consensus_confidence >= 60 && analysis.consensus_confidence < 75 && (
                  <div className="space-y-2 text-white">
                    <p className="text-lg font-bold text-green-400">✅ STRONG HOLD - Keep the stock</p>
                    <p className="text-sm text-white/80">• {analysis.consensus_confidence}% confidence - Good signal</p>
                    <p className="text-sm text-white/80">• If you own it, definitely hold</p>
                    <p className="text-sm text-white/80">• Don't panic sell</p>
                  </div>
                )}

                {analysis.consensus_confidence >= 45 && analysis.consensus_confidence < 60 && (
                  <div className="space-y-2 text-white">
                    <p className="text-lg font-bold text-yellow-400">⚠️ MODERATE HOLD - Decide carefully</p>
                    <p className="text-sm text-white/80">• {analysis.consensus_confidence}% confidence - Mixed signals</p>
                    <p className="text-sm text-white/80">• If you own it, you can hold but monitor closely</p>
                    <p className="text-sm text-white/80">• Look for better opportunities</p>
                  </div>
                )}

                {analysis.consensus_confidence >= 30 && analysis.consensus_confidence < 45 && (
                  <div className="space-y-2 text-white">
                    <p className="text-lg font-bold text-orange-400">⚠️ CONSIDER SELLING - Think about exit</p>
                    <p className="text-sm text-white/80">• {analysis.consensus_confidence}% confidence - Weak signals</p>
                    <p className="text-sm text-white/80">• Consider partial exit or set stop-loss</p>
                  </div>
                )}

                {analysis.consensus_confidence < 30 && (
                  <div className="space-y-2 text-white">
                    <p className="text-lg font-bold text-red-400">❌ STRONG SELL - Exit quickly</p>
                    <p className="text-sm text-white/80">• {analysis.consensus_confidence}% confidence - Very weak</p>
                    <p className="text-sm text-white/80">• Create an exit strategy as soon as possible</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-blue-400/30">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Brain className="w-7 h-7 text-blue-400" />
                📝 Summary
              </h3>
              <p className="text-lg text-white leading-relaxed">{analysis.summary || 'Analysis summary not available'}</p>
            </div>

            <div className="bg-green-500/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border-2 border-green-400/40">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <ThumbsUp className="w-10 h-10 text-green-400" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-green-400">✅ Reasons to HOLD/BUY</h3>
                  <p className="text-green-300 text-sm mt-1">Why you should keep this stock</p>
                </div>
              </div>

              {analysis.bullish_factors && analysis.bullish_factors.length > 0 && (
                <div className="space-y-3">
                  {analysis.bullish_factors.map((reason, index) => (
                    <div key={index} className="flex gap-3 bg-green-500/10 rounded-lg p-4 border border-green-400/30">
                      <span className="text-green-400 font-bold text-2xl flex-shrink-0">✓</span>
                      <p className="text-white leading-relaxed">{reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-red-500/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border-2 border-red-400/40">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-500/20 rounded-xl">
                  <ThumbsDown className="w-10 h-10 text-red-400" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-red-400">⚠️ Reasons to SELL</h3>
                  <p className="text-red-300 text-sm mt-1">Why you should consider selling this stock</p>
                </div>
              </div>

              {analysis.bearish_factors && analysis.bearish_factors.length > 0 && (
                <div className="space-y-3">
                  {analysis.bearish_factors.map((reason, index) => (
                    <div key={index} className="flex gap-3 bg-red-500/10 rounded-lg p-4 border border-red-400/30">
                      <span className="text-red-400 font-bold text-2xl flex-shrink-0">✗</span>
                      <p className="text-white leading-relaxed">{reason}</p>
                    </div>
                  ))}
                </div>
              )}

              {analysis.risk_factors && analysis.risk_factors.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-xl font-bold text-red-300 mb-3">🛡️ Risk Factors</h4>
                  <div className="space-y-3">
                    {analysis.risk_factors.map((risk, index) => (
                      <div key={index} className="flex gap-3 bg-red-500/10 rounded-lg p-4 border border-red-400/30">
                        <span className="text-red-400 font-bold text-2xl flex-shrink-0">⚠️</span>
                        <p className="text-white leading-relaxed">{risk}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {analysis.credible_news && analysis.credible_news.length > 0 && (
              <div className="bg-orange-500/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-orange-400/30">
                <h3 className="text-2xl font-bold text-orange-400 mb-4 flex items-center gap-2">
                  <Newspaper className="w-7 h-7" />
                  📰 Recent News & Updates
                </h3>
                <div className="space-y-3">
                  {analysis.credible_news.slice(0, 10).map((news, index) => (
                    <div key={index} className="flex gap-3">
                      <span className="text-orange-400 font-bold text-xl">•</span>
                      <div className="flex-1">
                        <a href={news.url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-orange-300">
                          {news.title}
                        </a>
                        <p className="text-xs text-white/50 mt-1">
                          {news.source} {news.published_at && `• ${new Date(news.published_at).toLocaleDateString('en-IN')}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Market & Fundamental Metrics Side by Side */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Market Metrics */}
              <div className="bg-blue-500/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-blue-400/30">
                <h3 className="text-xl font-bold text-blue-300 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6" />
                  📊 Market Metrics
                </h3>
                <div className="space-y-3">
                  {analysis.marketCap && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Market Cap:</span>
                      <span className="text-white font-semibold">{analysis.marketCap}</span>
                    </div>
                  )}
                  {analysis.volume && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Volume:</span>
                      <span className="text-white font-semibold">{analysis.volume}</span>
                    </div>
                  )}
                  {analysis.dayHigh && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Day High:</span>
                      <span className="text-white font-semibold">{analysis.dayHigh}</span>
                    </div>
                  )}
                  {analysis.dayLow && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Day Low:</span>
                      <span className="text-white font-semibold">{analysis.dayLow}</span>
                    </div>
                  )}
                  {analysis.week52High && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">52W High:</span>
                      <span className="text-white font-semibold">{analysis.week52High}</span>
                    </div>
                  )}
                  {analysis.week52Low && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">52W Low:</span>
                      <span className="text-white font-semibold">{analysis.week52Low}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Fundamental Metrics */}
              <div className="bg-purple-500/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-purple-400/30">
                <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                  💰 Fundamental Metrics
                </h3>
                <div className="space-y-3">
                  {analysis.peRatio && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">P/E Ratio:</span>
                      <span className="text-white font-semibold">{analysis.peRatio}</span>
                    </div>
                  )}
                  {analysis.eps && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">EPS:</span>
                      <span className="text-white font-semibold">{analysis.eps}</span>
                    </div>
                  )}
                  {analysis.roe && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">ROE:</span>
                      <span className="text-white font-semibold">{analysis.roe}</span>
                    </div>
                  )}
                  {analysis.debtToEquity && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Debt/Equity:</span>
                      <span className="text-white font-semibold">{analysis.debtToEquity}</span>
                    </div>
                  )}
                  {analysis.pegRatio && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">PEG Ratio:</span>
                      <span className="text-white font-semibold">{analysis.pegRatio}</span>
                    </div>
                  )}
                  {analysis.priceToBook && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Price/Book:</span>
                      <span className="text-white font-semibold">{analysis.priceToBook}</span>
                    </div>
                  )}
                  {analysis.dividendYield && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Dividend Yield:</span>
                      <span className="text-white font-semibold">{analysis.dividendYield}</span>
                    </div>
                  )}
                  {analysis.beta && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Beta:</span>
                      <span className="text-white font-semibold">{analysis.beta}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Data Sources Footer
            {analysis.data_sources_used && analysis.data_sources_used.length > 0 && (
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 text-center">
                <p className="text-sm text-white/60">
                  📊 Data from: {analysis.data_sources_used.join(' • ')} • API calls used: {analysis.api_calls_used || 0}
                </p>
                <p className="text-xs text-white/50 mt-1">
                  Last updated: {new Date(analysis.analysis_timestamp).toLocaleString('en-IN')}
                </p>
              </div>
            )} */}
          </div>
        )}

        <div className="mt-6 text-center text-purple-200 text-sm bg-purple-500/10 rounded-xl p-4 border border-purple-400/30">
          <p>⚠️ <strong>TRY:1 Disclaimer:</strong> This analysis is for educational purposes only.</p>
        </div>
      </div>
    </div>
  );
}