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

window.floatType = isMobile.any ? THREE.HalfFloatType : THREE.FloatType;

var That;

var container = document.getElementById('webglContainer');

var logoDiv;

var mouse = new THREE.Vector2(0, 0);

var timeLine = new TimeLine();
var bgVideo = new BgVideo();

var videoFrame = 0;


var cameraPerspective, cameraPerspectiveHelper;



var solidPo, solidOr;

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
			// console.log(jsonObj.project.items[2].layers[1].properties);


			var postionArr = jsonObj.project.items[2].layers[0].properties.Transform.Position.keyframes;
			var orientationArr = jsonObj.project.items[2].layers[0].properties.Transform.Orientation.keyframes;

			for (var i = 0; i < postionArr.length; i++) {
				var v = {
					x: postionArr[i][1][0],
					y: postionArr[i][1][1],
					z: postionArr[i][1][2],
					rx: orientationArr[i][1][0],
					ry: orientationArr[i][1][0],
					rz: orientationArr[i][1][0],
				};
				var t = postionArr[i][0];
				timeLine.cameraScript.addKeyframe(v, t);
			}

			console.log(timeLine.cameraScript);



			solidPo = jsonObj.project.items[2].layers[1].properties.Transform.Position.keyframes[0][1];
			solidOr = jsonObj.project.items[2].layers[1].properties.Transform.Position.keyframes[0][1];
			console.log(solidPo);



			That.init();
		});
	}


	init() {

		container = document.getElementById('webglContainer');

		this.camera;
		this.scene;

		this.scene = new THREE.Scene();

		this.camera = new THREE.PerspectiveCamera(56.9, 560 / 320, .01, 10000);
		// this.camera.target = new THREE.Vector3(0, 0, 0);
		this.camera.position.set(0, 0, -1000);
		// this.camera.lookAt(this.camera.target);
		// this.scene.add(this.camera);

		cameraPerspective = new THREE.Mesh(
			new THREE.BoxGeometry(200, 200, 200),
			new THREE.MeshBasicMaterial({
				color: 0xffffff,
				wireframe: true
			})
		);
		this.scene.add(cameraPerspective);

		// cameraPerspective = new THREE.PerspectiveCamera(56.9, 560 / 320, 150, 1000);
		// cameraPerspectiveHelper = new THREE.CameraHelper(cameraPerspective);
		// this.scene.add(cameraPerspectiveHelper);


		var solid = new THREE.Mesh(
			new THREE.BoxGeometry(320, 320, 20),
			new THREE.MeshBasicMaterial({
				color: 0xffffff,
				// wireframe: true
			})
		);
		this.scene.add(solid);
		solid.position.set(solidPo[0], solidPo[1], solidPo[2]);
		solid.rotation.set(solidOr[0], solidOr[1], solidOr[2]);



		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			premultipliedAlpha: false,
			alpha: true
		});
		this.renderer.setClearColor(0x000, 0.0);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.sortObjects = true;
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFShadowMap;


		container.appendChild(this.renderer.domElement);


		// // controls
		// this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		// this.controls.update();


		var light = new THREE.DirectionalLight();
		light.position.set(0.5, 0.5, -1);
		light.castShadow = true;
		light.shadow.camera.zoom = 4; // tighter shadow map
		this.scene.add(light);


		window.addEventListener('resize', this.onWindowResized);
		window.addEventListener('mousemove', this.onDocumentMouseMove);
		this.renderer.domElement.addEventListener('touchmove', this.onDocumentTouchMove);
		if (window.DeviceOrientationEvent) {
			window.addEventListener("deviceorientation", this.onOrientation);
		}

		this.initScene();
		this.onWindowResized();

		this.animate();

	}



	onDocumentMouseMove(event) {
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
	onOrientation(event) {
		var _z = event.alpha; //表示设备沿z轴上的旋转角度，范围为0~360。(z轴垂直于平面)
		var _x = event.beta; //表示设备在x轴上的旋转角度，范围为-180~180。它描述的是设备由前向后旋转的情况。
		var _y = event.gamma; //表示设备在y轴上的旋转角度，范围为-90~90。它描述的是设备由左向右旋转的情况。

		var _ox = (_y / 90);
		var _oy = (_x / 180);

		orientation.x = _ox;
		orientation.y = _oy;
	}


	initScene() {

		var geometry = new THREE.SphereGeometry(20, 4, 3);

		for (var i = 0; i < 5; i++) {

			var material = new THREE.MeshBasicMaterial({
				color: 0xffffff * Math.random(),
				wireframe: true
			});

			var mesh = new THREE.Mesh(geometry, material);

			mesh.position.x = Math.random() * 10000 - 5000;
			mesh.position.y = Math.random() * 10000 - 5000;
			mesh.position.z = Math.random() * 20000 - 10000;

			//mesh.rotation.x = Math.random() * 360 * ( Math.PI / 180 );
			// mesh.rotation.y = Math.random() * 2 * Math.PI;

			mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 4 + 1;

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


		var trackTime = bgVideo.currentTime;

		// console.log(trackTime);

		// videoFrame++;
		// if (videoFrame > 90) videoFrame = 0;

		var cameraValues = timeLine.getValues(timeLine.cameraScript, trackTime);

		this.camera.position.set(-cameraValues.x, cameraValues.y, -cameraValues.z);
		// this.camera.rotation.set(cameraValues.rx, cameraValues.ry, cameraValues.rz);

		// var quaternion = new THREE.Quaternion();
		// quaternion.setFromEuler ( new THREE.Euler( cameraValues.rx/360, cameraValues.ry/360, cameraValues.rz/360, 'XYZ' ) );

		// this.camera.quaternion.slerp( quaternion, .1 )


		var renderCamera = this.camera;
		this.renderer.render(this.scene, renderCamera);



	}


}