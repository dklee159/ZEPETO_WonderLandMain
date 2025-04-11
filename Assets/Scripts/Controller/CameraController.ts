import { Camera, GameObject, Transform, Vector3 } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { CameraView } from '../../ZepetoScripts/SyncHelper/TypeSyncHelper';
import TourManager from '../Game/Tour/TourManager';
import ScreenShotModeManager from '../../ZepetoScripts/ScreenShotScripts/ScreenShotModeManager';
import UIController from '../../ZepetoScripts/ScreenShotScripts/UIController';

export default class CameraController extends ZepetoScriptBehaviour {

    private _localCamera: Camera;
    private camOffset_OutDoor: CameraOffset;
    private camOffset_InDoor: CameraOffset;
    private camOffset_FPS: CameraOffset;

    @SerializeField() private _screenShotManager: GameObject;
    private screenshotManager: UIController;

    public RemoteStart() {
        const myCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        const characterPos = myCharacter.transform.position;
        ZepetoPlayers.instance.ZepetoCamera.transform.RotateAround(characterPos, Vector3.up, 180);
    }

    private Start() {
        this._localCamera = ZepetoPlayers.instance.ZepetoCamera.camera;      
        this.screenshotManager = this._screenShotManager.GetComponent<UIController>();
    }

    public SetHorrorCamera(isSet: boolean) {
        this.ChangeHorrorCam(isSet);
    }

    public ChangeBalloonCam(view: CameraView) {        
        switch (view) {
            case (CameraView.Air):
                this.ControlMainCamera(false);
                this.ChangeCamFPS(false);
                TourManager.Instance.AirCamera.SetActive(true);
                break;
            case (CameraView.FPS):
                this.ControlMainCamera(true);
                this.ChangeCamFPS(true);
                TourManager.Instance.AirCamera.SetActive(false);
                break;
            case (CameraView.Default):
                this.ControlMainCamera(true);
                this.ChangeCamFPS(false);
                TourManager.Instance.AirCamera.SetActive(false);
                break;
        }
    }

    public SetHallCam() {
        const myCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        const characterPos = myCharacter.transform.position;
        this.screenshotManager.SignalFromHall(true);
    }

    private ControlMainCamera(active: boolean) {
        if (!this._localCamera) this._localCamera = ZepetoPlayers.instance.ZepetoCamera.camera;
        this._localCamera.targetDisplay = active ? 0 : 1;
        this._localCamera.enabled = active;
    }

    private ChangeHorrorCam(isFPS: boolean) {
        /* Get Camera Data */
        this.InitHorrorOffset();

        /* Default */
        const cam = ZepetoPlayers.instance.cameraData;
        const offset = isFPS ? this.camOffset_FPS : this.camOffset_OutDoor;
        cam.offset = offset.offset;
        cam.maxZoomDistance = offset.maxZoomDistance;
        cam.minZoomDistance = offset.minZoomDistance;
    }

    private InitHorrorOffset() {
        if(this.camOffset_InDoor && this.camOffset_OutDoor && this.camOffset_FPS) return;

        /* Set Init Data */
        this.camOffset_InDoor = {
            offset: Vector3.up * 0.1,
            maxZoomDistance: 3,
            minZoomDistance: -1,
        }
        this.camOffset_OutDoor = {
            offset: Vector3.up * 0.5,
            maxZoomDistance: 8,
            minZoomDistance: 3,
        }
        this.camOffset_FPS = {
            offset: Vector3.up * 0.1,
            maxZoomDistance: 1,
            minZoomDistance: 1,
        }
    }

    private ChangeCamFPS(isFPS: boolean) {
        /* Get Camera Data */
        this.InitOffset();

        /* Default */
        const cam = ZepetoPlayers.instance.cameraData;
        const offset = isFPS ? this.camOffset_FPS : this.camOffset_OutDoor;
        cam.offset = offset.offset;
        cam.maxZoomDistance = offset.maxZoomDistance;
        cam.minZoomDistance = offset.minZoomDistance;
    }

    private InitOffset() {
        if(this.camOffset_InDoor && this.camOffset_OutDoor && this.camOffset_FPS) return;

        /* Set Init Data */
        this.camOffset_InDoor = {
            offset: Vector3.up * 0.1,
            maxZoomDistance: 3,
            minZoomDistance: -1,
        }
        this.camOffset_OutDoor = {
            offset: Vector3.up * 0.5,
            maxZoomDistance: 8,
            minZoomDistance: 3,
        }
        this.camOffset_FPS = {
            offset: Vector3.up * 0.1,
            maxZoomDistance: -1,
            minZoomDistance: -1,
        }
    }
}

interface CameraOffset {
    offset: Vector3,
    maxZoomDistance: number,
    minZoomDistance: number,
}