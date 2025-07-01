import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MapPin, TrendingUp, Users, Target } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  location_type: 'store' | 'competitor' | 'poi';
  address?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  analysis?: {
    locations?: Location[];
    recommendations?: string[];
    metrics?: { [key: string]: number };
  };
}

interface AIAnalysisChatProps {
  project: Project;
  locations: Location[];
  onLocationHighlight?: (locationIds: string[]) => void;
  onRecommendationSelect?: (recommendation: any) => void;
}

const AIAnalysisChat: React.FC<AIAnalysisChatProps> = ({
  project,
  locations,
  onLocationHighlight,
  onRecommendationSelect
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: '👋 Hi! I\'m your AI trade area analyst. I can help you analyze your locations, find optimal sites, assess competition, and provide strategic recommendations. Try asking me something like:\n\n• "Analyze the competition around my stores"\n• "Find the best location for a new coffee shop"\n• "What areas have high foot traffic but low competition?"\n• "Calculate market penetration for this area"',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simulate AI analysis (in real implementation, this would call OpenAI API)
  const analyzeQuery = async (query: string): Promise<string> => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    const lowerQuery = query.toLowerCase();
    
    // Competition analysis
    if (lowerQuery.includes('competition') || lowerQuery.includes('competitor')) {
      const competitors = locations.filter(loc => loc.location_type === 'competitor');
      const stores = locations.filter(loc => loc.location_type === 'store');
      
      return `📊 **Competition Analysis Results:**

**Current Situation:**
• You have ${stores.length} store(s) and face ${competitors.length} competitor location(s)
• Average distance between your stores and competitors: ${(Math.random() * 2 + 0.5).toFixed(1)} km
• Competition density: ${competitors.length > stores.length ? 'HIGH' : competitors.length === stores.length ? 'MEDIUM' : 'LOW'}

**Key Insights:**
• ${competitors.length > 3 ? 'Market is highly saturated' : 'Moderate competition levels'}
• ${Math.floor(Math.random() * 40 + 60)}% market share opportunity in underserved areas
• Recommended strategy: ${competitors.length > stores.length ? 'Focus on differentiation and customer retention' : 'Consider expansion in low-competition zones'}

**Next Steps:**
1. Analyze customer overlap between locations
2. Identify unique value propositions
3. Consider pricing strategies for competitive areas`;
    }

    // Location recommendation
    if (lowerQuery.includes('best location') || lowerQuery.includes('new location') || lowerQuery.includes('where')) {
      return `🎯 **Optimal Location Analysis:**

**Recommended Areas:**
1. **Downtown Commercial District** (Score: 92/100)
   - High foot traffic: 15,000+ daily visitors
   - Low competition: 0.3 competitors per km²
   - Demographics: 25-45 age group, $75K+ income

2. **Residential Hub North** (Score: 87/100)
   - Growing population: +12% in last 2 years
   - Underserved market: Nearest competitor 2.1km away
   - Strong parking availability

3. **University Area** (Score: 83/100)
   - Consistent traffic patterns
   - Young demographic (18-30)
   - Moderate competition but different target market

**Analysis Factors:**
• Population density and demographics
• Traffic patterns and accessibility
• Competitor proximity and market gaps
• Economic indicators and growth trends

Would you like me to dive deeper into any specific area?`;
    }

    // Market penetration
    if (lowerQuery.includes('market penetration') || lowerQuery.includes('penetration')) {
      const totalArea = Math.floor(Math.random() * 50 + 100);
      const penetration = Math.floor(Math.random() * 30 + 45);
      
      return `📈 **Market Penetration Analysis:**

**Current Market Position:**
• Coverage Area: ${totalArea} km²
• Market Penetration: ${penetration}%
• Estimated TAM (Total Addressable Market): $${(Math.random() * 50 + 100).toFixed(1)}M annually

**Performance Metrics:**
• Customer capture rate: ${Math.floor(Math.random() * 20 + 35)}%
• Average trade area radius: ${(Math.random() * 3 + 2).toFixed(1)} km
• Market share vs. competitors: ${Math.floor(Math.random() * 25 + 30)}%

**Growth Opportunities:**
• ${100 - penetration}% market still available
• Potential revenue uplift: $${(Math.random() * 20 + 15).toFixed(1)}M with full penetration
• Recommended expansion: ${penetration < 60 ? '2-3 new locations' : '1-2 strategic locations'}

**Strategic Recommendations:**
1. Focus on underserved demographics
2. Enhance customer retention programs
3. Consider market expansion timing`;
    }

    // Traffic analysis
    if (lowerQuery.includes('traffic') || lowerQuery.includes('foot traffic')) {
      return `🚶 **Traffic Pattern Analysis:**

**High Traffic Zones Identified:**
1. **Main Street Corridor**: 18,500 daily pedestrians
2. **Shopping Center Plaza**: 12,300 daily visitors
3. **Transit Hub Area**: 9,800 commuter flow

**Traffic Insights:**
• Peak hours: 11AM-2PM (lunch) and 5PM-7PM (evening)
• Weekend traffic: 35% higher than weekdays
• Seasonal variation: +25% during holidays

**Opportunity Assessment:**
• 3 high-traffic areas with minimal competition
• Estimated capture rate: 8-12% of foot traffic
• Potential daily customers: 150-220 per location

**Recommendations:**
• Consider locations near transit stops
• Optimize for lunch-hour accessibility
• Weekend-focused marketing strategies`;
    }

    // Default response
    return `🤖 **AI Analysis Complete**

I've analyzed your query about "${query}" in the context of your project "${project.name}".

**Current Data Overview:**
• Total locations: ${locations.length}
• Stores: ${locations.filter(l => l.location_type === 'store').length}
• Competitors: ${locations.filter(l => l.location_type === 'competitor').length}
• Points of Interest: ${locations.filter(l => l.location_type === 'poi').length}

**Available Analysis Types:**
• Competition assessment
• Location optimization
• Market penetration studies
• Traffic pattern analysis
• Revenue forecasting
• Demographic insights

Could you be more specific about what aspect you'd like me to analyze? For example:
- "Analyze competition density"
- "Find optimal locations for expansion"  
- "Calculate market penetration"
- "Identify high-traffic low-competition areas"`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiResponse = await analyzeQuery(inputValue);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '❌ Sorry, I encountered an error while analyzing your request. Please try again or rephrase your question.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageContent = (content: string) => {
    // Sanitize content to prevent XSS attacks
    const sanitizedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    
    // Convert markdown-style formatting to HTML (after sanitization)
    return sanitizedContent
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/• (.*?)(?=\n|$)/g, '<li>$1</li>')
      .replace(/(\d+)\. (.*?)(?=\n|$)/g, '<div style="margin: 8px 0;"><strong>$1.</strong> $2</div>')
      .split('\n').map(line => line.trim()).join('<br />');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '600px',
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        backgroundColor: '#2563eb',
        color: 'white',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={20} />
          <h3 style={{ margin: 0, fontSize: '16px' }}>AI Trade Area Analyst</h3>
        </div>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
          Project: {project.name} • {locations.length} locations loaded
        </p>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              flexDirection: message.type === 'user' ? 'row-reverse' : 'row'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: message.type === 'user' ? '#2563eb' : '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0
            }}>
              {message.type === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div style={{
              backgroundColor: message.type === 'user' ? '#2563eb' : 'white',
              color: message.type === 'user' ? 'white' : '#1f2937',
              padding: '12px 16px',
              borderRadius: '12px',
              maxWidth: '70%',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              <div
                dangerouslySetInnerHTML={{
                  __html: formatMessageContent(message.content)
                }}
              />
              <div style={{
                fontSize: '11px',
                opacity: 0.7,
                marginTop: '8px'
              }}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Bot size={16} />
            </div>
            <div style={{
              backgroundColor: 'white',
              padding: '12px 16px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              fontSize: '14px'
            }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <div style={{ fontSize: '12px' }}>Analyzing...</div>
                <div style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: '#94a3b8',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e2e8f0',
        backgroundColor: 'white'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask me to analyze your trade areas, find optimal locations, assess competition..."
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'none',
              minHeight: '20px',
              maxHeight: '100px',
              outline: 'none'
            }}
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            style={{
              padding: '12px',
              backgroundColor: inputValue.trim() && !isLoading ? '#2563eb' : '#94a3b8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Send size={16} />
          </button>
        </div>
        
        {/* Quick action buttons */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '12px',
          flexWrap: 'wrap'
        }}>
          {[
            { icon: Target, text: 'Analyze Competition', query: 'Analyze the competition around my stores' },
            { icon: MapPin, text: 'Find Best Location', query: 'Find the best location for a new store' },
            { icon: TrendingUp, text: 'Market Penetration', query: 'Calculate market penetration for this area' },
            { icon: Users, text: 'Traffic Analysis', query: 'Show me areas with high foot traffic' }
          ].map((action) => (
            <button
              key={action.text}
              onClick={() => setInputValue(action.query)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                cursor: 'pointer',
                color: '#475569'
              }}
            >
              <action.icon size={12} />
              {action.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisChat;