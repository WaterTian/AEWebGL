const THREE = require('three');

var rollOverGeo, rollOverMaterial, rollOverMesh;
var raycaster;

export default class rollOver {
	constructor() {

		rollOverGeo = new THREE.BoxGeometry(50, 50, 50);
		rollOverMaterial = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			opacity: 0.5,
			transparent: true
		});
		rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial);

		raycaster = new THREE.Raycaster();


		this.obj = rollOverMesh;

	}
	getPostion(mouse, camera) {
		raycaster.setFromCamera(mouse, camera);

		var pos = new THREE.Vector3();
		var quat = new THREE.Quaternion();

		pos.copy(raycaster.ray.direction);
		pos.multiplyScalar(20000);
		pos.add(raycaster.ray.origin);

		return pos;
	}

	update(mouse, camera) {

		rollOverMesh.position.lerp(this.getPostion(mouse, camera),0.3);
	}

}