// constants.js - 설정값과 정답 데이터 (선 스타일 포함)

export const CONFIG = {
  GRID_SIZE: 30,
  CANVAS_SIZE: 300,
  TOLERANCE: 0.5,
  TICK_COUNT: 10
};

export const DIFFICULTY_LABELS = {
  easy: '하',
  medium: '중', 
  hard: '상'
};

export const ISOMETRIC_IMAGES = {
  easy: 'figure1.png',
  medium: 'figure2.png',
  hard: 'figure3.png'
};

// 난이도별 기준점 위치 (격자 좌표)
export const REFERENCE_POINTS = {
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

// 정답 데이터 (격자 좌표 기준, 선 스타일 포함)
export const ANSWER_DATA = {
  easy: {
    top: [
      // 외곽 4x4 사각형
      { from: { x: 3, y: 3 }, to: { x: 7, y: 3 }, style: 'solid' },    // 기준점에서 우측으로 하단선
      { from: { x: 7, y: 3 }, to: { x: 7, y: 7 }, style: 'solid' },    // 우측 세로선
      { from: { x: 7, y: 7 }, to: { x: 3, y: 7 }, style: 'solid' },    // 상단 가로선
      { from: { x: 3, y: 7 }, to: { x: 3, y: 3 }, style: 'solid' },    // 기준점으로 돌아오는 좌측 세로선
      // 내부 세로 분할선 1개
      { from: { x: 5, y: 3 }, to: { x: 5, y: 7 }, style: 'solid' },    // 중앙 세로 분할선
    ],
    front: [
      // L자 형태 외곽선
      { from: { x: 3, y: 7 }, to: { x: 7, y: 7 }, style: 'solid' },    // 기준점에서 우측으로 하단선
      { from: { x: 7, y: 7 }, to: { x: 7, y: 5 }, style: 'solid' },    // 우측 세로선 (위로)
      { from: { x: 7, y: 5 }, to: { x: 5, y: 5 }, style: 'solid' },    // 중간 가로선 (좌측으로)
      { from: { x: 5, y: 5 }, to: { x: 5, y: 3 }, style: 'solid' },    // 두 번째 세로선 (위로)
      { from: { x: 5, y: 3 }, to: { x: 3, y: 3 }, style: 'solid' },    // 상단 가로선 (좌측으로)
      { from: { x: 3, y: 3 }, to: { x: 3, y: 7 }, style: 'solid' },    // 기준점으로 돌아오는 좌측 세로선
    ],
    side: [
      // 외곽 4x4 사각형
      { from: { x: 7, y: 7 }, to: { x: 3, y: 7 }, style: 'solid' },    // 기준점에서 좌측으로 하단선
      { from: { x: 3, y: 7 }, to: { x: 3, y: 3 }, style: 'solid' },    // 좌측 세로선
      { from: { x: 3, y: 3 }, to: { x: 7, y: 3 }, style: 'solid' },    // 상단 가로선
      { from: { x: 7, y: 3 }, to: { x: 7, y: 7 }, style: 'solid' },    // 기준점으로 돌아오는 우측 세로선
      // 내부 가로 분할선 1개
      { from: { x: 3, y: 5 }, to: { x: 7, y: 5 }, style: 'solid' },    // 중앙 가로 분할선
    ]
  },
  medium: {
    top: [
      // 외곽 6x4 사각형
      { from: { x: 2, y: 3 }, to: { x: 8, y: 3 }, style: 'solid' },    // 기준점에서 우측으로 하단선
      { from: { x: 8, y: 3 }, to: { x: 8, y: 7 }, style: 'solid' },    // 우측 세로선
      { from: { x: 8, y: 7 }, to: { x: 2, y: 7 }, style: 'solid' },    // 상단 가로선
      { from: { x: 2, y: 7 }, to: { x: 2, y: 3 }, style: 'solid' },    // 기준점으로 돌아오는 좌측 세로선
      // 내부 세로 분할선 2개
      { from: { x: 4, y: 3 }, to: { x: 4, y: 7 }, style: 'solid' },    // 첫 번째 세로 분할선
      { from: { x: 6, y: 3 }, to: { x: 6, y: 7 }, style: 'solid' },    // 두 번째 세로 분할선
    ],
    front: [
      // 계단식 형태 외곽선
      { from: { x: 2, y: 7 }, to: { x: 8, y: 7 }, style: 'solid' },    // 기준점에서 우측으로 하단선
      { from: { x: 8, y: 7 }, to: { x: 8, y: 3 }, style: 'solid' },    // 우측 세로선 (위로)
      { from: { x: 8, y: 3 }, to: { x: 6, y: 3 }, style: 'solid' },    // 상단 우측 가로선 (좌측으로)
      { from: { x: 6, y: 3 }, to: { x: 6, y: 5 }, style: 'solid' },    // 첫 번째 내부 세로선 (아래로)
      { from: { x: 6, y: 5 }, to: { x: 4, y: 5 }, style: 'solid' },    // 중간 가로선 (좌측으로)
      { from: { x: 4, y: 5 }, to: { x: 4, y: 3 }, style: 'solid' },    // 두 번째 내부 세로선 (위로)
      { from: { x: 4, y: 3 }, to: { x: 2, y: 3 }, style: 'solid' },    // 상단 좌측 가로선 (좌측으로)
      { from: { x: 2, y: 3 }, to: { x: 2, y: 7 }, style: 'solid' },    // 기준점으로 돌아오는 좌측 세로선
    ],
    side: [
      // 외곽 4x4 사각형
      { from: { x: 7, y: 7 }, to: { x: 3, y: 7 }, style: 'solid' },    // 기준점에서 좌측으로 하단선
      { from: { x: 3, y: 7 }, to: { x: 3, y: 3 }, style: 'solid' },    // 좌측 세로선
      { from: { x: 3, y: 3 }, to: { x: 7, y: 3 }, style: 'solid' },    // 상단 가로선
      { from: { x: 7, y: 3 }, to: { x: 7, y: 7 }, style: 'solid' },    // 기준점으로 돌아오는 우측 세로선
      // 내부 가로 분할선 1개 (숨은선 - 점선)
      { from: { x: 3, y: 5 }, to: { x: 7, y: 5 }, style: 'dashed' },   // 중앙 가로 분할선 (안보이는 선)
    ]
  },
  hard: {
    top: [
      // 외곽 6x4 사각형
      { from: { x: 2, y: 3 }, to: { x: 8, y: 3 }, style: 'solid' },    // 기준점에서 우측으로 하단선
      { from: { x: 8, y: 3 }, to: { x: 8, y: 7 }, style: 'solid' },    // 우측 세로선
      { from: { x: 8, y: 7 }, to: { x: 2, y: 7 }, style: 'solid' },    // 상단 가로선
      { from: { x: 2, y: 7 }, to: { x: 2, y: 3 }, style: 'solid' },    // 기준점으로 돌아오는 좌측 세로선
      // 내부 세로 분할선 1개
      { from: { x: 4, y: 3 }, to: { x: 4, y: 7 }, style: 'solid' },    // 세로 분할선 (격자 4에서)
    ],
    front: [
      // 빗면이 포함된 형태
      { from: { x: 2, y: 7 }, to: { x: 8, y: 7 }, style: 'solid' },    // 기준점에서 우측으로 하단선
      { from: { x: 8, y: 7 }, to: { x: 8, y: 5 }, style: 'solid' },    // 우측 세로선 (위로 2칸)
      { from: { x: 8, y: 5 }, to: { x: 4, y: 3 }, style: 'solid' },    // 빗면 (대각선: 좌상향)
      { from: { x: 4, y: 3 }, to: { x: 2, y: 3 }, style: 'solid' },    // 상단 가로선 (좌측으로)
      { from: { x: 2, y: 3 }, to: { x: 2, y: 7 }, style: 'solid' },    // 기준점으로 돌아오는 좌측 세로선
    ],
    side: [
      // 외곽 4x4 사각형
      { from: { x: 7, y: 7 }, to: { x: 3, y: 7 }, style: 'solid' },    // 기준점에서 좌측으로 하단선
      { from: { x: 3, y: 7 }, to: { x: 3, y: 3 }, style: 'solid' },    // 좌측 세로선
      { from: { x: 3, y: 3 }, to: { x: 7, y: 3 }, style: 'solid' },    // 상단 가로선
      { from: { x: 7, y: 3 }, to: { x: 7, y: 7 }, style: 'solid' },    // 기준점으로 돌아오는 우측 세로선
      // 내부 가로 분할선 1개
      { from: { x: 3, y: 5 }, to: { x: 7, y: 5 }, style: 'solid' },    // 중앙 가로 분할선
    ]
  }
};