declare module "ZEPETO.Multiplay.Schema" {

	import { Schema, MapSchema, ArraySchema } from "@colyseus/schema"; 


	interface State extends Schema {
		players: MapSchema<Player>;
		SyncTransforms: MapSchema<SyncTransform>;
		equipDatas: MapSchema<EquipData>;
	}
	class Player extends Schema {
		sessionId: string;
		zepetoUserId: string;
		playerAdditionalValue: PlayerAdditionalValue;
		animationParam: ZepetoAnimationParam;
		gestureName: string;
		visit: number;
		wonder: Wonder;
		wonderWorldData: WonderWorldData;
		playerDB: string;
	}
	class sVector3 extends Schema {
		x: number;
		y: number;
		z: number;
	}
	class sQuaternion extends Schema {
		x: number;
		y: number;
		z: number;
		w: number;
	}
	class SyncTransform extends Schema {
		Id: string;
		position: sVector3;
		localPosition: sVector3;
		rotation: sQuaternion;
		scale: sVector3;
		status: number;
		sendTime: number;
	}
	class PlayerAdditionalValue extends Schema {
		additionalWalkSpeed: number;
		additionalRunSpeed: number;
		additionalJumpPower: number;
	}
	class ZepetoAnimationParam extends Schema {
		State: number;
		MoveState: number;
		JumpState: number;
		LandingState: number;
		MotionSpeed: number;
		FallSpeed: number;
		Acceleration: number;
		MoveProgress: number;
		isSit: boolean;
		WonderState: number;
		isHold: boolean;
	}
	class EquipData extends Schema {
		key: string;
		sessionId: string;
		itemName: string;
		prevItemName: string;
		bone: number;
		prevBone: number;
		wonderState: number;
	}
	class Wonder extends Schema {
		WonderState: number;
		CurrentZone: number;
		Multiplay: number;
	}
	class WonderWorldData extends Schema {
		MissionClear_JG: boolean;
		MissionClear_NT: boolean;
		MissionClear_Badge: boolean;
		playScore: number;
	}
}