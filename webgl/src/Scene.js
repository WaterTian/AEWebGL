const THREE = require('three');
const glslify = require('glslify');
const TweenMax = require('gsap');
const OrbitControls = require('three-orbit-controls')(THREE);
const Stats = require('stats.js');
const dat = require('dat-gui');
const VConsole = require('vconsole');


// const Tone = require('tone');
const isMobile = require('./libs/isMobile.min.js');

const TimeLine = require('./TimeLine').default;
const BgVideo = require('./bgVideo').default;
const Physics = require('./physicsSense').default;

window.floatType = isMobile.any ? THREE.HalfFloatType : THREE.FloatType;

var That;

var loading = document.getElementById('loading');
var tip = document.getElementById('tip');

var container = document.getElementById('webglContainer');

var mouse = new THREE.Vector2(0, 0);


var soundPlayer;
var toneMeter;
var soundPanVol;


var cameraPerspective, cameraPerspectiveHelper;


var transformCamera;
var transformSolids;
var widthSolids;


var oldQ = new THREE.Quaternion();

var clock = new THREE.Clock();


var timeLine = new TimeLine();
var bgVideo;
var physics;


// ty2 ty3
var lightPostion;

///
var raycaster = new THREE.Raycaster();

/// 
var jsonScale = .1;

var debug = 0;

var DEMO_NUM = 2;


var boxMap = new THREE.TextureLoader().load("assets/box.png");


export default class Scene {
	constructor() {

		// this.vconsole = new VConsole();
		// this.stats = new Stats();
		// document.body.appendChild(this.stats.dom);

		loading.style.display = "none";
		



		That = this;
		document.getElementById('logo').addEventListener('touchmove', EventPreventDefault);

		function EventPreventDefault(event) {
			event.preventDefault();
		}

		document.getElementById('btn1').addEventListener('click', function() {
			DEMO_NUM = 2;
			bgVideo = new BgVideo('assets/' + DEMO_NUM + '.mp4');
			// bgVideo = new BgVideo('http://1251453141.vod2.myqcloud.com/484affa2vodtransgzp1251453141/dc8afa6e7447398155811716039/v.f30.mp4');
			That.loadJson();
			document.querySelector(".play").style.display = "none";

			lightPostion = new THREE.Vector3(-1, 1.3, 2);

	        loading.style.display = "block";
		    loading.style.top = window.innerWidth * 9 / 16 *0.5 +"px";

		});
		document.getElementById('btn2').addEventListener('click', function() {
			DEMO_NUM = 3;
			bgVideo = new BgVideo('assets/' + DEMO_NUM + '.mp4');
			// bgVideo = new BgVideo('http://1251453141.vod2.myqcloud.com/484affa2vodtransgzp1251453141/06e1fcb67447398155808574183/v.f30.mp4');
			That.loadJson();
			document.querySelector(".play").style.display = "none";

			lightPostion = new THREE.Vector3(-2, 1.3, -2);

	        loading.style.display = "block";
		    loading.style.top = window.innerWidth * 9 / 16 *0.5 +"px";

		});

		// this.loadSound();

	}


	loadSound() {
		soundPlayer = new Tone.Player("assets/bg2.mp3", function() {
			That.loadJson;
			soundPlayer.start();
		});

		soundPanVol = new Tone.PanVol(0, 10);
		soundPlayer.connect(soundPanVol);
		soundPanVol.toMaster();

		// toneMeter = new Tone.Meter();
		toneMeter = new Tone.Waveform(64);
		soundPlayer.connect(toneMeter);
		toneMeter.toMaster();

	}


	loadJson() {
		var jsonURL = 'assets/output' + DEMO_NUM + '.json';

		var fl = new THREE.FileLoader();
		fl.load(jsonURL, function(data) {
			var jsonObj = JSON.parse(data);
			var layers = jsonObj.project.items[jsonObj.project.numItems - 1].layers;
			console.log(layers);



			transformCamera = layers[1].properties.Transform;
			var postionArr = transformCamera.Position.keyframes;
			var orientationArr = transformCamera.Orientation.keyframes;
			for (var i = 0; i < postionArr.length; i++) {
				var v = {
					x: postionArr[i][1][0] * jsonScale,
					y: postionArr[i][1][1] * jsonScale,
					z: postionArr[i][1][2] * jsonScale,
					rx: orientationArr[i][1][0],
					ry: orientationArr[i][1][1],
					rz: orientationArr[i][1][2],
				};
				var t = postionArr[i][0];
				timeLine.cameraScript.addKeyframe(v, t);

				if (i == postionArr.length - 1) timeLine.cameraScript.addKeyframe(v, t + 1);

			}

			console.log(timeLine.cameraScript);



			transformSolids = [];
			widthSolids = [];
			for (var i = 2; i < layers.length; i++) {
				widthSolids.push(layers[i].width);

				var v = {
					x: layers[i].properties.Transform.Position.value[0] * jsonScale,
					y: layers[i].properties.Transform.Position.value[1] * jsonScale,
					z: layers[i].properties.Transform.Position.value[2] * jsonScale,
					rx: layers[i].properties.Transform.Orientation.value[0],
					ry: layers[i].properties.Transform.Orientation.value[1],
					rz: layers[i].properties.Transform.Orientation.value[2],
					sx: layers[i].properties.Transform.Scale.value[0] * jsonScale,
					sy: layers[i].properties.Transform.Scale.value[1] * jsonScale,
					sz: layers[i].properties.Transform.Scale.value[2] * jsonScale,
				};
				transformSolids.push(v);

			}
			console.log(transformSolids);



			That.init();
		});
	}


	init() {

		loading.style.display = "none";

	    tip.style.display = "block";
	    tip.style.top = window.innerWidth * 9 / 16 *0.5 +"px";


		container = document.getElementById('webglContainer');

		this.camera;
		this.scene;

		this.scene = new THREE.Scene();

		this.camera = new THREE.PerspectiveCamera(34, 16 / 9, .1, 100000);
		// this.camera.zoom = 1.58;
		// this.camera.target = new THREE.Vector3(0, 0, 0);
		this.camera.position.set(0, 0, -1000);
		// this.camera.rotation.set(0, Math.PI, 0);
		// this.camera.lookAt(this.camera.target);

		cameraPerspective = new THREE.Mesh(
			new THREE.BoxGeometry(200, 50, 300),
			new THREE.MeshBasicMaterial({
				color: 0xffffff,
				wireframe: true,
				visible: false
			})
		);
		this.scene.add(cameraPerspective);
		cameraPerspective.scale.set(jsonScale, jsonScale, jsonScale);

		// cameraPerspective = new THREE.PerspectiveCamera(56.9, 1920 / 1080, 150, 1000);
		// cameraPerspectiveHelper = new THREE.CameraHelper(cameraPerspective);
		// this.scene.add(cameraPerspectiveHelper);


		for (var i = 0; i < transformSolids.length; i++) {
			var solid = new THREE.Mesh(
				new THREE.BoxGeometry(widthSolids[i], widthSolids[i], 1),
				new THREE.MeshBasicMaterial({
					color: 0xffffff * Math.random(),
					wireframe: true,
					visible: false
				})
			);
			this.scene.add(solid);
			solid.position.set(-transformSolids[i].x, -transformSolids[i].y, transformSolids[i].z);
			solid.scale.set(transformSolids[i].sx / 100, transformSolids[i].sy / 100, transformSolids[i].sz / 100);

			var quaternion = new THREE.Quaternion();
			quaternion.setFromEuler(new THREE.Euler(-transformSolids[i].rx * Math.PI / 180, -transformSolids[i].ry * Math.PI / 180, transformSolids[i].rz * Math.PI / 180, 'XYZ'));
			solid.rotation.setFromQuaternion(quaternion);

		}



		var groundTransform = transformSolids[0];


		//////
		var ground = new THREE.Mesh(
			new THREE.BoxGeometry(widthSolids[0], widthSolids[0], 1),
			new THREE.ShadowMaterial({
				opacity: 0.4,
			})
		);
		this.scene.add(ground);
		ground.position.set(-groundTransform.x, -groundTransform.y, groundTransform.z);
		ground.scale.set(groundTransform.sx / 100, groundTransform.sy / 100, groundTransform.sz / 100);
		var quaternion = new THREE.Quaternion();
		quaternion.setFromEuler(new THREE.Euler(-groundTransform.rx * Math.PI / 180, -groundTransform.ry * Math.PI / 180, groundTransform.rz * Math.PI / 180, 'XYZ'));
		ground.rotation.setFromQuaternion(quaternion);

		ground.receiveShadow = true;
		//////



		//Physics
		physics = new Physics(groundTransform, jsonScale);
		this.scene.add(physics.obj);



		//lights
		var ambientLight = new THREE.AmbientLight(0x666666);
		this.scene.add(ambientLight);
		var dirLight = new THREE.DirectionalLight(0xffffff, 1);
		// dirLight.color.setHSL(0.1, 1, 0.95);
		dirLight.position.copy(lightPostion);
		dirLight.position.multiplyScalar(10000 * jsonScale);
		dirLight.target = ground;

		this.scene.add(dirLight);
		dirLight.castShadow = true;
		dirLight.shadow.mapSize.width = 2048;
		dirLight.shadow.mapSize.height = 2048;
		var d = 15000 * jsonScale;
		dirLight.shadow.camera.left = -d;
		dirLight.shadow.camera.right = d;
		dirLight.shadow.camera.top = d;
		dirLight.shadow.camera.bottom = -d;
		dirLight.shadow.camera.far = 40000 * jsonScale;
		dirLight.shadow.bias = -0.0001;

		// ///
		if (debug) this.scene.add(new THREE.CameraHelper(dirLight.shadow.camera));



		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			premultipliedAlpha: false,
			alpha: !debug
		});



		// this.renderer.setClearColor(0x000, 0.0);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFShadowMap;


		container.appendChild(this.renderer.domElement);

		if (debug) {
			// controls
			this.controls = new OrbitControls(this.camera, this.renderer.domElement);
			this.controls.update();
		}



		window.addEventListener('resize', this.onWindowResized);
		this.renderer.domElement.addEventListener('mousemove', this.onDocumentMouseMove);
		this.renderer.domElement.addEventListener('touchmove', this.onDocumentTouchMove);

		this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
		this.renderer.domElement.addEventListener('touchstart', this.onDocumentTouchStart);

		this.initScene();
		this.onWindowResized();

		this.animate();

	}

	onMouseDown(event) {
		event.preventDefault();
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

		That.addBox();
		bgVideo.play();
	}
	onDocumentTouchStart(event) {
		event.preventDefault();
		event.stopPropagation();
		mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;

		That.addBox();
		bgVideo.play();
	}


	addBox() {
		if (physics) {
			raycaster.setFromCamera(mouse, That.camera);
			physics.addBox(raycaster,boxMap);

			tip.style.display = "none";
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
		var h = w * 9 / 16;

		That.renderer.setSize(w, h);
		That.camera.aspect = w / h;
		That.camera.updateProjectionMatrix();
	}

	initScene() {


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

		if (toneMeter) {
			var soundValue = toneMeter.getValue();
			if (physics) physics.updateBoxs(soundValue);
		}



		// if (bgVideo.currentTime == 0 || bgVideo.currentTime > 12.5) bgVideo.currentTime = 4.5;

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