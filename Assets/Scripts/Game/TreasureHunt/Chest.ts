import { Collider } from "UnityEngine";
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoCamera, ZepetoCharacter, ZepetoPlayers } from "ZEPETO.Character.Controller";
import { UnityEvent } from "UnityEngine.Events";

export default class Chest extends ZepetoScriptBehaviour {
    public onTrigger: UnityEvent = new UnityEvent();
    private isOn: boolean = false;

    public On() {
        this.isOn = true;
        this.gameObject.SetActive(true);
    }

    public Off() {
        this.isOn = false;
        this.gameObject.SetActive(false);
    }

    OnTriggerEnter(coll: Collider) {
        if (!this.isOn) return;

        if (coll !== ZepetoPlayers.instance.LocalPlayer?.zepetoPlayer?.character.GetComponent<Collider>()) return;
        this.onTrigger.Invoke();
    }
}