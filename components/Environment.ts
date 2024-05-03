import * as THREE from "three";
import Ammo from "ammojs-typed";
import Physics from "./Physics";

enum PlatformDirection {
	VERTICAL = 1,
	HORIZONTAL = 2,
}

export default class Environment {
	scene: THREE.Scene;
	physics: Physics;
	platforms: THREE.Object3D[];
	tmpQuat: THREE.Quaternion;
	tmpPos: THREE.Vector3;
	ammoTmpPos: Ammo.btVector3;
	ammoTmpQuat: Ammo.btQuaternion;

	constructor(scene: THREE.Scene, physics: Physics) {
		this.scene = scene;
		this.physics = physics;
		this.platforms = [];

		this.tmpQuat = new THREE.Quaternion();
		this.tmpPos = new THREE.Vector3();
		this.ammoTmpPos = new this.physics.AmmoApi.btVector3();
		this.ammoTmpQuat = new this.physics.AmmoApi.btQuaternion(0, 0, 0, 1);
	}

	public initEnvironment() {
		this.createWall(
			[0.5, 2, 30.5],
			new THREE.Vector3(14, 0, 0),
			new this.physics.AmmoApi.btVector3(0.25, 1, 15.25)
		);

		this.createWall(
			[0.5, 2, 30.5],
			new THREE.Vector3(-14, 0, 0),
			new this.physics.AmmoApi.btVector3(0.25, 1, 15.25)
		);

		this.createWall(
			[28, 2, 0.5],
			new THREE.Vector3(0, 0, 15),
			new this.physics.AmmoApi.btVector3(14, 1, 0.25)
		);

		this.createWall(
			[28, 2, 0.5],
			new THREE.Vector3(0, 0, -15),
			new this.physics.AmmoApi.btVector3(14, 1, 0.25)
		);

		this.initFloorPlane();
		this.initLight();

		this.initMovingPlatforms();
	}

	public updatePlatformPosition(elapsedTime: number) {
		this.platforms.forEach((platform) => {
			const direction = platform.userData.direction;

			let translateFactor = this.tmpPos.set(
				direction === PlatformDirection.HORIZONTAL
					? Math.sin(elapsedTime + platform.userData.seed) * 0.02
					: 0,
				direction === PlatformDirection.VERTICAL
					? Math.sin(elapsedTime * 2 + platform.userData.seed) * 0.01
					: 0,
				0
			);

			if (direction === PlatformDirection.HORIZONTAL) {
				platform.translateX(translateFactor.x);
			} else {
				platform.translateY(translateFactor.y);
			}

			platform.getWorldPosition(this.tmpPos);
			platform.getWorldQuaternion(this.tmpQuat);
			let physicsBody = platform.userData.physicsBody;
			let ms = physicsBody.getMotionState();
			if (ms) {
				this.ammoTmpPos.setValue(this.tmpPos.x, this.tmpPos.y, this.tmpPos.z);
				this.ammoTmpQuat.setValue(
					this.tmpQuat.x,
					this.tmpQuat.y,
					this.tmpQuat.z,
					this.tmpQuat.w
				);
				this.physics.tmpTrans.setIdentity();
				this.physics.tmpTrans.setOrigin(this.ammoTmpPos);
				this.physics.tmpTrans.setRotation(this.ammoTmpQuat);
				ms.setWorldTransform(this.physics.tmpTrans);
			}
		});
	}

	private createWall(
		geometryArgs: typeof THREE.BoxGeometry.arguments,
		position: THREE.Vector3,
		shapeArgs: Ammo.btVector3
	) {
		const wall = new THREE.Mesh(
			new THREE.BoxGeometry(...geometryArgs),
			new THREE.MeshStandardMaterial({ color: "red" })
		);
		wall.position.set(position.x, position.y, position.z);
		wall.castShadow = true;
		wall.name = "wall";
		this.scene.add(wall);

		let wal1Shape = new this.physics.AmmoApi.btBoxShape(shapeArgs);
		wal1Shape.setMargin(0.05);

		this.physics.createRigidBody(
			wall,
			wal1Shape,
			0,
			wall.position,
			wall.quaternion
		);
	}

	private createPlatform(
		geometryArgs: typeof THREE.BoxGeometry.arguments,
		position: THREE.Vector3,
		seed = 0,
		direction = PlatformDirection.VERTICAL
	) {
		const platform = new THREE.Mesh(
			new THREE.BoxGeometry(...geometryArgs),
			new THREE.MeshStandardMaterial({ color: "red" })
		);
		platform.position.set(position.x, position.y, position.z);
		platform.castShadow = true;
		platform.receiveShadow = true;
		platform.name = "platform";
		platform.userData.seed = seed;
		platform.userData.direction = direction;

		let platformShape = new this.physics.AmmoApi.btBoxShape(
			new this.physics.AmmoApi.btVector3(
				geometryArgs[0] * 0.5,
				geometryArgs[1] * 0.5,
				geometryArgs[2] * 0.5
			)
		);
		platformShape.setMargin(0.05);

		const platformBody = this.physics.createRigidBody(
			platform,
			platformShape,
			0,
			platform.position,
			platform.quaternion
		);

		platformBody.setFriction(
			direction === PlatformDirection.HORIZONTAL ? 1 : 0.7
		);

		this.platforms.push(platform);
	}

	private initMovingPlatforms() {
		this.createPlatform([3, 0.25, 3], new THREE.Vector3(2, 1, 2), 5);

		this.createPlatform([4, 0.25, 2], new THREE.Vector3(3, 3, -1));

		this.createPlatform([4, 0.25, 4], new THREE.Vector3(5, 5, 3), 10);

		this.createPlatform([2, 0.25, 3], new THREE.Vector3(8, 3, 7), 12);

		this.createPlatform([4, 0.25, 4], new THREE.Vector3(4, 5, 10), 20);

		this.createPlatform([3, 0.25, 3], new THREE.Vector3(0, 1, 10), 5);

		this.createPlatform(
			[5, 0.25, 3],
			new THREE.Vector3(2, 2, -3),
			7,
			PlatformDirection.HORIZONTAL
		);
	}

	private initFloorPlane = () => {
		const pos = new THREE.Vector3(0, -0.65, 0);
		const scale = new THREE.Vector3(100, 1, 100);
		const quat = new THREE.Quaternion().fromArray([0, 0, 0, 1]);
		const mass = 0;

		const wfloor = new THREE.Mesh(
			new THREE.BoxGeometry(),
			new THREE.MeshPhongMaterial({
				color: 0x555555,
			})
		);
		wfloor.position.set(pos.x, pos.y - 0.2, pos.z);
		wfloor.scale.set(scale.x, scale.y, scale.z);
		this.scene.add(wfloor);

		const floor = new THREE.Mesh(
			new THREE.BoxGeometry(),
			new THREE.MeshPhongMaterial({
				color: 0x555555,
				opacity: 0.5,
				transparent: true,
			})
		);
		floor.receiveShadow = true;

		floor.position.set(pos.x, pos.y, pos.z);
		floor.scale.set(scale.x, scale.y, scale.z);
		floor.name = "floor";

		// floor.castShadow = true;
		floor.receiveShadow = true;

		let colShape = new this.physics.AmmoApi.btBoxShape(
			new this.physics.AmmoApi.btVector3(
				scale.x * 0.5,
				scale.y * 0.5,
				scale.z * 0.5
			)
		);
		colShape.setMargin(0.05);

		var gridHelper = new THREE.GridHelper(150, 120, 0xff0000, "red");
		gridHelper.position.y = -0.2;
		gridHelper.name = "gridHelper";
		this.scene.add(gridHelper);

		const floorBody = this.physics.createRigidBody(
			floor,
			colShape,
			mass,
			pos,
			quat
		);
		floorBody.setFriction(1);
	};

	private initLight() {
		const AmbientLight = new THREE.AmbientLight(0xffffff, 1);
		this.scene.add(AmbientLight);

		const dirLight = new THREE.DirectionalLight(0xffffff, 8);
		dirLight.position.set(1, 10, -2);
		dirLight.castShadow = true;
		dirLight.shadow.camera.top += 10;
		dirLight.shadow.camera.bottom -= 10;
		dirLight.shadow.camera.left -= 10;
		dirLight.shadow.camera.right += 10;
		dirLight.shadow.mapSize.width = 2048;
		dirLight.shadow.mapSize.height = 2048;
		dirLight.target.position.set(0, 0, 0);
		this.scene.add(dirLight);
		this.scene.add(dirLight.target);
	}
}
