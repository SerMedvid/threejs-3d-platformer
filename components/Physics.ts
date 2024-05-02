import Ammo from "ammojs-typed";
import * as THREE from "three";

const STATE = { DISABLE_DEACTIVATION: 4 };
const FLAGS = { CF_KINEMATIC_OBJECT: 2 };

export default class Physics {
	AmmoApi: typeof Ammo;
	tmpTrans: Ammo.btTransform;
	physicsWorld: Ammo.btDiscreteDynamicsWorld;
	rigidBodies: THREE.Object3D[];
	scene: THREE.Scene;

	constructor(scene: THREE.Scene) {
		this.rigidBodies = [];
		this.scene = scene;
	}

	public async initialize() {
		const AmmoAPI = await Ammo();
		this.AmmoApi = AmmoAPI;
		this.setupPhysicsWorld();
	}

	public setupPhysicsWorld() {
		this.tmpTrans = new this.AmmoApi.btTransform();

		const collisionConfiguration =
			new this.AmmoApi.btDefaultCollisionConfiguration();
		const dispatcher = new this.AmmoApi.btCollisionDispatcher(
			collisionConfiguration
		);
		const broadphase = new this.AmmoApi.btDbvtBroadphase();
		const solver = new this.AmmoApi.btSequentialImpulseConstraintSolver();
		this.physicsWorld = new this.AmmoApi.btDiscreteDynamicsWorld(
			dispatcher,
			broadphase,
			solver,
			collisionConfiguration
		);
		this.physicsWorld.setGravity(new this.AmmoApi.btVector3(0, -10, 0));
	}

	public createRigidBody(
		threeObject: THREE.Object3D,
		physicsShape: Ammo.btConvexShape,
		mass: number,
		pos: THREE.Vector3,
		quat: THREE.Quaternion
	) {
		threeObject.position.copy(pos);
		threeObject.quaternion.copy(quat);

		const transform = new this.AmmoApi.btTransform();
		transform.setIdentity();
		transform.setOrigin(new this.AmmoApi.btVector3(pos.x, pos.y, pos.z));
		transform.setRotation(
			new this.AmmoApi.btQuaternion(quat.x, quat.y, quat.z, quat.w)
		);
		const motionState = new this.AmmoApi.btDefaultMotionState(transform);

		const localInertia = new this.AmmoApi.btVector3(0, 0, 0);
		physicsShape.calculateLocalInertia(mass, localInertia);

		const rbInfo = new this.AmmoApi.btRigidBodyConstructionInfo(
			mass,
			motionState,
			physicsShape,
			localInertia
		);
		const body = new this.AmmoApi.btRigidBody(rbInfo);

		threeObject.userData.physicsBody = body;

		this.scene.add(threeObject);

		if (mass > 0) {
			this.rigidBodies.push(threeObject);
		} else {
			body.setCollisionFlags(FLAGS.CF_KINEMATIC_OBJECT);
		}
		body.setActivationState(STATE.DISABLE_DEACTIVATION);

		this.physicsWorld.addRigidBody(body);

		return body;
	}

	public updatePhysics(deltaTime: number) {
		this.physicsWorld.stepSimulation(deltaTime, 10);

		for (let i = 0; i < this.rigidBodies.length; i++) {
			const objThree = this.rigidBodies[i];
			const objAmmo = objThree.userData.physicsBody;

			let ms = objAmmo.getMotionState();

			if (ms) {
				ms.getWorldTransform(this.tmpTrans);
				let p = this.tmpTrans.getOrigin();
				let q = this.tmpTrans.getRotation();

				if (objThree.name === "character") {
					objThree.quaternion.set(0, q.y(), 0, q.w());
				} else {
					objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
				}

				objThree.position.set(p.x(), p.y(), p.z());
			}
		}
	}
}
