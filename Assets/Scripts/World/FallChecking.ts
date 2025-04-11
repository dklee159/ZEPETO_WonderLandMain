import {Collider, Vector3, Quaternion, Transform} from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script' 
import { ERROR } from '../../ZepetoScripts/SyncHelper/TypeSyncHelper';


export default class FallChecking extends ZepetoScriptBehaviour {
    //It's a script that responds when the Zepeto character falls.
    @SerializeField() private returnPoint:Transform;
    private OnTriggerEnter(collider: Collider) {
        if(!ZepetoPlayers.instance.LocalPlayer) return console.error(ERROR.NOT_FOUND_LOCAL_PLAYER);
        const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject;
        if(collider.gameObject != character) return;

        const localCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        if (this.returnPoint) localCharacter.Teleport(this.returnPoint.position, this.returnPoint.rotation);
        else localCharacter.Teleport(Vector3.zero, Quaternion.identity);
    }
}