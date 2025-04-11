import { GameObject } from 'UnityEngine'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import DrawController from './DrawController';

export default class DrawAnimationController extends ZepetoScriptBehaviour {
    @SerializeField() private _drawController: GameObject;
    private drawController: DrawController;

    Start() {
        this.drawController = this._drawController.GetComponent<DrawController>();
    }

    public Opened() {
        this.drawController.OpenResultUI();
    }

}