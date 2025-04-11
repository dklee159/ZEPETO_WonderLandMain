import { GameObject, Mathf } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Player } from 'ZEPETO.Multiplay.Schema';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import UIManager from './UIManager';
import SDManager from './SDManager';
import { Anim, PlayerDB, WonderCollectionList, WonderState } from '../../ZepetoScripts/SyncHelper/TypeSyncHelper';
import SyncIndexManager from '../../ZepetoScripts/SyncIndexManager';
import QuestManager from './QuestManager';
import MultiplayManager from '../../ZepetoScripts/Multiplay/MultiplayManager';


export default class DataManager extends ZepetoScriptBehaviour {

    /* Singleton */
    private static _instance: DataManager;
    public static get Instance(): DataManager {
        if (!DataManager._instance) {
            const managerObj = GameObject.Find("DataManager");
            if (managerObj) DataManager._instance = managerObj.GetComponent<DataManager>();
        }
        return DataManager._instance;
    }

    public static readonly coinLimit: number = 999999;

    private _playerDB: PlayerDB = null;
    public get PlayerDB(): PlayerDB {
        return this._playerDB;
    }
    public set PlayerDB(db: PlayerDB) {
        if (!db || this._playerDB) return;
        this._playerDB = db;
    }

    /* WonderState activation UI */
    private _currentWonderState: WonderState;
    public get currentWonderState(): WonderState { return this._currentWonderState; }
    public set currentWonderState(value: WonderState) {
        this._currentWonderState = value;
    }

    private _isGetPlayerDB: boolean = false;
    public get IsGetPlayerDB(): boolean { return this._isGetPlayerDB; }
    public set IsGetPlayerDB(value: boolean) { this._isGetPlayerDB = value; }

    private player: Player;
    
    Awake() {
        DataManager._instance = this;     
    }

    public PlayerDataUpdate() {
        // World Data Update
        const changeData = {
            mission_JG: false,
            mission_NT: false,
            mission_badge: false,
        };     

        if(this._isGetPlayerDB) {
            if(SyncIndexManager.WonderCoin != this._playerDB.wonderCoin) {
                SyncIndexManager.WonderCoin = this._playerDB.wonderCoin;
                UIManager.Instance.UpdateCoinUI();
            }

            for (let i = 0; i < SyncIndexManager.WonderDrawData.length; i++) {
                for (let j = 0; j < this._playerDB.wonderDraw.length; j++) {
                    if (SyncIndexManager.WonderDrawData[i].id === this._playerDB.wonderDraw[j].id) {
                        if (SyncIndexManager.WonderDrawData[i].amount !== this._playerDB.wonderDraw[j].amount) {
                            SyncIndexManager.WonderDrawData[i].amount = this._playerDB.wonderDraw[j].amount;                            
                            if (!SyncIndexManager.DrawDataChanged) SyncIndexManager.DrawDataChanged = true;
                        }
                        break;
                    }
                }
            }   

            const collectionData = this._playerDB.wonderCollection;
            for (const badge of collectionData) {
                if (badge.id == WonderCollectionList.Wonder_Badge_Hall) {
                    if (SyncIndexManager.BADGE_HALL != badge.has) {                        
                        SyncIndexManager.BADGE_HALL = badge.has
                        UIManager.Instance.UpdateBadgeUI();
                    }
                    break;
                }   
            }
        }
        // if(SyncIndexManager.MISSION_CLEAR_JG != this.player.wonderWorldData.MissionClear_JG) {
        //     SyncIndexManager.MISSION_CLEAR_JG = this.player.wonderWorldData.MissionClear_JG;
        //     changeData.mission_JG = true;
        // }
        
        // if(SyncIndexManager.MISSION_CLEAR_NT != this.player.wonderWorldData.MissionClear_NT) {
        //     SyncIndexManager.MISSION_CLEAR_NT = this.player.wonderWorldData.MissionClear_NT;
        //     changeData.mission_NT = true;
        // }
        
        // if(this._isGetPlayerDB) {
        //     if(SyncIndexManager.BADGE_HALL != this.player.wonderWorldData.MissionClear_Badge) {
        //         SyncIndexManager.BADGE_HALL = this.player.wonderWorldData.MissionClear_Badge;
        //         changeData.mission_badge = true;
        //     }
        // }

        // /* Update Local UI */
        // if(changeData.mission_badge) {
        //     UIManager.Instance.UpdateBadgeUI();

        //     // MinigameJGManager.instance.lastgameSuccess = SyncIndexManager.MISSION_CLEAR_JG || MinigameJGManager.instance.lastgameSuccess;
        //     // MinigameNTManager.instance.lastgameSuccess = SyncIndexManager.MISSION_CLEAR_NT || MinigameNTManager.instance.lastgameSuccess;

        //     // const hasBadge = MinigameJGManager.instance.IsGetBadge || MinigameNTManager.instance.IsGetBadge || SyncIndexManager.BADGE_HALL;
        //     // MinigameJGManager.instance.IsGetBadge = hasBadge;
        //     // MinigameNTManager.instance.IsGetBadge = hasBadge;
        // }
    }

    public SetLocalPlayer(player:Player) {
        this.player = player;
    }

    public AddBadge() {
        let hasBadge : boolean = false;
        let hasHidden : boolean = false;
        let hasCount : number = 0;
        this.PlayerDB.wonderCollection.forEach((value, index) => {
            if(value.id !== WonderCollectionList.Hiddle_Collection) {
                if(value.id == WonderCollectionList.Wonder_Badge_Hall) {
                    if(value.has) hasBadge = true;
                    else value.has = true;
                }
                
                if(value.has) hasCount++;
            }
            else {
                hasHidden = value.has;
            }
        });

        if(hasBadge) {
            return;
        }

        if(hasCount == 3) {
            if(!hasHidden) {
                for(const wonderCollection of this.PlayerDB.wonderCollection) {
                    if(wonderCollection.id == WonderCollectionList.Hiddle_Collection) {
                        wonderCollection.has = true;
                        break;
                    }
                }
                UIManager.Instance.UpdateGiftUI();
            }

            SDManager.Instance.OnAddBadge();
        }

        // MultiplayManager.instance.room.Send(EVENT_MESSAGE.AddBadge);
        UIManager.Instance.UpdateBadgeUI();
    }


    public AddCoin(count:number = 1, isQuest : boolean = false) {
        this._playerDB.wonderCoin = Mathf.Clamp(this._playerDB.wonderCoin +count, 0, DataManager.coinLimit);
        if(!isQuest) QuestManager.Instance.OnGetCoin(count);
        UIManager.Instance.UpdateCoinUI();
    }

    /** Local Player Animation **/
    /* Local Player State */
    public SetWonderState(wonderState: WonderState, isPlay:boolean, isHold:boolean = false) {
        const animator = ZepetoPlayers.instance.GetPlayer(MultiplayManager.instance.room.SessionId).character.ZepetoAnimator;
        const prevWonderState = animator.GetInteger(Anim.WonderState);
        this._currentWonderState = isPlay ? wonderState : WonderState.NONE;

        console.log(`${WonderState[wonderState]}, ${isPlay}, ${isHold}`);
        

        // const isPrevFood = prevWonderState == WonderState.Hold_RightHand_Side;        
        // if (isPrevFood) //TODO unequip

        /* Animation Play */
        this.PlayAnimation(wonderState, isPlay);
    }

     /* Local Player Animation */
    private PlayAnimation(wonderState:WonderState, isPlay:boolean) {
        const animator = ZepetoPlayers.instance.GetPlayer(MultiplayManager.instance.room.SessionId).character.ZepetoAnimator;
        
        /* Play Local Animaion */
        if(isPlay)  animator.SetInteger(Anim.WonderState, wonderState);
        else        animator.SetInteger(Anim.WonderState, WonderState.NONE);
    }

    /* Set Local Rank */
    public Horror_SetLocalRankUI(timer: number) {        
        UIManager.Instance.Open_Horror_ResultUI();
    }

    // public MissionAllClear() {
    //     if (this._isGetPlayerDB) {
    //         for (const item of this._playerDB.wonderCollection) {
    //             if (item.id != WonderCollectionList.Wonder_Badge_Hall) continue;
    //             if (item.has) return;
    //             item.has = true;
    //             SyncIndexManager.BADGE_HALL = true;
    //             // UIManager.instance.UpdateBadgeUI();
    //             break;
    //         }
    //     }
    //     this.room.Send(MESSAGE.MissionAllClear, null);
    //     this.AllClearCheck();
    // }

}