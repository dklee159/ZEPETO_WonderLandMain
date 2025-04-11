import { Animator, Collider, GameObject } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldContent } from 'ZEPETO.World';
import { WorldId } from '../../ZepetoScripts/SyncHelper/TypeSyncHelper';

export default class MoveToWorld extends ZepetoScriptBehaviour {

    @SerializeField() private teleportType: string;
    @SerializeField() private fadeScreen: GameObject;
    private fadeAnimator: Animator;

    private Start() {
        this.fadeAnimator = this.fadeScreen.GetComponent<Animator>();
    }

    private OnTriggerEnter(coll: Collider) {
        if (!coll.CompareTag("LocalPlayer")) return;
        if (coll.gameObject == ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject) {            
            this.fadeAnimator.SetTrigger("Teleport");
            
            ZepetoWorldContent.MoveToWorld(WorldId[this.teleportType], (errCode, errMsg) => {
            console.log(`${errCode} - ${errMsg}`);
            })
        }
    }
}

