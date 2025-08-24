// canvas-manager.js - 캔버스 그리기 시스템 (우클릭 스타일 변경 기능 추가)

import { CONFIG, REFERENCE_POINTS } from './constants.js';

export class CanvasManager {
  constructor() {
    this.canvases = {
      top: { canvas: null, ctx: null, lines: [], lastPoint: null },
      front: { canvas: null, ctx: null, lines: [], lastPoint: null },
      side: { canvas: null, ctx: null, lines: [], lastPoint: null }
    };
    this.currentDifficulty = '';
    
    // 이벤트 핸들러들을 저장할 객체 (중복 등록 방지용)
    this.eventHandlers = {
      top: { click: null, mousemove: null, contextmenu: null },
      front: { click: null, mousemove: null, contextmenu: null },
      side: { click: null, mousemove: null, contextmenu: null }
    };
  }

  // 캔버스 초기화
  initCanvases(difficulty) {
    this.currentDifficulty = difficulty;
    
    this.canvases.top.canvas = document.getElementById('topCanvas');
    this.canvases.front.canvas = document.getElementById('frontCanvas');
    this.canvases.side.canvas = document.getElementById('sideCanvas');

    Object.keys(this.canvases).forEach(key => {
      const obj = this.canvases[key];
      obj.ctx = obj.canvas.getContext("2d");
      this.drawGrid(obj.ctx);
      this.drawReferencePoint(obj.ctx, key);
      obj.lines = [];
      obj.isWaitingForSecondClick = false;
      obj.startX = null;
      obj.startY = null;
      
      // 기존 이벤트 리스너 제거
      this.removeEventListeners(key);
      
      // 새로운 이벤트 핸들러 생성 및 등록
      this.eventHandlers[key].click = (e) => this.onClick(e, key);
      this.eventHandlers[key].mousemove = (e) => this.onMouseMove(e, key);
      this.eventHandlers[key].contextmenu = (e) => this.onRightClick(e, key);
      
      obj.canvas.addEventListener("click", this.eventHandlers[key].click);
      obj.canvas.addEventListener("mousemove", this.eventHandlers[key].mousemove);
      obj.canvas.addEventListener("contextmenu", this.eventHandlers[key].contextmenu);
    });
  }

  // 기존 이벤트 리스너 제거
  removeEventListeners(key) {
    const obj = this.canvases[key];
    if (obj.canvas && this.eventHandlers[key]) {
      if (this.eventHandlers[key].click) {
        obj.canvas.removeEventListener("click", this.eventHandlers[key].click);
      }
      if (this.eventHandlers[key].mousemove) {
        obj.canvas.removeEventListener("mousemove", this.eventHandlers[key].mousemove);
      }
      if (this.eventHandlers[key].contextmenu) {
        obj.canvas.removeEventListener("contextmenu", this.eventHandlers[key].contextmenu);
      }
    }
  }

  // 모든 이벤트 리스너 제거 (앱 종료 시 사용)
  removeAllEventListeners() {
    Object.keys(this.canvases).forEach(key => {
      this.removeEventListeners(key);
    });
  }

  // 격자 그리기
  drawGrid(ctx) {
    ctx.clearRect(0, 0, CONFIG.CANVAS_SIZE, CONFIG.CANVAS_SIZE);
    ctx.strokeStyle = "#e0e0e0";
    
    for (let x = 0; x <= CONFIG.CANVAS_SIZE; x += CONFIG.GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CONFIG.CANVAS_SIZE);
      ctx.stroke();
    }
    
    for (let y = 0; y <= CONFIG.CANVAS_SIZE; y += CONFIG.GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CONFIG.CANVAS_SIZE, y);
      ctx.stroke();
    }
  }

  // 기준점 그리기
  drawReferencePoint(ctx, key) {
    const refPoint = REFERENCE_POINTS[this.currentDifficulty][key];
    const referenceX = refPoint.x * CONFIG.GRID_SIZE;
    const referenceY = refPoint.y * CONFIG.GRID_SIZE;
    
    ctx.fillStyle = refPoint.color;
    ctx.beginPath();
    ctx.arc(referenceX, referenceY, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // 기준점 라벨
    ctx.fillStyle = refPoint.color;
    ctx.font = "12px Arial";
    ctx.fillText("기준점", referenceX + 8, referenceY - 8);
  }

  // 격자에 스냅
  snapToGrid(x, y) {
    return [
      Math.round(x / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE,
      Math.round(y / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE
    ];
  }

  // 점과 선분 사이의 거리 계산
  distanceToLine(px, py, line) {
    const A = px - line.from.x;
    const B = py - line.from.y;
    const C = line.to.x - line.from.x;
    const D = line.to.y - line.from.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    
    let param = dot / lenSq;
    
    if (param < 0) {
      return Math.sqrt(A * A + B * B);
    } else if (param > 1) {
      const dx = px - line.to.x;
      const dy = py - line.to.y;
      return Math.sqrt(dx * dx + dy * dy);
    } else {
      const dx = px - (line.from.x + param * C);
      const dy = py - (line.from.y + param * D);
      return Math.sqrt(dx * dx + dy * dy);
    }
  }

  // 클릭 위치에서 가장 가까운 선분 찾기
  findNearestLine(x, y, key) {
    const obj = this.canvases[key];
    let nearestLine = null;
    let nearestIndex = -1;
    let minDistance = Infinity;
    const threshold = 10; // 10픽셀 이내

    obj.lines.forEach((line, index) => {
      const distance = this.distanceToLine(x, y, line);
      if (distance < threshold && distance < minDistance) {
        minDistance = distance;
        nearestLine = line;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }

  // 우클릭 이벤트 (선 스타일 변경)
  onRightClick(e, key) {
    e.preventDefault(); // 컨텍스트 메뉴 방지
    
    const obj = this.canvases[key];
    const rect = obj.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 가장 가까운 선분 찾기
    const lineIndex = this.findNearestLine(x, y, key);
    
    if (lineIndex !== -1) {
      // 선 스타일 토글
      const line = obj.lines[lineIndex];
      line.style = line.style === 'dashed' ? 'solid' : 'dashed';
      
      console.log(`[${key}] 선 ${lineIndex + 1} 스타일 변경: ${line.style}`);
      console.log(`[${key}] 선 좌표: (${line.from.x/CONFIG.GRID_SIZE}, ${line.from.y/CONFIG.GRID_SIZE}) → (${line.to.x/CONFIG.GRID_SIZE}, ${line.to.y/CONFIG.GRID_SIZE})`);
      
      // 캔버스 다시 그리기
      this.redrawCanvas(key);
    }
  }

  // 마우스 클릭 이벤트
  onClick(e, key) {
    const obj = this.canvases[key];
    const rect = obj.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const [snapX, snapY] = this.snapToGrid(x, y);
    
    if (!obj.isWaitingForSecondClick) {
      // 첫 번째 클릭: 시작점 설정
      obj.startX = snapX;
      obj.startY = snapY;
      obj.isWaitingForSecondClick = true;
      
      console.log(`[${key}] 시작점 클릭 - 좌표: (${snapX}, ${snapY}) | 격자: (${snapX/CONFIG.GRID_SIZE}, ${snapY/CONFIG.GRID_SIZE})`);
      
      // 시작점에 작은 점 표시
      this.redrawCanvas(key);
      obj.ctx.fillStyle = "red";
      obj.ctx.beginPath();
      obj.ctx.arc(snapX, snapY, 3, 0, Math.PI * 2);
      obj.ctx.fill();
    } else {
      // 두 번째 클릭: 선 완성
      if (obj.startX !== snapX || obj.startY !== snapY) {
        obj.lines.push({ 
          from: { x: obj.startX, y: obj.startY }, 
          to: { x: snapX, y: snapY },
          style: 'solid' // 기본적으로 실선
        });
        
        console.log(`[${key}] 선 완성 - 시작: (${obj.startX}, ${obj.startY}) 끝: (${snapX}, ${snapY})`);
        console.log(`[${key}] 격자 좌표 - 시작: (${obj.startX/CONFIG.GRID_SIZE}, ${obj.startY/CONFIG.GRID_SIZE}) 끝: (${snapX/CONFIG.GRID_SIZE}, ${snapY/CONFIG.GRID_SIZE})`);
        console.log(`[${key}] 현재 총 선 개수: ${obj.lines.length}`);
        console.log('---');
      }
      obj.isWaitingForSecondClick = false;
      obj.startX = null;
      obj.startY = null;
      this.redrawCanvas(key);
    }
  }

  // 마우스 이동 이벤트
  onMouseMove(e, key) {
    const obj = this.canvases[key];
    if (!obj.isWaitingForSecondClick) return;

    const rect = obj.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const [currentX, currentY] = this.snapToGrid(x, y);

    // 격자와 기존 선들을 다시 그리고, 미리보기 선 추가
    this.redrawCanvas(key);
    
    // 시작점 표시
    obj.ctx.fillStyle = "red";
    obj.ctx.beginPath();
    obj.ctx.arc(obj.startX, obj.startY, 3, 0, Math.PI * 2);
    obj.ctx.fill();
    
    // 미리보기 선 그리기 (회색 실선으로)
    obj.ctx.strokeStyle = "#999";
    obj.ctx.lineWidth = 2;
    obj.ctx.setLineDash([]); // 실선으로
    obj.ctx.beginPath();
    obj.ctx.moveTo(obj.startX, obj.startY);
    obj.ctx.lineTo(currentX, currentY);
    obj.ctx.stroke();
    
    // 끝점 미리보기
    obj.ctx.fillStyle = "#999";
    obj.ctx.beginPath();
    obj.ctx.arc(currentX, currentY, 3, 0, Math.PI * 2);
    obj.ctx.fill();
  }

  // 캔버스 다시 그리기
  redrawCanvas(key) {
    const obj = this.canvases[key];
    this.drawGrid(obj.ctx);
    this.drawReferencePoint(obj.ctx, key);
    
    // 기존 선들 모두 그리기
    obj.ctx.lineWidth = 2;
    
    obj.lines.forEach(line => {
      obj.ctx.strokeStyle = "black";
      
      // 선 스타일 설정
      if (line.style === 'dashed') {
        obj.ctx.setLineDash([8, 4]); // 점선
      } else {
        obj.ctx.setLineDash([]); // 실선
      }
      
      obj.ctx.beginPath();
      obj.ctx.moveTo(line.from.x, line.from.y);
      obj.ctx.lineTo(line.to.x, line.to.y);
      obj.ctx.stroke();
    });
    
    // 점선 설정 초기화
    obj.ctx.setLineDash([]);
  }

  // 개별 캔버스 초기화
  reset(key) {
    const obj = this.canvases[key];
    console.log(`[${key}] 캔버스 초기화 - 삭제된 선 개수: ${obj.lines.length}`);
    obj.lines = [];
    obj.isWaitingForSecondClick = false;
    obj.startX = null;
    obj.startY = null;
    this.redrawCanvas(key);
    console.log('---');
  }

  // 되돌리기
  undo(key) {
    const obj = this.canvases[key];
    if (obj.isWaitingForSecondClick) {
      // 첫 번째 클릭 상태라면 그것을 취소
      console.log(`[${key}] 시작점 선택 취소 - 좌표: (${obj.startX}, ${obj.startY})`);
      obj.isWaitingForSecondClick = false;
      obj.startX = null;
      obj.startY = null;
    } else {
      // 완성된 선이 있다면 마지막 선 삭제
      if (obj.lines.length > 0) {
        const deletedLine = obj.lines[obj.lines.length - 1];
        console.log(`[${key}] 마지막 선 삭제 - 시작: (${deletedLine.from.x}, ${deletedLine.from.y}) 끝: (${deletedLine.to.x}, ${deletedLine.to.y}) 스타일: ${deletedLine.style}`);
        obj.lines.pop();
        console.log(`[${key}] 남은 선 개수: ${obj.lines.length}`);
      } else {
        console.log(`[${key}] 삭제할 선이 없습니다`);
      }
    }
    this.redrawCanvas(key);
    console.log('---');
  }

  // 모든 캔버스 초기화
  resetAll() {
    console.log('=== 모든 캔버스 초기화 ===');
    
    // 모든 캔버스 초기화
    Object.keys(this.canvases).forEach(key => {
      const obj = this.canvases[key];
      console.log(`[${key}] 캔버스 초기화 - 삭제된 선 개수: ${obj.lines.length}`);
      
      // 선분 데이터 초기화
      obj.lines = [];
      obj.isWaitingForSecondClick = false;
      obj.startX = null;
      obj.startY = null;
      
      // 캔버스 다시 그리기
      this.redrawCanvas(key);
    });
    
    console.log('모든 캔버스가 초기화되었습니다.');
    console.log('=========================');
  }

  // 캔버스 데이터 가져오기
  getCanvasData() {
    return this.canvases;
  }
}