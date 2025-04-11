import { GameObject } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import HorrorZoneManager from './HorrorZoneManager';
import BalloonShopController from '../BalloonShop/BalloonShopController';

export default class HorrorZoneController extends ZepetoScriptBehaviour {

    @SerializeField() private horrorZoneEntranceUI: GameObject;
    @SerializeField() private horrorZoneEntranceConfirmButton: Button;
    @SerializeField() private horrorZoneEntranceCloseButton: Button;
    @SerializeField() private horrorZoneEntranceCancelButton: Button;
    
    @SerializeField() private horrorZoneNoticeUI: GameObject;
    @SerializeField() private horrorZoneNoticeConfirmButton: Button;
    @SerializeField() private horrorZoneNoticeCloseButton: Button;

    @SerializeField() private horrorZoneTutorialUI: GameObject ;
    @SerializeField() private horrorZoneTutorialConfirmButton: Button;
    @SerializeField() private horrorZoneTutorialCloseButton: Button;

    @SerializeField() private horrorZoneGameUI: GameObject;
    @SerializeField() private localHorrorZoneResultUI: GameObject;
    @SerializeField() private localHorrorZoneResultCloseButton: Button;

    @SerializeField() private _balloonShopController: GameObject;
    private ballonShopController: BalloonShopController;

    Start() {    
        this.ballonShopController = this._balloonShopController.GetComponent<BalloonShopController>();

        this.horrorZoneEntranceConfirmButton.onClick.AddListener(() => {
            this.horrorZoneEntranceUI.SetActive(false);
            this.horrorZoneNoticeUI.SetActive(true);            
        })

        this.horrorZoneEntranceCloseButton.onClick.AddListener(() => {
            this.horrorZoneEntranceUI.SetActive(false);
        })

        this.horrorZoneEntranceCancelButton.onClick.AddListener(() => {
            this.horrorZoneEntranceUI.SetActive(false);
        })

        this.horrorZoneNoticeConfirmButton.onClick.AddListener(() => {
            this.HorrorZoneInit();
        })

        this.horrorZoneNoticeCloseButton.onClick.AddListener(() => {
            this.HorrorZoneInit();
        })        

        this.horrorZoneTutorialConfirmButton.onClick.AddListener(() => {
            HorrorZoneManager.Instance.GameStart();
            this.horrorZoneTutorialUI.SetActive(false);
        })

        this.horrorZoneTutorialCloseButton.onClick.AddListener(() => {
            HorrorZoneManager.Instance.GameStart();
            this.horrorZoneTutorialUI.SetActive(false);
        })

        this.localHorrorZoneResultCloseButton.onClick.AddListener(() => {
            this.localHorrorZoneResultUI.SetActive(false);
        })
    }

    public OpenUI() {
        this.horrorZoneEntranceUI.SetActive(true);
    }

    private HorrorZoneInit() {        
        // Unequip            
        this.ballonShopController.UnequipBalloon();
        
        HorrorZoneManager.Instance.InitGame();
        this.horrorZoneNoticeUI.SetActive(false);                
    }
    
    public HorrorGamePanelVisibler(isVisible: boolean) {
        this.horrorZoneTutorialUI.SetActive(isVisible);
        this.horrorZoneGameUI.SetActive(isVisible);                
    }

    public OpenHorrorZoneResult() {
        this.localHorrorZoneResultUI.SetActive(true);
    }
}