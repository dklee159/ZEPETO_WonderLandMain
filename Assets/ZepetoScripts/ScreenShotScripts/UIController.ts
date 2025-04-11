import { Canvas, GameObject, Screen, Rect, RectTransform, WaitForSeconds, YieldInstruction, Sprite, Camera, RenderTexture, Coroutine } from 'UnityEngine';
import { Button, Image, Text } from 'UnityEngine.UI'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import ScreenShotController from './ScreenShotController';
import ScreenShotModeManager from './ScreenShotModeManager';
import { VideoResolutions, WorldVideoRecorder } from 'ZEPETO.World';
import { TimeSpan } from './TimeSpan';
import { TextMeshProUGUI } from 'TMPro';

export enum LAYER  {
    everything = -1,
    nothing = 0,
    UI= 5,
};

// Data
export enum TOAST_MESSAGE {
    feedUploading= "Uploading...",
    feedCompleted= "Done",
    feedFailed= "Failed",
    screenShotSaveCompleted= "Saved!"
};
export default class UIController extends ZepetoScriptBehaviour {
    
    public safeAreaObject: GameObject;
    /* Panels */
    @Header("Panels")
    public zepetoScreenShotCanvas: Canvas;
    public screenShotPanel: Image;
    public screenShotResultPanel: Image;
    public recordResultPanel: Image;
    public recordTimePanel: Image;

    /* Screenshot Mode */
    @Header("Screenshot Mode")
    public screenShotModeButton: Button;
    public viewChangeButton: Button;
    public startRecordingButton: Button;
    public stopRecordingButton: Button;
    public backgroundOnOffButton: Button;
    public shootScreenShotButton: Button;
    public screenShotModeExitButton: Button;
    private viewChangeImage: Image
    private backgroundOnOffImage: Image
    public selfiViewSprite: Sprite;
    public thirdPersonViewSprite: Sprite;
    public backgroundOnSprite: Sprite;
    public backgroundOffSprite: Sprite;

    /* Screenshot Result */
    @Header("Screenshot Result")
    public saveButton: Button;
    public shareButton: Button;
    public createFeedButton: Button;
    public screenShotResultExitButton: Button;
    public screenShotResultBackground: Image;
    
    /** Record Video Result */
    @Header("Record Result")
    public saveVideoButton: Button;
    public shareVideoButton: Button;
    public createVideoFeedButton: Button;
    public videoResultExitButton: Button;

    /* ToastMessage */
    @Header("Toast Message")
    public toastSuccessMessage: GameObject;
    public toastErrorMessage: GameObject;
    private waitForSecond: YieldInstruction;

    /* Camera mode */
    private isThirdPersonView: boolean = false;

    /* Background onoff */
    @Header("Background onoff")
    public backgroundCanvas: Canvas;
    private isBackgroundOn: boolean = true;
    
    /* Custom Class */
    private screenShot: ScreenShotController;
    private screenShotModeManager: ScreenShotModeManager;
    @Header("ScreenShot Mode Module")
    public screenShotModeModule: GameObject;

    /*Player Layer Setting*/
    private playerLayer: number = 0;

    @Header("Video Mode Module")
    // Recorder Camera 
    public recorderCamera: Camera;

    // Target Texture 
    public targetTexture: RenderTexture;

    // VideoPlayer Object 
    private videoPlayerObject: GameObject;
    private _recordRingCoroutine: Coroutine = null;
    private tsPlayTime: TimeSpan = null;   
    @SerializeField() private totalRecordTime: int = 60; 

    Awake() {
        this.isBackgroundOn = true;
        this.zepetoScreenShotCanvas.sortingOrder = 1;
        this.waitForSecond = new WaitForSeconds(1);

        this.screenShotPanel.gameObject.SetActive(false);
        this.backgroundCanvas.gameObject.SetActive(false);
        this.screenShotResultPanel.gameObject.SetActive(false);
        this.screenShotResultBackground.gameObject.SetActive(false);
        this.recordResultPanel.gameObject.SetActive(false);
        
        this.screenShot = this.screenShotModeModule.GetComponent<ScreenShotController>();
        this.screenShotModeManager = this.screenShotModeModule.GetComponent<ScreenShotModeManager>();
        this.playerLayer = this.screenShotModeManager.GetPlayerLayer();

        this.viewChangeImage = this.viewChangeButton.GetComponent<Image>();
        this.backgroundOnOffImage = this.backgroundOnOffButton.GetComponent<Image>();
        
        this.videoPlayerObject = new GameObject();
        this.videoPlayerObject.gameObject.name = "VideoPlayerObject";
    }

    Start() {

        // SafeArea Settings
        let safeArea: Rect = Screen.safeArea;
        let newAnchorMin = safeArea.position;
        let newAnchorMax = safeArea.position + safeArea.size;
        newAnchorMin.x /= Screen.width;
        newAnchorMax.x /= Screen.width;
        newAnchorMin.y /= Screen.height;
        newAnchorMax.y /= Screen.height;

        let rect = this.safeAreaObject.GetComponent<RectTransform>();
        rect.anchorMin = newAnchorMin;
        rect.anchorMax = newAnchorMax;

        /** Screenshot mode 
         *  1. Btn: Select Screenshot Mode - Set to Screenshot Mode and enable ZEPETO Camera by default.
         *  2. Btn: Switch view - Switch first-person/third-person camera according to current settings.
         *  3. Btn: Background ON/OFF - Button to turn the background on/off .
         *  4. Btn: Exit Screenshot Mode - Exits Screenshot Mode.
         *  5. Btn: Take a screenshot - Take a screenshot and display the screenshot results.
         */
        
        // 1. Btn: Select Screenshot Mode
        this.screenShotModeButton.onClick.AddListener(() => {
            const isScreenShotState = this.screenShotPanel.gameObject.activeSelf;
            this.screenShotPanel.gameObject.SetActive(!isScreenShotState);
            //Initialize the camera view to the default ZEPETO camera
            if(!isScreenShotState) {
                this.isThirdPersonView = true;
                this.backgroundCanvas.worldCamera = this.screenShotModeManager.GetZepetoCamera();
                this.screenShotModeManager.StartScreenShotMode();
            }
            else{
                if (!this.isBackgroundOn) {
                    this.SetBackgroundActive(true);
                    this.isBackgroundOn = true;
                }
                this.screenShotModeManager.ExitScreenShotMode(this.isThirdPersonView);
            }
        });


        // 2. Btn: Switch Views
        this.viewChangeButton.onClick.AddListener(() => {
            if (this.isThirdPersonView) {
                this.viewChangeImage.sprite = this.selfiViewSprite;
                this.backgroundCanvas.worldCamera = this.screenShotModeManager.GetSelfieCamera();
                this.screenShotModeManager.SetSelfieCameraMode();
                this.isThirdPersonView = false;
            } else {
                this.viewChangeImage.sprite = this.thirdPersonViewSprite;
                this.backgroundCanvas.worldCamera = this.screenShotModeManager.GetZepetoCamera();
                this.screenShotModeManager.SetZepetoCameraMode();
                this.isThirdPersonView = true;
            }
        });


        // 3. Btn: Background ON/OFF
        this.backgroundOnOffButton.onClick.AddListener(() => {
            if (this.isBackgroundOn) {
                this.backgroundOnOffImage.sprite = this.backgroundOffSprite;
                this.SetBackgroundActive(!this.isBackgroundOn);
                this.isBackgroundOn = false;
            } else {
                this.backgroundOnOffImage.sprite = this.backgroundOnSprite;
                this.SetBackgroundActive(!this.isBackgroundOn);
                this.isBackgroundOn = true;
            }
        });

        // 4. Btn: Exit Screenshot Mode
        this.screenShotModeExitButton.onClick.AddListener(() => {
            if (!this.isBackgroundOn) {
                this.SetBackgroundActive(true);
                this.isBackgroundOn = true;
            }
            this.screenShotPanel.gameObject.SetActive(false);
            this.screenShotModeManager.ExitScreenShotMode(this.isThirdPersonView);
        });

        // 5. Btn: Take a screenshot
        this.shootScreenShotButton.onClick.AddListener(() => {
            // Take a screenshot
            this.screenShot.TakeScreenShot(this.isBackgroundOn);
            // Activating the Screenshot Results Screen
            this.screenShotResultBackground.gameObject.SetActive(true);
            this.screenShotResultPanel.gameObject.SetActive(true);
            // Activating the Screenshot Feed Button
            this.createFeedButton.gameObject.SetActive(true);
        });

        /** Screenshot Result 
         *  1. Btn: Save Screenshot - Save the screenshot to the gallery.
         *  2. Btn: Screenshot sharing - The ability to share screenshots.
         *  3. Btn: Upload Feed - The ability to upload to a feed.
         *  4. Btn: Exit Screenshot Results Screen - Close the Screenshot Results screen.
        */

        // 1. Btn: Save Screenshot
        this.saveButton.onClick.AddListener(() => {
            this.screenShot.SaveScreenShot();
            this.StartCoroutine(this.ShowToastMessage(TOAST_MESSAGE.screenShotSaveCompleted));
        });

        // 2. Btn: Share Screenshots
        this.shareButton.onClick.AddListener(() => {
            this.screenShot.ShareScreenShot();
        });

        // 3. Btn: Upload Feed
        this.createFeedButton.onClick.AddListener(() => {
            this.screenShot.CreateFeedScreenShot();
            this.StartCoroutine(this.ShowToastMessage(TOAST_MESSAGE.feedUploading));
        });

        // 4. Btn: Close the Screenshot Results Screen
        this.screenShotResultExitButton.onClick.AddListener(() => {
            this.screenShotResultBackground.gameObject.SetActive(false);
            this.screenShotResultPanel.gameObject.SetActive(false);
        });

        // 5. Btn: StartRecordButton
        this.startRecordingButton.onClick.AddListener(() => {
            if (false == WorldVideoRecorder.StartRecording(this.recorderCamera, VideoResolutions.W1280xH720, 15)) {
                return;
            }
            this.startRecordingButton.gameObject.SetActive(false);
            this.stopRecordingButton.gameObject.SetActive(true);
            this.recordTimePanel.gameObject.SetActive(true);

            // Rotate Ring
            if (this._recordRingCoroutine !== null) {
                this.StopCoroutine(this._recordRingCoroutine);
                this._recordRingCoroutine = null;
            }
            this._recordRingCoroutine = this.StartCoroutine(this.RotateRecordRing());

            this.recorderCamera.gameObject.SetActive(true);
            this.StartCoroutine(this.CheckRecording());
        });

        // 6. Btn: StopRecord Button
        this.stopRecordingButton.onClick.AddListener(() => {
            this.StopRecording();
        });

        // 7. Btn: SaveRecord Button
        this.saveVideoButton.onClick.AddListener(() => {
            if (false == WorldVideoRecorder.IsRecording()) {
                WorldVideoRecorder.SaveToCameraRoll(result => { console.log(`${result}`) });
            }
        });

        // 8. Btn: ShareVideo Button
        this.shareVideoButton.onClick.AddListener(() => {
            if (false == WorldVideoRecorder.IsRecording()) {
                WorldVideoRecorder.Share(result => { console.log(`${result}`) });
            }
        });

        // 9. Btn: CreateVideo Button
        this.createFeedButton.onClick.AddListener(() => {
            if (false == WorldVideoRecorder.IsRecording()) {
                WorldVideoRecorder.CreateFeed("[contents]", result => { 
                    console.log(`${result}`) 
                    this.ShowCreateFeedResult(result);
                });
            }
        });

        // 9. Btn: Close Video Result Panel Button
        this.videoResultExitButton.onClick.AddListener(() => {            
            this.recordResultPanel.gameObject.SetActive(false);
        })
    }

    /* Custom Function */
    public SignalFromHall(isActive: boolean) {
        if (isActive) {
            const isScreenShotState = this.screenShotPanel.gameObject.activeSelf;
            this.screenShotPanel.gameObject.SetActive(true);

            //Initialize the camera view to the default ZEPETO camera
            if(!isScreenShotState) {
                this.isThirdPersonView = true;
                this.backgroundCanvas.worldCamera = this.screenShotModeManager.GetZepetoCamera();
                this.screenShotModeManager.CustomViewForHall();
            }

            if (this.isThirdPersonView) {
                this.viewChangeImage.sprite = this.selfiViewSprite;
                this.backgroundCanvas.worldCamera = this.screenShotModeManager.GetSelfieCamera();
                this.screenShotModeManager.SetSelfieCameraMode();
                this.isThirdPersonView = false;
            } 
        } else {

        }
    }


    // Displays the screenshot results screen.
    public ShowCreateFeedResult(result: Boolean) {
        if (result) {
            this.createFeedButton.gameObject.SetActive(false);
            this.StartCoroutine(this.ShowToastMessage(TOAST_MESSAGE.feedCompleted));
        }
        else {
            this.StartCoroutine(this.ShowToastMessage(TOAST_MESSAGE.feedFailed));
        }
    }

    // The screenshot results screen shows a toast message when saving and uploading feeds.
    *ShowToastMessage(text: string) {
        yield this.waitForSecond;
        let toastMessage: GameObject = null;
        if (text == TOAST_MESSAGE.feedFailed)
            toastMessage = GameObject.Instantiate<GameObject>(this.toastErrorMessage);
        else
            toastMessage = GameObject.Instantiate<GameObject>(this.toastSuccessMessage);
        toastMessage.transform.SetParent(this.screenShotResultPanel.transform);

        toastMessage.GetComponentInChildren<Text>().text = text;
        GameObject.Destroy(toastMessage, 1);
    }
    //Enables/disables MeshRender for background gameobjects.
    SetBackgroundActive(active: boolean) {
        // Background canvas (checkered pattern) disabled/enabled
        if (active) {
            this.backgroundCanvas.gameObject.SetActive(!active);
            //Layer Settings to Everything
            this.screenShotModeManager.GetSelfieCamera().cullingMask = LAYER.everything;
            this.screenShotModeManager.GetZepetoCamera().cullingMask = LAYER.everything;
        } else {
            this.backgroundCanvas.gameObject.SetActive(!active);
            //Change the Layer setting to only include nothing, player, and UI Layers
            this.screenShotModeManager.GetSelfieCamera().cullingMask = LAYER.nothing | 1 << this.playerLayer | 1 << LAYER.UI;
            this.screenShotModeManager.GetZepetoCamera().cullingMask = LAYER.nothing | 1 << this.playerLayer | 1 << LAYER.UI;
        }
    }

    private StopRecording() {
        if (false == WorldVideoRecorder.IsRecording()) {
            return;
        }

        if (this._recordRingCoroutine !== null) {
            this.StopCoroutine(this._recordRingCoroutine);
            this._recordRingCoroutine = null;
        }

        this.stopRecordingButton.gameObject.SetActive(false);
        this.recorderCamera.gameObject.SetActive(false);
        this.startRecordingButton.gameObject.SetActive(true);
        WorldVideoRecorder.StopRecording();
        this.recordTimePanel.GetComponentInChildren<TextMeshProUGUI>().text = "00:00";
        this.recordTimePanel.gameObject.SetActive(false);
        this.screenShotPanel.gameObject.SetActive(false);
        this.recordResultPanel.gameObject.SetActive(true);
    }

    *CheckRecording() {
        while (WorldVideoRecorder.IsRecording()) {
            yield null;
        }

        let videoPlayer = WorldVideoRecorder.AddVideoPlayerComponent(this.videoPlayerObject, this.targetTexture);

        if (videoPlayer === null) {
            return;
        }
        
        videoPlayer.Play();
    }

    private *RotateRecordRing() {
        let timeGap = 0.01;        
        this.tsPlayTime = TimeSpan.fromMilliseconds(0);        
        
        const totalTimeMS = 1000 * this.totalRecordTime;
        const tsTimeGap = TimeSpan.fromMilliseconds(timeGap * 1000);
        const wait = new WaitForSeconds(timeGap);

        let sec = '';
        let msec = '';

        this.stopRecordingButton.transform.GetChild(0).GetComponent<Image>().fillAmount = 0;

        while (true) {
            sec = this.tsPlayTime.seconds.toString().padStart(2, "0");
            msec = (this.tsPlayTime.milliseconds * 0.1).toString().padStart(2, "0");          
            this.recordTimePanel.GetComponentInChildren<TextMeshProUGUI>().text = `${sec}:${msec}`;
            yield wait;

            this.tsPlayTime = this.tsPlayTime.add(tsTimeGap);
            if (this.tsPlayTime.totalSeconds >= 60 ) {
                break;
            }

            const playRatio =  this.tsPlayTime.totalMilliseconds / totalTimeMS;
            this.stopRecordingButton.transform.GetChild(0).GetComponent<Image>().fillAmount = playRatio;
        }

        console.log("Record Time Out!!");
        this.StopRecording();        
    }
}

