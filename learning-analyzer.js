// learning-analyzer.js - 학습 결과 분석 시스템 (Netlify용 - 수정됨)

export class LearningAnalyzer {
  constructor() {
    this.isAIAnalyzing = false;
  }

  // 학습 결과 분석 및 표시 (AI 선생님 분석 포함)
  async displayLearningResults(learningSession) {
    const session = learningSession;
    
    try {
      // 기본 통계 표시
      this.displayBasicStats(session);
      
      // 도면 이미지 표시
      this.displayDrawingImages(session);
      
      // 성취도 표시
      this.displayAchievements(session);
      
      // AI 선생님 분석 실행 (Netlify Functions 사용)
      await this.runAutoTeacherAnalysis(session);
      
    } catch (error) {
      console.error('학습 결과 표시 중 오류:', error);
    }
  }

  // AI 선생님 자동 분석 실행 (Netlify Functions 사용 - 경로 수정)
  async runAutoTeacherAnalysis(session) {
    const analysisArea = document.getElementById('aiPatternAnalysis');
    
    if (!analysisArea) {
      console.warn('AI 패턴 분석 영역을 찾을 수 없습니다.');
      return;
    }

    // 로딩 상태 표시
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
        AI가 학습 패턴을 분석하고 있습니다...
      </div>
    `;

    this.isAIAnalyzing = true;

    try {
      // 학습 분석 데이터 준비
      const analysisData = this.prepareLearningAnalysisData(session);
      
      if (!analysisData) {
        throw new Error('분석 데이터 준비 실패');
      }
      
      // Netlify Functions API 호출 (URL 변경)
      const response = await fetch('/.netlify/functions/learning-analysis', {
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

  // AI 선생님 분석 오류 처리 (Netlify용)
  handleTeacherAnalysisError(analysisArea, error) {
    let errorMessage = error.message;
    if (error.message.includes('Failed to fetch')) {
      errorMessage = 'AI 서비스에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.';
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

**상세 학습 패턴:**
${detailedPatterns}

이 데이터를 바탕으로 중학교 1학년 수준에 맞는 친근하고 구체적인 학습 분석을 해주세요.`;

      return analysisPrompt;

    } catch (error) {
      console.error('학습 분석 데이터 준비 오류:', error);
      return null;
    }
  }

  // 기본 통계 표시
  displayBasicStats(session) {
    const summary = this.getLearningSummary(session);

    // 난이도 배지 표시
    const difficultyBadge = document.getElementById('resultsDifficultyBadge');
    if (difficultyBadge) {
      const labels = { easy: '하', medium: '중', hard: '상' };
      const colors = { easy: '#28a745', medium: '#ffc107', hard: '#dc3545' };
      difficultyBadge.innerHTML = `<span style="background-color: ${colors[session.difficulty]}; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold;">${labels[session.difficulty]}</span>`;
    }

    // 통계 데이터 표시
    document.getElementById('totalTime').textContent = `${summary.totalTime}분`;
    document.getElementById('totalAttempts').textContent = `${summary.totalAttempts}회`;
    document.getElementById('bestScore').textContent = `${summary.bestScore}점`;
    document.getElementById('finalScore').textContent = `${summary.finalScore}점`;

    // 도면별 통계
    const viewProgress = {
      top: this.getViewProgress(session, 'top'),
      front: this.getViewProgress(session, 'front'),
      side: this.getViewProgress(session, 'side')
    };

    document.getElementById('topStats').textContent = `${viewProgress.top.bestScore}점`;
    document.getElementById('frontStats').textContent = `${viewProgress.front.bestScore}점`;
    document.getElementById('sideStats').textContent = `${viewProgress.side.bestScore}점`;
  }

  // 도면 이미지 생성 및 표시
  displayDrawingImages(session) {
    // 캔버스에서 이미지 생성하는 로직
    // (현재는 기본 구현만 제공)
  }

  // 성취도 배지 표시
  displayAchievements(session) {
    const achievementArea = document.getElementById('achievementArea');
    const summary = this.getLearningSummary(session);
    
    let badges = [];
    
    // 완벽주의자 배지
    if (summary.bestScore === 300) {
      badges.push('🏆 완벽주의자');
    }
    
    // 끈기 배지
    if (summary.totalAttempts >= 10) {
      badges.push('💪 끈기왕');
    }
    
    // 빠른 학습자 배지
    if (summary.totalTime <= 10 && summary.bestScore >= 240) {
      badges.push('⚡ 빠른 학습자');
    }
    
    // 향상자 배지
    if (summary.improvement >= 100) {
      badges.push('📈 향상자');
    }

    if (badges.length === 0) {
      badges.push('🌟 도전자');
    }

    achievementArea.innerHTML = `
      <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
        ${badges.map(badge => `<span style="background-color: #6C63FF; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold;">${badge}</span>`).join('')}
      </div>
    `;
    
    // 학습 배지 섹션 다음에 페이지 구분 마커를 별도 요소로 추가
    const pageBreakMarker = document.createElement('div');
    pageBreakMarker.innerHTML = '<!-- PDF 페이지 구분 마커: 학습 배지까지 1페이지, 이후 2페이지 -->';
    pageBreakMarker.style.display = 'none'; // 화면에는 보이지 않게
    pageBreakMarker.setAttribute('data-page-break', 'true');
    
    // 학습 배지 섹션 바로 다음에 마커 삽입
    const achievementSection = achievementArea.closest('.learning-stats');
    if (achievementSection && achievementSection.parentNode) {
      achievementSection.parentNode.insertBefore(pageBreakMarker, achievementSection.nextSibling);
    }
  }

  // 학습 요약 데이터 생성
  getLearningSummary(session) {
    if (!session.attempts || session.attempts.length === 0) {
      return {
        totalTime: 0,
        totalAttempts: 0,
        bestScore: 0,
        finalScore: 0,
        improvement: 0
      };
    }

    const totalTime = session.endTime && session.startTime ? 
      Math.round((session.endTime - session.startTime) / (1000 * 60)) : 0;
    
    const scores = session.attempts.map(attempt => 
      attempt.scores.top + attempt.scores.front + attempt.scores.side
    );
    
    const bestScore = Math.max(...scores, 0);
    const finalScore = scores[scores.length - 1] || 0;
    const firstScore = scores[0] || 0;
    const improvement = bestScore - firstScore;

    return {
      totalTime,
      totalAttempts: session.attempts.length,
      bestScore,
      finalScore,
      improvement
    };
  }

  // 도면별 진행상황 분석
  getViewProgress(session, viewKey) {
    if (!session.attempts || session.attempts.length === 0) {
      return {
        bestScore: 0,
        attemptCount: 0,
        trend: 'stable',
        consistency: 0
      };
    }

    const viewScores = session.attempts.map(attempt => attempt.scores[viewKey]);
    const bestScore = Math.max(...viewScores, 0);
    const attemptCount = viewScores.length;
    
    // 추세 분석
    let trend = 'stable';
    if (attemptCount >= 3) {
      const firstHalf = viewScores.slice(0, Math.floor(attemptCount / 2));
      const secondHalf = viewScores.slice(Math.floor(attemptCount / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg + 10) trend = 'improving';
      else if (secondAvg < firstAvg - 10) trend = 'declining';
    }
    
    // 일관성 계산
    const avgScore = viewScores.reduce((a, b) => a + b, 0) / viewScores.length;
    const variance = viewScores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / viewScores.length;
    const consistency = Math.max(0, 100 - Math.sqrt(variance));

    return {
      bestScore,
      attemptCount,
      trend,
      consistency: Math.round(consistency)
    };
  }

  // 상세 학습 패턴 분석
  getDetailedLearningPatterns(session) {
    if (!session.attempts || session.attempts.length === 0) {
      return '학습 데이터가 부족합니다.';
    }

    let patterns = [];
    
    // 강점/약점 분석
    const viewProgress = {
      top: this.getViewProgress(session, 'top'),
      front: this.getViewProgress(session, 'front'),
      side: this.getViewProgress(session, 'side')
    };
    
    const viewNames = { top: '평면도', front: '정면도', side: '우측면도' };
    const strongViews = [];
    const weakViews = [];
    
    Object.keys(viewProgress).forEach(key => {
      if (viewProgress[key].bestScore >= 80) {
        strongViews.push(viewNames[key]);
      } else if (viewProgress[key].bestScore < 60) {
        weakViews.push(viewNames[key]);
      }
    });
    
    if (strongViews.length > 0) {
      patterns.push(`• 강점 영역: ${strongViews.join(', ')}`);
    }
    
    if (weakViews.length > 0) {
      patterns.push(`• 개선 필요 영역: ${weakViews.join(', ')}`);
    }
    
    // 학습 스타일 분석
    const summary = this.getLearningSummary(session);
    if (summary.totalAttempts <= 5) {
      patterns.push('• 신중한 학습 스타일: 적은 시도로 문제 해결');
    } else if (summary.totalAttempts >= 15) {
      patterns.push('• 적극적 학습 스타일: 많은 시도를 통한 학습');
    }
    
    if (summary.improvement >= 50) {
      patterns.push('• 빠른 개선 능력: 학습을 통한 점수 향상이 뛰어남');
    }
    
    return patterns.length > 0 ? patterns.join('\n') : '일반적인 학습 패턴을 보였습니다.';
  }

  // 추세를 한국어로 변환
  getTrendKorean(trend) {
    const trendMap = {
      'improving': '향상중',
      'declining': '하락중',
      'stable': '안정적'
    };
    return trendMap[trend] || '안정적';
  }

  // 캔버스에서 이미지 생성 (기본 구현)
  generateCanvasImage(lines, difficulty, viewKey) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      
      // 배경 색상
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 격자 그리기
      const gridSize = 20;
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
      
      // 선분 그리기
      if (lines && lines.length > 0) {
        lines.forEach(line => {
          ctx.beginPath();
          ctx.strokeStyle = line.style === 'dashed' ? '#333' : '#000';
          ctx.lineWidth = 2;
          
          if (line.style === 'dashed') {
            ctx.setLineDash([5, 5]);
          } else {
            ctx.setLineDash([]);
          }
          
          const scale = gridSize / 30; // 원본 격자 크기 비율
          ctx.moveTo(line.from.x * scale, line.from.y * scale);
          ctx.lineTo(line.to.x * scale, line.to.y * scale);
          ctx.stroke();
        });
      }
      
      return canvas.toDataURL();
    } catch (error) {
      console.error('캔버스 이미지 생성 오류:', error);
      return null;
    }
  }

  // PDF 다운로드를 위한 유틸리티 메서드들
  async generatePDFReport(session) {
    // PDF 생성 로직 (기존과 동일)
    // 여기서는 기본 구현만 제공
    console.log('PDF 생성 기능은 별도 구현이 필요합니다.');
  }

  // 학습 데이터 내보내기
  exportLearningData(session) {
    const data = {
      session: session,
      summary: this.getLearningSummary(session),
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-data-${session.difficulty}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}