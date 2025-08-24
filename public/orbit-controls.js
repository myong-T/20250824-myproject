// orbit-controls.js - OrbitControls 클래스

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
    
    this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.domElement.addEventListener('wheel', this.onMouseWheel.bind(this));
  }
  
  onMouseDown(event) {
    this.isMouseDown = true;
    this.rotateStart.set(event.clientX, event.clientY);
  }
  
  onMouseMove(event) {
    if (!this.isMouseDown) return;
    
    this.rotateEnd.set(event.clientX, event.clientY);
    this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(0.0015);
    
    this.sphericalDelta.theta -= this.rotateDelta.x;
    this.sphericalDelta.phi -= this.rotateDelta.y;
    
    this.rotateStart.copy(this.rotateEnd);
  }
  
  onMouseUp() {
    this.isMouseDown = false;
  }
  
  onMouseWheel(event) {
    if (event.deltaY < 0) {
      this.scale *= 0.95;
    } else {
      this.scale *= 1.05;
    }
  }
  
  update() {
    const offset = new THREE.Vector3();
    offset.copy(this.camera.position).sub(this.target);
    
    this.spherical.setFromVector3(offset);
    this.spherical.theta += this.sphericalDelta.theta;
    this.spherical.phi += this.sphericalDelta.phi;
    this.spherical.radius *= this.scale;
    
    this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi));
    this.spherical.radius = Math.max(1, Math.min(20, this.spherical.radius));
    
    offset.setFromSpherical(this.spherical);
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
    
    if (this.enableDamping) {
      this.sphericalDelta.theta *= (1 - this.dampingFactor);
      this.sphericalDelta.phi *= (1 - this.dampingFactor);
    } else {
      this.sphericalDelta.set(0, 0, 0);
    }
    
    this.scale = 1;
  }
}