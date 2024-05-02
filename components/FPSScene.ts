import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
// import { AmmoDebugDrawer, DefaultBufferSize } from "./DebugDrawer";
import Physics from "./Physics";
import Environment from "./Environment";
import Character from "./Character";

export class FPSScene {
	physics: Physics;
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;
	renderer: THREE.WebGLRenderer;
	followCam: THREE.Object3D;
	character: Character;
	environment: Environment;
	clock: THREE.Clock;
	animationFrame: ReturnType<typeof global.requestAnimationFrame>;
	orbitControls: OrbitControls;
	loader: GLTFLoader;

	// Debug variables
	// debugGeometry: THREE.BufferGeometry;
	// debugDrawer: AmmoDebugDrawer;
	// DEBUGMODE: number; // 0 = off , 1 = wireframe, 2 = aabb

	constructor() {
		this.clock = new THREE.Clock();
		this.loader = new GLTFLoader();
		const dracoLoader = new DRACOLoader();
		dracoLoader.setDecoderPath("./draco/");
		this.loader.setDRACOLoader(dracoLoader);
		// this.DEBUGMODE = 0;

		this.init();
	}

	private async init() {
		this.initScene();

		// this.initOrbitControls();
		this.physics = new Physics(this.scene);
		await this.physics.initialize();
		this.environment = new Environment(this.scene, this.physics);
		this.environment.initEnvironment();

		this.character = new Character(this.loader, this.physics, this.scene);
		await this.character.initialize();
		this.initFollowCamera();

		this.animate();
		// this.initDebug();

		window.addEventListener("resize", this.onWindowResize.bind(this), false);
	}

	private animate() {
		const delta = this.clock.getDelta();
		const elapsedTime = this.clock.getElapsedTime();
		// this.orbitControls.update();

		this.environment.updatePlatformPosition(elapsedTime);

		this.character.characterMovement();

		if (this.followCam) {
			const pos = new THREE.Vector3();
			this.followCam.getWorldPosition(pos);

			this.camera.position.lerp(pos, 0.085);

			this.camera.lookAt(
				this.character.character.position.x,
				this.character.character.position.y + 0.5,
				this.character.character.position.z
			);
		}

		this.physics.updatePhysics(delta);
		this.character.mixer.update(delta);

		// if (this.debugDrawer) {
		// 	if (this.debugDrawer.index !== 0) {
		// 		this.debugGeometry.attributes.position.needsUpdate = true;
		// 		this.debugGeometry.attributes.color.needsUpdate = true;
		// 	}

		// 	this.debugGeometry.setDrawRange(0, this.debugDrawer.index);
		// 	this.debugDrawer.update();
		// }

		this.renderer.render(this.scene, this.camera);

		this.camera.updateProjectionMatrix();

		this.animationFrame = window.requestAnimationFrame(this.animate.bind(this));
	}

	private initScene() {
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		this.camera.position.set(0, 2, -2);

		this.scene.background = new THREE.Color(0xf02050);
		this.scene.fog = new THREE.Fog(0xf02050, 1, 26);

		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		document.body.appendChild(this.renderer.domElement);
	}

	private initFollowCamera() {
		this.camera.lookAt(this.scene.position);
		this.followCam = new THREE.Object3D();
		this.followCam.position.copy(this.camera.position);
		this.scene.add(this.followCam);
		this.followCam.parent = this.character.character;
	}

	// private initOrbitControls() {
	// 	this.orbitControls = new OrbitControls(
	// 		this.camera,
	// 		this.renderer.domElement
	// 	);
	// 	this.camera.position.set(1.2, 4.6, -2.2);
	// 	this.orbitControls.update();
	// }

	private onWindowResize() {
		const width = window.innerWidth;
		const height = window.innerHeight;

		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(width, height);
	}

	// private initDebug() {
	// 	const debugVertices = new Float32Array(DefaultBufferSize);
	// 	const debugColors = new Float32Array(DefaultBufferSize);
	// 	this.debugGeometry = new THREE.BufferGeometry();
	// 	this.debugGeometry.setAttribute(
	// 		"position",
	// 		new THREE.BufferAttribute(debugVertices, 3).setUsage(
	// 			THREE.DynamicDrawUsage
	// 		)
	// 	);
	// 	this.debugGeometry.setAttribute(
	// 		"color",
	// 		new THREE.BufferAttribute(debugColors, 3).setUsage(THREE.DynamicDrawUsage)
	// 	);
	// 	const debugMaterial = new THREE.LineBasicMaterial({
	// 		vertexColors: true,
	// 	});
	// 	const debugMesh = new THREE.LineSegments(this.debugGeometry, debugMaterial);
	// 	debugMesh.frustumCulled = false;
	// 	this.scene.add(debugMesh);
	// 	this.debugDrawer = new AmmoDebugDrawer(
	// 		this.physics.AmmoApi,
	// 		null,
	// 		debugVertices,
	// 		debugColors,
	// 		this.physics.physicsWorld
	// 	);
	// 	this.debugDrawer.enable();
	// 	this.debugDrawer.setDebugMode(this.DEBUGMODE);
	// }
}
