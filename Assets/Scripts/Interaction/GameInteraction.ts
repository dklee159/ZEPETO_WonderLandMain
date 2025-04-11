import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { GameObject } from 'UnityEngine';
import InteractionBtn from './InteractionBtn';
import MiniMapController from '../World/MiniMapController';
import DrawController from '../Game/Draw/DrawController';
import HorrorZoneController from '../Game/HorrorZone/HorrorZoneController';
import InteractionController from './InteractionController';
import LeaderBoardManager from '../Manager/LeaderBoardManager';
import BalloonShopController from '../Game/BalloonShop/BalloonShopController';
import TourBallonController from '../Game/Tour/TourBallonController';
import NpcController from '../Controller/NpcController';
import TreasureHunt from '../Game/TreasureHunt/TreasureHunt';

export default class GameInteraction extends ZepetoScriptBehaviour {

    @SerializeField() private _interactionType: InteractionType;
    @SerializeField() private _controller: GameObject;
    private _interactionBtn: InteractionBtn;
    
    Start() {    
        this._interactionBtn = this.GetComponent<InteractionBtn>();        
        this._interactionBtn.onClickEvent.AddListener(() => {
            this._interactionBtn.HideIcon();
            this.DoInteraction();
        })
    }

    private DoInteraction() {
        switch (this._interactionType) {
            case (InteractionType.HorrorZone):                
                this._controller.GetComponent<HorrorZoneController>().OpenUI();                
                break;    
            case (InteractionType.BalloonShop):
                this._controller.GetComponent<BalloonShopController>().OpenUI();                
                break;
            case (InteractionType.MiniMap):
                this._controller.GetComponent<MiniMapController>().OpenUI();                
                break;
            case (InteractionType.TourBalloon):
                this._controller.GetComponent<TourBallonController>().OpenUI();                
                break;
            case (InteractionType.Draw):
                this._controller.GetComponent<DrawController>().OpenUI();
                break;    
            case (InteractionType.AnimInteraction):
                this.GetComponent<InteractionController>().SendSignal();
                break;
            case (InteractionType.LeaderBoard):
                LeaderBoardManager.Instance.OpenRankUI();
                break;
            case (InteractionType.NpcInteraction):
                this.GetComponent<NpcController>().OpenDialogue();
                break;
            case (InteractionType.TreasureHunt):
                this._controller.GetComponent<TreasureHunt>().StartTreasureHunt();
                break;
        }
    }
}

export enum InteractionType {
    HorrorZone,    
    BalloonShop,
    MiniMap,
    TourBalloon,
    Draw,
    AnimInteraction,
    LeaderBoard,
    NpcInteraction,
    TreasureHunt
}