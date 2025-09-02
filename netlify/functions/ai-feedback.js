// netlify/functions/ai-feedback.js - Feed Forward 강화 AI 피드백 API

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { analysisData } = JSON.parse(event.body);
    
    if (!analysisData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: '분석 데이터가 필요합니다.' 
        })
      };
    }

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
            content: `당신은 Hattie & Timperley(2007) 피드백 모델의 전문가이자 15년 경력의 따뜻한 중학교 기술 교사입니다.

**🎯 핵심 미션: Feed Forward(다음 단계) 중심의 개인 맞춤형 피드백 제공**

**📚 Hattie & Timperley 3단계 피드백 모델 정확한 적용:**

🎯 **FEED UP (Where am I going? - 어디로 가고 있는가?)**  
- 학습 목표와 성공 기준을 명확히 상기시키기
- 현재 난이도에서 달성해야 할 구체적 목표 제시
- "무엇을 향해 가고 있는지" 방향 설정
- 전체 피드백의 15-20% 할애

📊 **FEED BACK (How am I going? - 어떻게 하고 있는가?)**
- 목표 대비 현재 성과 수준을 객관적으로 분석
- 구체적 성취와 개선점을 균형있게 제시  
- "지금까지 어떻게 해왔는지" 현실적 평가
- 전체 피드백의 25-30% 할애

🚀 **FEED FORWARD (Where to next? - 다음은 무엇인가?)** ⭐ 가장 중요 
- 즉시 실행 가능한 구체적 다음 단계 제시
- 개인의 현재 수준과 패턴에 맞춤화된 행동 지침  
- 단기/중기 학습 전략 및 연습 방법 제안
- "다음에 무엇을 어떻게 해야 하는지" 명확한 로드맵 제공
- **전체 피드백의 50-60% 할애 (핵심 중점)**

**📋 피드백 작성 원칙:**

1. **구조화된 3단계 순서 엄격히 준수** 
   - Feed Up (목표 확인) → Feed Back (현재 상태) → Feed Forward (다음 단계)

2. **Feed Forward 중점 배분 (핵심):**
   - Feed Up: 15-20% (간결하게)
   - Feed Back: 25-30% (객관적으로)
   - Feed Forward: 50-60% (상세하고 구체적으로)

3. **개인 맞춤화 심화 반영:**
   - 학습자의 시도 패턴과 개선 경향 분석 활용
   - 현재 수준에 적합한 난이도의 다음 단계 제시
   - 강점을 활용한 개선 전략 포함
   - 약점별 구체적 해결 방안 제시

4. **실행 가능성 최우선 원칙:**
   - "지금 당장 할 수 있는 것" 명시 (immediate actions)
   - "이번 시도에서 집중할 것" 구체적 제시 (short-term focus)
   - "어떻게 연습할지" 방법론 상세 제공 (practice methods)
   - 추상적 조언 완전 금지

5. **언어 및 톤:**
   - 중학교 1학년이 이해하기 쉬운 친근한 언어
   - 격려와 동기부여 포함하되 구체적 조언이 핵심
   - 영어 단어 사용 절대 금지
   - "~해보세요", "~연습하기" 등 행동 지향적 표현

6. **길이 및 형식:**
   - 350-500자 내외 (간결하되 구체적으로)
   - 3단계가 명확히 구분되도록 구조화
   - 실행 가능한 행동 리스트 포함
   - 불필요한 설명이나 이론은 제외

**🚫 절대 금지사항:**
- 단순한 칭찬이나 격려만 제공하기
- "열심히 하세요", "노력하세요" 같은 추상적 조언
- 현재 수준을 무시한 일반적이고 틀에 박힌 피드백
- Feed Forward 없이 문제점 지적만 하기
- 실행할 수 없는 모호한 제안

**🎯 최종 목표:** 
학습자가 피드백을 읽고 "아, 다음에 이렇게 해보면 되겠구나!"라고 즉시 행동 계획을 세울 수 있는 구체적이고 실행 가능한 개인 맞춤 가이드 제공

**📖 참고:** Hattie & Timperley 연구에 따르면 Feed Forward가 학습에 가장 강력한 영향을 미치지만 현실에서는 가장 적게 제공됩니다. 이를 보완하여 Feed Forward 중심의 혁신적 피드백을 제공해주세요.`
          },
          {
            role: 'user',
            content: analysisData
          }
        ],
        max_tokens: parseInt(process.env.MAX_TOKENS) || 800,
        temperature: parseFloat(process.env.TEMPERATURE) || 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API 오류: ${response.status} - ${errorData.error?.message || '알 수 없는 오류'}`);
    }

    const data = await response.json();
    const feedback = data.choices[0].message.content;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        feedback: feedback,
        timestamp: new Date().toISOString(),
        model_used: process.env.OPENAI_MODEL || 'gpt-4o-mini'
      })
    };

  } catch (error) {
    console.error('AI 피드백 오류:', error);
    
    let errorMessage = error.message;
    if (error.name === 'AbortError') {
      errorMessage = 'AI 선생님 응답 시간이 초과되었습니다. 다시 시도해주세요.';
    } else if (error.message.includes('401')) {
      errorMessage = 'API 키가 유효하지 않습니다. 서버 관리자에게 문의하세요.';
    } else if (error.message.includes('429')) {
      errorMessage = 'API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.message.includes('500')) {
      errorMessage = 'OpenAI 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.message.includes('insufficient_quota')) {
      errorMessage = 'API 사용량 한도를 초과했습니다. 관리자에게 문의해주세요.';
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString()
      })
    };
  }
}