const THREE = require('three');

// Physics variables
var gravityConstant = -1000;
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

var obj;

var boxArr = [];


var That;

export default class physicsSense {
	constructor(solid2Po, solid2Or, solid2Sc) {

		That = this;


		this.obj = new THREE.Object3D();

		obj = this.obj;


		this.clickRequest = false;

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
		var ground = this.createParalellepiped(solid2Sc[0] * 3.68, solid2Sc[2] * 3.68, 1, 0, pos, quat, new THREE.MeshPhongMaterial({
			color: 0xffffff,
			opacity: 0.2,
			// wireframe: true,
			visible:false,
		}));
		// ground.castShadow = true;
		// ground.receiveShadow = true;



	}


	addBox(pos) {
		var quat = new THREE.Quaternion();

		pos.add(new THREE.Vector3(Math.random() * 200, Math.random() * 200, Math.random() * 200));

		var texture = new THREE.TextureLoader().load("assets/box.png");

		for (var i = 0; i < 8; i++) {
			quat.set(Math.random(), Math.random(), Math.random(), 1);
			var brick = That.createParalellepiped(Math.random() * 100 + 50, Math.random() * 100 + 50, Math.random() * 100 + 50, 1, pos, quat, new THREE.MeshPhongMaterial({
				// color: 0xFFFFFF * Math.random(),
				map: texture,
				// opacity: 0.1,
				// wireframe: true
			}));

			brick.castShadow = true;
			brick.receiveShadow = true;


			boxArr.push(brick);
		}
	}
	updateBoxs(soundValue) {
		// for (var i = 0; i < boxArr.length; i++) {
		// 	if (!soundValue[i]) return;

		// 	var _s = Math.abs(soundValue[i]);

		// 	boxArr[i].material.opacity = _s*6+0.6;

		// }

	}


	createParalellepiped(sx, sy, sz, mass, pos, quat, material) {

		var threeObject = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1), material);
		var shape = new Ammo.btBoxShape(new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5));
		shape.setMargin(margin);

		this.createRigidBody(threeObject, shape, mass, pos, quat);

		return threeObject;
	}

	createRigidBody(threeObject, physicsShape, mass, pos, quat) {

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

		////
		obj.add(threeObject);


		if (mass > 0) {
			rigidBodies.push(threeObject);

			// Disable deactivation
			body.setActivationState(4);
		}

		physicsWorld.addRigidBody(body);

	}



	update(deltaTime) {

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