// server.js - 백엔드 프록시 서버 (Hattie & Timperley 모형 적용 버전)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES6 모듈에서 __dirname 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env 파일 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 환경 변수 검증
const requiredEnvVars = ['OPENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ 필수 환경 변수가 누락되었습니다:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('   .env 파일을 확인해주세요.');
}

// CORS 설정 (환경 변수 활용)
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  process.env.FRONTEND_URL || 'http://localhost:3000'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// 미들웨어
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 요청 로깅 (개발 모드에서만)
if (process.env.DEBUG_MODE === 'true') {
  app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// 정적 파일 제공 (프론트엔드 파일들)
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting (세션별)
const sessionRequests = new Map();

const rateLimitMiddleware = (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW) || 60000;
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX) || 20;
  
  if (!sessionRequests.has(clientIp)) {
    sessionRequests.set(clientIp, []);
  }
  
  const requests = sessionRequests.get(clientIp);
  const recentRequests = requests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: `너무 많은 요청입니다. ${Math.ceil(windowMs/1000)}초 후 다시 시도해주세요.`
    });
  }
  
  recentRequests.push(now);
  sessionRequests.set(clientIp, recentRequests);
  next();
};

// AI 피드백 API 엔드포인트 (Hattie & Timperley 모형 적용)
app.post('/api/ai-feedback', rateLimitMiddleware, async (req, res) => {
  if (process.env.AI_FEEDBACK_ENABLED === 'false') {
    return res.status(503).json({
      success: false,
      error: 'AI 선생님 피드백 기능이 비활성화되어 있습니다.'
    });
  }

  console.log('📡 AI 선생님 피드백 요청 수신');
  
  try {
    const { analysisData } = req.body;
    
    if (!analysisData) {
      return res.status(400).json({ 
        success: false, 
        error: '분석 데이터가 필요합니다.' 
      });
    }

    // Mock AI 응답 (테스트용) - Hattie 모형 적용
    if (process.env.USE_MOCK_AI === 'true') {
      console.log('🤖 Mock AI 선생님 응답 사용');
      
      // 완벽한 경우와 개선 필요 경우를 구분하여 응답
      let mockResponse = '';
      if (analysisData.includes('완벽!')) {
        mockResponse = `정말 완벽해요! 평면도, 정면도, 우측면도를 모두 정확하게 그렸네요. 특히 기준점을 중심으로 체계적으로 접근한 점이 훌륭해요. 공간을 입체적으로 파악하는 능력이 뛰어나요. 이제 중급 과정의 숨은선 개념을 배워서 더 복잡한 도형에 도전해볼까요?`;
      } else {
        mockResponse = `평면도는 정말 잘 그렸어요! 정면도에서 선분 2개가 빠졌는데, 기준점에서 오른쪽으로 2칸 위치에 세로선을 그려보세요. 차근차근 기준점부터 시작해서 하나씩 확인하면 금세 완성할 수 있을 거예요!`;
      }
      
      return res.json({
        success: true,
        feedback: mockResponse
      });
    }

    console.log('🤖 OpenAI API 호출 중...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 
      parseInt(process.env.AI_TIMEOUT) || 30000);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `당신은 10년 경력의 따뜻하고 친절한 중학교 기술 AI 선생님입니다. Hattie & Timperley의 피드백 3단계 모형을 적용하여 중학교 1학년 학생들에게 도면 작성 피드백을 제공해주세요.

피드백 작성 원칙:
1. Task Level (과제 수준): 무엇을 잘했는지/틀렸는지 구체적으로 제시
2. Process Level (과정 수준): 어떤 방법으로 개선할 수 있는지 전략 제시  
3. Self-regulation Level (자기조절 수준): 스스로 점검하고 개선할 수 있는 방법 제시

언어 가이드라인:
- 중학교 1학년이 이해하기 쉬운 친근한 말투
- 영어 단어 사용 금지 (AI→AI 선생님, feedback→조언 등)
- 따뜻하고 부드러운 AI 선생님의 어투
- 격려와 동기부여 중심

완벽한 도면(모든 도면 100점): 칭찬 + 다음 단계 안내
개선 필요 도면: 잘한 점 + 구체적 개선 방법 + 동기 부여

응답은 250-400자 내외로 작성해주세요.`
          },
          {
            role: 'user',
            content: analysisData
          }
        ],
        max_tokens: parseInt(process.env.MAX_TOKENS) || 600,
        temperature: parseFloat(process.env.TEMPERATURE) || 0.7
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API 오류: ${response.status} - ${errorData.error?.message || '알 수 없는 오류'}`);
    }

    const data = await response.json();
    const feedback = data.choices[0].message.content;
    
    console.log('✅ AI 선생님 피드백 생성 완료');
    
    const responseData = { 
      success: true, 
      feedback: feedback 
    };

    if (process.env.INCLUDE_DEBUG_INFO === 'true') {
      responseData.debug = {
        model: process.env.OPENAI_MODEL,
        tokens: data.usage,
        timestamp: new Date().toISOString()
      };
    }
    
    res.json(responseData);

  } catch (error) {
    console.error('❌ AI 선생님 피드백 오류:', error.message);
    
    let errorMessage = error.message;
    if (error.name === 'AbortError') {
      errorMessage = 'AI 선생님 응답 시간이 초과되었습니다. 다시 시도해주세요.';
    } else if (error.message.includes('401')) {
      errorMessage = 'API 키가 유효하지 않습니다. 서버 관리자에게 문의하세요.';
    } else if (error.message.includes('429')) {
      errorMessage = 'API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.message.includes('500')) {
      errorMessage = 'OpenAI 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.';
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage 
    });
  }
});

// AI 학습 분석 API 엔드포인트 (AI 선생님 톤 적용)
app.post('/api/learning-analysis', rateLimitMiddleware, async (req, res) => {
  if (process.env.LEARNING_ANALYSIS_ENABLED === 'false') {
    return res.status(503).json({
      success: false,
      error: 'AI 선생님 학습 분석 기능이 비활성화되어 있습니다.'
    });
  }

  console.log('📊 AI 선생님 학습 분석 요청 수신');
  
  try {
    const { analysisData } = req.body;
    
    if (!analysisData) {
      return res.status(400).json({ 
        success: false, 
        error: '분석 데이터가 필요합니다.' 
      });
    }

    // Mock AI 응답 (테스트용) - 친근한 AI 선생님 톤
    if (process.env.USE_MOCK_AI === 'true') {
      console.log('🧠 Mock AI 선생님 학습 분석 사용');
      return res.json({
        success: true,
        analysis: `## 📊 **현재 학습 상황**
평면도에서 80점으로 기본 구조는 잘 파악하고 있어요. 공간 감각이 좋은 편이에요!

## 🎯 **개인 학습 특성**  
차근차근 신중하게 접근하는 스타일이네요. 완벽을 추구하려는 성향이 강해요!

## 🚀 **다음 학습 방향**
우측면도 연습을 더 해보세요. 숨은선 개념을 익히면 한 단계 성장할 거예요!

## 💡 **실습 개선 방법**
- 기준점에서 시작해서 차례대로 선 그어보기
- 안 보이는 선은 점선으로 표현하기
- 등각투상도와 정투상도를 번갈아 보며 비교하기`,
        timestamp: new Date().toISOString()
      });
    }

    console.log('🧠 OpenAI API 호출 중 (학습 분석)...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 
      parseInt(process.env.AI_TIMEOUT) || 30000);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `당신은 경력 15년의 따뜻하고 친절한 기술교육 AI 선생님입니다. 중학교 1학년 학생의 정투상도 학습 결과를 종합적으로 분석하고, 개인 맞춤형 학습 방향을 제시해주세요.

학습 분석 가이드라인:
1. 중학교 1학년이 이해하기 쉬운 친근한 언어 사용
2. 구체적이고 실행 가능한 조언 제시
3. 격려와 동기부여 메시지 포함
4. 단계적이고 체계적인 접근법 제시
5. 과도한 학습 부담 주지 않기
6. 영어 단어 사용 금지

응답 구조:
📊 현재 학습 상황 진단
🎯 개인별 학습 특성 분석  
🚀 맞춤형 학습 방향 제시
💡 실습 중심 개선 방법

응답은 500-800자 내외로 작성해주세요.`
          },
          {
            role: 'user',
            content: analysisData
          }
        ],
        max_tokens: parseInt(process.env.MAX_TOKENS) || 1200,
        temperature: parseFloat(process.env.TEMPERATURE) || 0.7
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API 오류: ${response.status} - ${errorData.error?.message || '알 수 없는 오류'}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;
    
    console.log('✅ AI 선생님 학습 분석 생성 완료');
    
    const responseData = {
      success: true,
      analysis: analysis,
      timestamp: new Date().toISOString()
    };

    if (process.env.INCLUDE_DEBUG_INFO === 'true') {
      responseData.debug = {
        model: process.env.OPENAI_MODEL,
        tokens: data.usage,
        processingTime: Date.now() - Date.now()
      };
    }
    
    res.json(responseData);

  } catch (error) {
    console.error('❌ AI 선생님 학습 분석 오류:', error.message);
    
    let errorMessage = error.message;
    if (error.name === 'AbortError') {
      errorMessage = 'AI 선생님 분석 시간이 초과되었습니다. 다시 시도해주세요.';
    } else if (error.message.includes('401')) {
      errorMessage = 'API 키가 유효하지 않습니다. 서버 관리자에게 문의하세요.';
    } else if (error.message.includes('429')) {
      errorMessage = 'API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.message.includes('500')) {
      errorMessage = 'OpenAI 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.message.includes('insufficient_quota')) {
      errorMessage = 'API 사용량 한도를 초과했습니다. 관리자에게 문의해주세요.';
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage 
    });
  }
});

// 헬스 체크 엔드포인트 (향상됨)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hasApiKey: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-actual-openai-api-key-here',
    aiEnabled: {
      feedback: process.env.AI_FEEDBACK_ENABLED !== 'false',
      analysis: process.env.LEARNING_ANALYSIS_ENABLED !== 'false',
      mock: process.env.USE_MOCK_AI === 'true'
    },
    endpoints: [
      'POST /api/ai-feedback',
      'POST /api/learning-analysis',
      'GET  /api/health'
    ],
    limits: {
      rateLimit: `${process.env.RATE_LIMIT_MAX || 20} requests per ${process.env.RATE_LIMIT_WINDOW || 60000}ms`,
      maxTokens: process.env.MAX_TOKENS || 1200,
      timeout: `${process.env.AI_TIMEOUT || 30000}ms`
    }
  });
});

// 루트 경로에서 프론트엔드 제공
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({
    error: 'API 엔드포인트를 찾을 수 없습니다.',
    availableEndpoints: [
      'GET  /',
      'GET  /api/health',
      'POST /api/ai-feedback',
      'POST /api/learning-analysis'
    ]
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('❌ 서버 에러:', err.message);
  res.status(500).json({
    error: '내부 서버 오류가 발생했습니다.',
    ...(process.env.DEBUG_MODE === 'true' && { debug: err.message })
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버가 http://localhost:${PORT}에서 실행중입니다.`);
  console.log(`📁 정적 파일 경로: ${path.join(__dirname, 'public')}`);
  console.log(`🌍 환경: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 사용 가능한 API:`);
  console.log(`   - POST /api/ai-feedback (도면 피드백)`);
  console.log(`   - POST /api/learning-analysis (학습 분석)`);
  console.log(`   - GET  /api/health (상태 확인)`);
  
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-actual-openai-api-key-here') {
    console.log('✅ OpenAI API 키가 설정되었습니다.');
    if (process.env.USE_MOCK_AI === 'true') {
      console.log('🤖 Mock AI 선생님 모드가 활성화되어 있습니다.');
    }
  } else {
    console.log('⚠️  OpenAI API 키를 .env 파일에서 설정해주세요.');
    console.log('💡 테스트를 위해 USE_MOCK_AI=true로 설정할 수 있습니다.');
  }
  
  if (process.env.DEBUG_MODE === 'true') {
    console.log('🔍 디버그 모드가 활성화되었습니다.');
  }
});