// learning-analyzer.js - 학습 결과 분석 시스템 (최고 점수 도면 이미지 표시)

export class LearningAnalyzer {
  constructor() {
    this.isAIAnalyzing = false;
  }

  // 학습 결과 분석 및 표시 (매 세션마다 AI 선생님 분석 실행)
  async displayLearningResults(learningSession) {
    const session = learningSession;
    
    try {
      // 기본 통계 표시
      this.displayBasicStats(session);
      
      // 🆕 최고 점수 도면 이미지 표시 (마지막 시도가 아닌 최고 점수 시도)
      this.displayBestDrawingImages(session);
      
      // 🆕 기존 성취도 표시 대신 새로운 배지 컬렉션 표시
      await this.displayBadgeCollection(session);
      
      // AI 선생님 분석 매번 실행 (세션별로 새로운 분석)
      await this.runAutoTeacherAnalysis(session);
      
    } catch (error) {
      console.error('학습 결과 표시 중 오류:', error);
    }
  }

  // 🆕 최고 점수 도면 이미지 표시 (기존 displayDrawingImages 함수 개선)
  displayBestDrawingImages(session) {
    try {
      if (!session.attempts || session.attempts.length === 0) {
        console.warn('시도 기록이 없어 도면 이미지를 표시할 수 없습니다.');
        return;
      }

      // 각 도면별로 최고 점수를 달성한 시도 찾기
      const bestAttempts = this.findBestAttemptsForEachView(session);
      
      console.log('각 도면별 최고 점수 시도:', bestAttempts);
      
      // 각 도면 카드에 이미지 추가
      Object.keys(bestAttempts).forEach(key => {
        const statsElement = document.getElementById(`${key}Stats`);
        if (statsElement && statsElement.parentElement) {
          const statCard = statsElement.parentElement;
          
          // 기존 이미지가 있다면 제거
          const existingImage = statCard.querySelector('.drawing-preview');
          if (existingImage) {
            existingImage.remove();
          }
          
          const bestAttempt = bestAttempts[key];
          if (bestAttempt && bestAttempt.canvasLines && bestAttempt.canvasLines[key]) {
            // 최고 점수 캔버스 이미지 생성
            const imageData = this.generateCanvasImage(
              bestAttempt.canvasLines[key], 
              session.difficulty, 
              key
            );
            
            if (imageData) {
              // 이미지 엘리먼트 생성
              const imageElement = document.createElement('img');
              imageElement.src = imageData;
              imageElement.className = 'drawing-preview';
              imageElement.alt = `${this.getViewName(key)} 최고 점수 도면`;
              imageElement.title = `${bestAttempt.scores[key]}점 달성 (시도 ${bestAttempt.attemptNumber})`;
              
              // CSS 스타일 적용 (기존 스타일과 동일)
              imageElement.style.cssText = `
                width: 100px;
                height: 100px;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-top: 8px;
                background-color: white;
                display: block;
                margin-left: auto;
                margin-right: auto;
                cursor: help;
              `;
              
              // 이미지를 stat-value 아래에 추가
              statsElement.parentElement.appendChild(imageElement);
              
              console.log(`${key} 도면 이미지 추가 완료 (${bestAttempt.scores[key]}점)`);
            }
          }
        }
      });
      
    } catch (error) {
      console.error('최고 점수 도면 이미지 표시 중 오류:', error);
    }
  }

  // 🆕 각 도면별로 최고 점수를 달성한 시도 찾기
  findBestAttemptsForEachView(session) {
    const bestAttempts = {};
    
    // 각 도면별로 초기화
    ['top', 'front', 'side'].forEach(viewKey => {
      bestAttempts[viewKey] = null;
      let bestScore = -1;
      
      // 모든 시도를 검사하여 해당 도면의 최고 점수 찾기
      session.attempts.forEach(attempt => {
        if (attempt.canvasLines && attempt.canvasLines[viewKey] && attempt.scores[viewKey] > bestScore) {
          bestScore = attempt.scores[viewKey];
          bestAttempts[viewKey] = attempt;
        }
      });
      
      console.log(`${viewKey} 도면 최고 점수: ${bestScore}점 (시도 ${bestAttempts[viewKey]?.attemptNumber || '없음'})`);
    });
    
    return bestAttempts;
  }

  // 🆕 도면 이름 반환 헬퍼 함수
  getViewName(viewKey) {
    const viewNames = { top: '평면도', front: '정면도', side: '우측면도' };
    return viewNames[viewKey] || '도면';
  }

  // 캔버스에서 이미지 생성 (기존 함수 유지)
  generateCanvasImage(lines, difficulty, viewKey) {
    try {
      // 임시 캔버스 생성
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      
      // 배경 색상
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 격자 그리기 (축소된 크기)
      const gridSize = 20; // 원본 30에서 20으로 축소
      ctx.strokeStyle = "#e0e0e0";
      ctx.lineWidth = 1;
      
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // 기준점 그리기
      const referencePoints = {
        easy: {
          top: { x: 3, y: 3, color: "green" },
          front: { x: 3, y: 7, color: "blue" },
          side: { x: 7, y: 7, color: "red" }
        },
        medium: {
          top: { x: 2, y: 3, color: "green" },
          front: { x: 2, y: 7, color: "blue" },
          side: { x: 7, y: 7, color: "red" }
        },
        hard: {
          top: { x: 2, y: 3, color: "green" },
          front: { x: 2, y: 7, color: "blue" },
          side: { x: 7, y: 7, color: "red" }
        }
      };
      
      const refPoint = referencePoints[difficulty][viewKey];
      const referenceX = refPoint.x * gridSize;
      const referenceY = refPoint.y * gridSize;
      
      ctx.fillStyle = refPoint.color;
      ctx.beginPath();
      ctx.arc(referenceX, referenceY, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // 선분들 그리기
      ctx.lineWidth = 2;
      lines.forEach(line => {
        ctx.strokeStyle = "black";
        
        // 선 스타일 설정
        if (line.style === 'dashed') {
          ctx.setLineDash([6, 3]); // 점선 (축소됨)
        } else {
          ctx.setLineDash([]); // 실선
        }
        
        // 좌표를 축소된 크기에 맞게 변환 (30 -> 20)
        const fromX = (line.from.x / 30) * gridSize;
        const fromY = (line.from.y / 30) * gridSize;
        const toX = (line.to.x / 30) * gridSize;
        const toY = (line.to.y / 30) * gridSize;
        
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
      });
      
      // 점선 설정 초기화
      ctx.setLineDash([]);
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('캔버스 이미지 생성 중 오류:', error);
      return null;
    }
  }

  // 기본 통계 표시
  displayBasicStats(session) {
    try {
      // 난이도 표시
      const difficultyLabels = { easy: '하급', medium: '중급', hard: '상급' };
      const difficultyColors = { easy: '#28a745', medium: '#fd7e14', hard: '#dc3545' };
      const difficultyEmojis = { easy: '🌱', medium: '🚀', hard: '🏆' };
      
      const difficultyBadgeElement = document.getElementById('resultsDifficultyBadge');
      if (difficultyBadgeElement) {
        const difficultyLabel = difficultyLabels[session.difficulty] || '알 수 없음';
        const difficultyColor = difficultyColors[session.difficulty] || '#6c757d';
        const difficultyEmoji = difficultyEmojis[session.difficulty] || '📋';
        
        difficultyBadgeElement.innerHTML = `
          <span style="
            background-color: ${difficultyColor};
            color: white;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.9rem;
            font-weight: bold;
            display: inline-flex;
            align-items: center;
            gap: 5px;
          ">
            ${difficultyEmoji} ${difficultyLabel}
          </span>
        `;
      }
      
      // 총 학습 시간 계산
      const totalTime = Math.round((session.endTime - session.startTime) / 1000 / 60);
      const totalTimeElement = document.getElementById('totalTime');
      if (totalTimeElement) {
        totalTimeElement.textContent = `${totalTime}분`;
      }
      
      // 총 시도 횟수
      const totalAttemptsElement = document.getElementById('totalAttempts');
      if (totalAttemptsElement) {
        totalAttemptsElement.textContent = `${session.attempts.length}회`;
      }
      
      // 최고 점수와 최종 점수
      const lastAttempt = session.attempts[session.attempts.length - 1];
      const bestOverall = Math.max(
        session.bestScores.top,
        session.bestScores.front, 
        session.bestScores.side
      );
      const finalOverall = Math.round(
        (lastAttempt.scores.top + lastAttempt.scores.front + lastAttempt.scores.side) / 3
      );
      
      const bestScoreElement = document.getElementById('bestScore');
      if (bestScoreElement) {
        bestScoreElement.textContent = `${bestOverall}점`;
      }
      
      const finalScoreElement = document.getElementById('finalScore');
      if (finalScoreElement) {
        finalScoreElement.textContent = `${finalOverall}점`;
      }
      
      // 도면별 상세 분석
      const topStatsElement = document.getElementById('topStats');
      if (topStatsElement) {
        topStatsElement.textContent = `${session.bestScores.top}점`;
      }
      
      const frontStatsElement = document.getElementById('frontStats');
      if (frontStatsElement) {
        frontStatsElement.textContent = `${session.bestScores.front}점`;
      }
      
      const sideStatsElement = document.getElementById('sideStats');
      if (sideStatsElement) {
        sideStatsElement.textContent = `${session.bestScores.side}점`;
      }
      
    } catch (error) {
      console.error('기본 통계 표시 중 오류:', error);
    }
  }

  // 자동 AI 선생님 분석 실행
  async runAutoTeacherAnalysis(session) {
    const analysisArea = document.getElementById('aiPatternAnalysis');
    
    if (!analysisArea) {
      console.error('AI 선생님 분석 영역을 찾을 수 없습니다.');
      return;
    }

    // 로딩 상태 표시 (매번 새로 표시)
    analysisArea.innerHTML = `
      <div class="loading-content" style="
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 120px;
        color: #6c757d;
      ">
        <div class="loading-spinner" style="
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #6C63FF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 10px;
        "></div>
        AI 선생님이 학습 패턴을 분석하고 있습니다...
      </div>
    `;

    this.isAIAnalyzing = true;

    try {
      // 학습 분석 데이터 준비
      const analysisData = this.prepareLearningAnalysisData(session);
      
      if (!analysisData) {
        throw new Error('분석 데이터 준비 실패');
      }
      
      // 백엔드 API 호출
      const response = await fetch('/api/learning-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analysisData: analysisData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'AI 선생님 분석 서버 오류가 발생했습니다.');
      }

      // 성공적으로 분석 받음
      this.displayTeacherPatternAnalysis(analysisArea, result.analysis);

    } catch (error) {
      console.error('자동 AI 선생님 분석 오류:', error);
      this.handleTeacherAnalysisError(analysisArea, error);
    } finally {
      this.isAIAnalyzing = false;
    }
  }

  // AI 선생님 패턴 분석 결과 표시
  displayTeacherPatternAnalysis(analysisArea, analysis) {
    if (analysisArea) {
      analysisArea.innerHTML = `<div class="ai-analysis-content">${analysis}</div><div class="ai-tips" style="
          background-color: #e7f3ff;
          border: 1px solid #b3d9ff;
          border-radius: 6px;
          padding: 10px;
          margin-top: 15px;
          font-size: 0.85rem;
          color: #0066cc;
          text-align: center;
        ">💡 이 분석은 AI 선생님이 학습 패턴을 종합적으로 분석한 결과입니다.</div>`;
    }
  }

  // AI 선생님 분석 오류 처리
  handleTeacherAnalysisError(analysisArea, error) {
    let errorMessage = error.message;
    if (error.message.includes('Failed to fetch')) {
      errorMessage = '서버에 연결할 수 없습니다.';
    } else if (error.message.includes('HTTP 401')) {
      errorMessage = 'API 키 인증 오류입니다.';
    } else if (error.message.includes('HTTP 429')) {
      errorMessage = 'API 요청 한도를 초과했습니다.';
    } else if (error.message.includes('HTTP 500')) {
      errorMessage = '서버 내부 오류가 발생했습니다.';
    }
    
    if (analysisArea) {
      analysisArea.innerHTML = `
        <div class="ai-error-content" style="
          color: #dc3545;
          text-align: center;
          padding: 20px;
        ">
          <div style="font-size: 1.2rem; margin-bottom: 10px;">⚠️</div>
          <div style="font-weight: bold; margin-bottom: 5px;">AI 선생님 분석 중 오류가 발생했습니다</div>
          <div style="font-size: 0.9rem; color: #6c757d;">${errorMessage}</div>
          <button onclick="location.reload()" style="
            margin-top: 15px;
            padding: 8px 16px;
            background-color: #6C63FF;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">다시 시도</button>
        </div>
      `;
    }
  }

  // 학습 분석 데이터 준비
  prepareLearningAnalysisData(session) {
    try {
      const summary = this.getLearningSummary(session);
      const viewProgress = {
        top: this.getViewProgress(session, 'top'),
        front: this.getViewProgress(session, 'front'),
        side: this.getViewProgress(session, 'side')
      };

      const detailedPatterns = this.getDetailedLearningPatterns(session);
      
      const difficultyInfo = {
        easy: '하급 - 복잡한 블록 구조 (L자형)',
        medium: '중급 - 실린더 형태 (계단식, 숨은선 포함)',
        hard: '상급 - 복합 기하학적 도형 (빗면 포함)'
      };

      const analysisPrompt = `당신은 경력 15년의 기술교육 전문가이자 학습 분석 전문가인 AI 선생님입니다. 중학생의 정투상도 학습 결과를 종합적으로 분석하고, 개인 맞춤형 학습 방향을 제시해주세요.

**학습자 정보:**
- 학습 난이도: ${session.difficulty}급 (${difficultyInfo[session.difficulty]})
- 총 학습 시간: ${summary.totalTime}분
- 총 시도 횟수: ${summary.totalAttempts}회
- 최고 점수: ${summary.bestScore}점
- 최종 점수: ${summary.finalScore}점
- 점수 향상도: ${summary.improvement}점

**도면별 학습 성과:**
1. **평면도**: ${viewProgress.top.bestScore}점 (시도 ${viewProgress.top.attemptCount}회, 추세: ${this.getTrendKorean(viewProgress.top.trend)}, 일관성: ${viewProgress.top.consistency}%)
2. **정면도**: ${viewProgress.front.bestScore}점 (시도 ${viewProgress.front.attemptCount}회, 추세: ${this.getTrendKorean(viewProgress.front.trend)}, 일관성: ${viewProgress.front.consistency}%)
3. **우측면도**: ${viewProgress.side.bestScore}점 (시도 ${viewProgress.side.attemptCount}회, 추세: ${this.getTrendKorean(viewProgress.side.trend)}, 일관성: ${viewProgress.side.consistency}%)

**학습 패턴 분석:**
- 학습 집중도: ${detailedPatterns.focusLevel}
- 학습 지속성: ${detailedPatterns.persistence}
- 오류 개선 패턴: ${detailedPatterns.errorImprovement}
- 강점 도면: ${detailedPatterns.strengths.join(', ')}
- 약점 도면: ${detailedPatterns.weaknesses.join(', ')}
- 특이 패턴: ${detailedPatterns.uniquePatterns.join(', ')}

**시간대별 성과 변화:**
${this.getTimeBasedAnalysis(session)}

**분석 요청 사항:**
다음 형식으로 간결하고 친근하게 분석해주세요:

## 📊 **현재 학습 상황**
(이해도 수준, 강약점, 학습 태도 등을 2-3문장으로)

## 🎯 **개인 학습 특성**
(이 학습자만의 패턴과 선호 방식을 2-3문장으로)

## 🚀 **다음 학습 방향**
(구체적인 다음 단계와 목표를 2-3문장으로)

## 💡 **실습 개선 방법**
(당장 실천할 수 있는 방법 2-3가지를 간단히)

**답변 조건:**
- 중학생이 쉽게 이해할 수 있는 친근한 언어
- 총 400-600자 내외
- 격려와 동기부여 포함
- 구체적이고 실행 가능한 조언
- 과도한 부담 주지 않기
- 영어 단어 사용 금지`;

      return analysisPrompt;
    } catch (error) {
      console.error('학습 분석 데이터 준비 중 오류:', error);
      return null;
    }
  }

  // 🆕 배지 컬렉션 표시 (기존 displayAchievements 대체)
  async displayBadgeCollection(session) {
    const achievementArea = document.getElementById('achievementArea');
    
    if (!achievementArea) {
      console.warn('성취도 표시 영역을 찾을 수 없습니다.');
      return;
    }

    try {
      // BadgeSystem을 동적으로 import
      const { BadgeSystem } = await import('./badge-system.js');
      const badgeSystem = new BadgeSystem();
      
      // CSS 스타일 추가
      badgeSystem.addBadgeStyles();
      
      // 배지 컬렉션 HTML 생성 및 표시
      achievementArea.innerHTML = badgeSystem.generateBadgeCollectionHTML(session);
      
      console.log('배지 컬렉션 표시 완료');
    } catch (error) {
      console.error('배지 컬렉션 표시 중 오류:', error);
      
      // 오류 발생 시 기본 메시지 표시
      achievementArea.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #666;">
          <h3>🏆 학습 배지</h3>
          <p>배지 시스템을 불러오는 중 오류가 발생했습니다.</p>
          <p>새로고침 후 다시 시도해주세요.</p>
        </div>
      `;
    }
  }

  // 학습 통계 요약 반환
  getLearningSummary(session) {
    try {
      const totalTime = Math.round((session.endTime - session.startTime) / 1000 / 60);
      const lastAttempt = session.attempts[session.attempts.length - 1];
      const bestOverall = Math.max(session.bestScores.top, session.bestScores.front, session.bestScores.side);
      const finalOverall = Math.round(
        (lastAttempt.scores.top + lastAttempt.scores.front + lastAttempt.scores.side) / 3
      );

      return {
        totalTime,
        totalAttempts: session.attempts.length,
        bestScore: bestOverall,
        finalScore: finalOverall,
        difficulty: session.difficulty,
        improvement: this.calculateSimpleImprovement(session),
        bestScores: { ...session.bestScores }
      };
    } catch (error) {
      console.error('학습 통계 요약 중 오류:', error);
      return {
        totalTime: 0,
        totalAttempts: 0,
        bestScore: 0,
        finalScore: 0,
        difficulty: 'unknown',
        improvement: 0,
        bestScores: { top: 0, front: 0, side: 0 }
      };
    }
  }

  // 간단한 향상도 계산 (배지 시스템용)
  calculateSimpleImprovement(session) {
    try {
      if (session.attempts.length < 2) return 0;
      
      const firstAttempt = session.attempts[0];
      const lastAttempt = session.attempts[session.attempts.length - 1];
      
      const firstAvg = (firstAttempt.scores.top + firstAttempt.scores.front + firstAttempt.scores.side) / 3;
      const lastAvg = (lastAttempt.scores.top + lastAttempt.scores.front + lastAttempt.scores.side) / 3;
      
      return Math.round(lastAvg - firstAvg);
    } catch (error) {
      console.error('향상도 계산 중 오류:', error);
      return 0;
    }
  }

  // 특정 도면의 학습 진도 분석
  getViewProgress(session, viewKey) {
    try {
      const scores = session.attempts.map(attempt => attempt.scores[viewKey]);
      const trend = this.calculateTrend(scores);
      
      return {
        viewName: { top: '평면도', front: '정면도', side: '우측면도' }[viewKey] || '알 수 없음',
        bestScore: session.bestScores[viewKey] || 0,
        attemptCount: scores.length,
        scoreHistory: scores,
        trend: trend,
        consistency: this.calculateConsistency(scores)
      };
    } catch (error) {
      console.error('도면 진도 분석 중 오류:', error);
      return {
        viewName: '분석 오류',
        bestScore: 0,
        attemptCount: 0,
        scoreHistory: [],
        trend: 'stable',
        consistency: 0
      };
    }
  }

  // 점수 추세 계산
  calculateTrend(scores) {
    try {
      if (scores.length < 2) return 'stable';
      
      const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
      const secondHalf = scores.slice(Math.floor(scores.length / 2));
      
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg + 5) return 'improving';
      if (secondAvg < firstAvg - 5) return 'declining';
      return 'stable';
    } catch (error) {
      console.error('점수 추세 계산 중 오류:', error);
      return 'stable';
    }
  }

  // 점수 일관성 계산
  calculateConsistency(scores) {
    try {
      if (scores.length < 2) return 100;
      
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
      const stdDev = Math.sqrt(variance);
      
      return Math.max(0, Math.round(100 - stdDev));
    } catch (error) {
      console.error('점수 일관성 계산 중 오류:', error);
      return 0;
    }
  }

  // 추세를 한국어로 변환
  getTrendKorean(trend) {
    switch (trend) {
      case 'improving': return '향상 중';
      case 'declining': return '하락 중';
      case 'stable': return '안정적';
      default: return '분석 중';
    }
  }

  // 상세 학습 패턴 분석
  getDetailedLearningPatterns(session) {
    try {
      const totalTime = (session.endTime - session.startTime) / 1000 / 60;
      const attempts = session.attempts;
      
      // 학습 집중도
      let focusLevel = '분석 불가';
      if (attempts.length > 0) {
        const avgTimePerAttempt = totalTime / attempts.length;
        if (avgTimePerAttempt < 3) {
          focusLevel = '높음';
        } else if (avgTimePerAttempt < 6) {
          focusLevel = '보통';
        } else {
          focusLevel = '낮음';
        }
      }
      
      // 학습 지속성
      let persistence = '짧은 집중형';
      if (totalTime >= 40) {
        persistence = '매우 꾸준한 형';
      } else if (totalTime >= 20) {
        persistence = '끈기 있는 형';
      } else if (totalTime >= 10) {
        persistence = '적정 지속형';
      }
      
      // 오류 개선 패턴
      let errorImprovement = '분석 중';
      if (attempts.length > 1) {
        const firstScore = (attempts[0].scores.top + attempts[0].scores.front + attempts[0].scores.side) / 3;
        const lastScore = (attempts[attempts.length - 1].scores.top + attempts[attempts.length - 1].scores.front + attempts[attempts.length - 1].scores.side) / 3;
        
        if (lastScore > firstScore + 10) {
          errorImprovement = '빠른 개선형';
        } else if (lastScore > firstScore) {
          errorImprovement = '점진적 개선형';
        } else if (lastScore === firstScore) {
          errorImprovement = '안정적 유지형';
        } else {
          errorImprovement = '재검토 필요형';
        }
      }
      
      // 강점/약점 도면
      const scores = session.bestScores;
      const viewNames = { top: '평면도', front: '정면도', side: '우측면도' };
      const sortedViews = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
      
      const strengths = [viewNames[sortedViews[0]]];
      const weaknesses = scores[sortedViews[2]] < 80 ? [viewNames[sortedViews[2]]] : [];
      
      // 특이 패턴
      const uniquePatterns = [];
      if (attempts.length === 1) uniquePatterns.push('일발성공형');
      if (attempts.length > 5) uniquePatterns.push('끈기형');
      if (scores.top === scores.front && scores.front === scores.side) uniquePatterns.push('균형형');
      if (Math.max(...Object.values(scores)) - Math.min(...Object.values(scores)) > 30) uniquePatterns.push('편차형');
      
      return {
        focusLevel,
        persistence,
        errorImprovement,
        strengths,
        weaknesses,
        uniquePatterns: uniquePatterns.length > 0 ? uniquePatterns : ['표준형']
      };
    } catch (error) {
      console.error('상세 학습 패턴 분석 중 오류:', error);
      return {
        focusLevel: '분석 오류',
        persistence: '분석 오류',
        errorImprovement: '분석 오류',
        strengths: ['분석 불가'],
        weaknesses: ['분석 불가'],
        uniquePatterns: ['분석 오류']
      };
    }
  }

  // 시간대별 성과 분석
  getTimeBasedAnalysis(session) {
    try {
      if (session.attempts.length < 2) {
        return '시도 횟수가 부족하여 시간대별 분석이 어렵습니다.';
      }
      
      const attempts = session.attempts;
      const timeIntervals = [];
      
      for (let i = 1; i < attempts.length; i++) {
        const timeDiff = (attempts[i].timestamp - attempts[i-1].timestamp) / 1000 / 60;
        const scoreDiff = (
          (attempts[i].scores.top + attempts[i].scores.front + attempts[i].scores.side) -
          (attempts[i-1].scores.top + attempts[i-1].scores.front + attempts[i-1].scores.side)
        ) / 3;
        
        timeIntervals.push({
          interval: Math.round(timeDiff),
          improvement: Math.round(scoreDiff)
        });
      }
      
      let analysis = '';
      timeIntervals.forEach((interval, index) => {
        const sign = interval.improvement > 0 ? '+' : '';
        analysis += `${index + 1}→${index + 2}차 시도: ${interval.interval}분 간격, 점수 변화 ${sign}${interval.improvement}점\n`;
      });
      
      return analysis;
    } catch (error) {
      console.error('시간대별 성과 분석 중 오류:', error);
      return '시간대별 분석 중 오류가 발생했습니다.';
    }
  }
}