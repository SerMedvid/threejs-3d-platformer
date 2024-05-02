"use client";

import { FPSScene } from "@/components/FPSScene";
import { useEffect, useRef } from "react";

export default function Home() {
	const scene = useRef<FPSScene>();

	useEffect(() => {
		if (!scene.current) {
			scene.current = new FPSScene();
		}
	}, []);

	return (
		<main className="flex min-h-[100vhs] flex-col items-center justify-between"></main>
	);
}
