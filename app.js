// app.js - 메인 앱 로직 (화면과 PDF 통일된 레이아웃)

import { DIFFICULTY_LABELS, ISOMETRIC_IMAGES } from './constants.js';
import { CanvasManager } from './canvas-manager.js';
import { Viewer3D } from './viewer-3d.js';
import { AnswerChecker } from './answer-checker.js';
import { LearningAnalyzer } from './learning-analyzer.js';
import { AIFeedbackManager } from './ai-feedback-manager.js';

class DrawingApp {
  constructor() {
    this.currentDifficulty = '';
    this.canvasManager = new CanvasManager();
    this.viewer3D = new Viewer3D();
    this.answerChecker = new AnswerChecker();
    this.learningAnalyzer = new LearningAnalyzer();
    this.aiFeedbackManager = new AIFeedbackManager();
    
    // 마지막 검증 결과 저장 (AI 피드백에서 사용)
    this.lastValidationResults = null;
    
    // 학습 추적 데이터
    this.learningSession = {
      startTime: null,
      endTime: null,
      attempts: [],
      difficulty: '',
      bestScores: { top: 0, front: 0, side: 0 },
      currentAttempt: 0
    };
    
    this.pages = {
      start: document.getElementById('startPage'),
      difficulty: document.getElementById('difficultyPage'),
      main: document.getElementById('mainPage'),
      results: document.getElementById('resultsPage')
    };
    
    this.initEventListeners();
  }

  // 이벤트 리스너 초기화
  initEventListeners() {
    // 시작 버튼
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.showPage('difficulty');
      });
    }

    // 난이도 선택 버튼들
    const difficultyButtons = document.querySelectorAll('[data-difficulty]');
    difficultyButtons.forEach(button => {
      button.addEventListener('click', () => {
        const selected = button.dataset.difficulty;
        this.setDifficulty(selected);
      });
    });

    // API 키 입력 필드 엔터 키 처리
    const apiKeyInput = document.getElementById('apiKeyInput');
    if (apiKeyInput) {
      apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.getAIFeedback();
        }
      });
    }

    // 전역 함수들을 window에 바인딩 (HTML에서 호출하기 위해)
    window.reset = (key) => this.canvasManager.reset(key);
    window.undo = (key) => this.canvasManager.undo(key);
    window.resetAll = () => this.resetAll();
    window.submitDrawings = () => this.submitDrawings();
    window.getAIFeedback = () => this.getAIFeedback();
    window.finishLearning = () => this.finishLearning();
    window.downloadLearningReport = () => this.downloadLearningReport();
    window.goToStart = () => this.goToStart();
    window.closeApp = () => this.closeApp();
  }

  // 페이지 전환
  showPage(pageId) {
    Object.values(this.pages).forEach(page => {
      if (page) {
        page.classList.remove('active');
      }
    });
    
    if (this.pages[pageId]) {
      this.pages[pageId].classList.add('active');
    }
  }

  // 난이도 설정
  setDifficulty(difficulty) {
    this.currentDifficulty = difficulty;
    
    // 학습 세션 시작
    this.startLearningSession(difficulty);
    
    // 난이도 배지 업데이트
    const badge = document.getElementById('difficultyBadge');
    if (badge) {
      badge.textContent = DIFFICULTY_LABELS[difficulty];
    }
    
    // 등각투상도 이미지 업데이트
    this.updateIsometricImage();
    
    // 메인 페이지로 이동
    this.showPage('main');
    
    // 3D 뷰어 초기화
    this.viewer3D.init(difficulty);
    
    // 캔버스 초기화
    this.canvasManager.initCanvases(difficulty);
  }

  // 학습 세션 시작
  startLearningSession(difficulty) {
    this.learningSession = {
      startTime: new Date(),
      endTime: null,
      attempts: [],
      difficulty: difficulty,
      bestScores: { top: 0, front: 0, side: 0 },
      currentAttempt: 0
    };
    console.log('학습 세션 시작:', this.learningSession);
  }

  // 등각투상도 이미지 업데이트
  updateIsometricImage() {
    const isometricImg = document.getElementById('isometricImage');
    if (!isometricImg) return;
    
    isometricImg.src = ISOMETRIC_IMAGES[this.currentDifficulty];
    
    const altTexts = {
      easy: '복잡한 블록 구조 등각투상도',
      medium: '좀 더 복잡한 블록 구조 등각투상도',
      hard: '복합 기하학적 도형 등각투상도'
    };
    
    isometricImg.alt = altTexts[this.currentDifficulty];
  }

  // 모든 캔버스 초기화
  resetAll() {
    this.canvasManager.resetAll();
    this.resetFeedback();
    this.resetAIFeedback();
  }

  // 피드백 초기화
  resetFeedback() {
    const feedbackElements = ['top', 'front', 'side'];
    feedbackElements.forEach(key => {
      const feedback = document.getElementById(`${key}Feedback`);
      const comment = document.getElementById(`${key}Comment`);
      
      if (feedback) {
        feedback.textContent = '❓';
        feedback.style.color = 'black';
      }
      
      if (comment) {
        comment.textContent = '-';
      }
    });
    
    this.lastValidationResults = null;
  }

  // AI 피드백 초기화
  resetAIFeedback() {
    this.aiFeedbackManager.resetAIFeedback();
  }

  // 도면 제출 및 검증
  submitDrawings() {
    const canvasData = this.canvasManager.getCanvasData();
    const results = this.answerChecker.validateDrawings(canvasData, this.currentDifficulty);
    
    // 검증 결과 저장 (AI 피드백에서 사용)
    this.lastValidationResults = results;
    
    // 학습 시도 기록
    this.recordAttempt(results);
    
    // UI에 피드백 반영
    Object.keys(results).forEach(key => {
      const feedback = document.getElementById(`${key}Feedback`);
      const comment = document.getElementById(`${key}Comment`);
      const result = results[key];
      
      if (feedback) {
        feedback.textContent = result.style.emoji;
        feedback.style.color = result.style.color;
      }
      
      if (comment) {
        comment.textContent = result.message;
      }
    });
  }

  // 학습 시도 기록
  recordAttempt(results) {
    this.learningSession.currentAttempt++;
    
    // 현재 캔버스 데이터 저장
    const canvasData = this.canvasManager.getCanvasData();
    const currentCanvasLines = {
      top: [...canvasData.top.lines], // 깊은 복사
      front: [...canvasData.front.lines],
      side: [...canvasData.side.lines]
    };
    
    const attempt = {
      attemptNumber: this.learningSession.currentAttempt,
      timestamp: new Date(),
      scores: {
        top: results.top.accuracy.score,
        front: results.front.accuracy.score,
        side: results.side.accuracy.score
      },
      details: results,
      canvasLines: currentCanvasLines // 캔버스 데이터 추가
    };
    
    this.learningSession.attempts.push(attempt);
    
    // 최고 점수 업데이트
    Object.keys(attempt.scores).forEach(key => {
      if (attempt.scores[key] > this.learningSession.bestScores[key]) {
        this.learningSession.bestScores[key] = attempt.scores[key];
      }
    });
    
    console.log(`시도 ${this.learningSession.currentAttempt} 기록됨:`, attempt);
  }

  // AI 피드백 기능 (AIFeedbackManager로 위임)
  async getAIFeedback() {
    try {
      await this.aiFeedbackManager.getAIFeedback(
        this.lastValidationResults, 
        this.currentDifficulty, 
        this.canvasManager
      );
    } catch (error) {
      console.error('AI 피드백 처리 중 오류:', error);
    }
  }

  // 학습 마무리
  finishLearning() {
    if (this.learningSession.attempts.length === 0) {
      alert('아직 도면을 제출하지 않았어요! 먼저 도면을 그리고 제출해보세요.');
      return;
    }

    // 학습 세션 종료
    this.learningSession.endTime = new Date();
    
    console.log('학습 세션 종료:', this.learningSession);
    
    // 결과 분석 페이지로 이동
    this.showPage('results');
    
    // 학습 분석기를 사용하여 결과 표시
    try {
      this.learningAnalyzer.displayLearningResults(this.learningSession);
    } catch (error) {
      console.error('학습 결과 표시 중 오류:', error);
    }
  }

  // 간소화된 PDF 다운로드 (화면과 동일한 구조)
  async downloadLearningReport() {
    try {
      // 다운로드 버튼 비활성화
      const downloadBtn = document.querySelector('button[onclick="downloadLearningReport()"]');
      if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.textContent = '📄 생성 중...';
      }

      // 스크롤을 맨 위로 이동
      const resultsPage = document.getElementById('resultsPage');
      if (resultsPage) {
        resultsPage.scrollTo(0, 0);
      }
      window.scrollTo(0, 0);

      // 결과 페이지 전체 컨테이너
      const contentContainer = document.querySelector('#resultsPage > div[style*="max-width: 800px"]');
      
      if (!contentContainer) {
        throw new Error('학습 결과 컨테이너를 찾을 수 없습니다.');
      }

      // 1페이지와 2페이지 요소 분리 (페이지 구분 마커 기준)
      const page1Elements = [];
      const page2Elements = [];
      
      let isPage2 = false;
      const allChildren = Array.from(contentContainer.children);
      
      allChildren.forEach((child) => {
        // 버튼 영역은 PDF에서 제외
        if (child.style.textAlign === 'center' && 
            child.style.marginTop === '30px' && 
            child.querySelector('button')) {
          return; // 버튼 영역은 건너뛰기
        }
        
        // 페이지 구분 마커 확인 - 더 정확한 감지
        if (child.getAttribute && child.getAttribute('data-page-break') === 'true' ||
            child.innerHTML?.includes('PDF 페이지 구분 마커') ||
            child.textContent.includes('🤖 AI 선생님의 학습 분석') ||
            (child.querySelector && child.querySelector('h3') && 
             child.querySelector('h3').textContent.includes('🤖 AI 선생님의 학습 분석'))) {
          isPage2 = true;
          return; // 마커 자체는 PDF에 포함하지 않음
        }
        
        if (isPage2) {
          page2Elements.push(child);
        } else {
          page1Elements.push(child);
        }
      });

      console.log(`페이지 1 요소 수: ${page1Elements.length}, 페이지 2 요소 수: ${page2Elements.length}`);

      // PDF 객체 생성
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210; // A4 너비 (mm)
      const pageHeight = 297; // A4 높이 (mm)
      const margin = 12; // 여백
      const contentWidth = pageWidth - (margin * 2);
      const maxContentHeight = pageHeight - (margin * 2);

      // === 1페이지 생성 ===
      await this.generatePDFPage(pdf, page1Elements, contentContainer, contentWidth, maxContentHeight, margin, 1);

      // === 2페이지 생성 ===
      if (page2Elements.length > 0) {
        pdf.addPage();
        await this.generatePDFPage(pdf, page2Elements, contentContainer, contentWidth, maxContentHeight, margin, 2);
      }

      // 파일명 생성
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const difficultyLabels = { easy: '하급', medium: '중급', hard: '상급' };
      const difficultyLabel = difficultyLabels[this.learningSession.difficulty] || '알수없음';
      
      const filename = `도면학습결과_${difficultyLabel}_${dateStr}_${timeStr}.pdf`;

      // PDF 다운로드
      pdf.save(filename);
      console.log('학습 결과 PDF 다운로드 완료:', filename);

    } catch (error) {
      console.error('PDF 다운로드 중 오류:', error);
      alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      // 버튼 영역 다시 표시 (PDF 생성 완료 후)
      const buttonArea = document.querySelector('#resultsPage div[style*="text-align: center"]');
      if (buttonArea && buttonArea.style.display === 'none') {
        buttonArea.style.display = 'block';
      }

      // 다운로드 버튼 복원
      const downloadBtn = document.querySelector('button[onclick="downloadLearningReport()"]');
      if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.textContent = '📄 학습 결과 다운로드';
      }
    }
  }

  // PDF 페이지 생성 (화면과 동일한 구조 사용)
  async generatePDFPage(pdf, elements, originalContainer, contentWidth, maxContentHeight, margin, pageNumber) {
    try {
      // 임시 컨테이너 생성
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: absolute;
        top: -10000px;
        left: -10000px;
        width: 800px;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f4f4f4;
        font-family: 'Noto Sans KR', sans-serif;
        box-sizing: border-box;
        line-height: 1.4;
      `;

      // 요소들 복사해서 임시 컨테이너에 추가
      elements.forEach(element => {
        const clonedElement = element.cloneNode(true);
        
        // 로딩 관련 요소 제거
        const loadingSpinners = clonedElement.querySelectorAll('.loading-spinner');
        loadingSpinners.forEach(spinner => spinner.remove());
        
        const loadingContent = clonedElement.querySelector('.loading-content');
        if (loadingContent && loadingContent.textContent.includes('AI가 학습 패턴을 분석하고 있습니다')) {
          loadingContent.remove();
        }
        
        tempContainer.appendChild(clonedElement);
      });

      // 임시 컨테이너를 DOM에 추가
      document.body.appendChild(tempContainer);

      // 페이지 정보 추가
      const pageInfo = document.createElement('div');
      pageInfo.style.cssText = `
        text-align: center;
        font-size: 0.75rem;
        color: #888;
        margin-top: 15px;
        padding-top: 8px;
        border-top: 1px solid #ccc;
      `;
      pageInfo.innerHTML = `Page ${pageNumber} · ${new Date().toLocaleDateString('ko-KR')}`;
      tempContainer.appendChild(pageInfo);

      // html2canvas로 캡처
      const canvas = await html2canvas(tempContainer, {
        scale: 1.8,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f4f4f4',
        width: tempContainer.scrollWidth,
        height: tempContainer.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        logging: false,
        ignoreElements: (element) => {
          return element.tagName === 'CANVAS' && element.getContext && element.getContext('webgl');
        }
      });

      // 임시 컨테이너 제거
      document.body.removeChild(tempContainer);

      // 캔버스를 PDF에 추가
      const imgData = canvas.toDataURL('image/png', 0.92);
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      // 페이지에 맞춰 스케일 조정
      let finalWidth = imgWidth;
      let finalHeight = imgHeight;
      
      if (imgHeight > maxContentHeight) {
        const scaleFactor = maxContentHeight / imgHeight;
        finalWidth = imgWidth * scaleFactor;
        finalHeight = maxContentHeight;
        console.log(`페이지 ${pageNumber} 스케일 조정: ${imgHeight.toFixed(1)}mm → ${finalHeight.toFixed(1)}mm`);
      }

      // PDF에 이미지 추가 (상단 정렬)
      pdf.addImage(imgData, 'PNG', margin, margin, finalWidth, finalHeight);
      
      console.log(`페이지 ${pageNumber} 생성 완료: ${finalWidth.toFixed(1)}mm x ${finalHeight.toFixed(1)}mm`);

    } catch (error) {
      console.error(`페이지 ${pageNumber} 생성 중 오류:`, error);
      throw error;
    }
  }

  // 처음으로 돌아가기
  goToStart() {
    // 학습 세션 초기화
    this.learningSession = {
      startTime: null,
      endTime: null,
      attempts: [],
      difficulty: '',
      bestScores: { 
        top: 0, 
        front: 0, 
        side: 0 
      },
      currentAttempt: 0
    };
    
    this.currentDifficulty = '';
    this.lastValidationResults = null;
    
    // 학습 분석기 상태 초기화
    this.learningAnalyzer.isAIAnalyzing = false;
    
    // 모든 캔버스 초기화
    this.canvasManager.resetAll();
    this.resetFeedback();
    this.resetAIFeedback();
    
    // 시작 페이지로
    this.showPage('start');
  }

  // 앱 종료 (창 닫기)
  closeApp() {
    // 사용자에게 확인 메시지
    const confirmClose = confirm('정말로 도면 연습을 끝내시겠습니까?\n\n학습 결과는 저장되지 않습니다.');
    
    if (confirmClose) {
      // 브라우저 창 닫기 시도
      try {
        window.close();
        
        // window.close()가 작동하지 않는 경우 (일부 브라우저에서)
        setTimeout(() => {
          alert('브라우저 창을 직접 닫아주세요.\n\n학습해주셔서 감사합니다! 😊');
        }, 100);
      } catch (error) {
        alert('브라우저 창을 직접 닫아주세요.\n\n학습해주셔서 감사합니다! 😊');
      }
    }
  }
}

// DOM 로드 완료 후 앱 초기화
document.addEventListener("DOMContentLoaded", () => {
  new DrawingApp();
});