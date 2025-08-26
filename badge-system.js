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

  // 메인 페이지용 미니 배지 HTML 생성
  generateMiniBadgeHTML(session = null) {
    const status = session ? this.analyzeBadgeStatus(session) : {};
    const achievedCount = session ? this.getAchievedCount(session) : 0;
    
    let motivationText = '총 5개 배지에 도전해보세요!';
    if (session) {
      const achievableCount = Object.values(status).filter(badge => badge.status === 'achievable').length;
      if (achievedCount > 0) {
        motivationText = `현재 ${achievedCount}개 달성 완료`;
        if (achievableCount > 0) {
          motivationText += `, ${achievableCount}개 달성 근접 중!`;
        }
      } else if (achievableCount > 0) {
        motivationText = `${achievableCount}개 배지가 달성 가능해요!`;
      }
    }

    return `
      <div class="badge-preview">
        <h4>🎯 도전할 수 있는 학습 배지</h4>
        <div class="badge-mini-list">
          ${Object.values(status.length ? status : this.badges).map(badge => {
            const badgeStatus = status[badge.id] || { status: 'locked', progress: '미시작' };
            return `
              <div class="badge-mini ${badgeStatus.status}" title="${badge.name}: ${badge.condition}">
                ${badge.icon}
                <div class="tooltip">
                  ${badge.name}: ${badgeStatus.progress || badge.condition}
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="progress-text">${motivationText}</div>
        <small>💡 배지에 마우스를 올려 조건을 확인하세요</small>
      </div>
    `;
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

  // CSS 스타일 추가 함수
  addBadgeStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* 미니 배지 미리보기 스타일 */
      .badge-preview {
        text-align: center;
        margin: 15px 0;
        padding: 15px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 10px;
        color: white;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      }
      
      .badge-preview h4 {
        margin: 0 0 10px 0;
        font-size: 1rem;
        font-weight: 600;
      }
      
      .badge-mini-list {
        display: flex;
        justify-content: center;
        gap: 15px;
        margin: 15px 0;
        flex-wrap: wrap;
      }
      
      .badge-mini {
        font-size: 2rem;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        padding: 5px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .badge-mini.locked {
        opacity: 0.3;
        filter: grayscale(80%);
      }
      
      .badge-mini.achievable {
        opacity: 0.8;
        animation: pulse 2s infinite;
      }
      
      .badge-mini.achieved {
        opacity: 1;
        filter: drop-shadow(0 0 8px gold);
        animation: glow 3s ease-in-out infinite alternate;
      }
      
      .badge-mini:hover {
        transform: scale(1.2);
        opacity: 1 !important;
      }
      
      .badge-mini .tooltip {
        position: absolute;
        bottom: -45px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 0.8rem;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s;
        z-index: 1000;
      }
      
      .badge-mini:hover .tooltip {
        opacity: 1;
      }
      
      .progress-text {
        font-size: 0.9rem;
        margin: 10px 0 5px 0;
        opacity: 0.9;
        font-weight: 500;
      }
      
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
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
        margin-top: 15px;
      }
      
      .badge-card {
        display: flex;
        align-items: center;
        padding: 15px;
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
        font-size: 2.5rem;
        margin-right: 15px;
      }
      
      .badge-card.locked .badge-card-icon {
        filter: grayscale(100%) opacity(0.5);
      }
      
      .badge-info h5 {
        margin: 0 0 5px 0;
        font-size: 1.1rem;
        color: #333;
      }
      
      .badge-status {
        font-size: 0.9rem;
        color: #666;
      }
      
      .badge-card.achieved .badge-status {
        color: #d4af37;
        font-weight: 600;
      }
      
      /* 애니메이션 */
      @keyframes pulse {
        0%, 100% { 
          transform: scale(1);
          filter: brightness(1);
        }
        50% { 
          transform: scale(1.05);
          filter: brightness(1.2);
        }
      }
      
      @keyframes glow {
        0% { filter: drop-shadow(0 0 5px gold); }
        100% { filter: drop-shadow(0 0 15px gold); }
      }

      @media (max-width: 768px) {
        .badge-mini-list {
          gap: 10px;
        }
        .badge-mini {
          font-size: 1.5rem;
        }
        .badge-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
}