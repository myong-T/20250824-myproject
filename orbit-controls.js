// orbit-controls.js - 3D 뷰어용 OrbitControls 클래스

export class SimpleOrbitControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = new THREE.Vector3(1.5, 1.5, 0.5);
    this.enableDamping = true;
    this.dampingFactor = 0.05;
    
    this.spherical = new THREE.Spherical();
    this.sphericalDelta = new THREE.Spherical();
    this.scale = 1;
    this.panOffset = new THREE.Vector3();
    
    this.rotateStart = new THREE.Vector2();
    this.rotateEnd = new THREE.Vector2();
    this.rotateDelta = new THREE.Vector2();
    
    this.isMouseDown = false;
    
    // 이벤트 리스너 등록
    this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.domElement.addEventListener('wheel', this.onMouseWheel.bind(this));
    
    // 컨텍스트 메뉴 비활성화 (우클릭 방지)
    this.domElement.addEventListener('contextmenu', (event) => event.preventDefault());
  }
  
  onMouseDown(event) {
    this.isMouseDown = true;
    this.rotateStart.set(event.clientX, event.clientY);
    this.domElement.style.cursor = 'grabbing';
  }
  
  onMouseMove(event) {
    if (!this.isMouseDown) return;
    
    this.rotateEnd.set(event.clientX, event.clientY);
    this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(0.0015);
    
    // 회전 감도 조정
    this.sphericalDelta.theta -= this.rotateDelta.x;
    this.sphericalDelta.phi -= this.rotateDelta.y;
    
    this.rotateStart.copy(this.rotateEnd);
  }
  
  onMouseUp() {
    this.isMouseDown = false;
    this.domElement.style.cursor = 'grab';
  }
  
  onMouseWheel(event) {
    event.preventDefault();
    
    // 줌 감도 조정
    if (event.deltaY < 0) {
      this.scale *= 0.95; // 줌 인
    } else {
      this.scale *= 1.05; // 줌 아웃
    }
  }
  
  update() {
    const offset = new THREE.Vector3();
    offset.copy(this.camera.position).sub(this.target);
    
    // 구면 좌표계로 변환
    this.spherical.setFromVector3(offset);
    this.spherical.theta += this.sphericalDelta.theta;
    this.spherical.phi += this.sphericalDelta.phi;
    this.spherical.radius *= this.scale;
    
    // 회전 각도 제한
    this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi));
    
    // 줌 거리 제한
    this.spherical.radius = Math.max(1, Math.min(20, this.spherical.radius));
    
    // 카메라 위치 업데이트
    offset.setFromSpherical(this.spherical);
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
    
    // 댐핑 효과 적용
    if (this.enableDamping) {
      this.sphericalDelta.theta *= (1 - this.dampingFactor);
      this.sphericalDelta.phi *= (1 - this.dampingFactor);
    } else {
      this.sphericalDelta.set(0, 0, 0);
    }
    
    // 스케일 초기화
    this.scale = 1;
  }
  
  // 대상 위치 설정
  setTarget(x, y, z) {
    this.target.set(x, y, z);
  }
  
  // 컨트롤 비활성화
  dispose() {
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('mouseup', this.onMouseUp);
    this.domElement.removeEventListener('wheel', this.onMouseWheel);
    this.domElement.removeEventListener('contextmenu', (event) => event.preventDefault());
  }
}