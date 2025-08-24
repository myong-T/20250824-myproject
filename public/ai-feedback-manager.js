// ai-feedback-manager.js - 개선된 AI 피드백 관리 시스템 (구체적 오류 유형 감지 추가)

import { CONFIG } from './constants.js';

export class AIFeedbackManager {
  constructor() {
    this.isProcessing = false;
    this.lastFeedbackTime = null;
    this.feedbackHistory = [];
  }

  // AI 피드백 메인 함수
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
      // 현재 상태 수집 및 완성도 판단 (개선된 오류 유형 감지 포함) - async 처리
      const analysisData = await this.prepareEnhancedAnalysisData(lastValidationResults, currentDifficulty, canvasManager);
      
      // 백엔드 API 호출
      const response = await fetch('/api/ai-feedback', {
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

  // 🆕 개선된 분석 데이터 준비 (구체적 오류 유형 감지 추가) - async 처리
  async prepareEnhancedAnalysisData(lastValidationResults, currentDifficulty, canvasManager) {
    const difficultyLabels = { easy: '하급', medium: '중급', hard: '상급' };
    const difficultyDescriptions = {
      easy: '복잡한 블록 구조 (L자형)',
      medium: '실린더 형태 (계단식, 숨은선 포함)', 
      hard: '복합 기하학적 도형 (빗면 포함)'
    };

    // 전체 완성도 판단
    const overallCompletion = this.assessOverallCompletion(lastValidationResults);
    
    // 🆕 구체적 오류 유형 감지 (async 처리)
    const specificErrors = await this.detectSpecificErrors(lastValidationResults, currentDifficulty, canvasManager);
    
    // 도면별 상세 분석
    const detailedAnalysis = this.generateDetailedAnalysis(lastValidationResults, currentDifficulty, canvasManager);
    
    // Hattie & Timperley 3단계 모형 적용 (구체적 오류 정보 포함)
    let feedbackPrompt = '';
    
    if (overallCompletion.isPerfect) {
      // 완벽한 경우: 칭찬 + 다음 단계 안내
      feedbackPrompt = this.generatePerfectFeedbackPrompt(
        currentDifficulty, 
        difficultyLabels, 
        difficultyDescriptions, 
        overallCompletion
      );
    } else {
      // 개선이 필요한 경우: 구체적 피드백 + 개선 방향 (🆕 구체적 오류 유형 포함)
      feedbackPrompt = this.generateEnhancedImprovementFeedbackPrompt(
        currentDifficulty, 
        difficultyLabels, 
        difficultyDescriptions, 
        detailedAnalysis,
        overallCompletion,
        specificErrors  // 🆕 추가
      );
    }

    return feedbackPrompt;
  }

  // 🆕 구체적 오류 유형 감지 함수 (정답 데이터 크로스 체크 방식)
  async detectSpecificErrors(lastValidationResults, currentDifficulty, canvasManager) {
    // ANSWER_DATA import 필요 (constants.js에서)
    const { ANSWER_DATA } = await import('./constants.js');
    
    const canvasData = canvasManager.getCanvasData();
    const correctAnswers = ANSWER_DATA[currentDifficulty];
    
    const errors = {
      viewPositionMistakes: [],    // 도면 위치 착각
      sizeMistakes: [],           // 크기 착각
      diagonalErrors: [],         // 대각선(빗면) 오류
      otherPatterns: []           // 기타 패턴
    };

    // 난이도별 예상 크기 정보
    const expectedSizes = {
      easy: { 
        maxWidth: 4, maxHeight: 4,
        description: '4x4 크기의 L자형 블록'
      },
      medium: { 
        maxWidth: 6, maxHeight: 4,
        description: '6x4 크기의 계단식 실린더'
      },
      hard: { 
        maxWidth: 6, maxHeight: 4,
        description: '6x4 크기의 빗면 포함 도형'
      }
    };

    const expectedSize = expectedSizes[currentDifficulty];

    // 각 도면별 오류 분석
    Object.keys(lastValidationResults).forEach(viewKey => {
      const result = lastValidationResults[viewKey];
      const userLines = canvasData[viewKey].lines;
      const viewNames = { top: '평면도', front: '정면도', side: '우측면도' };
      const viewName = viewNames[viewKey];

      // 1. 🆕 도면 위치 착각 감지 (정답 데이터 크로스 체크)
      const viewMistake = this.detectViewPositionMistakeByAnswerData(
        userLines, viewKey, currentDifficulty, correctAnswers, result.accuracy.score
      );
      if (viewMistake) {
        errors.viewPositionMistakes.push({
          view: viewName,
          mistakeType: viewMistake.type,
          suggestion: viewMistake.suggestion,
          matchedView: viewMistake.matchedView,
          matchScore: viewMistake.matchScore
        });
      }

      // 2. 크기 착각 감지
      const sizeMistake = this.detectSizeMistake(userLines, viewKey, currentDifficulty, expectedSize);
      if (sizeMistake) {
        errors.sizeMistakes.push({
          view: viewName,
          actualSize: sizeMistake.actualSize,
          expectedSize: sizeMistake.expectedSize,
          suggestion: sizeMistake.suggestion
        });
      }

      // 3. 대각선(빗면) 오류 감지 (상급 난이도만)
      if (currentDifficulty === 'hard' && viewKey === 'front') {
        const diagonalError = this.detectDiagonalError(userLines, result);
        if (diagonalError) {
          errors.diagonalErrors.push({
            view: viewName,
            errorType: diagonalError.type,
            suggestion: diagonalError.suggestion
          });
        }
      }
    });

    return errors;
  }

  // 🆕 정답 데이터 기반 도면 위치 착각 감지 (핵심 함수)
  detectViewPositionMistakeByAnswerData(userLines, currentViewKey, currentDifficulty, correctAnswers, currentScore) {
    if (userLines.length === 0) return null;
    
    // 현재 도면의 점수가 너무 높으면 위치 착각이 아님
    if (currentScore >= 90) return null;

    console.log(`[도면 위치 착각 감지] ${currentViewKey} 도면 분석 시작`);
    
    // 사용자가 그린 선분들을 격자 좌표로 변환
    const userGridLines = this.convertUserLinesToGrid(userLines);
    
    // 모든 다른 도면의 정답과 비교
    const viewKeys = ['top', 'front', 'side'];
    let bestMatch = null;
    let bestMatchScore = 0;
    
    viewKeys.forEach(answerViewKey => {
      if (answerViewKey === currentViewKey) return; // 자기 자신과는 비교하지 않음
      
      const answerLines = correctAnswers[answerViewKey];
      const matchScore = this.calculateCrossMatchScore(userGridLines, answerLines);
      
      console.log(`[크로스 체크] ${currentViewKey}에 그린 것 vs ${answerViewKey} 정답: ${matchScore.toFixed(2)}% 일치`);
      
      if (matchScore > bestMatchScore && matchScore >= 60) { // 60% 이상 일치하면 착각으로 판단
        bestMatchScore = matchScore;
        bestMatch = answerViewKey;
      }
    });

    if (bestMatch) {
      const viewNames = { top: '평면도', front: '정면도', side: '우측면도' };
      const currentViewName = viewNames[currentViewKey];
      const matchedViewName = viewNames[bestMatch];
      
      console.log(`[착각 감지] ${currentViewKey}에 ${bestMatch} 패턴을 그렸음! (${bestMatchScore.toFixed(1)}% 일치)`);
      
      return {
        type: 'view_position_mistake',
        matchedView: bestMatch,
        matchScore: bestMatchScore,
        suggestion: this.generateViewMistakeSuggestion(currentViewKey, bestMatch, currentViewName, matchedViewName)
      };
    }

    return null;
  }

  // 🆕 사용자 선분을 격자 좌표로 변환
  convertUserLinesToGrid(userLines) {
    return userLines.map(line => ({
      from: {
        x: Math.round(line.from.x / CONFIG.GRID_SIZE),
        y: Math.round(line.from.y / CONFIG.GRID_SIZE)
      },
      to: {
        x: Math.round(line.to.x / CONFIG.GRID_SIZE),
        y: Math.round(line.to.y / CONFIG.GRID_SIZE)
      },
      style: line.style || 'solid'
    }));
  }

  // 🆕 크로스 매칭 점수 계산 (사용자 선분과 다른 도면 정답의 일치도)
  calculateCrossMatchScore(userGridLines, answerLines) {
    if (userGridLines.length === 0 || answerLines.length === 0) return 0;
    
    let matchedLines = 0;
    const tolerance = 0.5;
    
    // 각 사용자 선분이 정답 선분과 얼마나 일치하는지 확인
    userGridLines.forEach(userLine => {
      const normalizedUserLine = this.normalizeLine(userLine);
      
      answerLines.forEach(answerLine => {
        const normalizedAnswerLine = this.normalizeLine(answerLine);
        
        // 위치 매칭 (스타일 무시)
        const positionMatch = this.linesEqualPosition(normalizedUserLine, normalizedAnswerLine, tolerance);
        
        if (positionMatch) {
          matchedLines++;
        }
      });
    });
    
    // 일치 비율 계산 (사용자가 그린 선분 중 정답과 일치하는 비율)
    const userMatchRate = (matchedLines / userGridLines.length) * 100;
    
    // 정답 커버리지 (정답 선분을 얼마나 커버했는지)
    let coveredAnswerLines = 0;
    answerLines.forEach(answerLine => {
      const normalizedAnswerLine = this.normalizeLine(answerLine);
      
      userGridLines.forEach(userLine => {
        const normalizedUserLine = this.normalizeLine(userLine);
        
        if (this.linesEqualPosition(normalizedUserLine, normalizedAnswerLine, tolerance)) {
          coveredAnswerLines++;
        }
      });
    });
    
    const answerCoverageRate = (coveredAnswerLines / answerLines.length) * 100;
    
    // 두 점수의 평균 (사용자 정확도 + 정답 커버리지)
    const finalScore = (userMatchRate + answerCoverageRate) / 2;
    
    return Math.min(100, finalScore); // 최대 100%
  }

  // 🆕 위치만 비교하는 선분 동등성 검사 (스타일 무시)
  linesEqualPosition(line1, line2, tolerance = 0.5) {
    return this.pointsEqual(line1.from, line2.from, tolerance) && 
           this.pointsEqual(line1.to, line2.to, tolerance);
  }

  // 🆕 점 동등성 검사
  pointsEqual(p1, p2, tolerance = 0.5) {
    return Math.abs(p1.x - p2.x) <= tolerance && Math.abs(p1.y - p2.y) <= tolerance;
  }

  // 🆕 선분 정규화 (시작점이 항상 작은 좌표가 되도록)
  normalizeLine(line) {
    let start, end;
    if (line.from.x < line.to.x || (line.from.x === line.to.x && line.from.y < line.to.y)) {
      start = { x: line.from.x, y: line.from.y };
      end = { x: line.to.x, y: line.to.y };
    } else {
      start = { x: line.to.x, y: line.to.y };
      end = { x: line.from.x, y: line.from.y };
    }
    
    return {
      from: start,
      to: end,
      style: line.style || 'solid'
    };
  }

  // 🆕 명확한 상황 설명 생성
  generateClearSituationExplanation(error) {
    const viewNames = { top: '평면도', front: '정면도', side: '우측면도' };
    const matchedViewName = viewNames[error.matchedView];
    
    return `${error.view} 칸에 ${matchedViewName} 패턴을 그렸어요 (${error.matchScore.toFixed(0)}% 일치)`;
  }

  // 도면 착각 상황별 조언 메시지 생성
  generateViewMistakeSuggestion(currentViewKey, matchedViewKey, currentViewName, matchedViewName) {
    const suggestions = {
      // 정면도에 평면도를 그린 경우
      'front-top': `정면도는 앞에서 본 모습이에요. 지금 그린 도면은 위에서 본 모습(평면도) 같아요. 물체를 정면에서 바라본 모습을 다시 생각해보세요.`,
      
      // 정면도에 우측면도를 그린 경우  
      'front-side': `정면도는 앞에서 본 모습이에요. 지금 그린 도면은 오른쪽에서 본 모습(우측면도) 같아요. 물체를 정면에서 바라본 모습을 그려보세요.`,
      
      // 평면도에 정면도를 그린 경우
      'top-front': `평면도는 위에서 본 모습이에요. 지금 그린 도면은 앞에서 본 모습(정면도) 같아요. 물체를 위에서 내려다본 모습을 생각해보세요.`,
      
      // 평면도에 우측면도를 그린 경우
      'top-side': `평면도는 위에서 본 모습이에요. 지금 그린 도면은 오른쪽에서 본 모습(우측면도) 같아요. 물체를 위에서 내려다본 모습을 그려보세요.`,
      
      // 우측면도에 정면도를 그린 경우
      'side-front': `우측면도는 오른쪽에서 본 모습이에요. 지금 그린 도면은 앞에서 본 모습(정면도) 같아요. 물체를 오른쪽에서 바라본 모습을 생각해보세요.`,
      
      // 우측면도에 평면도를 그린 경우
      'side-top': `우측면도는 오른쪽에서 본 모습이에요. 지금 그린 도면은 위에서 본 모습(평면도) 같아요. 물체를 오른쪽에서 바라본 모습을 그려보세요.`
    };

    const key = `${currentViewKey}-${matchedViewKey}`;
    return suggestions[key] || `${currentViewName}는 해당 방향에서 본 모습이에요. 지금 그린 도면은 다른 방향에서 본 모습 같아요. 올바른 시점에서 다시 생각해보세요.`;
  }

  // 🆕 크기 착각 감지
  detectSizeMistake(userLines, viewKey, currentDifficulty, expectedSize) {
    if (userLines.length === 0) return null;

    // 사용자가 그린 도면의 실제 크기 계산
    const actualSize = this.calculateDrawingSize(userLines);
    
    // 예상 크기와 비교 (격자 단위)
    const tolerance = 1; // 1격자 오차 허용
    
    if (actualSize.width > expectedSize.maxWidth + tolerance) {
      return {
        actualSize: `가로 ${actualSize.width}칸`,
        expectedSize: `가로 최대 ${expectedSize.maxWidth}칸`,
        suggestion: `도형의 최대 가로 길이를 다시 확인해보세요. ${expectedSize.description}이에요.`
      };
    }

    if (actualSize.height > expectedSize.maxHeight + tolerance) {
      return {
        actualSize: `세로 ${actualSize.height}칸`,
        expectedSize: `세로 최대 ${expectedSize.maxHeight}칸`,
        suggestion: `도형의 최대 세로 길이를 다시 확인해보세요. ${expectedSize.description}이에요.`
      };
    }

    return null;
  }

  // 🆕 대각선(빗면) 오류 감지 (상급 난이도 전용)
  detectDiagonalError(userLines, validationResult) {
    if (userLines.length === 0) return null;

    // 대각선이 있는지 확인
    const hasDiagonal = userLines.some(line => {
      const dx = Math.abs(line.to.x - line.from.x);
      const dy = Math.abs(line.to.y - line.from.y);
      return dx > 0 && dy > 0; // 기울어진 선
    });

    if (!hasDiagonal && validationResult.accuracy.score < 80) {
      return {
        type: 'missing_diagonal',
        suggestion: '빗면(대각선)이 빠진 것 같아요. 도형의 기울어진 면을 대각선으로 표현해보세요.'
      };
    }

    if (hasDiagonal) {
      // 대각선의 시작점과 끝점이 올바른지 확인
      const diagonalLines = userLines.filter(line => {
        const dx = Math.abs(line.to.x - line.from.x);
        const dy = Math.abs(line.to.y - line.from.y);
        return dx > 0 && dy > 0;
      });

      if (diagonalLines.length > 0 && validationResult.accuracy.score < 90) {
        return {
          type: 'wrong_diagonal_position',
          suggestion: '빗면의 시작점이나 끝점을 다시 확인해보세요. 빗면이 지나가는 정확한 위치를 생각해보세요.'
        };
      }
    }

    return null;
  }

  // 🆕 선분 패턴 분석 (도면 유형 추정용)
  analyzeLinePatterns(userLines) {
    if (userLines.length === 0) return { shape: 'empty' };

    let hasInternalVertical = false;
    let hasInternalHorizontal = false;
    let hasDiagonal = false;
    let rectangularLines = 0;

    userLines.forEach(line => {
      const dx = Math.abs(line.to.x - line.from.x);
      const dy = Math.abs(line.to.y - line.from.y);

      if (dx > 0 && dy > 0) {
        hasDiagonal = true;
      } else if (dx > 0) {
        // 수평선
        hasInternalHorizontal = true;
        rectangularLines++;
      } else if (dy > 0) {
        // 수직선
        hasInternalVertical = true;
        rectangularLines++;
      }
    });

    // 형태 추정
    let shape = 'unknown';
    if (hasDiagonal) {
      shape = 'diagonal';
    } else if (rectangularLines >= 4) {
      if (userLines.length > 6) {
        shape = 'stepped';
      } else if (userLines.length <= 6 && hasInternalVertical !== hasInternalHorizontal) {
        shape = 'L-shaped';
      } else {
        shape = 'rectangular';
      }
    }

    return {
      shape,
      hasInternalVertical,
      hasInternalHorizontal,
      hasDiagonal
    };
  }

  // 🆕 도면 크기 계산
  calculateDrawingSize(userLines) {
    if (userLines.length === 0) return { width: 0, height: 0 };

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    userLines.forEach(line => {
      const x1 = line.from.x / CONFIG.GRID_SIZE;
      const y1 = line.from.y / CONFIG.GRID_SIZE;
      const x2 = line.to.x / CONFIG.GRID_SIZE;
      const y2 = line.to.y / CONFIG.GRID_SIZE;

      minX = Math.min(minX, x1, x2);
      maxX = Math.max(maxX, x1, x2);
      minY = Math.min(minY, y1, y2);
      maxY = Math.max(maxY, y1, y2);
    });

    return {
      width: Math.round(maxX - minX),
      height: Math.round(maxY - minY)
    };
  }

  // 🆕 개선된 피드백 프롬프트 생성 (구체적 오류 유형 포함)
  generateEnhancedImprovementFeedbackPrompt(currentDifficulty, difficultyLabels, difficultyDescriptions, detailedAnalysis, completion, specificErrors) {
    // 기존 개선점 정리
    let improvementPoints = '';
    let locationHints = '';
    
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

    // 🆕 구체적 오류 유형별 안내 추가
    let specificErrorGuidance = '';
    
    // 1. 도면 위치 착각 오류
    if (specificErrors.viewPositionMistakes.length > 0) {
      specificErrorGuidance += `\n**🎯 중요한 도면 위치 오류를 발견했어요:**\n`;
      specificErrors.viewPositionMistakes.forEach(error => {
        // 더 명확한 설명 추가
        const situationExplanation = this.generateClearSituationExplanation(error);
        specificErrorGuidance += `- ${situationExplanation}\n`;
        specificErrorGuidance += `  → ${error.suggestion}\n`;
      });
    }

    // 2. 크기 착각 오류
    if (specificErrors.sizeMistakes.length > 0) {
      specificErrorGuidance += `\n**📏 도형 크기를 다시 확인해보세요:**\n`;
      specificErrors.sizeMistakes.forEach(error => {
        specificErrorGuidance += `- ${error.view}: ${error.suggestion}\n`;
        specificErrorGuidance += `  (그린 크기: ${error.actualSize}, 정답 크기: ${error.expectedSize})\n`;
      });
    }

    // 3. 대각선(빗면) 오류 (상급 난이도에서만 언급)
    if (currentDifficulty === 'hard' && specificErrors.diagonalErrors.length > 0) {
      specificErrorGuidance += `\n**📐 빗면(대각선) 그리기:**\n`;
      specificErrors.diagonalErrors.forEach(error => {
        specificErrorGuidance += `- ${error.view}: ${error.suggestion}\n`;
      });
    }

    // 중급 난이도 숨은선 특별 안내
    let hiddenLineGuide = '';
    if (currentDifficulty === 'medium') {
      const sideScore = completion.viewResults.side;
      if (sideScore < 100) {
        hiddenLineGuide = `\n**🔍 중급 과정 특별 안내 - 숨은선 그리기:**
우측면도에서 가운데 가로선은 점선으로 그려야 해요. 앞쪽 부분이 뒤쪽을 가려서 직접 보이지 않기 때문이에요.
- 그린 선에 마우스 오른쪽 버튼을 클릭하면 점선으로 바뀌어요
- 보이는 선은 실선, 안 보이는 선은 점선이 도면의 기본 규칙이에요`;
      }
    }

    return `당신은 10년 경력의 따뜻하고 친절한 기술 AI 선생님입니다. 중학교 1학년 학생이 ${difficultyLabels[currentDifficulty]}급 도면(${difficultyDescriptions[currentDifficulty]})을 그렸는데 개선할 점이 있습니다.

**학생 성과:**
- 평면도: ${completion.viewResults.top}점
- 정면도: ${completion.viewResults.front}점  
- 우측면도: ${completion.viewResults.side}점
- 전체 평균: ${completion.averageScore}점

**기본 개선사항:**${improvementPoints}

**🆕 구체적인 학습 포인트:**${specificErrorGuidance}${hiddenLineGuide}

**⚠️ 중요 지침:**
- 도면 위치 착각이 감지된 경우: 학생이 어느 칸에 어떤 패턴을 그렸는지 정확히 파악하고, 올바른 방향에서 본 모습을 설명해주세요
- 크기 착각이 감지된 경우: "도형의 최대 크기를 생각해보자"라고 안내해주세요
- ${currentDifficulty === 'hard' ? '빗면 오류가 감지된 경우에만 빗면 관련 조언을 해주세요' : '이 난이도에는 빗면이 없으므로 빗면에 대해 언급하지 마세요'}

**피드백 작성 원칙 (Hattie & Timperley 모형 적용):**

1단계 - 과제 수준 피드백 (Task Level):
- 잘한 부분을 먼저 구체적으로 인정하기
- 틀린 부분을 정확하고 친절하게 설명하기  
- 구체적 오류 유형(도면 위치 착각, 크기 착각, 빗면 오류)을 자연스럽게 포함하기

2단계 - 과정 수준 피드백 (Process Level):
- 어떤 방법으로 개선할 수 있는지 구체적 전략 제시
- "어떤 칸에 어떤 패턴을 그렸는지" 정확히 이해하고 올바른 시점에서의 사고 과정 안내
- 단계별 접근 방법 제시하기

3단계 - 자기조절 수준 피드백 (Self-regulation Level):
- 스스로 점검하고 개선할 수 있는 방법 제시
- 다음 시도에 대한 동기 부여하기
- 성공 가능성에 대한 확신 심어주기

**🆕 특별 주의사항:**
- 도면 위치 착각: 구체적으로 "○○ 칸에 △△ 패턴을 그렸다"는 사실을 바탕으로 올바른 시점 안내
- 난이도별 적절한 조언: ${currentDifficulty}급 난이도에 맞는 수준의 조언만 제공
- 혼란 방지: 학생이 실제로 한 실수에만 집중하여 명확하게 조언

**작성 가이드:**
- 중학교 1학년이 이해하기 쉬운 친근한 말투
- 실망하지 않도록 격려하면서 개선점 제시
- 구체적이고 실행 가능한 방법 안내
- 영어 단어 사용 금지  
- 따뜻하고 부드러운 AI 선생님의 어투
- 비판보다는 건설적 조언 중심

**답변 형식:**
잘한 점 (현재 성취 인정과 격려)
고칠 점 (구체적 개선 사항과 방법, 🆕 구체적 오류 유형 자연스럽게 포함)
다음 단계 (실행 방법과 동기 부여)

300-450자 내외로 따뜻하고 격려하는 톤으로 작성해주세요.`;
  }

  // 전체 완성도 평가 (기존 함수 유지)
  assessOverallCompletion(lastValidationResults) {
    const scores = Object.values(lastValidationResults).map(result => result.accuracy.score);
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const averageScore = Math.round(totalScore / scores.length);
    const perfectCount = scores.filter(score => score === 100).length;
    const highScoreCount = scores.filter(score => score >= 90).length;
    const lowScoreCount = scores.filter(score => score < 70).length;
    
    return {
      isPerfect: perfectCount === 3,
      isNearPerfect: perfectCount >= 2 || highScoreCount === 3,
      hasLowScores: lowScoreCount > 0,
      averageScore: averageScore,
      perfectCount: perfectCount,
      highScoreCount: highScoreCount,
      lowScoreCount: lowScoreCount,
      scores: scores,
      viewResults: {
        top: lastValidationResults.top.accuracy.score,
        front: lastValidationResults.front.accuracy.score,
        side: lastValidationResults.side.accuracy.score
      }
    };
  }

  // 완벽한 도면에 대한 피드백 프롬프트 (기존 함수 유지)
  generatePerfectFeedbackPrompt(currentDifficulty, difficultyLabels, difficultyDescriptions, completion) {
    const nextLevelSuggestions = {
      easy: {
        nextLevel: '중급',
        nextChallenge: '숨은선(점선) 개념을 배우고 실린더 형태의 도형',
        skillBuilding: '공간 감각을 더욱 발전시켜 보이지 않는 부분까지 정확히 표현하는 연습'
      },
      medium: {
        nextLevel: '상급',
        nextChallenge: '빗면이 포함된 복합 기하학적 도형',
        skillBuilding: '기울어진 면과 곡면이 있는 복잡한 형태의 도면 작성'
      },
      hard: {
        nextLevel: '응용 과정',
        nextChallenge: '실제 기계 부품이나 건축 요소의 도면',
        skillBuilding: '산업 현장에서 사용되는 실무 도면 작성 기법'
      }
    };

    const nextStep = nextLevelSuggestions[currentDifficulty];

    return `당신은 10년 경력의 따뜻하고 친절한 기술 AI 선생님입니다. 중학교 1학년 학생이 ${difficultyLabels[currentDifficulty]}급 도면(${difficultyDescriptions[currentDifficulty]})을 완벽하게 완성했습니다.

**학생 성과:**
- 평면도: ${completion.viewResults.top}점 (완벽!)
- 정면도: ${completion.viewResults.front}점 (완벽!)
- 우측면도: ${completion.viewResults.side}점 (완벽!)
- 전체 평균: ${completion.averageScore}점

**피드백 작성 원칙 (Hattie & Timperley 모형 적용):**

1단계 - 과제 수준 피드백 (Task Level):
- 무엇을 잘했는지 구체적으로 인정하기
- 도면의 정확성과 완성도 칭찬하기
- 학습 목표 달성을 명확히 인정하기

2단계 - 과정 수준 피드백 (Process Level):  
- 학생의 학습 과정과 전략을 칭찬하기
- 공간 감각, 정확성, 체계적 접근 등 강점 인정하기
- 좋은 학습 습관이나 태도 격려하기

3단계 - 자기조절 수준 피드백 (Self-regulation Level):
- 다음 단계 학습 동기 부여하기
- ${nextStep.nextLevel} 과정으로의 발전 가능성 제시하기
- 자신감과 도전 의식 북돋우기

**다음 학습 방향 제시:**
- 다음 도전: ${nextStep.nextChallenge}
- 발전 방향: ${nextStep.skillBuilding}

**작성 가이드:**
- 중학교 1학년이 이해하기 쉬운 친근한 말투
- 과도한 칭찬보다는 구체적이고 진심 어린 격려
- 성취감을 느끼게 하면서 다음 목표 제시
- 영어 단어 사용 금지
- 따뜻하고 부드러운 AI 선생님의 어투

**답변 형식:**
완벽해요 (구체적 칭찬과 성취 인정)
잘한 점 (학습 과정과 전략 칭찬)  
다음 도전 (발전 방향과 동기 부여)

250-300자 내외로 따뜻하고 격려하는 톤으로 작성해주세요.`;
  }

  // 상세 분석 데이터 생성 (기존 함수 유지)
  generateDetailedAnalysis(lastValidationResults, currentDifficulty, canvasManager) {
    const canvasData = canvasManager.getCanvasData();
    const answerCounts = {
      easy: { top: 5, front: 6, side: 5 },
      medium: { top: 6, front: 8, side: 5 },
      hard: { top: 5, front: 5, side: 5 }
    };

    const currentAnswerCount = answerCounts[currentDifficulty];
    let detailedAnalysis = {};

    Object.keys(lastValidationResults).forEach(key => {
      const result = lastValidationResults[key];
      const userLines = canvasData[key].lines;
      
      detailedAnalysis[key] = {
        score: result.accuracy.score,
        drawnCount: userLines.length,
        correctCount: currentAnswerCount[key],
        missingCount: result.accuracy.missing.length,
        extraCount: result.accuracy.extra.length,
        styleErrorCount: result.accuracy.detailedAnalysis.styleErrors ? result.accuracy.detailedAnalysis.styleErrors.length : 0,
        completionRate: result.accuracy.detailedAnalysis.completionRate,
        precisionRate: result.accuracy.detailedAnalysis.precisionRate,
        styleErrors: result.accuracy.detailedAnalysis.styleErrors || []
      };
    });

    return detailedAnalysis;
  }

  // 로딩 상태 관리 (기존 함수 유지)
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

  // 성공 피드백 표시 (기존 함수 유지)
  displayFeedback(feedbackArea, feedback) {
    feedbackArea.className = 'ai-feedback-area';
    feedbackArea.innerHTML = `<strong>👨‍🏫 AI 선생님의 조언:</strong>

${feedback}

<div class="ai-tips">
💡 AI 선생님의 조언은 학습에 도움이 되도록 작성되었어요. 기본 점수는 위의 정답 확인을 참고해주세요.
</div>`;

    this.lastFeedbackTime = new Date();
  }

  // 오류 표시 (기존 함수 유지)
  showError(feedbackArea, message) {
    feedbackArea.className = 'ai-feedback-area error';
    feedbackArea.innerHTML = `<div style="color: #c53030;">${message}</div>`;
  }

  // 오류 처리 (기존 함수 유지)
  handleError(feedbackArea, error) {
    let errorMessage = error.message;
    if (error.message.includes('Failed to fetch')) {
      errorMessage = 'AI 선생님께 연결할 수 없어요. 서버가 실행중인지 확인해주세요.';
    }
    
    feedbackArea.className = 'ai-feedback-area error';
    feedbackArea.innerHTML = `⚠️ AI 선생님의 조언을 받아오는 중에 문제가 생겼어요.

문제 내용: ${errorMessage}

• 서버가 실행중인지 확인해주세요 (http://localhost:3001)
• 인터넷 연결을 확인해주세요  
• 잠시 후 다시 시도해주세요`;
  }

  // AI 피드백 초기화 (기존 함수 유지)
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

  // 피드백 이력 저장 (기존 함수 유지)
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
    
    console.log('AI 피드백 이력 저장됨:', entry);
  }

  // 분석 데이터에서 난이도 추출 (기존 함수 유지)
  extractDifficultyFromData(analysisData) {
    if (analysisData.includes('하급')) return 'easy';
    if (analysisData.includes('중급')) return 'medium';
    if (analysisData.includes('상급')) return 'hard';
    return 'unknown';
  }

  // 피드백 이력 관련 메서드들 (기존 함수들 유지)
  getFeedbackHistory() {
    return [...this.feedbackHistory];
  }

  getLastFeedbackTime() {
    return this.lastFeedbackTime;
  }

  getFeedbackStats() {
    const stats = {
      totalRequests: this.feedbackHistory.length,
      byDifficulty: {
        easy: 0,
        medium: 0,
        hard: 0
      },
      averageResponseLength: 0,
      lastRequestTime: this.lastFeedbackTime
    };

    if (this.feedbackHistory.length > 0) {
      this.feedbackHistory.forEach(entry => {
        if (stats.byDifficulty[entry.difficulty] !== undefined) {
          stats.byDifficulty[entry.difficulty]++;
        }
      });

      const totalLength = this.feedbackHistory.reduce((sum, entry) => 
        sum + (entry.feedback ? entry.feedback.length : 0), 0);
      stats.averageResponseLength = Math.round(totalLength / this.feedbackHistory.length);
    }

    return stats;
  }

  clearFeedbackHistory() {
    this.feedbackHistory = [];
    this.lastFeedbackTime = null;
    console.log('AI 피드백 이력이 초기화되었습니다.');
  }
}