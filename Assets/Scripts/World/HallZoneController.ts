import { Collider, GameObject } from 'UnityEngine'
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import WonderHallController from './WonderHallController';

export default class HallZoneController extends ZepetoScriptBehaviour {

    @SerializeField() private wonderHallController: GameObject
    private _wonderHallController: WonderHallController;
    private isTrigger = false

    private Start() {
        this._wonderHallController = this.wonderHallController.GetComponent<WonderHallController>();
    }

    private OnTriggerEnter (coll: Collider) {
        if (coll !== ZepetoPlayers.instance.LocalPlayer?.zepetoPlayer?.character.GetComponent<Collider>()) return;
        if (!this.isTrigger) {
            this.isTrigger = true;
            this._wonderHallController.OpenUI();
        }        
    }
}