import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import Physics from "./Physics";

const keys = {
	a: 0,
	s: 0,
	d: 0,
	w: 0,
};

export default class Character {
	mouse: THREE.Vector2;
	loader: GLTFLoader;
	animations: THREE.AnimationClip[];
	mixer: THREE.AnimationMixer;
	model: THREE.Mesh;
	playingAnimation: THREE.AnimationAction;
	canJump: boolean;
	followCam: THREE.Object3D;
	character: THREE.Object3D;
	physics: Physics;
	raycaster: THREE.Raycaster;
	worldDirectetion: THREE.Vector3;
	directionDown: THREE.Vector3;
	scene: THREE.Scene;

	constructor(loader: GLTFLoader, physics: Physics, scene: THREE.Scene) {
		this.loader = loader;
		this.physics = physics;
		this.mouse = new THREE.Vector2(0, 0);
		this.canJump = true;
		this.raycaster = new THREE.Raycaster();
		this.worldDirectetion = new THREE.Vector3();
		this.directionDown = new THREE.Vector3(0, -1, 0);
		this.scene = scene;
	}

	public async initialize() {
		await this.initCharacter();

		this.setCharacterPhysics();

		window.addEventListener("mousemove", this.onMouselocationChange.bind(this));
		window.addEventListener("keydown", this.onKeyDown.bind(this));
		window.addEventListener("keyup", this.onKeyUp.bind(this));
	}

	private async initCharacter() {
		const glb = await this.loader.loadAsync("/Ninja_Male_Hair.gltf");

		this.animations = glb.animations;
		this.mixer = new THREE.AnimationMixer(glb.scene);
		const model = glb.scene;
		model.position.setY(-0.25);
		model.scale.set(0.3, 0.3, 0.3);
		model.castShadow = true;

		model.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				child.castShadow = true;
			}
		});

		const characterGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.5);
		const characterMaterial = new THREE.MeshBasicMaterial({
			color: "blue",
			transparent: true,
			opacity: 0,
			depthWrite: false,
		});
		this.character = new THREE.Mesh(characterGeometry, characterMaterial);
		this.character.add(model);

		this.character.name = "character";
	}

	private setCharacterPhysics() {
		let pos = new THREE.Vector3(0, 0, 0);

		let quat = new THREE.Quaternion().fromArray([0, 0, 0, 1]);
		let mass = 10;

		this.character.position.set(pos.x, pos.y, pos.z);

		const colShape = new this.physics.AmmoApi.btCapsuleShape(0.25, 0.4);
		colShape.setMargin(0.05);

		const playerBody = this.physics.createRigidBody(
			this.character,
			colShape,
			mass,
			pos,
			quat
		);
		playerBody.setAngularFactor(new this.physics.AmmoApi.btVector3(0, 0, 0));
	}

	private handleJump() {
		this.character.getWorldDirection(this.worldDirectetion);
		this.raycaster.set(this.character.position, this.directionDown);

		const intersects = this.raycaster.intersectObjects(this.scene.children);

		for (const intersect of intersects) {
			if (
				["platform", "wall", "floor"].includes(intersect.object.name) &&
				intersect.distance < 0.5
			) {
				this.animationHandler("Jump", false);
				const physicsBody = this.character.userData.physicsBody;

				physicsBody.applyCentralImpulse(
					new this.physics.AmmoApi.btVector3(0, 70, 0)
				);
			}
		}
	}

	public characterMovement() {
		const movementSpeed = 70;
		const rotationSpeed = 2.5;

		const moveX = keys.a - keys.d;
		const moveZ = keys.w - keys.s;

		const physicsBody = this.character.userData.physicsBody;

		const temporaryEuler = new THREE.Vector3(
			moveX * movementSpeed,
			0,
			moveZ * movementSpeed
		).applyQuaternion(this.character.quaternion);

		if (moveZ || moveX) {
			//movement
			physicsBody.applyForce(
				new this.physics.AmmoApi.btVector3(
					temporaryEuler.x,
					temporaryEuler.y,
					temporaryEuler.z
				)
			);
		}

		if (this.mouse.y) {
			//rotation
			const resultantImpulseRotation = new this.physics.AmmoApi.btVector3(
				0,
				-this.mouse.x,
				0
			);
			resultantImpulseRotation.op_mul(rotationSpeed);
			physicsBody.setAngularVelocity(resultantImpulseRotation);
		}
	}

	private onMouselocationChange(event: MouseEvent) {
		const width = window.innerWidth;
		const height = window.innerHeight;

		this.mouse.x = (event.clientX / width) * 2 - 1;
		this.mouse.y = -(event.clientY / height) * 2 + 1;
	}

	private onKeyUp(event: KeyboardEvent) {
		const key = event.key === " " ? "space" : event.key;

		keys[key as keyof typeof keys] = 0;
		this.canJump = true;

		this.animationHandler("Idle");
	}

	private onKeyDown = (event: KeyboardEvent) => {
		switch (event.key) {
			case "a":
			case "w":
			case "s":
			case "d":
				this.animationHandler("Run");
				keys[event.key as keyof typeof keys] = 1;

				break;

			case " ":
				this.handleJump();
				break;
		}
	};

	private animationHandler(animation: string, loop = true) {
		const clip = THREE.AnimationClip.findByName(this.animations, animation);

		if (clip && this.playingAnimation?.getClip().name !== animation) {
			const action = this.mixer.clipAction(clip);
			action.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
			action.clampWhenFinished = true;

			if (!this.playingAnimation) {
				action.play();
			} else {
				this.playingAnimation?.crossFadeTo(action, 1, false).reset().play();
			}

			this.playingAnimation = action;
		}
	}
}
