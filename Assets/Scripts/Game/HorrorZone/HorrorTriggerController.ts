import { Collider } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import HorrorZoneManager from './HorrorZoneManager';
import { ERROR, Tags } from '../../../ZepetoScripts/SyncHelper/TypeSyncHelper';


export default class HorrorTriggerController extends ZepetoScriptBehaviour {

    /* Properties */
    @SerializeField() private triggerType: HorrorTriggerType = HorrorTriggerType.NONE;
    
    @SerializeField() private _ghostType: GhostType = GhostType.NONE;
    public get ghostType(): GhostType { return this._ghostType; };
    
    @SerializeField() private animationIndex: number;
    public get index(): number { return this.animationIndex; };    
    
    public isTargeted : boolean = false;

    /* HorrorZoneManager */
    public RemoteStart() {
        if (this.triggerType == HorrorTriggerType.NONE) return console.error(ERROR.NOT_SELECTED_TYPE);
    }

    OnEnable() {        
        this.isTargeted = false;        
        HorrorZoneManager.Instance.addMob(this);        
    }

    OnDisable() {
        HorrorZoneManager.Instance.removeMob(this);
    }

    public onHitted() {
        // 파이어볼
        //collider.transform.parent.parent.gameObject.SetActive(false);        
        HorrorZoneManager.Instance.removeOnRange(this.gameObject.GetInstanceID());
        HorrorZoneManager.Instance.GhostBurn(this.gameObject);
    }

    /* Branches Trigger Enter */
    private OnTriggerEnter(collider: Collider) {
        console.log(`OnTriggerEnter ${HorrorTriggerType[this.triggerType]} : ${collider.name} : ${collider.gameObject.tag}`);
        
        if(this.triggerType == HorrorTriggerType.NONE) return;
        if(!ZepetoPlayers.instance.LocalPlayer) return console.error(ERROR.NOT_FOUND_LOCAL_PLAYER);

        switch(this.triggerType) {
            case HorrorTriggerType.Ghost :
                this.OnGhostTrigger(collider);
                break;

            case HorrorTriggerType.Item :
                this.OnItemTrigger(collider);
                break;

            case HorrorTriggerType.Finish :
                this.OnFinishTrigger(collider);
                break;
        }
    }

    private OnGhostTrigger(collider: Collider) {
        const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject;

        if(collider.gameObject == character) {
            HorrorZoneManager.Instance.Damage(this.gameObject);

        } else if(collider.CompareTag(Tags.Weapon)) {

            // 파이어볼
            // collider.transform.parent.parent.gameObject.SetActive(false);
            // this.horrorZoneManager.GhostBurn(this.gameObject);
        }
    }
    
    private OnItemTrigger(collider: Collider) {
        const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject;

        if(collider.gameObject == character) {
            HorrorZoneManager.Instance.AddItem(this.name);
            this.gameObject.SetActive(false);
        }
    }

    // private OnTeleportTrigger(collider: Collider) {
    //     const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject;

    //     if(collider.gameObject == character) {
    //         const target = this.transform.GetChild(0);
    //         this.horrorZoneManager.Teleport(target);
    //     }
    // }

    private OnFinishTrigger(collider: Collider) {
        const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject;

        if(collider.gameObject === character) {
            HorrorZoneManager.Instance.GameClear(collider);
        }
    }
}

export enum HorrorTriggerType {
    NONE = -1,
    Start = 0, Ghost = 10, Item = 20, Teleport = 40, Finish = 50,
}

export enum GhostType {
    NONE = -1,
    Cho = 0, Doke = 1, Reaper = 2,
}