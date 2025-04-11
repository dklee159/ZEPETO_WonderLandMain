import { GameObject } from 'UnityEngine'
import { Button } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import TourManager from './TourManager';
import GameManager from '../../GameManager';
import { CameraView, DATA_TYPE } from '../../../ZepetoScripts/SyncHelper/TypeSyncHelper';
import CameraController from '../../Controller/CameraController';
import { TOAST_MESSAGE } from '../../../ZepetoScripts/ScreenShotScripts/UIController';
import UIManager from '../../Manager/UIManager';
import SyncIndexManager from '../../../ZepetoScripts/SyncIndexManager';

export default class TourBallonController extends ZepetoScriptBehaviour {
    /** Tour */
    @SerializeField() private tourEntrance: GameObject;
    @SerializeField() private tourNotice: GameObject;
    @SerializeField() private tourTutorial: GameObject;    

    /** TourButton */
    @SerializeField() private entranceYes: Button;
    @SerializeField() private entranceNo: Button;
    @SerializeField() private entranceClose: Button;

    @SerializeField() private noticeConfirmButton: Button;

    @SerializeField() private tutorialCloseButton: Button;
    @SerializeField() private tutorialConfirmButton: Button;

    @SerializeField() private photoUploadButton: Button;
    @SerializeField() private photoCloseButton: Button;

    /** Camera */
    @SerializeField() private cameraPanel: GameObject;
    @SerializeField() private screenShotPanel: GameObject;

    @SerializeField() private exitButton: Button;
    @SerializeField() private airCamButton: Button;
    @SerializeField() private defaultButton: Button;
    @SerializeField() private changeViewButton: Button;

    @SerializeField() private _cameraController: GameObject;
    private cameraController: CameraController;
    
    Start() {    
        this.cameraController = this._cameraController.GetComponent<CameraController>();

        this.entranceYes.onClick.AddListener(() => {
            if (SyncIndexManager.TourBalloonIsPlay) {
                UIManager.Instance.SystemNoticed(DATA_TYPE.AlreadyPlay);                
            } else {
                GameManager.Instance.ReceiveTourBalloonSignal(true);
                this.tourNotice.SetActive(true);
            }
            this.tourEntrance.SetActive(false);
        })

        this.entranceNo.onClick.AddListener(() => {
            this.tourEntrance.SetActive(false);
        })

        this.entranceClose.onClick.AddListener(() => {
            this.tourEntrance.SetActive(false);
        })

        this.noticeConfirmButton.onClick.AddListener(() => {
            this.tourNotice.SetActive(false);
        })

        this.tutorialCloseButton.onClick.AddListener(() => {
            this.tourTutorial.SetActive(false);     
        })

        this.tutorialConfirmButton.onClick.AddListener(() => {
            this.tourTutorial.SetActive(false);
        })

        this.airCamButton.onClick.AddListener(() => {
            this.cameraController.ChangeBalloonCam(CameraView.Air);
        })

        this.defaultButton.onClick.AddListener(() => {
            this.cameraController.ChangeBalloonCam(CameraView.Default);
        })

        this.changeViewButton.onClick.AddListener(() => {
            this.cameraController.ChangeBalloonCam(CameraView.FPS);
        })

        this.photoUploadButton.onClick.AddListener(() => {
            TourManager.Instance.UploadTourPhoto();
            UIManager.Instance.Toast(TOAST_MESSAGE.feedUploading);
        })

        this.photoCloseButton.onClick.AddListener(() => {
            this.screenShotPanel.SetActive(false);
        })

        this.exitButton.onClick.AddListener(() => {
            GameManager.Instance.ReceiveTourBalloonSignal(false);
        })
    }

    public OpenUI() {
        if (!this.tourEntrance.activeSelf) this.tourEntrance.SetActive(true);
    }

    public SetTourDefaultUI(isOn: boolean) {
        if (isOn) {
            this.tourNotice.SetActive(true);
        }
        this.cameraPanel.SetActive(isOn);
        UIManager.Instance.ControlDefaultUI(!isOn);
    }

    public PhotoResultOpen() {
        this.screenShotPanel.SetActive(true);
    }
}