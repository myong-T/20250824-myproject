// ai-feedback-manager.js - AI 피드백 관리 시스템 (Feed Forward 강화 버전)

import { CONFIG } from './constants.js';

export class AIFeedbackManager {
  constructor() {
    this.isProcessing = false;
    this.lastFeedbackTime = null;
    this.feedbackHistory = [];
  }

  // AI 피드백 메인 함수 (Feed Forward 중심 개선)
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
      // 🚀 개선된 Feed Forward 중심 분석 데이터 준비
      const analysisData = await this.prepareEnhancedFeedForwardData(
        lastValidationResults, 
        currentDifficulty, 
        canvasManager
      );
      
      // Netlify Functions API 호출
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
      this.displayEnhancedFeedback(feedbackArea, result.feedback);
      this.saveFeedbackHistory(analysisData, result.feedback);

    } catch (error) {
      console.error('AI 피드백 오류:', error);
      this.handleError(feedbackArea, error);
    } finally {
      this.setLoadingState(button, feedbackArea, false);
    }
  }

  // 🚀 개선된 Feed Forward 중심 분석 데이터 준비
  async prepareEnhancedFeedForwardData(lastValidationResults, currentDifficulty, canvasManager) {
    const difficultyLabels = { easy: '하급', medium: '중급', hard: '상급' };
    const difficultyDescriptions = {
      easy: '복잡한 블록 구조 (L자형)',
      medium: '실린더 형태 (계단식, 숨은선 포함)', 
      hard: '복합 기하학적 도형 (빗면 포함)'
    };

    // 1. 현재 성과 분석 (Feed Back)
    const currentPerformance = this.analyzeCurrentPerformance(lastValidationResults);
    
    // 2. 개인 학습 패턴 분석 (새로운 기능)
    const learningPattern = this.analyzeLearningPattern();
    
    // 3. 구체적 다음 단계 생성 (Feed Forward 강화)
    const nextSteps = this.generatePersonalizedNextSteps(currentPerformance, learningPattern, currentDifficulty);
    
    // 4. 개선된 Hattie & Timperley 3단계 프롬프트 생성
    const feedbackPrompt = this.generateEnhancedHattieTimperleyPrompt({
      difficulty: currentDifficulty,
      difficultyLabels,
      difficultyDescriptions,
      currentPerformance,
      learningPattern,
      nextSteps
    });
    
    return feedbackPrompt;
  }

  // 현재 성과 분석 (더 구체적)
  analyzeCurrentPerformance(lastValidationResults) {
    const performance = {
      overallStatus: '',
      strengths: [],
      weaknesses: [],
      specificErrors: {
        styleErrors: [],
        missingLines: [],
        extraLines: [],
        partialMatches: []
      },
      readinessLevel: '', // 다음 단계 준비도
      viewAnalysis: {}
    };

    // 전체 완성도 판단
    const totalScore = Object.keys(lastValidationResults).reduce((sum, key) => 
      sum + lastValidationResults[key].accuracy.score, 0
    );
    const avgScore = totalScore / 3;

    // 성과 상태 분류
    if (totalScore === 300) {
      performance.overallStatus = 'perfect';
      performance.readinessLevel = 'ready_for_next_level';
    } else if (avgScore >= 90) {
      performance.overallStatus = 'excellent';
      performance.readinessLevel = 'fine_tuning_needed';
    } else if (avgScore >= 70) {
      performance.overallStatus = 'good';
      performance.readinessLevel = 'skill_building_needed';
    } else if (avgScore >= 50) {
      performance.overallStatus = 'developing';
      performance.readinessLevel = 'foundation_building_needed';
    } else {
      performance.overallStatus = 'struggling';
      performance.readinessLevel = 'basic_concept_review_needed';
    }

    // 도면별 강약점 분석
    Object.keys(lastValidationResults).forEach(viewKey => {
      const result = lastValidationResults[viewKey];
      const analysis = result.accuracy.detailedAnalysis || {};
      
      performance.viewAnalysis[viewKey] = {
        score: result.accuracy.score,
        status: result.accuracy.score >= 90 ? 'strong' : 
                result.accuracy.score >= 70 ? 'moderate' : 'weak',
        missingCount: analysis.missingCount || 0,
        extraCount: analysis.extraCount || 0,
        styleErrorCount: analysis.styleErrorMatches || 0,
        partialMatches: analysis.partialMatches || 0
      };

      // 강점/약점 분류
      if (result.accuracy.score >= 85) {
        performance.strengths.push({
          view: viewKey,
          score: result.accuracy.score,
          reason: this.getStrengthReason(analysis)
        });
      } else if (result.accuracy.score < 70) {
        performance.weaknesses.push({
          view: viewKey,
          score: result.accuracy.score,
          mainIssues: this.identifyMainIssues(analysis)
        });
      }

      // 구체적 오류 수집
      if (analysis.styleErrors && analysis.styleErrors.length > 0) {
        performance.specificErrors.styleErrors.push({
          view: viewKey,
          count: analysis.styleErrors.length,
          details: analysis.styleErrors
        });
      }
      
      if (analysis.missingCount > 0) {
        performance.specificErrors.missingLines.push({
          view: viewKey,
          count: analysis.missingCount
        });
      }
      
      if (analysis.extraCount > 0) {
        performance.specificErrors.extraLines.push({
          view: viewKey,
          count: analysis.extraCount
        });
      }
      
      if (analysis.partialMatches > 0) {
        performance.specificErrors.partialMatches.push({
          view: viewKey,
          count: analysis.partialMatches
        });
      }
    });

    return performance;
  }

  // 개인 학습 패턴 분석 (새로운 기능)
  analyzeLearningPattern() {
    // 기존 시도 히스토리가 있다면 활용
    const attempts = this.feedbackHistory || [];
    
    const pattern = {
      attemptCount: attempts.length,
      improvementTrend: 'stable', // improving, declining, stable
      commonMistakes: [],
      learningStyle: 'systematic', // systematic, trial_error, quick_learner
      persistenceLevel: 'moderate', // high, moderate, low
      preferredFeedbackType: 'detailed' // detailed, concise, visual
    };

    if (attempts.length >= 2) {
      // 개선 추세 분석
      const recentScores = attempts.slice(-3).map(attempt => 
        this.extractScoreFromFeedback(attempt.feedback)
      );
      
      if (recentScores.length >= 2) {
        const trend = recentScores[recentScores.length - 1] - recentScores[0];
        pattern.improvementTrend = trend > 5 ? 'improving' : 
                                  trend < -5 ? 'declining' : 'stable';
      }
      
      // 공통 실수 패턴 분석
      pattern.commonMistakes = this.identifyCommonMistakes(attempts);
      
      // 학습 스타일 추정
      pattern.learningStyle = this.estimateLearningStyle(attempts);
    }

    return pattern;
  }

  // 개인화된 다음 단계 생성 (핵심 개선 부분)
  generatePersonalizedNextSteps(performance, pattern, difficulty) {
    const nextSteps = {
      immediate: [], // 지금 당장 할 수 있는 것
      shortTerm: [], // 이번 시도에서 집중할 것
      longTerm: [], // 장기적 개선 목표
      specificActions: [], // 구체적 행동 지침
      practiceRecommendations: [] // 연습 방법 제안
    };

    // 준비도 수준별 다음 단계
    switch (performance.readinessLevel) {
      case 'ready_for_next_level':
        nextSteps.immediate.push('다음 난이도에 도전할 준비가 되었어요!');
        nextSteps.longTerm.push(`${this.getNextDifficulty(difficulty)} 난이도 도전하기`);
        break;
        
      case 'fine_tuning_needed':
        nextSteps.immediate.push('세부적인 정확성 향상에 집중해보세요');
        nextSteps.specificActions.push('각 선분을 그린 후 실선/점선 구분 재확인하기');
        break;
        
      case 'skill_building_needed':
        nextSteps.immediate.push('기본기 다지기가 필요해요');
        nextSteps.shortTerm.push('한 번에 하나의 도면씩 완벽하게 만들어보기');
        break;
        
      case 'foundation_building_needed':
        nextSteps.immediate.push('기초 개념 복습이 필요해요');
        nextSteps.specificActions.push('등각투상도를 더 자세히 관찰하며 그리기');
        break;
        
      case 'basic_concept_review_needed':
        nextSteps.immediate.push('정투상도의 기본 원리부터 차근차근 익혀보세요');
        nextSteps.practiceRecommendations.push('간단한 도형부터 시작해서 단계적으로 연습');
        break;
    }

    // 구체적 오류별 맞춤 지침
    this.addErrorSpecificGuidance(nextSteps, performance.specificErrors, difficulty);
    
    // 학습 패턴별 맞춤 조언
    this.addLearningPatternGuidance(nextSteps, pattern);
    
    // 강점 활용 전략
    this.addStrengthBasedStrategy(nextSteps, performance.strengths);
    
    return nextSteps;
  }

  // 오류별 구체적 지침 추가
  addErrorSpecificGuidance(nextSteps, specificErrors, difficulty) {
    // 스타일 오류 (실선/점선)
    if (specificErrors.styleErrors.length > 0) {
      nextSteps.specificActions.push(
        '선을 그린 후 "보이는 선인지, 숨은 선인지" 스스로 질문해보기'
      );
      nextSteps.practiceRecommendations.push(
        '마우스 우클릭으로 실선↔점선 변경 연습하기'
      );
    }
    
    // 누락된 선분
    if (specificErrors.missingLines.length > 0) {
      nextSteps.immediate.push('빠뜨린 모서리가 있는지 체계적으로 점검해보세요');
      nextSteps.specificActions.push(
        '등각투상도의 각 모서리를 손가락으로 따라가며 확인하기'
      );
    }
    
    // 불필요한 선분
    if (specificErrors.extraLines.length > 0) {
      nextSteps.shortTerm.push('꼭 필요한 선만 그리는 연습이 필요해요');
      nextSteps.specificActions.push(
        '선을 그리기 전에 "이 선이 정말 필요한가?" 한번 더 생각하기'
      );
    }
    
    // 부분 일치 (선분 길이나 위치 오류)
    if (specificErrors.partialMatches.length > 0) {
      nextSteps.practiceRecommendations.push(
        '격자점을 정확히 클릭하여 정밀도 높이기'
      );
      nextSteps.specificActions.push(
        '선분의 시작점과 끝점을 그리기 전에 먼저 확인하기'
      );
    }
  }

  // 학습 패턴별 맞춤 조언
  addLearningPatternGuidance(nextSteps, pattern) {
    if (pattern.improvementTrend === 'improving') {
      nextSteps.immediate.push('지금처럼 꾸준히 개선하고 있어요! 현재 방식을 유지하세요');
    } else if (pattern.improvementTrend === 'declining') {
      nextSteps.shortTerm.push('잠시 쉬어가며 기본기를 다시 점검해보세요');
    }
    
    switch (pattern.learningStyle) {
      case 'systematic':
        nextSteps.practiceRecommendations.push('단계별로 체계적으로 접근하는 현재 방식이 좋아요');
        break;
      case 'trial_error':
        nextSteps.specificActions.push('여러 번 시도해보는 것도 좋지만, 패턴을 찾아보세요');
        break;
      case 'quick_learner':
        nextSteps.longTerm.push('빠른 이해력을 바탕으로 더 복잡한 도형에 도전해보세요');
        break;
    }
  }

  // 강점 기반 전략 추가
  addStrengthBasedStrategy(nextSteps, strengths) {
    if (strengths.length > 0) {
      const strongViews = strengths.map(s => this.getViewName(s.view)).join(', ');
      nextSteps.immediate.push(
        `${strongViews}에서 보여준 실력을 다른 도면에도 적용해보세요`
      );
      
      // 가장 강한 도면의 접근법을 다른 도면에 적용 제안
      const bestView = strengths[0];
      nextSteps.specificActions.push(
        `${this.getViewName(bestView.view)}에서 사용한 방법을 다른 도면에도 똑같이 적용해보기`
      );
    }
  }

  // 개선된 Hattie & Timperley 프롬프트 생성
  generateEnhancedHattieTimperleyPrompt(data) {
    const { difficulty, difficultyLabels, currentPerformance, nextSteps } = data;
    
    return `당신은 Hattie & Timperley의 피드백 모델 전문가이자 따뜻한 중학교 기술 교사입니다. 
다음 3단계 질문에 기반하여 개인 맞춤형 피드백을 제공해주세요:

**📍 FEED UP (Where am I going?) - 목표 명확화**
- 현재 도전: ${difficultyLabels[difficulty]} 난이도 (${data.difficultyDescriptions[difficulty]})
- 학습 목표: 정투상도 3면(평면도, 정면도, 우측면도) 정확히 그리기
- 성공 기준: 모든 선분의 위치와 스타일(실선/점선)이 정답과 일치

**📊 FEED BACK (How am I going?) - 현재 성과 분석**
현재 상태: ${currentPerformance.overallStatus}
- 평면도: ${currentPerformance.viewAnalysis.top?.score || 0}점 (${currentPerformance.viewAnalysis.top?.status || 'unknown'})
- 정면도: ${currentPerformance.viewAnalysis.front?.score || 0}점 (${currentPerformance.viewAnalysis.front?.status || 'unknown'})  
- 우측면도: ${currentPerformance.viewAnalysis.side?.score || 0}점 (${currentPerformance.viewAnalysis.side?.status || 'unknown'})

강점: ${currentPerformance.strengths.map(s => this.getViewName(s.view)).join(', ') || '분석 중'}
개선 필요: ${currentPerformance.weaknesses.map(w => this.getViewName(w.view)).join(', ') || '없음'}

구체적 오류:
- 선 스타일 실수: ${currentPerformance.specificErrors.styleErrors.length}건
- 누락된 선분: ${currentPerformance.specificErrors.missingLines.length}건  
- 불필요한 선분: ${currentPerformance.specificErrors.extraLines.length}건
- 부분 일치: ${currentPerformance.specificErrors.partialMatches.length}건

**🚀 FEED FORWARD (Where to next?) - 개인 맞춤 다음 단계**
즉시 실행할 것: ${nextSteps.immediate.join(', ')}
이번 시도 집중사항: ${nextSteps.shortTerm.join(', ')}
구체적 행동: ${nextSteps.specificActions.join(', ')}
연습 방법: ${nextSteps.practiceRecommendations.join(', ')}

**피드백 작성 지침:**
1. 위 3단계(Feed Up → Feed Back → Feed Forward) 순서로 구성
2. Feed Forward에 가장 많은 비중 할애 (50% 이상)
3. 구체적이고 즉시 실행 가능한 조언 제시
4. 개인의 현재 수준과 패턴을 반영한 맞춤형 내용
5. 중학생이 이해하기 쉬운 친근한 언어 사용
6. 격려와 함께 명확한 방향 제시
7. 350-500자 내외

이 학습자에게 딱 맞는 따뜻하고 구체적인 피드백을 작성해주세요.`;
  }

  // 개선된 피드백 표시 (3단계 구조 시각화)
  displayEnhancedFeedback(feedbackArea, feedback) {
    feedbackArea.className = 'ai-feedback-area enhanced';
    
    // Feed Forward 중심의 시각적 구조 제공
    feedbackArea.innerHTML = `
      <div class="feedback-header">
        <strong>👨‍🏫 AI 선생님의 개인 맞춤 조언</strong>
      </div>
      
      <div class="feedback-content">
        ${this.formatFeedbackWithStructure(feedback)}
      </div>

      <div class="feedback-actions">
        <div class="next-steps-highlight">
          💡 <strong>핵심:</strong> 위의 "다음 단계" 조언을 하나씩 실행해보세요!
        </div>
      </div>

      <div class="ai-tips">
        🎯 이 조언은 당신의 현재 실력과 패턴을 분석하여 맞춤 제작되었어요.
      </div>
    `;

    this.lastFeedbackTime = new Date();
  }

  // 피드백 구조화 포맷팅
  formatFeedbackWithStructure(feedback) {
    // 구조 식별 및 시각적 개선
    let formattedFeedback = feedback;
    
    // Feed Forward 관련 키워드 강조
    formattedFeedback = formattedFeedback.replace(
      /(다음 단계|다음에|앞으로|이제|시도해보세요|해보세요|연습해보세요|집중해보세요|확인해보세요)/g, 
      '<strong class="feed-forward-highlight">$1</strong>'
    );
    
    // 구체적 행동 지침 강조
    formattedFeedback = formattedFeedback.replace(
      /(우클릭|좌클릭|격자점|기준점|등각투상도|실선|점선)/g,
      '<span class="action-highlight">$1</span>'
    );
    
    // 점수 및 성과 부분 스타일링
    formattedFeedback = formattedFeedback.replace(
      /(\d+점|완벽|잘했어|잘하고|성공)/g,
      '<span class="achievement-highlight">$1</span>'
    );
    
    // 줄바꿈을 적절한 HTML로 변환
    formattedFeedback = formattedFeedback.replace(/\n/g, '<br>');
    
    return formattedFeedback;
  }

  // 로딩 상태 관리
  setLoadingState(button, feedbackArea, isLoading) {
    this.isProcessing = isLoading;
    button.disabled = isLoading;

    if (isLoading) {
      feedbackArea.className = 'ai-feedback-area enhanced loading';
      feedbackArea.innerHTML = '<div class="loading-spinner"></div>AI 선생님이 맞춤 조언을 준비하고 있어요...';
      button.innerHTML = '<span class="icon">⏳</span>분석 중...';
    } else {
      button.innerHTML = '<span class="icon">🤖</span>AI 선생님께 조언 받기';
    }
  }

  // 성공 피드백 표시 (기존 함수는 displayEnhancedFeedback으로 대체됨)

  // 오류 표시
  showError(feedbackArea, message) {
    feedbackArea.className = 'ai-feedback-area enhanced error';
    feedbackArea.innerHTML = `<div style="color: #c53030; text-align: center; padding: 20px;">${message}</div>`;
  }

  // 오류 처리
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
    
    feedbackArea.className = 'ai-feedback-area enhanced error';
    feedbackArea.innerHTML = `
      <div class="feedback-header">
        <strong>⚠️ AI 선생님 연결 오류</strong>
      </div>
      <div style="padding: 20px; text-align: center;">
        <div style="color: #c53030; margin-bottom: 15px;">${errorMessage}</div>
        <div style="font-size: 0.9rem; color: #666;">
          • 인터넷 연결을 확인해주세요<br>
          • 잠시 후 다시 시도해주세요
        </div>
      </div>
    `;
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

  // 헬퍼 함수들
  getViewName(viewKey) {
    const names = { top: '평면도', front: '정면도', side: '우측면도' };
    return names[viewKey] || '도면';
  }

  getNextDifficulty(current) {
    const next = { easy: '중급', medium: '상급', hard: '고급' };
    return next[current] || '다음 단계';
  }

  getStrengthReason(analysis) {
    if (analysis.matchedLines === analysis.totalAnswerLines) {
      return '모든 선분을 정확히 그렸음';
    }
    return '높은 정확도 달성';
  }

  identifyMainIssues(analysis) {
    const issues = [];
    if (analysis.missingCount > 0) issues.push('누락된 선분');
    if (analysis.extraCount > 0) issues.push('불필요한 선분');
    if (analysis.styleErrorMatches > 0) issues.push('선 스타일 실수');
    return issues;
  }

  extractScoreFromFeedback(feedback) {
    // 피드백에서 점수 추출 (간단한 정규식)
    const scoreMatch = feedback.match(/(\d+)점/);
    return scoreMatch ? parseInt(scoreMatch[1]) : 0;
  }

  identifyCommonMistakes(attempts) {
    // 공통 실수 패턴 식별 (향후 개선)
    return [];
  }

  estimateLearningStyle(attempts) {
    // 학습 스타일 추정 (향후 개선)
    return 'systematic';
  }

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