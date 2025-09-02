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
            content: `Hattie & Timperley의 피드백 3단계 모형을 적용하여 중학교 1학년 학생들에게 도면 작성 피드백을 제공해주세요.

피드백 작성 원칙:
1. Task Level (과제 수준): 무엇을 잘했는지/틀렸는지 구체적으로 제시
2. Process Level (과정 수준): 어떤 방법으로 개선할 수 있는지 전략 제시  
3. Self-regulation Level (자기조절 수준): 스스로 점검하고 개선할 수 있는 방법 제시

언어 가이드라인:
- 중학교 1학년이 이해하기 쉬운 친근한 말투
- 영어 단어 사용 금지
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
        feedback: feedback 
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
        error: errorMessage 
      })
    };
  }
}