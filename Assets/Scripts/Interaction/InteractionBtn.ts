import { Camera, Canvas, Collider, GameObject, Object, SphereCollider, Sprite, Transform } from 'UnityEngine'
import { UnityEvent } from 'UnityEngine.Events';
import { Button, Image } from 'UnityEngine.UI';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class InteractionBtn extends ZepetoScriptBehaviour {

    /* Button Icon */
    @Header("Icon")
    @SerializeField() private prefabIcon: GameObject;
    @SerializeField() private iconPosition: Transform;
    @SerializeField() private iconImage: Sprite = null;

    /** Unity Events */
    @Header("Unity Event")
    private onTriggerEnterEvent: UnityEvent;
    private onTriggerExitEvent: UnityEvent;
    public onClickEvent: UnityEvent;

    private _button: Button;
    private _canvas: Canvas;
    private _localPlayerCamera: Camera;
    private _isDoneFirstTrig: boolean = false;
    // private _isIconActive: boolean = false;
    
    private Update() {
        if (this._isDoneFirstTrig && this._canvas?.gameObject.activeSelf) this.UpdateIconRotation();
    }

    private OnTriggerEnter(coll: Collider) {        
        if (coll !== ZepetoPlayers.instance.LocalPlayer?.zepetoPlayer?.character.GetComponent<Collider>()) return;

        this.ShowIcon();
        this.onTriggerEnterEvent?.Invoke();
    }

    private OnTriggerExit(coll: Collider) {
        if (coll !== ZepetoPlayers.instance.LocalPlayer?.zepetoPlayer?.character.GetComponent<Collider>()) return;

        this.HideIcon();
        this.onTriggerExitEvent?.Invoke();        
    }

    public ShowIcon() {
        if (!this._isDoneFirstTrig) {
            this.CreateIcon();
            this._isDoneFirstTrig = true;
        } else this._canvas.gameObject.SetActive(true);
    }

    public HideIcon() {
        this._canvas?.gameObject.SetActive(false);        
    }

    private CreateIcon() {
        if (this._canvas === undefined) {
            const canvas = GameObject.Instantiate(this.prefabIcon, this.iconPosition) as GameObject;
            this._canvas = canvas.GetComponent<Canvas>();
            this._button = canvas.GetComponentInChildren<Button>();
            this._canvas.transform.position = this.iconPosition.position;

            if (this.iconImage) canvas.GetComponentInChildren<Image>().sprite = this.iconImage;
        }
        this._localPlayerCamera = ZepetoPlayers.instance.LocalPlayer.zepetoCamera.camera;
        this._canvas.worldCamera = this._localPlayerCamera;

        this._button.onClick.AddListener(() => {
            this.OnClickIcon();
        });
    }

    private OnClickIcon() {
        this.onClickEvent?.Invoke();
    }

    private UpdateIconRotation() {
        this._canvas.transform.LookAt(this._localPlayerCamera.transform);
    }
}