// import { Collider } from 'UnityEngine';
// import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
// import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
// import { ERROR } from '../Managers/TypeManager';
// import CoinZoneManager from './CoinZoneManager';

// export default class CoinController extends ZepetoScriptBehaviour {

//     /* Properties */
//     private manager: CoinZoneManager;
//     private id: number;

//     /* CoinZoneManager */
//     public RemoteStart(manager:CoinZoneManager, id:number) {
//         this.manager = manager;
//         this.id = id;
//     }

//     OnTriggerEnter(collider : Collider) {
//         if(!ZepetoPlayers.instance.LocalPlayer) return console.error(ERROR.NOT_FOUND_LOCAL_PLAYER);
//         const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject;
//         if(collider.gameObject != character) return;
//         if(!this.manager) return;

//         this.manager.AddCoin(this.id);
//     }

// }