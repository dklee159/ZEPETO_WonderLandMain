import { GameObject, Sprite } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { TextMeshProUGUI } from 'TMPro';
import DataManager from './DataManager';
import HorrorZoneController from '../Game/HorrorZone/HorrorZoneController';
import AttendController from '../Controller/AttendController';
import DayLightController from '../Controller/DayLightController';
import CustomPoseController from '../Controller/CustomPoseController';
import BadgeController from '../Controller/BadgeController';
import GiftController from '../Controller/GiftController';
import VisitController from '../Controller/VisitController';
import EntryTicketController from '../Controller/EntryTicketController';
import { ERROR, ScreenCanvasType } from '../../ZepetoScripts/SyncHelper/TypeSyncHelper';
import TourBallonController from '../Game/Tour/TourBallonController';
import ToastController from '../../ZepetoScripts/ScreenShotScripts/ToastController';

export default class UIManager extends ZepetoScriptBehaviour {
    private static _instance: UIManager;
    public static get Instance(): UIManager {
        if (!UIManager._instance) {
            const managerObj = GameObject.Find("UIManager");
            if (managerObj) UIManager._instance = managerObj.GetComponent<UIManager>();
        }
        return UIManager._instance;         
    }

    @Header("ScreenUI")
    @SerializeField() private loadingUI: GameObject;
    @SerializeField() private fadeUI: GameObject;
    
    @Header("In Game UI")
    @SerializeField() private attendUI: GameObject;
    @SerializeField() private badgeUI: GameObject;
    @SerializeField() private giftUI: GameObject;    
    @SerializeField() private wonderCoinUI: TextMeshProUGUI;
    @SerializeField() private defaultUI: GameObject;
    @SerializeField() private gestureCanvas: GameObject;
    @SerializeField() private screenshotCanvas: GameObject;
    
    @SerializeField() private _attendController: GameObject;
    private attendController: AttendController;
    @SerializeField() private _badgeController: GameObject;
    private badgeController: BadgeController;
    @SerializeField() private _giftController: GameObject;
    private giftController: GiftController;
    @SerializeField() private _dayLightController: GameObject;
    private dayLightController: DayLightController;
    @SerializeField() private _customPoseController: GameObject;
    private customPoseController: CustomPoseController;
    @SerializeField() private _visitController: GameObject;
    private visitController: VisitController;
    @SerializeField() private _entryTicketController: GameObject;
    private entryTicketController: EntryTicketController;

    @Header("Game UI")
    @SerializeField() private _horrorZoneController: GameObject;
    private horrorZoneController: HorrorZoneController;
    @SerializeField() private _tourBalloonController: GameObject;    
    private tourBalloonController: TourBallonController;

    @SerializeField() private _toastController: GameObject;
    private toastController: ToastController;

    @SerializeField() private alreadyPlayUI: GameObject;

    @Header("Resources")
    

    private _openUI: GameObject;
    public get openUI(): GameObject { return this._openUI; }
    public set openUI(value: GameObject) {
        if(!this._openUI) {
            this._openUI = value;
            this._openUI.SetActive(true);
        } else {
            console.error(ERROR.ALREADY_OPENED);
        }
    }

    private Awake() {
        UIManager._instance = this;
    }

    private Start() {
        this.alreadyPlayUI.GetComponentInChildren<Button>().onClick.AddListener(() => {
            this.alreadyPlayUI.SetActive(false);
        })
    }


    public RemoteStart() {
        /*** Http Data Connection Service ***/
        this.SetPosePanel();
        this.SetBadgeUI();
        this.SetGiftUI();
        this.SetDayLightSkyBox();
        this.CheckAttendance();
        this.SetUiToaster();
        this.SetController();
        this.SetVisit();

        this.UpdatePlayerDB();
    }

    private UpdatePlayerDB() {
        this.UpdateCoinUI();
        this.UpdateBadgeUI();
        this.UpdateGiftUI();
    }

    private SetPosePanel() {
        if (!this.customPoseController) this.customPoseController = this._customPoseController.GetComponent<CustomPoseController>();   
        this.customPoseController.RemoteStart();
        console.log(`[UIManager] CustomPoseController loaded success`);
    }

    private SetGiftUI() {
        if (!this.giftController) this.giftController = this._giftController.GetComponent<GiftController>();   
        this.giftController.RemoteStart();
        console.log(`[UIManager] GiftController loaded success`); 
    }

    private SetBadgeUI() {
        if (!this.badgeController) this.badgeController = this._badgeController.GetComponent<BadgeController>();
        this.badgeController.RemoteStart();
        console.log(`[UIManager] BadgeController loaded success`); 
    }

    /* Update Coin Count */
    public UpdateCoinUI() {
        const coin = +DataManager.Instance.PlayerDB.wonderCoin;
        this.wonderCoinUI.text = this.FormatNumber(coin);
    }

    private FormatNumber(num: number) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /* Update Badge Has */
    public UpdateBadgeUI() {  
        if(!this.badgeController) this.badgeController = this._badgeController.GetComponent<BadgeController>();
        this.badgeController.UpdateBadgeUI();

        // if (this.badgeController) {
        //     const wonderCollection = DataManager.Instance.PlayerDB.wonderCollection;
        //     const allClear = this.badgeController.UpdateBadgeUI(wonderCollection);
        //     this.customPoseController.UpdateAwardPose(allClear);
        // }
    }

    public UpdateGiftUI() {
        const hasHidden = this.giftController.UpdateGiftUI();
        this.customPoseController.UpdateAwardPose(hasHidden);
    }

    private SetDayLightSkyBox() {        
        if (!this.dayLightController) this.dayLightController = this._dayLightController.GetComponent<DayLightController>();
        this.dayLightController.RemoteStart();
        console.log(`[UIManager] DayLightController loaded success`);        
    }

    private CheckAttendance() {        
        if (!this.attendController) this.attendController = this._attendController.GetComponent<AttendController>();
        this.attendController.RemoteStart();
        console.log(`[UIManager] AttendController loaded success`);
        this.attendController.UpdateAttendData(DataManager.Instance.PlayerDB.attend);
    }

    private SetUiToaster() {
        if (!this.toastController) this.toastController = this._toastController.GetComponent<ToastController>();            
        console.log(`[UIManager] ToastController loaded success`);
    }

    private SetController() {
        if (!this.tourBalloonController) this.tourBalloonController = this._tourBalloonController.GetComponent<TourBallonController>();
        console.log(`[UIManager] TourBalloonController loaded success`);
        if (!this.horrorZoneController) this.horrorZoneController = this._horrorZoneController.GetComponent<HorrorZoneController>();        
        console.log(`[UIManager] HorrorZoneController loaded success`);
    }

    private SetVisit() {
        if (!this.visitController) this.visitController = this._visitController.GetComponent<VisitController>();
        console.log(`[UIManager] VisitController loaded success`);
        this.visitController.RemoteStart();
    }

    public OpenEntryTicket(amount: number) {
        if (!this.entryTicketController) this.entryTicketController = this._entryTicketController.GetComponent<EntryTicketController>();

        this.entryTicketController.GetEntryTicket(amount);
    }

    public SystemNoticed(noticeName: string) {
        if (noticeName == "AlreadyPlay") {
            this.alreadyPlayUI.SetActive(true);
        }
    }

    public ControlDefaultUI(isOn: boolean) {
        this.attendUI.SetActive(isOn);
        this.badgeUI.SetActive(isOn);
        this.giftUI.SetActive(isOn);
        this.wonderCoinUI.transform.parent.gameObject.SetActive(isOn);
    }

    public UpdatePlayItemLockPanel(score:number) {
        // const gamePanel = this.zonePlayUI.GetChild(1);
        // const lockPanel = gamePanel.GetChild(1);
        // const lock_add_Time = lockPanel.GetChild(2);
        // const lock_add_Star = lockPanel.GetChild(3);

        // if(PlayItemConditions.Item_Time < score) lock_add_Time.gameObject.SetActive(false);
        // if(PlayItemConditions.Item_Star < score) lock_add_Star.gameObject.SetActive(false);
    }

    public OpenTourPhoto() {
        this.tourBalloonController.PhotoResultOpen();
    }

    /** Game Functions */
    public HorrorGamePanelVisibler(isVisible: boolean) {
        this.horrorZoneController.HorrorGamePanelVisibler(isVisible);
        this.defaultUI.SetActive(!isVisible);
        this.gestureCanvas.SetActive(!isVisible);
        this.screenshotCanvas.SetActive(!isVisible);
    }


    /*UTILS */

    public GetScreenImage(screenCanvas: ScreenCanvasType): GameObject {
        switch(screenCanvas) {
            case ScreenCanvasType.Load:
                return this.loadingUI;                
            case ScreenCanvasType.Fade:
                return this.fadeUI;
            default :
                return null;
        }
    }



    public Toast(text: string) {
        this.toastController.Toast(text); 
    }
    public TextAnimate(text:string) { this.toastController.TextAnimate(text); }
    public TextAnimationOFF() { this.toastController.TextAnimationOFF(); }
    public TextAnimate_OneSec(text:string) { this.toastController.TextAnimate_OneSec(text); }
    public TextAnimationOFF_OneSec() { this.toastController.TextAnimationOFF_OneSec(); }

    public Open_Horror_ResultUI() {
        this.horrorZoneController.OpenHorrorZoneResult();
    }
}
