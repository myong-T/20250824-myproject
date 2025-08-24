// viewer-3d.js - 3D 뷰어 시스템

import { SimpleOrbitControls } from './orbit-controls.js';
import { CONFIG } from './constants.js';

export class Viewer3D {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
  }

  // 3D 뷰어 초기화
  init(difficulty) {
    const viewer = document.getElementById('viewer');
    viewer.innerHTML = '';
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      preserveDrawingBuffer: true // PDF 캡처를 위해 필요
    });
    this.renderer.setSize(335, 335);
    viewer.appendChild(this.renderer.domElement);

    if (difficulty === 'easy') {
      this.setupComplexBlockScene();
    } else if (difficulty === 'medium') {
      this.setupCylinderScene();
    } else {
      this.setupAdvancedGeometryScene();
    }
  }

  // 공통 씬 설정
  setupScene(targetPosition = new THREE.Vector3(1.5, 1.5, 0.5)) {
    this.camera.position.set(10, 10, 15);
    
    // OrbitControls 추가
    this.controls = new SimpleOrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;
    this.controls.target.copy(targetPosition);
    
    const group = new THREE.Group();
    this.scene.add(group);

    // 좌표축
    const axesHelper = new THREE.AxesHelper(10);
    group.add(axesHelper);

    // 조명
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 15, 10);
    this.scene.add(dirLight);

    // 상세한 격자선 시스템
    this.addGridSystem(group);
    this.addAxisLabels(group);

    return group;
  }

  // 격자 시스템 추가
  addGridSystem(group) {
    const tickCount = CONFIG.TICK_COUNT;
    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });

    // X축 기준 → YZ 평면
    for (let i = 0; i <= tickCount; i++) {
      const tick = this.createTickMark('red');
      tick.position.set(i, 0, 0);
      group.add(tick);

      // Y축 방향 선
      const yGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i, 0, 0),
        new THREE.Vector3(i, tickCount, 0)
      ]);
      group.add(new THREE.Line(yGeo, gridMaterial));

      // Z축 방향 선
      const zGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i, 0, 0),
        new THREE.Vector3(i, 0, tickCount)
      ]);
      group.add(new THREE.Line(zGeo, gridMaterial));
    }

    // Y축 기준 → XZ 평면
    for (let i = 0; i <= tickCount; i++) {
      const tick = this.createTickMark('green');
      tick.position.set(0, i, 0);
      group.add(tick);

      // X축 방향 선
      const xGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, i, 0),
        new THREE.Vector3(tickCount, i, 0)
      ]);
      group.add(new THREE.Line(xGeo, gridMaterial));

      // Z축 방향 선
      const zGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, i, 0),
        new THREE.Vector3(0, i, tickCount)
      ]);
      group.add(new THREE.Line(zGeo, gridMaterial));
    }

    // Z축 기준 → XY 평면
    for (let i = 0; i <= tickCount; i++) {
      const tick = this.createTickMark('blue');
      tick.position.set(0, 0, i);
      group.add(tick);

      // X축 방향 선
      const xGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, i),
        new THREE.Vector3(tickCount, 0, i)
      ]);
      group.add(new THREE.Line(xGeo, gridMaterial));

      // Y축 방향 선
      const yGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, i),
        new THREE.Vector3(0, tickCount, i)
      ]);
      group.add(new THREE.Line(yGeo, gridMaterial));
    }
  }

  // 축 라벨 추가
  addAxisLabels(group) {
    const tickCount = CONFIG.TICK_COUNT;

    // 축 라벨 + 한글 레이블
    const xLabel = this.createTextSprite('X', 'red');
    xLabel.position.set(tickCount + 0.5, 0, 0);
    group.add(xLabel);

    const rightLabel = this.createTextSprite('우측면', 'white');
    rightLabel.position.set(tickCount + 0.5, 0, -0.5);
    group.add(rightLabel);

    const yLabel = this.createTextSprite('Y', 'green');
    yLabel.position.set(0, tickCount + 0.5, 0);
    group.add(yLabel);

    const topLabel = this.createTextSprite('평면', 'white');
    topLabel.position.set(-0.8, tickCount + 0.5, 0);
    group.add(topLabel);

    const zLabel = this.createTextSprite('Z', 'blue');
    zLabel.position.set(0, 0, tickCount + 0.5);
    group.add(zLabel);

    const frontLabel = this.createTextSprite('정면', 'white');
    frontLabel.position.set(0, -0.5, tickCount + 0.5);
    group.add(frontLabel);
  }

  // 보조선용 점 생성
  createTickMark(color = 'white') {
    const geometry = new THREE.SphereGeometry(0.05, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color });
    return new THREE.Mesh(geometry, material);
  }

  // 텍스트 스프라이트 생성
  createTextSprite(message, color = 'white') {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = '48px Arial';
    context.fillStyle = color;
    context.fillText(message, 0, 50);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.6, 0.3, 1);
    return sprite;
  }

  // 복잡한 블록 구조 (하 난이도)
  setupComplexBlockScene() {
    const group = this.setupScene();

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xB299D4 });

    const positions = [
      [0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0],
      [0, 1, 0], [0, 2, 0], [0, 3, 0],
      [0, 0, 1], [1, 0, 1], [2, 0, 1], [3, 0, 1],
      [0, 0, 2], [1, 0, 2], [2, 0, 2], [3, 0, 2],
      [0, 0, 3], [1, 0, 3], [2, 0, 3], [3, 0, 3],
      [0, 1, 1], [0, 2, 1], [0, 3, 1],
      [0, 1, 2], [0, 2, 2], [0, 3, 2],
      [0, 1, 3], [0, 2, 3], [0, 3, 3],
      [1, 1, 0], [2, 1, 0], [3, 1, 0],
      [1, 2, 0], [1, 3, 0],
      [1, 1, 1], [2, 1, 1], [3, 1, 1],
      [1, 2, 1], [1, 3, 1],
      [1, 1, 2], [2, 1, 2], [3, 1, 2],
      [1, 2, 2], [1, 3, 2],
      [1, 1, 3], [2, 1, 3], [3, 1, 3],
      [1, 2, 3], [1, 3, 3]
    ];

    positions.forEach(pos => {
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(pos[0] + 0.5, pos[1] + 0.5, pos[2] + 0.5);
      group.add(cube);
    });

    this.startAnimation();
  }

  // 실린더 씬 (중 난이도)
  setupCylinderScene() {
    const targetPosition = new THREE.Vector3(2.5, 1.5, 1.5);
    const group = this.setupScene(targetPosition);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });

    const positions = [
      [0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0], [4, 0, 0], [5, 0, 0],
      [0, 1, 0], [0, 2, 0], [0, 3, 0],
      [0, 0, 1], [1, 0, 1], [2, 0, 1], [3, 0, 1], [4, 0, 1], [5, 0, 1],
      [0, 0, 2], [1, 0, 2], [2, 0, 2], [3, 0, 2], [4, 0, 2], [5, 0, 2],
      [0, 0, 3], [1, 0, 3], [2, 0, 3], [3, 0, 3], [4, 0, 3], [5, 0, 3],
      [0, 1, 1], [0, 2, 1], [0, 3, 1],
      [0, 1, 2], [0, 2, 2], [0, 3, 2],
      [0, 1, 3], [0, 2, 3], [0, 3, 3],
      [1, 1, 0], [2, 1, 0], [3, 1, 0], [4, 1, 0], [5, 1, 0],
      [1, 2, 0], [1, 3, 0], 
      [1, 1, 1], [2, 1, 1], [3, 1, 1], [4, 1, 1], [5, 1, 1],
      [1, 2, 1], [1, 3, 1],
      [1, 1, 2], [2, 1, 2], [3, 1, 2], [4, 1, 2], [5, 1, 2],
      [1, 2, 2], [1, 3, 2],
      [1, 1, 3], [2, 1, 3], [3, 1, 3], [4, 1, 3], [5, 1, 3],
      [1, 2, 3], [1, 3, 3],
      [4, 3, 0], [5, 3, 0],
      [4, 3, 1], [5, 3, 1],
      [4, 3, 2], [5, 3, 2],
      [4, 3, 3], [5, 3, 3],
      [4, 2, 0], [5, 2, 0],
      [4, 2, 1], [5, 2, 1],
      [4, 2, 2], [5, 2, 2],
      [4, 2, 3], [5, 2, 3]
    ];

    positions.forEach(pos => {
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(pos[0] + 0.5, pos[1] + 0.5, pos[2] + 0.5);
      group.add(cube);
    });

    this.startAnimation();
  }

  // 복합 기하학적 도형 (상 난이도)
  setupAdvancedGeometryScene() {
    const targetPosition = new THREE.Vector3(3, 2, 2);
    const group = this.setupScene(targetPosition);

    const smoothUnifiedGeometry = this.createSmoothUnifiedShape();
    const smoothUnifiedMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x1E3A8A,
      side: THREE.DoubleSide
    });
    const smoothUnifiedMesh = new THREE.Mesh(smoothUnifiedGeometry, smoothUnifiedMaterial);

    // 모서리 라인 추가
    const edges = new THREE.EdgesGeometry(smoothUnifiedGeometry, 25);
    const edgeMaterial = new THREE.LineBasicMaterial({ 
      color: 0x2C3E50,
      linewidth: 2,
      transparent: true,
      opacity: 0.6
    });
    const edgeLines = new THREE.LineSegments(edges, edgeMaterial);

    group.add(smoothUnifiedMesh);
    group.add(edgeLines);

    // 조명 최적화
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight.position.set(10, 15, 10);
    this.scene.add(dirLight);

    this.startAnimation();
  }

  // 매끄러운 통합 도형 생성
  createSmoothUnifiedShape() {
    const smoothGeometry = new THREE.BufferGeometry();
    
    const vertices = [];
    const indices = [];
    
    const uniqueVertices = [
      // 빗면과 좌측면이 만나는 정점들
      0, 4, 0,    // 0: 원점 상단 앞
      0, 4, 4,    // 1: 원점 상단 뒤
      2, 4, 0,    // 2: 빗면 좌상단 앞
      2, 4, 4,    // 3: 빗면 좌상단 뒤
      6, 2, 0,    // 4: 빗면 우하단 앞
      6, 2, 4,    // 5: 빗면 우하단 뒤
      
      // 바닥면 정점들
      0, 0, 0,    // 6: 원점 하단 앞
      0, 0, 4,    // 7: 원점 하단 뒤
      2, 0, 0,    // 8: 중간 하단 앞
      2, 0, 4,    // 9: 중간 하단 뒤
      6, 0, 0,    // 10: 우측 하단 앞
      6, 0, 4,    // 11: 우측 하단 뒤
    ];
    
    vertices.push(...uniqueVertices);
    
    const smoothFaces = [
      // 상단면 (y=4, 연속된 하나의 면)
      0, 2, 3,    0, 3, 1,    // 좌측 상단면
      2, 4, 5,    2, 5, 3,    // 빗면
      
      // 바닥면 (y=0, 연속된 하나의 면)
      6, 8, 9,    6, 9, 7,    // 좌측 바닥면
      8, 10, 11,  8, 11, 9,   // 우측 바닥면
      
      // 앞면 (z=0, 연속된 하나의 면)
      0, 6, 8,    0, 8, 2,    // 좌측 앞면
      2, 8, 10,   2, 10, 4,   // 우측 앞면
      
      // 뒷면 (z=4, 연속된 하나의 면)
      1, 3, 9,    1, 9, 7,    // 좌측 뒷면
      3, 5, 11,   3, 11, 9,   // 우측 뒷면
      
      // 좌측면 (x=0)
      0, 1, 7,    0, 7, 6,
      
      // 우측 빗면 (기울어진 면)
      4, 10, 11,  4, 11, 5,
    ];
    
    indices.push(...smoothFaces);
    
    smoothGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    smoothGeometry.setIndex(indices);
    smoothGeometry.computeVertexNormals();
    
    return smoothGeometry;
  }

  // 애니메이션 시작
  startAnimation() {
    const animate = () => {
      requestAnimationFrame(animate);
      if (this.controls) {
        this.controls.update();
      }
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }
}