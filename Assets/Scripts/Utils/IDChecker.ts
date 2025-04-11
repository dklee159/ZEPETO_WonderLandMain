import { Button } from 'UnityEngine.UI'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldHelper } from "ZEPETO.World";
export default class IDChecker extends ZepetoScriptBehaviour {

    @SerializeField() button: Button;
    @SerializeField() id: string;

    Start() {    
        if (this.button) {
            this.button.onClick.AddListener(() => {
                this.CheckID();
            });
        }
    }

    private CheckID() {
        ZepetoWorldHelper.GetUserIdInfo(
            [this.id],
            (users) => {
                console.log(`id: ${users[0].zepetoId}`);
            },
            (err) => {}
        );
    }
}