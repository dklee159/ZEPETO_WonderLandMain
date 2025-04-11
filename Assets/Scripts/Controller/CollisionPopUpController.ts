import { Collider, GameObject } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import LocalizationController from '../../ZepetoScripts/Localize/LocalizationController';

export default class CollisionPopUpController extends ZepetoScriptBehaviour {

    @SerializeField() private dialogueUI: GameObject;
    @SerializeField() private pageNum: number;

    private _isFirstTrig: boolean = false
    private localizationController: LocalizationController;

    Start() {
        const dialogueText = this.dialogueUI.transform.GetChild(0).GetChild(4)
        this.localizationController = dialogueText.GetComponent<LocalizationController>();
    }

    private OnTriggerEnter(coll: Collider) {
        if (!coll.CompareTag("LocalPlayer")) return;
        if (this._isFirstTrig) return;
        this._isFirstTrig = true;

        this.dialogueUI.SetActive(true);
        this.localizationController.TranslateText(this.pageNum);
    }
}