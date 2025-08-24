// answer-checker.js - 개선된 부분 정답 시스템 (정확한 커버리지 + 초과 페널티)

import { ANSWER_DATA, CONFIG } from './constants.js';

export class AnswerChecker {
  constructor() {
    this.tolerance = CONFIG.TOLERANCE;
  }

  // 선분 비교 함수 (기존 로직 유지)
  isLineMatch(userLine, answerLine, tolerance = this.tolerance) {
    const userFromGrid = { 
      x: userLine.from.x / CONFIG.GRID_SIZE, 
      y: userLine.from.y / CONFIG.GRID_SIZE 
    };
    const userToGrid = { 
      x: userLine.to.x / CONFIG.GRID_SIZE, 
      y: userLine.to.y / CONFIG.GRID_SIZE 
    };
    
    // 위치 비교 (정방향)
    const forwardMatch = (
      Math.abs(userFromGrid.x - answerLine.from.x) <= tolerance &&
      Math.abs(userFromGrid.y - answerLine.from.y) <= tolerance &&
      Math.abs(userToGrid.x - answerLine.to.x) <= tolerance &&
      Math.abs(userToGrid.y - answerLine.to.y) <= tolerance
    );
    
    // 위치 비교 (역방향)
    const reverseMatch = (
      Math.abs(userFromGrid.x - answerLine.to.x) <= tolerance &&
      Math.abs(userFromGrid.y - answerLine.to.y) <= tolerance &&
      Math.abs(userToGrid.x - answerLine.from.x) <= tolerance &&
      Math.abs(userToGrid.y - answerLine.from.y) <= tolerance
    );
    
    const positionMatch = forwardMatch || reverseMatch;
    const userStyle = userLine.style || 'solid';
    const answerStyle = answerLine.style || 'solid';
    const styleMatch = userStyle === answerStyle;
    
    return positionMatch && styleMatch;
  }

  // 위치만 비교하는 함수 (스타일 무시)
  isPositionMatch(userLine, answerLine, tolerance = this.tolerance) {
    const userFromGrid = { 
      x: userLine.from.x / CONFIG.GRID_SIZE, 
      y: userLine.from.y / CONFIG.GRID_SIZE 
    };
    const userToGrid = { 
      x: userLine.to.x / CONFIG.GRID_SIZE, 
      y: userLine.to.y / CONFIG.GRID_SIZE 
    };
    
    const forwardMatch = (
      Math.abs(userFromGrid.x - answerLine.from.x) <= tolerance &&
      Math.abs(userFromGrid.y - answerLine.from.y) <= tolerance &&
      Math.abs(userToGrid.x - answerLine.to.x) <= tolerance &&
      Math.abs(userToGrid.y - answerLine.to.y) <= tolerance
    );
    
    const reverseMatch = (
      Math.abs(userFromGrid.x - answerLine.to.x) <= tolerance &&
      Math.abs(userFromGrid.y - answerLine.to.y) <= tolerance &&
      Math.abs(userToGrid.x - answerLine.from.x) <= tolerance &&
      Math.abs(userToGrid.y - answerLine.from.y) <= tolerance
    );
    
    return forwardMatch || reverseMatch;
  }

  // 기존 통합 관련 함수들 유지
  pointsEqual(p1, p2, tolerance = this.tolerance) {
    return Math.abs(p1.x - p2.x) <= tolerance && Math.abs(p1.y - p2.y) <= tolerance;
  }

  convertUserLineToGrid(userLine) {
    return {
      from: {
        x: userLine.from.x / CONFIG.GRID_SIZE,
        y: userLine.from.y / CONFIG.GRID_SIZE
      },
      to: {
        x: userLine.to.x / CONFIG.GRID_SIZE,
        y: userLine.to.y / CONFIG.GRID_SIZE
      },
      style: userLine.style || 'solid'
    };
  }

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

  linesEqual(line1, line2, tolerance = this.tolerance) {
    return this.pointsEqual(line1.from, line2.from, tolerance) && 
           this.pointsEqual(line1.to, line2.to, tolerance) &&
           line1.style === line2.style;
  }

  linesConnected(line1, line2, tolerance = this.tolerance) {
    return this.pointsEqual(line1.to, line2.from, tolerance) ||
           this.pointsEqual(line1.to, line2.to, tolerance) ||
           this.pointsEqual(line1.from, line2.from, tolerance) ||
           this.pointsEqual(line1.from, line2.to, tolerance);
  }

  linesOnSameLine(line1, line2, tolerance = this.tolerance) {
    if (line1.style !== line2.style) return false;
    
    // 수직선인 경우
    if (Math.abs(line1.from.x - line1.to.x) <= tolerance && 
        Math.abs(line2.from.x - line2.to.x) <= tolerance) {
      return Math.abs(line1.from.x - line2.from.x) <= tolerance;
    }
    
    // 수평선인 경우
    if (Math.abs(line1.from.y - line1.to.y) <= tolerance && 
        Math.abs(line2.from.y - line2.to.y) <= tolerance) {
      return Math.abs(line1.from.y - line2.from.y) <= tolerance;
    }
    
    // 일반적인 경우
    const dx1 = line1.to.x - line1.from.x;
    const dy1 = line1.to.y - line1.from.y;
    const dx2 = line2.to.x - line2.from.x;
    const dy2 = line2.to.y - line2.from.y;
    
    if (Math.abs(dx1 * dy2 - dy1 * dx2) > tolerance) return false;
    
    const pointToLineX = line1.from.x - line2.from.x;
    const pointToLineY = line1.from.y - line2.from.y;
    
    return Math.abs(pointToLineX * dy2 - pointToLineY * dx2) <= tolerance;
  }

  mergeLines(line1, line2, tolerance = this.tolerance) {
    if (!this.linesOnSameLine(line1, line2, tolerance)) return null;
    if (!this.linesConnected(line1, line2, tolerance)) return null;
    
    const allPoints = [line1.from, line1.to, line2.from, line2.to];
    let maxDistance = 0;
    let farthestPoints = [allPoints[0], allPoints[1]];
    
    for (let i = 0; i < allPoints.length; i++) {
      for (let j = i + 1; j < allPoints.length; j++) {
        const distance = Math.sqrt(
          Math.pow(allPoints[i].x - allPoints[j].x, 2) + 
          Math.pow(allPoints[i].y - allPoints[j].y, 2)
        );
        if (distance > maxDistance) {
          maxDistance = distance;
          farthestPoints = [allPoints[i], allPoints[j]];
        }
      }
    }
    
    return {
      from: farthestPoints[0],
      to: farthestPoints[1],
      style: line1.style
    };
  }

  consolidateLines(lines) {
    if (lines.length === 0) return [];
    
    console.log('=== 선분 통합 시작 ===');
    console.log('입력 선분 수:', lines.length);
    
    let normalizedLines = lines.map(line => {
      const gridLine = this.convertUserLineToGrid(line);
      return this.normalizeLine(gridLine);
    });
    
    // 중복 제거
    let uniqueLines = [];
    for (let line of normalizedLines) {
      if (!uniqueLines.some(existing => this.linesEqual(existing, line))) {
        uniqueLines.push(line);
      }
    }
    console.log('중복 제거 후:', uniqueLines.length, '개');
    
    // 병합
    let merged = true;
    let iterations = 0;
    while (merged && iterations < 10) {
      merged = false;
      iterations++;
      
      for (let i = 0; i < uniqueLines.length; i++) {
        for (let j = i + 1; j < uniqueLines.length; j++) {
          const mergedLine = this.mergeLines(uniqueLines[i], uniqueLines[j]);
          if (mergedLine) {
            console.log(`병합: (${uniqueLines[i].from.x},${uniqueLines[i].from.y})→(${uniqueLines[i].to.x},${uniqueLines[i].to.y}) + (${uniqueLines[j].from.x},${uniqueLines[j].from.y})→(${uniqueLines[j].to.x},${uniqueLines[j].to.y})`);
            
            uniqueLines = uniqueLines.filter((_, index) => index !== i && index !== j);
            uniqueLines.push(mergedLine);
            merged = true;
            break;
          }
        }
        if (merged) break;
      }
    }
    
    console.log('최종 통합 결과:', uniqueLines.length, '개');
    console.log('=== 선분 통합 완료 ===');
    
    return uniqueLines;
  }

  // 🔧 새로운 커버리지 + 페널티 계산 함수
  calculateCoverageWithPenalty(consolidatedLine, answerLine, tolerance = this.tolerance) {
    // 스타일이 다르면 매칭 없음
    if (consolidatedLine.style !== answerLine.style) {
      return { coverage: 0, penalty: 0, score: 0 };
    }
    
    // 같은 직선상에 있는지 확인
    if (!this.linesOnSameLine(consolidatedLine, answerLine, tolerance)) {
      return { coverage: 0, penalty: 0, score: 0 };
    }
    
    console.log(`커버리지 분석: 사용자선 (${consolidatedLine.from.x},${consolidatedLine.from.y})→(${consolidatedLine.to.x},${consolidatedLine.to.y}) vs 정답선 (${answerLine.from.x},${answerLine.from.y})→(${answerLine.to.x},${answerLine.to.y})`);
    
    // 수직선인 경우
    if (Math.abs(consolidatedLine.from.x - consolidatedLine.to.x) <= tolerance && 
        Math.abs(answerLine.from.x - answerLine.to.x) <= tolerance) {
      
      if (Math.abs(consolidatedLine.from.x - answerLine.from.x) > tolerance) {
        return { coverage: 0, penalty: 0, score: 0 };
      }
      
      const userMinY = Math.min(consolidatedLine.from.y, consolidatedLine.to.y);
      const userMaxY = Math.max(consolidatedLine.from.y, consolidatedLine.to.y);
      const answerMinY = Math.min(answerLine.from.y, answerLine.to.y);
      const answerMaxY = Math.max(answerLine.from.y, answerLine.to.y);
      
      return this.calculateLineCoverageAndPenalty(userMinY, userMaxY, answerMinY, answerMaxY);
    }
    
    // 수평선인 경우
    if (Math.abs(consolidatedLine.from.y - consolidatedLine.to.y) <= tolerance && 
        Math.abs(answerLine.from.y - answerLine.to.y) <= tolerance) {
      
      if (Math.abs(consolidatedLine.from.y - answerLine.from.y) > tolerance) {
        return { coverage: 0, penalty: 0, score: 0 };
      }
      
      const userMinX = Math.min(consolidatedLine.from.x, consolidatedLine.to.x);
      const userMaxX = Math.max(consolidatedLine.from.x, consolidatedLine.to.x);
      const answerMinX = Math.min(answerLine.from.x, answerLine.to.x);
      const answerMaxX = Math.max(answerLine.from.x, answerLine.to.x);
      
      return this.calculateLineCoverageAndPenalty(userMinX, userMaxX, answerMinX, answerMaxX);
    }
    
    // 일반적인 경우 (기울어진 선분) - 매개변수 기반
    const dx = answerLine.to.x - answerLine.from.x;
    const dy = answerLine.to.y - answerLine.from.y;
    
    if (Math.abs(dx) < tolerance && Math.abs(dy) < tolerance) {
      return { coverage: 0, penalty: 0, score: 0 };
    }
    
    // 사용자 선분의 시작점과 끝점을 정답 선분의 매개변수로 변환
    let userT1, userT2;
    
    if (Math.abs(dx) > tolerance) {
      userT1 = (consolidatedLine.from.x - answerLine.from.x) / dx;
      userT2 = (consolidatedLine.to.x - answerLine.from.x) / dx;
    } else {
      userT1 = (consolidatedLine.from.y - answerLine.from.y) / dy;
      userT2 = (consolidatedLine.to.y - answerLine.from.y) / dy;
    }
    
    const userMinT = Math.min(userT1, userT2);
    const userMaxT = Math.max(userT1, userT2);
    
    return this.calculateLineCoverageAndPenalty(userMinT, userMaxT, 0, 1);
  }

  // 🔧 1차원 커버리지 + 페널티 계산 (핵심 로직)
  calculateLineCoverageAndPenalty(userMin, userMax, answerMin, answerMax) {
    const answerLength = answerMax - answerMin;
    const userLength = userMax - userMin;
    
    if (answerLength <= 0) {
      return { coverage: 0, penalty: 0, score: 0 };
    }
    
    // 정답 구간과의 교집합 계산
    const overlapStart = Math.max(userMin, answerMin);
    const overlapEnd = Math.min(userMax, answerMax);
    const overlapLength = Math.max(0, overlapEnd - overlapStart);
    
    // 커버리지 비율 (정답 구간을 얼마나 커버했는가)
    const coverage = overlapLength / answerLength;
    
    // 초과 구간 계산
    let excessLength = 0;
    if (userMin < answerMin) {
      excessLength += answerMin - userMin; // 앞쪽 초과
    }
    if (userMax > answerMax) {
      excessLength += userMax - answerMax; // 뒤쪽 초과
    }
    
    // 페널티 비율 (정답 길이 대비 초과 길이)
    const penalty = excessLength / answerLength;
    
    // 최종 점수 계산
    let score = coverage; // 기본적으로 커버리지 비율
    
    if (coverage >= 1.0) {
      // 정답 구간을 완전히 커버한 경우
      if (penalty === 0) {
        score = 1.0; // 완벽한 정답
      } else {
        // 초과 구간에 따른 감점 (최대 30% 감점)
        const penaltyFactor = Math.min(0.3, penalty * 0.5);
        score = 1.0 - penaltyFactor;
      }
    } else {
      // 정답 구간을 부분적으로만 커버한 경우
      // 커버리지 비율에 추가 페널티 적용
      const penaltyFactor = penalty * 0.2;
      score = Math.max(0, coverage - penaltyFactor);
    }
    
    console.log(`  → 커버리지: ${(coverage * 100).toFixed(1)}%, 페널티: ${(penalty * 100).toFixed(1)}%, 최종점수: ${(score * 100).toFixed(1)}%`);
    
    return { coverage, penalty, score };
  }

  // 🔧 수정된 매칭 함수
  matchConsolidatedLine(consolidatedLine, answerLine, tolerance = this.tolerance) {
    // 완전 매칭 확인 (기존 로직)
    const forwardMatch = (
      Math.abs(consolidatedLine.from.x - answerLine.from.x) <= tolerance &&
      Math.abs(consolidatedLine.from.y - answerLine.from.y) <= tolerance &&
      Math.abs(consolidatedLine.to.x - answerLine.to.x) <= tolerance &&
      Math.abs(consolidatedLine.to.y - answerLine.to.y) <= tolerance
    );
    
    const reverseMatch = (
      Math.abs(consolidatedLine.from.x - answerLine.to.x) <= tolerance &&
      Math.abs(consolidatedLine.from.y - answerLine.to.y) <= tolerance &&
      Math.abs(consolidatedLine.to.x - answerLine.from.x) <= tolerance &&
      Math.abs(consolidatedLine.to.y - answerLine.from.y) <= tolerance
    );
    
    if ((forwardMatch || reverseMatch) && consolidatedLine.style === answerLine.style) {
      return { type: 'complete', score: 1.0 };
    }
    
    // 🔧 새로운 커버리지 기반 매칭
    const result = this.calculateCoverageWithPenalty(consolidatedLine, answerLine, tolerance);
    
    if (result.score > 0) {
      if (result.coverage >= 1.0 && result.penalty === 0) {
        return { type: 'complete', score: 1.0 };
      } else if (result.coverage >= 1.0) {
        return { type: 'complete_with_excess', score: result.score };
      } else if (result.score >= 0.1) { // 10% 이상 겹치면 부분 매칭으로 인정
        return { type: 'partial', score: result.score };
      }
    }
    
    return { type: 'none', score: 0 };
  }

  // 🔧 수정된 정확도 계산 함수
  calculateAccuracy(userLines, answerLines) {
    if (answerLines.length === 0) {
      return { 
        score: 0, 
        matched: 0, 
        total: 0, 
        missing: [], 
        extra: [],
        detailedAnalysis: {
          totalAnswerLines: 0,
          totalUserLines: userLines.length,
          matchedLines: 0,
          missingCount: 0,
          extraCount: userLines.length,
          styleErrors: [],
          consolidationInfo: {
            originalUserLines: userLines.length,
            consolidatedUserLines: 0
          },
          partialMatches: 0,
          excessPenalties: 0
        }
      };
    }
    
    console.log('=== 개선된 커버리지 기반 정확도 계산 시작 ===');
    
    // 사용자 선분 통합
    const consolidatedUserLines = this.consolidateLines(userLines);
    console.log(`통합 결과 - 사용자: ${userLines.length} → ${consolidatedUserLines.length}`);
    
    // 매칭 결과 저장
    const answerMatched = new Array(answerLines.length).fill(false);
    const userMatched = new Array(consolidatedUserLines.length).fill(false);
    const matchResults = [];
    const styleErrors = [];
    
    // 1단계: 완전 매칭 우선 처리
    console.log('=== 1단계: 완전 매칭 처리 ===');
    for (let userIndex = 0; userIndex < consolidatedUserLines.length; userIndex++) {
      if (userMatched[userIndex]) continue;
      
      const userLine = consolidatedUserLines[userIndex];
      let bestMatch = { answerIndex: -1, score: 0, type: 'none' };
      
      for (let answerIndex = 0; answerIndex < answerLines.length; answerIndex++) {
        if (answerMatched[answerIndex]) continue;
        
        const answerLine = answerLines[answerIndex];
        const matchResult = this.matchConsolidatedLine(userLine, answerLine);
        
        // 완전 매칭만 이 단계에서 처리
        if ((matchResult.type === 'complete' || matchResult.type === 'complete_with_excess') && matchResult.score > bestMatch.score) {
          bestMatch = {
            answerIndex: answerIndex,
            score: matchResult.score,
            type: matchResult.type,
            userLine: userLine,
            answerLine: answerLine
          };
        }
      }
      
      // 완전 매칭이 발견되면 즉시 확정
      if (bestMatch.answerIndex !== -1) {
        answerMatched[bestMatch.answerIndex] = true;
        userMatched[userIndex] = true;
        matchResults.push(bestMatch);
        console.log(`완전 매칭: 사용자 ${userIndex} ↔ 정답 ${bestMatch.answerIndex} (${(bestMatch.score * 100).toFixed(1)}%, ${bestMatch.type})`);
      }
    }
    
    // 2단계: 부분 매칭 처리
    console.log('=== 2단계: 부분 매칭 처리 ===');
    for (let userIndex = 0; userIndex < consolidatedUserLines.length; userIndex++) {
      if (userMatched[userIndex]) continue;
      
      const userLine = consolidatedUserLines[userIndex];
      let bestMatch = { answerIndex: -1, score: 0, type: 'none' };
      
      for (let answerIndex = 0; answerIndex < answerLines.length; answerIndex++) {
        if (answerMatched[answerIndex]) continue;
        
        const answerLine = answerLines[answerIndex];
        const matchResult = this.matchConsolidatedLine(userLine, answerLine);
        
        // 부분 매칭 처리 (조금이라도 겹치면 인정)
        if (matchResult.score > bestMatch.score && matchResult.score > 0) {
          bestMatch = {
            answerIndex: answerIndex,
            score: matchResult.score,
            type: matchResult.type,
            userLine: userLine,
            answerLine: answerLine
          };
        }
      }
      
      // 부분 매칭이 발견되면 확정
      if (bestMatch.answerIndex !== -1) {
        answerMatched[bestMatch.answerIndex] = true;
        userMatched[userIndex] = true;
        matchResults.push(bestMatch);
        console.log(`부분 매칭: 사용자 ${userIndex} ↔ 정답 ${bestMatch.answerIndex} (${(bestMatch.score * 100).toFixed(1)}%, ${bestMatch.type})`);
      }
    }
    
    // 3단계: 위치는 맞지만 스타일이 틀린 경우 처리
    console.log('=== 3단계: 스타일 오류 처리 ===');
    for (let userIndex = 0; userIndex < consolidatedUserLines.length; userIndex++) {
      if (userMatched[userIndex]) continue;
      
      const userLine = consolidatedUserLines[userIndex];
      
      for (let answerIndex = 0; answerIndex < answerLines.length; answerIndex++) {
        if (answerMatched[answerIndex]) continue;
        
        const answerLine = answerLines[answerIndex];
        
        // 위치는 맞지만 스타일이 다른 경우
        if (this.isPositionMatch(this.convertUserLineToGrid(userLine), answerLine)) {
          const userStyle = userLine.style || 'solid';
          const answerStyle = answerLine.style || 'solid';
          
          if (userStyle !== answerStyle) {
            styleErrors.push({
              userLine: userLine,
              answerLine: answerLine,
              userStyle: userStyle,
              expectedStyle: answerStyle
            });
            
            answerMatched[answerIndex] = true;
            userMatched[userIndex] = true;
            
            matchResults.push({
              answerIndex: answerIndex,
              score: 0.7, // 위치는 맞으므로 70% 점수 인정
              type: 'style_error',
              userLine: userLine,
              answerLine: answerLine
            });
            
            console.log(`스타일 오류: 사용자 ${userIndex} ↔ 정답 ${answerIndex} (위치 정확, ${userStyle}→${answerStyle})`);
            break;
          }
        }
      }
    }
    
    // 점수 계산
    const totalScore = matchResults.reduce((sum, match) => sum + match.score, 0);
    const completeMatches = matchResults.filter(match => match.type === 'complete').length;
    const completeWithExcessMatches = matchResults.filter(match => match.type === 'complete_with_excess').length;
    const partialMatches = matchResults.filter(match => match.type === 'partial').length;
    const styleErrorMatches = matchResults.filter(match => match.type === 'style_error').length;
    
    // 최종 점수 계산 (100점 만점)
    let finalScore = Math.round((totalScore / answerLines.length) * 100);
    
    console.log(`점수 계산: 총점 ${totalScore.toFixed(2)}/${answerLines.length} = ${finalScore}%`);
    console.log(`완전: ${completeMatches}, 완전+초과: ${completeWithExcessMatches}, 부분: ${partialMatches}, 스타일오류: ${styleErrorMatches}`);
    
    // 불필요한 선분 계산 (매칭되지 않은 선분만)
    const extraLinesCount = consolidatedUserLines.length - userMatched.filter(Boolean).length;
    if (extraLinesCount > 0) {
      finalScore = Math.min(finalScore, 90); // 불필요한 선이 있으면 최대 90%
      console.log(`불필요한 선분 ${extraLinesCount}개로 인해 최대 90%로 제한`);
    }
    
    // 누락된 정답 선분들
    const missing = answerLines.filter((_, index) => !answerMatched[index]);
    
    // 불필요한 사용자 선분들 (매칭되지 않은 선분만)
    const extra = consolidatedUserLines.filter((_, index) => !userMatched[index]);
    
    // 상세 분석 정보
    const detailedAnalysis = {
      totalAnswerLines: answerLines.length,
      totalUserLines: consolidatedUserLines.length,
      matchedLines: completeMatches,
      partialMatches: partialMatches,
      completeWithExcessMatches: completeWithExcessMatches,
      styleErrorMatches: styleErrorMatches,
      missingCount: missing.length,
      extraCount: extra.length,
      styleErrors: styleErrors,
      completionRate: Math.round((totalScore / answerLines.length) * 100),
      precisionRate: consolidatedUserLines.length > 0 ? Math.round((userMatched.filter(Boolean).length / consolidatedUserLines.length) * 100) : 0,
      consolidationInfo: {
        originalUserLines: userLines.length,
        consolidatedUserLines: consolidatedUserLines.length
      }
    };
    
    console.log(`=== 개선된 커버리지 기반 계산 완료 ===`);
    console.log(`최종: ${finalScore}% (완전: ${completeMatches}, 완전+초과: ${completeWithExcessMatches}, 부분: ${partialMatches}, 스타일오류: ${styleErrorMatches}, 누락: ${missing.length}, 불필요: ${extra.length})`);
    
    return {
      score: finalScore,
      matched: completeMatches + completeWithExcessMatches + partialMatches + styleErrorMatches,
      total: answerLines.length,
      missing,
      extra,
      detailedAnalysis
    };
  }

  // 개선된 피드백 메시지 (초과 구간 반영)
  getFeedbackMessage(score, hasExtra = false, partialCount = 0, styleErrorCount = 0, excessCount = 0) {
    if (score === 100) {
      return `완벽합니다! 정확도 ${score}%!`;
    } else if (excessCount > 0 && score >= 85) {
      return `정확도 ${score}%. 선분이 조금 길게 그어졌어요!`;
    } else if (styleErrorCount > 0 && !hasExtra) {
      return `정확도 ${score}%. 위치는 정확하지만 선 스타일을 확인해보세요!`;
    } else if (hasExtra && styleErrorCount === 0 && partialCount === 0) {
      return `정확도 ${score}%. 불필요한 선이 ${hasExtra}개 있어요!`;
    } else if (partialCount > 0 && !hasExtra) {
      return `정확도 ${score}%. ${partialCount}개 선분이 부분적으로 맞아요!`;
    } else if (hasExtra && partialCount > 0) {
      return `정확도 ${score}%. 부분 일치와 불필요한 선을 확인해보세요!`;
    } else if (hasExtra && styleErrorCount > 0) {
      return `정확도 ${score}%. 선 스타일과 불필요한 선을 확인해보세요!`;
    } else if (score >= 80) {
      return `정확도 ${score}%. 거의 다 맞았어요!`;
    } else if (score >= 60) {
      return `정확도 ${score}%. 조금 더 보완이 필요해요.`;
    } else if (score >= 30) {
      return `정확도 ${score}%. 다시 한번 확인해보세요.`;
    } else {
      return `정확도 ${score}%. 기준점을 참고하여 다시 그려보세요.`;
    }
  }

  // 피드백 스타일 반환 (개선됨)
  getFeedbackStyle(score, styleErrorCount = 0, excessCount = 0) {
    if (score === 100) {
      return { emoji: '⭕', color: 'blue' };
    } else if (score >= 90 || (score >= 80 && (styleErrorCount > 0 || excessCount > 0))) {
      // 스타일 오류나 초과 구간이 있지만 위치가 정확한 경우 더 관대하게 평가
      return { emoji: '🔶', color: 'orange' };
    } else if (score >= 60) {
      return { emoji: '⚠️', color: 'darkorange' };
    } else if (score >= 30) {
      return { emoji: '⚠️', color: 'darkorange' };
    } else {
      return { emoji: '❌', color: 'red' };
    }
  }

  // AI 피드백을 위한 상세 분석 정보 생성 (개선됨)
  generateDetailedFeedback(results) {
    const overallStats = {
      totalViews: Object.keys(results).length,
      perfectViews: 0,
      goodViews: 0,
      needsWorkViews: 0,
      totalLines: 0,
      totalCorrectLines: 0,
      totalPartialLines: 0,
      totalStyleErrors: 0,
      totalExcessLines: 0, // 새로 추가
      commonIssues: [],
      consolidationStats: {
        totalOriginalLines: 0,
        totalConsolidatedLines: 0,
        consolidationEfficiency: 0
      }
    };

    Object.keys(results).forEach(viewKey => {
      const result = results[viewKey];
      const analysis = result.accuracy.detailedAnalysis;
      
      if (result.accuracy.score === 100) overallStats.perfectViews++;
      else if (result.accuracy.score >= 80) overallStats.goodViews++;
      else overallStats.needsWorkViews++;
      
      overallStats.totalLines += analysis.totalUserLines;
      overallStats.totalCorrectLines += analysis.matchedLines;
      overallStats.totalPartialLines += analysis.partialMatches || 0;
      overallStats.totalStyleErrors += analysis.styleErrorMatches || 0;
      overallStats.totalExcessLines += analysis.completeWithExcessMatches || 0;
      
      overallStats.consolidationStats.totalOriginalLines += analysis.consolidationInfo.originalUserLines;
      overallStats.consolidationStats.totalConsolidatedLines += analysis.consolidationInfo.consolidatedUserLines;
      
      if (analysis.missingCount > 0) {
        overallStats.commonIssues.push(`${viewKey}에서 ${analysis.missingCount}개 선분 누락`);
      }
      if (analysis.extraCount > 0) {
        overallStats.commonIssues.push(`${viewKey}에서 ${analysis.extraCount}개 불필요한 선분`);
      }
      if (analysis.partialMatches > 0) {
        overallStats.commonIssues.push(`${viewKey}에서 ${analysis.partialMatches}개 부분 일치`);
      }
      if (analysis.styleErrorMatches > 0) {
        overallStats.commonIssues.push(`${viewKey}에서 ${analysis.styleErrorMatches}개 스타일 오류 (위치 정확)`);
      }
      if (analysis.completeWithExcessMatches > 0) {
        overallStats.commonIssues.push(`${viewKey}에서 ${analysis.completeWithExcessMatches}개 선분이 조금 길게 그어짐`);
      }
      if (analysis.consolidationInfo.originalUserLines > analysis.consolidationInfo.consolidatedUserLines) {
        const efficiency = Math.round(
          (1 - analysis.consolidationInfo.consolidatedUserLines / analysis.consolidationInfo.originalUserLines) * 100
        );
        overallStats.commonIssues.push(`${viewKey}에서 ${efficiency}% 선분 통합 최적화`);
      }
    });

    if (overallStats.consolidationStats.totalOriginalLines > 0) {
      overallStats.consolidationStats.consolidationEfficiency = Math.round(
        (1 - overallStats.consolidationStats.totalConsolidatedLines / overallStats.consolidationStats.totalOriginalLines) * 100
      );
    }

    return overallStats;
  }

  // 전체 도면 검증 (수정된 로직 적용)
  validateDrawings(canvases, currentDifficulty) {
    console.log('=== 개선된 커버리지 기반 정답 검증 시작 ===');
    
    const results = {};
    
    Object.keys(canvases).forEach(key => {
      const userLines = canvases[key].lines;
      const answerLines = ANSWER_DATA[currentDifficulty][key];
      
      console.log(`[${key}] 원본 - 사용자: ${userLines.length}개, 정답: ${answerLines.length}개`);
      
      const accuracy = this.calculateAccuracy(userLines, answerLines);
      
      console.log(`[${key}] 통합 후 - 사용자: ${accuracy.detailedAnalysis.consolidationInfo.consolidatedUserLines}개`);
      console.log(`[${key}] 정확도: ${accuracy.score}% (완전: ${accuracy.detailedAnalysis.matchedLines}, 완전+초과: ${accuracy.detailedAnalysis.completeWithExcessMatches}, 부분: ${accuracy.detailedAnalysis.partialMatches}, 스타일오류: ${accuracy.detailedAnalysis.styleErrorMatches})`);
      console.log(`[${key}] 누락: ${accuracy.missing.length}개, 불필요: ${accuracy.extra.length}개`);
      
      // 초과 구간 정보를 피드백에 반영
      results[key] = {
        accuracy,
        message: this.getFeedbackMessage(
          accuracy.score, 
          accuracy.extra.length, 
          accuracy.detailedAnalysis.partialMatches || 0,
          accuracy.detailedAnalysis.styleErrorMatches || 0,
          accuracy.detailedAnalysis.completeWithExcessMatches || 0
        ),
        style: this.getFeedbackStyle(
          accuracy.score, 
          accuracy.detailedAnalysis.styleErrorMatches || 0,
          accuracy.detailedAnalysis.completeWithExcessMatches || 0
        )
      };
      
      console.log('---');
    });
    
    const detailedFeedback = this.generateDetailedFeedback(results);
    console.log('개선된 커버리지 기반 종합 분석:', detailedFeedback);
    
    console.log('=== 개선된 커버리지 기반 정답 검증 완료 ===');
    return results;
  }
}