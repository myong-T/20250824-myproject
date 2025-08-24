// ai-feedback-manager.js - AI 피드백 관리 시스템 (Netlify용)

import { CONFIG } from './constants.js';

export class AIFeedbackManager {
  constructor() {
    this.isProcessing = false;
    this.lastFeedbackTime = null;
    this.feedbackHistory = [];
  }

  // AI 피드백 메인 함수 (Netlify Functions 사용)
  async getAIFeedback(lastValidationResults, currentDifficulty, canvasManager) {
    const feedbackArea = document.getElementById('aiFeedbackArea');
    const button = document.getElementById('getAiFeedbackBtn');
    
    // 도면 제출 여부 확인
    if (!lastValidationResults) {
      this.showError(feedbackArea, '⚠️ 먼저 "제출하기" 버튼을 눌러 도면을 채점해주세요.');
      return;
    }

    // 중복 요청 방지
    if (this.isProcessing) {
      this.showError(feedbackArea, '⚠️ 이미 AI 선생님이 분석하고 있어요. 잠시만 기다려주세요.');
      return;
    }

    // 로딩 상태 시작
    this.setLoadingState(button, feedbackArea, true);

    try {
      // 현재 상태 수집 및 완성도 판단
      const analysisData = await this.prepareEnhancedAnalysisData(lastValidationResults, currentDifficulty, canvasManager);
      
      // Netlify Functions API 호출 (URL 변경)
      const response = await fetch('/.netlify/functions/ai-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analysisData: analysisData
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '서버 오류가 발생했습니다.');
      }

      // 성공적으로 피드백 받음
      this.displayFeedback(feedbackArea, result.feedback);
      this.saveFeedbackHistory(analysisData, result.feedback);

    } catch (error) {
      console.error('AI 피드백 오류:', error);
      this.handleError(feedbackArea, error);
    } finally {
      this.setLoadingState(button, feedbackArea, false);
    }
  }

  // 개선된 분석 데이터 준비
  async prepareEnhancedAnalysisData(lastValidationResults, currentDifficulty, canvasManager) {
    const difficultyLabels = { easy: '하급', medium: '중급', hard: '상급' };
    const difficultyDescriptions = {
      easy: '복잡한 블록 구조 (L자형)',
      medium: '실린더 형태 (계단식, 숨은선 포함)', 
      hard: '복합 기하학적 도형 (빗면 포함)'
    };

    // 전체 완성도 판단
    const overallCompletion = this.assessOverallCompletion(lastValidationResults);
    
    // 구체적 오류 유형 감지
    const specificErrors = await this.detectSpecificErrors(lastValidationResults, currentDifficulty, canvasManager);
    
    // 도면별 상세 분석
    const detailedAnalysis = this.generateDetailedAnalysis(lastValidationResults, currentDifficulty, canvasManager);
    
    // Hattie & Timperley 3단계 모형 적용
    let feedbackPrompt = '';
    
    if (overallCompletion.isPerfect) {
      // 완벽한 경우: 칭찬 + 다음 단계 안내
      feedbackPrompt = this.generatePerfectFeedbackPrompt(
        currentDifficulty, 
        difficultyLabels, 
        difficultyDescriptions,
        detailedAnalysis
      );
    } else {
      // 개선 필요한 경우: 구체적 개선 방법 + 동기부여
      feedbackPrompt = this.generateEnhancedImprovementFeedbackPrompt(
        currentDifficulty,
        difficultyLabels,
        difficultyDescriptions,
        detailedAnalysis,
        overallCompletion,
        specificErrors
      );
    }
    
    return feedbackPrompt;
  }

  // 전체 완성도 평가
  assessOverallCompletion(lastValidationResults) {
    const totalScore = lastValidationResults.top.score + 
                      lastValidationResults.front.score + 
                      lastValidationResults.side.score;
    const averageScore = totalScore / 3;
    
    return {
      isPerfect: totalScore === 300,
      isExcellent: averageScore >= 90,
      isGood: averageScore >= 70,
      averageScore: Math.round(averageScore),
      totalScore: totalScore,
      perfectViews: Object.keys(lastValidationResults).filter(
        view => lastValidationResults[view].score === 100
      ),
      weakViews: Object.keys(lastValidationResults).filter(
        view => lastValidationResults[view].score < 70
      )
    };
  }

  // 구체적 오류 유형 감지
  async detectSpecificErrors(lastValidationResults, currentDifficulty, canvasManager) {
    const errors = {
      positionMistakes: [],
      styleMistakes: [],
      missingHiddenLines: [],
      unnecessaryLines: [],
      proportionErrors: []
    };

    // 각 도면별 오류 분석
    Object.keys(lastValidationResults).forEach(viewKey => {
      const result = lastValidationResults[viewKey];
      
      if (result.accuracy && result.accuracy.detailedAnalysis) {
        const analysis = result.accuracy.detailedAnalysis;
        
        // 스타일 오류 (실선/점선 혼동)
        if (analysis.styleErrors && analysis.styleErrors.length > 0) {
          errors.styleMistakes.push({
            view: viewKey,
            count: analysis.styleErrors.length,
            details: analysis.styleErrors
          });
        }
        
        // 누락된 선분
        if (analysis.missingCount > 0) {
          errors.missingHiddenLines.push({
            view: viewKey,
            count: analysis.missingCount
          });
        }
        
        // 불필요한 선분
        if (analysis.extraCount > 0) {
          errors.unnecessaryLines.push({
            view: viewKey,
            count: analysis.extraCount
          });
        }
      }
    });

    return errors;
  }

  // 상세 분석 생성
  generateDetailedAnalysis(lastValidationResults, currentDifficulty, canvasManager) {
    const detailedAnalysis = {};
    
    Object.keys(lastValidationResults).forEach(viewKey => {
      const result = lastValidationResults[viewKey];
      
      detailedAnalysis[viewKey] = {
        score: result.score,
        missingCount: result.accuracy?.detailedAnalysis?.missingCount || 0,
        extraCount: result.accuracy?.detailedAnalysis?.extraCount || 0,
        styleErrorCount: result.accuracy?.detailedAnalysis?.styleErrors ? 
          result.accuracy.detailedAnalysis.styleErrors.length : 0,
        completionRate: result.accuracy?.detailedAnalysis?.completionRate,
        precisionRate: result.accuracy?.detailedAnalysis?.precisionRate,
        styleErrors: result.accuracy?.detailedAnalysis?.styleErrors || []
      };
    });

    return detailedAnalysis;
  }

  // 완벽한 경우 피드백 생성
  generatePerfectFeedbackPrompt(currentDifficulty, difficultyLabels, difficultyDescriptions, detailedAnalysis) {
    const nextLevel = {
      easy: '중급',
      medium: '상급',
      hard: '고급 응용'
    };

    return `**${difficultyLabels[currentDifficulty]}** 난이도 문제를 완벽하게 해결했습니다!

**현재 성과:**
- 평면도: ${detailedAnalysis.top.score}점 (완벽!)
- 정면도: ${detailedAnalysis.front.score}점 (완벽!)
- 우측면도: ${detailedAnalysis.side.score}점 (완벽!)

모든 선분을 정확한 위치에, 올바른 스타일(실선/점선)로 그렸어요. 입체 도형을 평면으로 투상하는 개념을 완전히 이해하고 있습니다.

**다음 도전:**
${nextLevel[currentDifficulty]} 난이도에 도전해보세요! 더 복잡한 형태의 도형도 잘 해낼 거예요.

**계속 발전하는 방법:**
- 다양한 각도에서 도형 관찰하기
- 실제 물건을 보고 정투상도 그려보기
- 친구들과 함께 도면 맞추기 게임하기`;
  }

  // 개선 필요 시 피드백 생성
  generateEnhancedImprovementFeedbackPrompt(currentDifficulty, difficultyLabels, difficultyDescriptions, detailedAnalysis, completion, specificErrors) {
    let improvementPoints = '';
    
    Object.keys(detailedAnalysis).forEach(viewKey => {
      const analysis = detailedAnalysis[viewKey];
      const viewNames = { top: '평면도', front: '정면도', side: '우측면도' };
      const viewName = viewNames[viewKey];
      
      if (analysis.score < 100) {
        improvementPoints += `\n**${viewName} (${analysis.score}점):**\n`;
        
        if (analysis.missingCount > 0) {
          improvementPoints += `- 빠진 선분: ${analysis.missingCount}개\n`;
        }
        if (analysis.extraCount > 0) {
          improvementPoints += `- 불필요한 선분: ${analysis.extraCount}개\n`;
        }
        if (analysis.styleErrorCount > 0) {
          improvementPoints += `- 선 종류 실수: ${analysis.styleErrorCount}개 (실선↔점선)\n`;
        }
      }
    });

    let specificErrorGuidance = '';
    
    // 스타일 오류 안내
    if (specificErrors.styleMistakes.length > 0) {
      specificErrorGuidance += `\n**선 종류 구분법:**\n- 보이는 선: 실선으로 그리기\n- 안보이는 선(숨은선): 점선으로 그리기\n- 그린 선에 마우스 오른쪽 클릭으로 변경 가능\n`;
    }
    
    // 누락/추가 선분 안내
    if (specificErrors.missingHiddenLines.length > 0 || specificErrors.unnecessaryLines.length > 0) {
      specificErrorGuidance += `\n**정확한 선분 그리기:**\n- 등각투상도를 자세히 관찰하세요\n- 각 면에서 보이는 모서리만 그리세요\n- 기준점(색깔 점)에서 시작해서 차례대로 그려보세요\n`;
    }

    return `**${difficultyLabels[currentDifficulty]}** 난이도 (${difficultyDescriptions[currentDifficulty]}) 도전 중!

**현재 상황:**
평균 점수: ${completion.averageScore}점 ${completion.averageScore >= 70 ? '(잘하고 있어요!)' : '(조금만 더 노력하면 돼요!)'}
${improvementPoints}

${specificErrorGuidance}

**격려 메시지:**
${completion.perfectViews.length > 0 ? 
  `${completion.perfectViews.map(v => ({top:'평면도',front:'정면도',side:'우측면도'}[v])).join(', ')}는 완벽해요! 다른 도면도 같은 방식으로 접근해보세요.` : 
  '포기하지 마세요! 정투상도는 연습할수록 쉬워져요.'}

**다음 단계:**
1. 등각투상도를 더 자세히 관찰하기
2. 한 번에 하나씩 차근차근 그리기  
3. 그린 후에는 꼭 검토하기`;
  }

  // 로딩 상태 관리
  setLoadingState(button, feedbackArea, isLoading) {
    this.isProcessing = isLoading;
    button.disabled = isLoading;

    if (isLoading) {
      feedbackArea.className = 'ai-feedback-area loading';
      feedbackArea.innerHTML = '<div class="loading-spinner"></div>AI 선생님이 도면을 살펴보고 있어요...';
      button.innerHTML = '<span class="icon">⏳</span>분석 중...';
    } else {
      button.innerHTML = '<span class="icon">🤖</span>AI 선생님께 조언 받기';
    }
  }

  // 성공 피드백 표시
  displayFeedback(feedbackArea, feedback) {
    feedbackArea.className = 'ai-feedback-area';
    feedbackArea.innerHTML = `<strong>👨‍🏫 AI 선생님의 조언:</strong>

${feedback}

<div class="ai-tips">
💡 AI 선생님의 조언은 학습에 도움이 되도록 작성되었어요. 기본 점수는 위의 정답 확인을 참고해주세요.
</div>`;

    this.lastFeedbackTime = new Date();
  }

  // 오류 표시
  showError(feedbackArea, message) {
    feedbackArea.className = 'ai-feedback-area error';
    feedbackArea.innerHTML = `<div style="color: #c53030;">${message}</div>`;
  }

  // 오류 처리 (Netlify용 메시지 수정)
  handleError(feedbackArea, error) {
    let errorMessage = error.message;
    if (error.message.includes('Failed to fetch')) {
      errorMessage = 'AI 선생님께 연결할 수 없어요. 인터넷 연결을 확인해주세요.';
    } else if (error.message.includes('401')) {
      errorMessage = 'API 키 설정에 문제가 있어요. 관리자에게 문의해주세요.';
    } else if (error.message.includes('429')) {
      errorMessage = 'AI 사용량이 많아요. 잠시 후 다시 시도해주세요.';
    } else if (error.message.includes('500')) {
      errorMessage = 'AI 서버에 일시적인 문제가 있어요. 잠시 후 다시 시도해주세요.';
    }
    
    feedbackArea.className = 'ai-feedback-area error';
    feedbackArea.innerHTML = `⚠️ AI 선생님의 조언을 받아오는 중에 문제가 생겼어요.

문제 내용: ${errorMessage}

• 인터넷 연결을 확인해주세요
• 잠시 후 다시 시도해주세요`;
  }

  // AI 피드백 초기화
  resetAIFeedback() {
    const aiFeedbackArea = document.getElementById('aiFeedbackArea');
    if (aiFeedbackArea) {
      aiFeedbackArea.className = 'ai-feedback-area';
      aiFeedbackArea.innerHTML = `AI 선생님께 조언을 받으려면 위의 버튼을 클릭해주세요.
        <div class="ai-tips">
          <p>💡 <strong>AI 선생님 기능:</strong> 여러분의 도면을 분석해서 더 잘할 수 있는 방법을 알려드려요.</p>
        </div>`;
    }
    
    const button = document.getElementById('getAiFeedbackBtn');
    if (button) {
      button.innerHTML = '<span class="icon">🤖</span>AI 선생님께 조언 받기';
    }
    
    this.isProcessing = false;
    this.lastFeedbackTime = null;
  }

  // 피드백 이력 저장
  saveFeedbackHistory(analysisData, feedback) {
    const entry = {
      timestamp: new Date(),
      analysisData: analysisData,
      feedback: feedback,
      difficulty: this.extractDifficultyFromData(analysisData)
    };
    
    this.feedbackHistory.push(entry);
    
    if (this.feedbackHistory.length > 10) {
      this.feedbackHistory.shift();
    }
  }

  // 분석 데이터에서 난이도 추출
  extractDifficultyFromData(analysisData) {
    if (analysisData.includes('하급')) return 'easy';
    if (analysisData.includes('중급')) return 'medium';
    if (analysisData.includes('상급')) return 'hard';
    return 'unknown';
  }

  // 유틸리티 메서드들
  getFeedbackHistory() {
    return [...this.feedbackHistory];
  }

  getLastFeedbackTime() {
    return this.lastFeedbackTime;
  }

  clearFeedbackHistory() {
    this.feedbackHistory = [];
    this.lastFeedbackTime = null;
  }
}