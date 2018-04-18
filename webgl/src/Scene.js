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

var oldCameraValues;


var cameraPerspective, cameraPerspectiveHelper;



var solid1Po, solid1Or, solid1Sc;
var solid2Po, solid2Or, solid2Sc;


var debug = 0;


var oldQ = new THREE.Quaternion();


var clock = new THREE.Clock();

// Physics variables
var gravityConstant = -598;
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver;
var softBodySolver;
var physicsWorld;
var rigidBodies = [];
var margin = 0.05;
var hinge;
var rope;
var transformAux1 = new Ammo.btTransform();



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
				wireframe: true
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
				wireframe: true
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



		// Physics configuration
		collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
		dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
		broadphase = new Ammo.btDbvtBroadphase();
		solver = new Ammo.btSequentialImpulseConstraintSolver();
		softBodySolver = new Ammo.btDefaultSoftBodySolver();
		physicsWorld = new Ammo.btSoftRigidDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
		physicsWorld.setGravity(new Ammo.btVector3(0, gravityConstant, 0));
		physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3(0, gravityConstant, 0));



		var pos = new THREE.Vector3();
		var quat = new THREE.Quaternion();

		// Ground
		pos.set(-solid2Po[0], -solid2Po[1], solid2Po[2]);
		quat.setFromEuler(new THREE.Euler(-solid2Or[0] * Math.PI / 180, -solid2Or[1] * Math.PI / 180, solid2Or[2] * Math.PI / 180, 'XYZ'));
		var ground = createParalellepiped(solid2Sc[0] * 3.68, solid2Sc[2] * 3.68, 1, 0, pos, quat, new THREE.MeshPhongMaterial({
			color: 0xffffff,
			opacity: 0.2,
			// wireframe: true
		}));
		ground.castShadow = true;
		ground.receiveShadow = true;
		That.scene.add(ground);


		// Boxs


		var _n = 0;
		addBox();

		function addBox() {
			for (var i = 0; i < 10; i++) {
				pos.set(100 * Math.random() - 600, 0, 100 * Math.random() - 1000);
				quat.set(0, 0, 0, 1);
				var brick = createParalellepiped(30, 30, 30, 0.5, pos, quat, new THREE.MeshPhongMaterial({
					color: 0xFFFFFF * Math.random(),
					// opacity: 0.1,
					// wireframe: true
				}));

				brick.castShadow = true;
				brick.receiveShadow = true;
				That.scene.add(brick);
			}
			_n++;

			if (_n < 10) setTimeout(addBox, 2000);
		}


		function createParalellepiped(sx, sy, sz, mass, pos, quat, material) {

			var threeObject = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1), material);
			var shape = new Ammo.btBoxShape(new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5));
			shape.setMargin(margin);

			createRigidBody(threeObject, shape, mass, pos, quat);

			return threeObject;
		}

		function createRigidBody(threeObject, physicsShape, mass, pos, quat) {

			threeObject.position.copy(pos);
			threeObject.quaternion.copy(quat);

			var transform = new Ammo.btTransform();
			transform.setIdentity();
			transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
			transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
			var motionState = new Ammo.btDefaultMotionState(transform);

			var localInertia = new Ammo.btVector3(0, 0, 0);
			physicsShape.calculateLocalInertia(mass, localInertia);

			var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia);
			var body = new Ammo.btRigidBody(rbInfo);

			threeObject.userData.physicsBody = body;


			if (mass > 0) {
				rigidBodies.push(threeObject);

				// Disable deactivation
				body.setActivationState(4);
			}

			physicsWorld.addRigidBody(body);

		}



		var geometry = new THREE.SphereGeometry(20, 4, 3);

		for (var i = 0; i < 1000; i++) {

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
		this.updatePhysics(deltaTime);



		var trackTime = bgVideo.currentTime;
		// var trackTime = 0;

		// console.log(trackTime);


		// videoFrame++;
		// if (videoFrame > 90) videoFrame = 0;

		var cameraValues = timeLine.getValues(timeLine.cameraScript, trackTime);


		if (debug) cameraPerspective.position.set(-cameraValues.x, -cameraValues.y, cameraValues.z);
		else this.camera.position.set(-cameraValues.x, -cameraValues.y, cameraValues.z);
		// this.camera.rotation.set(cameraValues.rx, cameraValues.ry, cameraValues.rz);
		// cameraPerspective.rotation.set(cameraValues.rx, cameraValues.ry, cameraValues.rz);


		// console.log(Math.floor(cameraValues.ry))


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
		}

		oldQ = quaternion.clone();


		var renderCamera = this.camera;
		this.renderer.render(this.scene, renderCamera);

	}



	updatePhysics(deltaTime) {


		// Step world
		physicsWorld.stepSimulation(deltaTime, 10);

		// Update rigid bodies
		for (var i = 0, il = rigidBodies.length; i < il; i++) {
			var objThree = rigidBodies[i];
			var objPhys = objThree.userData.physicsBody;
			var ms = objPhys.getMotionState();
			if (ms) {
				ms.getWorldTransform(transformAux1);
				var p = transformAux1.getOrigin();
				var q = transformAux1.getRotation();
				objThree.position.set(p.x(), p.y(), p.z());
				objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

			}
		}

	}


}