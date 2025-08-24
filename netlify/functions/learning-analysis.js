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
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API 오류: ${response.status} - ${errorData.error?.message || '알 수 없는 오류'}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        analysis: analysis,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('AI 학습 분석 오류:', error);
    
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
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: errorMessage 
      })
    };
  }
}