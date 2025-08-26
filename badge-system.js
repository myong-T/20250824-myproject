// badge-system.js - 미니 배지 시스템 구현

export class BadgeSystem {
  constructor() {
    this.badges = {
      perfectionist: {
        id: 'perfectionist',
        name: '완벽주의자',
        icon: '🏆',
        condition: '모든 도면에서 100점 달성 (각각 다른 시도 가능)',
        check: (session) => this.getAllViewsPerfect(session),
        progress: (session) => {
          const perfectViews = this.getPerfectViewsCount(session);
          return `${perfectViews}/3개 도면 완벽`;
        }
      },
      persistent: {
        id: 'persistent', 
        name: '끈기왕',
        icon: '💪',
        condition: '총 시도 횟수 10회 이상',
        check: (session) => session.attempts?.length >= 10,
        progress: (session) => `${session.attempts?.length || 0}/10회`
      },
      speedLearner: {
        id: 'speedLearner',
        name: '빠른 학습자', 
        icon: '⚡',
        condition: '10분 이하 + 240점 이상',
        check: (session) => {
          const time = this.getSessionTime(session);
          const score = this.getMaxScore(session);
          return time <= 10 && score >= 240;
        },
        progress: (session) => {
          const time = this.getSessionTime(session);
          const score = this.getMaxScore(session);
          return `${time}분/${score}점`;
        }
      },
      improver: {
        id: 'improver',
        name: '향상자',
        icon: '📈', 
        condition: '점수 향상도 100점 이상',
        check: (session) => this.getImprovement(session) >= 100,
        progress: (session) => `+${this.getImprovement(session)}점`
      },
      challenger: {
        id: 'challenger',
        name: '도전자',
        icon: '🌟',
        condition: '학습에 참여',
        check: (session) => session.attempts?.length > 0,
        progress: (session) => '참여 완료!'
      }
    };
  }

  // 모든 도면에서 100점 달성했는지 확인 (각각 다른 시도에서도 가능)
  getAllViewsPerfect(session) {
    if (!session.attempts || session.attempts.length === 0) return false;
    
    let topPerfect = false;
    let frontPerfect = false;
    let sidePerfect = false;
    
    session.attempts.forEach(attempt => {
      if (attempt.scores.top === 100) topPerfect = true;
      if (attempt.scores.front === 100) frontPerfect = true;
      if (attempt.scores.side === 100) sidePerfect = true;
    });
    
    return topPerfect && frontPerfect && sidePerfect;
  }

  // 완벽한 도면 개수 계산
  getPerfectViewsCount(session) {
    if (!session.attempts || session.attempts.length === 0) return 0;
    
    let count = 0;
    let topPerfect = false;
    let frontPerfect = false;
    let sidePerfect = false;
    
    session.attempts.forEach(attempt => {
      if (attempt.scores.top === 100) topPerfect = true;
      if (attempt.scores.front === 100) frontPerfect = true;
      if (attempt.scores.side === 100) sidePerfect = true;
    });
    
    if (topPerfect) count++;
    if (frontPerfect) count++;
    if (sidePerfect) count++;
    
    return count;
  }

  // 세션에서 최고 점수 계산
  getMaxScore(session) {
    if (!session.attempts || session.attempts.length === 0) return 0;
    const totalScores = session.attempts.map(attempt => 
      attempt.scores.top + attempt.scores.front + attempt.scores.side
    );
    return Math.max(...totalScores);
  }

  // 세션 시간 계산 (분 단위)
  getSessionTime(session) {
    if (!session.startTime || !session.endTime) return 999;
    return Math.round((session.endTime - session.startTime) / (1000 * 60));
  }

  // 점수 향상도 계산
  getImprovement(session) {
    if (!session.attempts || session.attempts.length < 2) return 0;
    const scores = session.attempts.map(attempt => 
      attempt.scores.top + attempt.scores.front + attempt.scores.side
    );
    return Math.max(...scores) - scores[0];
  }

  // 배지 상태 분석
  analyzeBadgeStatus(session) {
    const result = {};
    
    Object.keys(this.badges).forEach(key => {
      const badge = this.badges[key];
      const achieved = badge.check(session);
      const progress = badge.progress(session);
      
      result[key] = {
        ...badge,
        achieved,
        progress,
        status: achieved ? 'achieved' : this.isAchievable(badge, session) ? 'achievable' : 'locked'
      };
    });
    
    return result;
  }

  // 달성 가능한지 판단 (거의 달성에 가까운 상태)
  isAchievable(badge, session) {
    switch(badge.id) {
      case 'persistent':
        return session.attempts?.length >= 7; // 10회 중 7회 이상
      case 'perfectionist':
        return this.getPerfectViewsCount(session) >= 2; // 3개 중 2개 완벽
      case 'improver':
        return this.getImprovement(session) >= 70; // 100점 중 70점 이상
      case 'speedLearner':
        const time = this.getSessionTime(session);
        const score = this.getMaxScore(session);
        return (time <= 15 && score >= 200) || (time <= 10 && score >= 180);
      case 'challenger':
        return session.attempts?.length >= 0; // 항상 달성 가능
      default:
        return false;
    }
  }

  // 달성한 배지 개수 계산
  getAchievedCount(session) {
    const status = this.analyzeBadgeStatus(session);
    return Object.values(status).filter(badge => badge.achieved).length;
  }

  // 결과 페이지용 배지 컬렉션 HTML 생성
  generateBadgeCollectionHTML(session) {
    const status = this.analyzeBadgeStatus(session);
    const achievedCount = this.getAchievedCount(session);
    
    return `
      <div class="badge-collection">
        <h3>🏆 학습 배지 컬렉션 (${achievedCount}/5 달성)</h3>
        <div class="badge-grid">
          ${Object.values(status).map(badge => `
            <div class="badge-card ${badge.achieved ? 'achieved' : 'locked'}">
              <div class="badge-card-icon">${badge.icon}</div>
              <div class="badge-info">
                <h5>${badge.name}</h5>
                <div class="badge-status">
                  ${badge.achieved ? '✅ 달성 완료!' : `⏳ ${badge.progress}`}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // CSS 스타일 추가 함수 (배지 컬렉션용만)
  addBadgeStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* 배지 컬렉션 스타일 */
      .badge-collection {
        margin: 20px 0;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 10px;
        border: 1px solid #e9ecef;
      }
      
      .badge-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 12px;
        margin-top: 15px;
      }
      
      .badge-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 15px 10px;
        background: white;
        border-radius: 8px;
        border: 2px solid #e0e0e0;
        transition: all 0.3s ease;
      }
      
      .badge-card.achieved {
        border-color: #ffd700;
        background: linear-gradient(135deg, #fff9e6, #ffffff);
        box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
      }
      
      .badge-card.locked {
        opacity: 0.6;
        background: #f5f5f5;
      }
      
      .badge-card-icon {
        font-size: 2.2rem;
        margin-bottom: 8px;
      }
      
      .badge-card.locked .badge-card-icon {
        filter: grayscale(100%) opacity(0.5);
      }
      
      .badge-info h5 {
        margin: 0 0 5px 0;
        font-size: 0.95rem;
        color: #333;
        font-weight: 600;
      }
      
      .badge-status {
        font-size: 0.8rem;
        color: #666;
        line-height: 1.3;
      }
      
      .badge-card.achieved .badge-status {
        color: #d4af37;
        font-weight: 600;
      }

      @media (max-width: 768px) {
        .badge-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        
        .badge-card {
          padding: 12px 8px;
        }
        
        .badge-card-icon {
          font-size: 1.8rem;
          margin-bottom: 6px;
        }
        
        .badge-info h5 {
          font-size: 0.85rem;
        }
        
        .badge-status {
          font-size: 0.75rem;
        }
      }
      
      @media (max-width: 480px) {
        .badge-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `;
    
    document.head.appendChild(style);
  }
}