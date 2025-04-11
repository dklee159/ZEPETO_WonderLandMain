import { AnimationClip, Animator, Camera, GameObject, Quaternion, RenderTexture, Transform, WaitForEndOfFrame, WaitForSeconds } from 'UnityEngine'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoWorldContent } from 'ZEPETO.World';
import TourBallonController from './TourBallonController';
import { Anim, DATA_TYPE } from '../../../ZepetoScripts/SyncHelper/TypeSyncHelper';
import UIManager from '../../Manager/UIManager';
import MultiplayManager from '../../../ZepetoScripts/Multiplay/MultiplayManager';
import QuestManager from '../../Manager/QuestManager';
import GameManager from '../../GameManager';
import { TOAST_MESSAGE } from '../../../ZepetoScripts/ScreenShotScripts/UIController';
import TransformSyncHelper from '../../../ZepetoScripts/SyncHelper/TransformSyncHelper';

export default class TourManager extends ZepetoScriptBehaviour {

    /* Singleton */
    private static _instance: TourManager;
    public static get Instance(): TourManager {
        if (!TourManager._instance) {
            const managerObj = GameObject.Find("TourManager");
            if (managerObj) TourManager._instance = managerObj.GetComponent<TourManager>();
        }
        return TourManager._instance;
    }

    @SerializeField() private tourBalloonController: GameObject;
    private _tourBalloonController: TourBallonController;

    @SerializeField() private ballonPrefab: GameObject;
    @SerializeField() private playerTeleportPos: Transform;
    @SerializeField() private playerReturnPos: Transform;

    /** Camera */    
    @SerializeField() private photoCamera: GameObject;
    @SerializeField() private airCamera: GameObject;
    public get AirCamera() {
        return this.airCamera;
    }
    // @SerializeField() private cameraTrigger: GameObject;
    @SerializeField() private balloonRenderTexture: RenderTexture;

    @SerializeField() private balloonTourAnim: AnimationClip;
    private balloonAnim: Animator;
    
    private touringPlayer: string;

    Start() {    
        this.balloonAnim = this.ballonPrefab.GetComponent<Animator>();
        this._tourBalloonController = this.tourBalloonController.GetComponent<TourBallonController>();
    }

    public TourStart(sessionId: string) {        
        this.balloonAnim.SetTrigger(Anim.Play);

        const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;         
        character.transform.SetParent(this.playerTeleportPos);        
        if (MultiplayManager.instance.room.SessionId === sessionId) {
            character.Teleport(this.playerTeleportPos.position, Quaternion.Euler(0, 180, 0));
            
            this._tourBalloonController.SetTourDefaultUI(true);
            this.StartCoroutine(this.WaitForTourFinish());
        }        
    }

    public TourExit(sessionId: string) {        
        const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;                        
        character.transform.SetParent(null);
        if (MultiplayManager.instance.room.SessionId === sessionId) {            
            character.Teleport(this.playerReturnPos.position, this.playerReturnPos.rotation);
            
            QuestManager.Instance.OnPlayGame();
            this._tourBalloonController.SetTourDefaultUI(false);
        }
    }

    private *WaitForTourFinish() {
        console.log(this.balloonTourAnim.length * 1.9);
        
        yield new WaitForSeconds(this.balloonTourAnim.length);
        yield new WaitForEndOfFrame();
        console.log("FIn");
        
        GameManager.Instance.ReceiveTourBalloonSignal(false);
    }

    public TakeBalloonPhoto() {
        this.StartCoroutine(this.CountNumbering());
    }

    private *CountNumbering() {
        const wait = new WaitForSeconds(1);
        UIManager.Instance.TextAnimate_OneSec("3");
        yield wait;
        UIManager.Instance.TextAnimate_OneSec("2");
        yield wait;
        UIManager.Instance.TextAnimate_OneSec("1");
        yield wait;
        UIManager.Instance.TextAnimationOFF_OneSec();

        this.photoCamera.SetActive(true);
        this.photoCamera.GetComponent<Camera>().targetTexture = this.balloonRenderTexture;        
        yield new WaitForEndOfFrame();

        this.photoCamera.GetComponent<Camera>().Render();
        this.photoCamera.GetComponent<Camera>().targetTexture = null;        
        this.photoCamera.SetActive(false);
        yield new WaitForEndOfFrame();

        UIManager.Instance.OpenTourPhoto();
        this.StopCoroutine(this.CountNumbering());
    }

    public UploadTourPhoto() {
        ZepetoWorldContent.CreateFeed(this.balloonRenderTexture, DATA_TYPE.FeedMessage, (result: boolean) => {
            QuestManager.Instance.OnPostFeed();
            console.log(`[BalloonZoneManager] Feed Uploading ${result? DATA_TYPE.Success : DATA_TYPE.Failed}`);
            UIManager.Instance.Toast(TOAST_MESSAGE.feedCompleted);
        })
    }

}