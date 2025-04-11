import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import {Animator, AnimatorStateInfo, Object } from "UnityEngine";
import {Room, RoomData} from "ZEPETO.Multiplay";
import {ZepetoWorldMultiplay} from "ZEPETO.World";
import { SyncIndexType } from './TypeSyncHelper';
import TransformSyncHelper from './TransformSyncHelper';
import SyncIndexManager from '../SyncIndexManager';
import MultiplayManager from '../Multiplay/MultiplayManager';

export default class AnimatorSyncHelper extends ZepetoScriptBehaviour {
    //This synchronizes the animator when its state changes. 
    // By default, the master synchronizes. 
    // When synchronizing transforms such as position, rotation, etc., it must be used with TransformSyncHelper.ts
    
    /** animator **/
    private _animator :Animator;
    private _stateInfo : AnimatorStateInfo;
    private _previousShortNameHash : number;

    /** multiplay **/
    private _multiplay: ZepetoWorldMultiplay;
    private _room: Room;
    private _Id: string;
    private _isMasterClient: boolean;
    
    get Id() {
        return this._Id;
    }
    
    // public syncIndexType: SyncIndexType = SyncIndexType.AlreadyCreated;

    /* Already Created Object Start */
    // private RemoteStart(id:string) {
    //     if(this.syncIndexType == SyncIndexType.Instantiate) return;
    //     if(this.syncIndexType == SyncIndexType.AlreadyCreated) return;
    //     this._animator = this.GetComponentInChildren<Animator>();
        
    //     this._Id = this.GetComponent<TransformSyncHelper>()?.Id ?? (SyncIndexManager.SyncIndex++).toString();
    //     this._multiplay = Object.FindObjectOfType<ZepetoWorldMultiplay>();
    //     this._multiplay.RoomJoined += (room: Room) => {
    //         this._room = room;
    //         this.SyncMessageHandler();
    //     };
    // }

    /* Instantiate Object Start */
    private Start() {
        // if(this.syncIndexType == SyncIndexType.AlreadyCreated) return;
        this._animator = this.GetComponentInChildren<Animator>();
        
        this._Id = this.GetComponent<TransformSyncHelper>()?.Id ?? (SyncIndexManager.SyncIndex++).toString();
        this._multiplay = Object.FindObjectOfType<ZepetoWorldMultiplay>();
        this._multiplay.RoomJoined += (room: Room) => {
            this._room = room;
            this.SyncMessageHandler();
        };
    }
    
    private Update(){
        if(!this._isMasterClient)
            return;

        if(this._previousShortNameHash != this._animator.GetCurrentAnimatorStateInfo(0)?.shortNameHash){
            this.SendAnimator();
            this._previousShortNameHash = this._stateInfo.shortNameHash;
        }
    }

    public ChangeOwner(ownerSessionId:string){
        console.log("AnimANIMANIMANIMANIMANIM");
        console.log(ownerSessionId);
        if (this._room == null)
            this._room = MultiplayManager.instance.room;
        if (this._room.SessionId == ownerSessionId){
            this._isMasterClient = true;
            this.SendAnimator();
        } else if(this._room.SessionId != ownerSessionId && this._isMasterClient) {
            this._isMasterClient = false;
        }
    }

    private SendAnimator() {
        this._stateInfo = this._animator?.GetCurrentAnimatorStateInfo(0);
        const clipNameHash = this._stateInfo.shortNameHash;
        const clipNormalizedTime = this._stateInfo.normalizedTime;
        
        const data = new RoomData();
        data.Add(DATA_TYPE.Id, this._Id);
        data.Add(DATA_TYPE.clipNameHash, clipNameHash);
        data.Add(DATA_TYPE.clipNormalizedTime, clipNormalizedTime);

        this._room?.Send(MESSAGE.SyncAnimator, data.GetObject());
    }

    private SyncMessageHandler() {
        const ResponseId: string = MESSAGE.ResponseAnimator + this._Id;
        console.log(ResponseId);
        this._room.AddMessageHandler(ResponseId, (message: syncAnimator) => {
            this.GetSyncAnimator(message);
        });
    }

    private GetSyncAnimator(message:syncAnimator){
        this._animator.Play(message.clipNameHash, 0, message.clipNormalizedTime);
    }
}

interface syncAnimator {
    Id: string,
    clipNameHash: number,
    clipNormalizedTime: number
}

enum DATA_TYPE {
    Id = "Id",
    clipNameHash = "clipNameHash",
    clipNormalizedTime = "clipNormalizedTime",
}

enum MESSAGE {
    SyncAnimator = "SyncAnimator",
    ResponseAnimator = "ResponseAnimator"
}