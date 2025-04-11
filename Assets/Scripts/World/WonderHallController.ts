import { GameObject } from 'UnityEngine'
import { Button } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class WonderHallController extends ZepetoScriptBehaviour {

    @SerializeField() private hallUI: GameObject;
    @SerializeField() private hallCloseButton: Button;
    @SerializeField() private hallConfirmButton: Button;

    Start() {    
        this.hallCloseButton.onClick.AddListener(() => {
            this.CloseUI();
        })

        this.hallConfirmButton.onClick.AddListener(() => {
            this.CloseUI();
        })
    }

    public OpenUI() {
        if (!this.hallUI.activeSelf) this.hallUI.SetActive(true);
    }

    private CloseUI() {
        this.hallUI.SetActive(false);
    }

}