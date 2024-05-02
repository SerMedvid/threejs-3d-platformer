type Props = {
	name: string;
	large?: boolean;
};

function ControlKey({ name, large = false }: Props) {
	return (
		<div
			className={`${
				large ? "w-36" : "w-10"
			} h-10 m-1 border border-solid border-white bg-white bg-opacity-60 flex justify-center items-center
			`}
		>
			{name}
		</div>
	);
}

export default function Interface() {
	return (
		<div className="fixed top-0 left-0 w-full h-full pointer-events-none">
			<div className="absolute bottom-[5%] left-0 w-full">
				<div className="flex justify-center">
					<ControlKey name={"W"} />
				</div>
				<div className="flex justify-center">
					<ControlKey name={"A"} />
					<ControlKey name={"S"} />
					<ControlKey name={"D"} />
				</div>
				<div className="flex justify-center">
					<ControlKey
						large
						name={"Jump"}
					/>
				</div>
			</div>
		</div>
	);
}
