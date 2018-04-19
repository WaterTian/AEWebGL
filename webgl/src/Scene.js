const THREE = require('three');
const glslify = require('glslify');
const TweenMax = require('gsap');
const OrbitControls = require('three-orbit-controls')(THREE);
const Stats = require('stats.js');
const dat = require('dat-gui');
const VConsole = require('vconsole');


const isMobile = require('./libs/isMobile.min.js');

const TimeLine = require('./TimeLine').default;
const BgVideo = require('./bgVideo').default;
const RollOver = require('./rollOver').default;
const Physics = require('./physicsSense').default;

window.floatType = isMobile.any ? THREE.HalfFloatType : THREE.FloatType;

var That;

var container = document.getElementById('webglContainer');

var logoDiv;

var mouse = new THREE.Vector2(0, 0);

var timeLine = new TimeLine();
var bgVideo = new BgVideo();
var rollOver = new RollOver();

var oldCameraValues;


var cameraPerspective, cameraPerspectiveHelper;



var solid1Po, solid1Or, solid1Sc;
var solid2Po, solid2Or, solid2Sc;


var debug = 0;


var oldQ = new THREE.Quaternion();


var clock = new THREE.Clock();


var physics;



export default class Scene {
	constructor() {

		// this.vconsole = new VConsole();
		this.stats = new Stats();
		document.body.appendChild(this.stats.dom);



		That = this;
		logoDiv = document.getElementById('logo');
		logoDiv.addEventListener('touchmove', EventPreventDefault);

		function EventPreventDefault(event) {
			event.preventDefault();
		}

		this.loadJson();
	}


	loadJson() {
		var fl = new THREE.FileLoader();
		fl.load('assets/output.json', function(data) {
			var jsonObj = JSON.parse(data);
			// console.log(jsonObj.project.items[jsonObj.project.numItems-1].layers);

			var layerCamera = jsonObj.project.items[jsonObj.project.numItems - 1].layers[1];
			var layer1 = jsonObj.project.items[jsonObj.project.numItems - 1].layers[3];
			var layer2 = jsonObj.project.items[jsonObj.project.numItems - 1].layers[2];

			console.log(layer1);


			var postionArr = layerCamera.properties.Transform.Position.keyframes;
			var orientationArr = layerCamera.properties.Transform.Orientation.keyframes;

			for (var i = 0; i < postionArr.length; i++) {
				var v = {
					x: postionArr[i][1][0],
					y: postionArr[i][1][1],
					z: postionArr[i][1][2],
					rx: orientationArr[i][1][0],
					ry: orientationArr[i][1][1],
					rz: orientationArr[i][1][2],
				};
				var t = postionArr[i][0];
				timeLine.cameraScript.addKeyframe(v, t);

				if (i == postionArr.length - 1) timeLine.cameraScript.addKeyframe(v, t + 1);

			}

			console.log(timeLine.cameraScript);



			solid1Po = layer1.properties.Transform.Position.keyframes[0][1];
			solid1Or = layer1.properties.Transform.Orientation.keyframes[0][1];
			solid1Sc = layer1.properties.Transform.Scale.keyframes[0][1];
			console.log(solid1Sc);

			solid2Po = layer2.properties.Transform.Position.keyframes[0][1];
			solid2Or = layer2.properties.Transform.Orientation.keyframes[0][1];
			solid2Sc = layer2.properties.Transform.Scale.keyframes[0][1];


			That.init();
		});
	}


	init() {

		container = document.getElementById('webglContainer');

		this.camera;
		this.scene;

		this.scene = new THREE.Scene();

		this.camera = new THREE.PerspectiveCamera(38, 1920 / 1080, .1, 50000);
		this.camera.zoom = 1.58;
		// this.camera.target = new THREE.Vector3(0, 0, 0);
		this.camera.position.set(0, 0, -1000);
		// this.camera.rotation.set(0, Math.PI, 0);
		// this.camera.lookAt(this.camera.target);

		cameraPerspective = new THREE.Mesh(
			new THREE.BoxGeometry(200, 50, 300),
			new THREE.MeshBasicMaterial({
				color: 0xffffff,
				wireframe: true
			})
		);
		this.scene.add(cameraPerspective);

		// cameraPerspective = new THREE.PerspectiveCamera(56.9, 1920 / 1080, 150, 1000);
		// cameraPerspectiveHelper = new THREE.CameraHelper(cameraPerspective);
		// this.scene.add(cameraPerspectiveHelper);


		var solid1 = new THREE.Mesh(
			new THREE.BoxGeometry(368, 368, 1),
			new THREE.MeshBasicMaterial({
				color: 0x0000ff,
				wireframe: true,
				visible: false
			})
		);
		this.scene.add(solid1);
		solid1.position.set(-solid1Po[0], -solid1Po[1], solid1Po[2]);
		solid1.scale.set(solid1Sc[0] / 100, solid1Sc[1] / 100, solid1Sc[2] / 100);
		// solid1.position.set(-200, -300, 0);
		// solid1.rotation.set(solidOr[0], solidOr[1], solidOr[2]);
		var quaternion = new THREE.Quaternion();
		quaternion.setFromEuler(new THREE.Euler(-solid1Or[0] * Math.PI / 180, -solid1Or[1] * Math.PI / 180, solid1Or[2] * Math.PI / 180, 'XYZ'));
		solid1.rotation.setFromQuaternion(quaternion);


		var solid2 = new THREE.Mesh(
			new THREE.BoxGeometry(368, 368, 1),
			new THREE.MeshBasicMaterial({
				color: 0xff0000,
				// opacity: 0.1,
				// wireframe: true
				visible: false
			})
		);
		this.scene.add(solid2);
		solid2.position.set(-solid2Po[0], -solid2Po[1], solid2Po[2]);
		solid2.scale.set(solid2Sc[0] / 100, solid2Sc[1] / 100, solid2Sc[2] / 100);
		var quaternion = new THREE.Quaternion();
		quaternion.setFromEuler(new THREE.Euler(-solid2Or[0] * Math.PI / 180, -solid2Or[1] * Math.PI / 180, solid2Or[2] * Math.PI / 180, 'XYZ'));
		solid2.rotation.setFromQuaternion(quaternion);



		// var helper = new THREE.GridHelper(10000, 100);
		// helper.position.set(-solid2Po[0], -solid2Po[1], solid2Po[2]);
		// helper.rotation.y = -solid2.rotation.z;
		// helper.material.opacity = 0.5;
		// helper.material.transparent = true;
		// this.scene.add(helper);


		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			premultipliedAlpha: false,
			alpha: true
		});


		// this.renderer.setClearColor(0x000, 0.0);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.shadowMap.enabled = true;
		// this.renderer.shadowMap.type = THREE.PCFShadowMap;


		container.appendChild(this.renderer.domElement);

		if (debug) {
			// controls
			this.controls = new OrbitControls(this.camera, this.renderer.domElement);
			this.controls.update();
		}



		var ambientLight = new THREE.AmbientLight(0x404040);
		this.scene.add(ambientLight);


		var dirLight = new THREE.DirectionalLight(0xffffff, 1);
		// dirLight.color.setHSL(0.1, 1, 0.95);
		dirLight.position.set(-1, 1.75, 1);
		dirLight.position.multiplyScalar(30);
		this.scene.add(dirLight);
		dirLight.castShadow = true;
		dirLight.shadow.mapSize.width = 2048;
		dirLight.shadow.mapSize.height = 2048;
		var d = 1000;
		dirLight.shadow.camera.left = -d - solid2Po[0];
		dirLight.shadow.camera.right = d;
		dirLight.shadow.camera.top = d + solid2Po[2];
		dirLight.shadow.camera.bottom = -d;
		dirLight.shadow.camera.far = 5000;
		dirLight.shadow.bias = -0.0001;



		window.addEventListener('resize', this.onWindowResized);
		window.addEventListener('mousemove', this.onDocumentMouseMove);
		this.renderer.domElement.addEventListener('touchmove', this.onDocumentTouchMove);

		window.addEventListener('mousedown', this.onMouseDown);

		this.initScene();
		this.onWindowResized();

		this.animate();

	}

	onMouseDown(event) {
		event.preventDefault();
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

		if (physics) {
			var rollOverPos = rollOver.getPostion(mouse, That.camera);
            physics.addBox(rollOverPos);
		}
	}

	onDocumentMouseMove(event) {
		event.preventDefault();
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	}
	onDocumentTouchMove(event) {
		event.preventDefault();
		event.stopPropagation();
		mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
	}
	onWindowResized() {
		var w = container.clientWidth;
		// var h = container.clientHeight;
		var h = w * 320 / 568;

		That.renderer.setSize(w, h);
		That.camera.aspect = w / h;
		That.camera.updateProjectionMatrix();
	}

	initScene() {

		//Physics
		physics = new Physics(solid2Po, solid2Or, solid2Sc);
		this.scene.add(physics.obj);

		this.scene.add(rollOver.obj);


		var geometry = new THREE.SphereGeometry(20, 4, 3);

		for (var i = 0; i < 0; i++) {

			var material = new THREE.MeshBasicMaterial({
				color: 0xffffff * Math.random(),
				wireframe: true
			});

			var mesh = new THREE.Mesh(geometry, material);

			mesh.position.x = Math.random() * 2000 - 1000;
			mesh.position.y = Math.random() * 1000 - 300;
			mesh.position.z = Math.random() * 4000 - 2000;

			//mesh.rotation.x = Math.random() * 360 * ( Math.PI / 180 );
			// mesh.rotation.y = Math.random() * 2 * Math.PI;

			mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 1 + .1;

			this.scene.add(mesh);
		}

	}


	animate() {
		requestAnimationFrame(this.animate.bind(this));


		this.render();
	}

	// main animation loop
	render() {
		if (this.stats) this.stats.update();


		var deltaTime = clock.getDelta();
		if (physics) physics.update(deltaTime);

  //       // rollOver obj
		// rollOver.update(mouse, That.camera);



		if (bgVideo.currentTime == 0 || bgVideo.currentTime > 13.5) bgVideo.currentTime = 4.5;

		var trackTime = bgVideo.currentTime;
		// var trackTime = 0;



		// console.log(trackTime);

		var cameraValues = timeLine.getValues(timeLine.cameraScript, trackTime);


		if (debug) cameraPerspective.position.set(-cameraValues.x, -cameraValues.y, cameraValues.z);
		else this.camera.position.set(-cameraValues.x, -cameraValues.y, cameraValues.z);


		var quaternion = new THREE.Quaternion();
		quaternion.setFromEuler(new THREE.Euler(-cameraValues.rx * Math.PI / 180, -cameraValues.ry * Math.PI / 180, cameraValues.rz * Math.PI / 180, 'XYZ'));

		var quaternion2 = new THREE.Quaternion();
		quaternion2.setFromEuler(new THREE.Euler(0, Math.PI, 0, 'XYZ'));

		quaternion.multiply(quaternion2);


		//// 求差= 逆乘
		var q1 = quaternion.clone();
		q1 = q1.inverse();
		var q2 = q1.multiply(oldQ);



		var _able = Math.abs(q2.x) + Math.abs(q2.y) + Math.abs(q2.z) < 0.01;
		var _t = 1;


		if (_able) {
			if (debug) cameraPerspective.quaternion.slerp(quaternion, _t);
			else this.camera.quaternion.slerp(quaternion, _t);
		} else {
			// console.log(trackTime);
		}

		oldQ = quaternion.clone();


		var renderCamera = this.camera;
		this.renderer.render(this.scene, renderCamera);

	}



}