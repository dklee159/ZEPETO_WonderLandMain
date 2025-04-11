import { Sprite } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Button, Image } from 'UnityEngine.UI';
import MaterialManager from '../Manager/MaterialManager';

export default class DayLightController extends ZepetoScriptBehaviour {

    @SerializeField() private dayLightUI: Button;
    @SerializeField() private dayLightImages: Sprite[] = [];

    //States
    private dayLight: boolean;

    public RemoteStart() {    
        this.StartCoroutine(this.CheckDayLight());
        // this.dayLight = MaterialManager.Instance.GetCurrentSkyBox() === 1;
        // this.dayLightUI.GetComponent<Image>().sprite = this.dayLight ? this.dayLightImages[0] : this.dayLightImages[1]

        this.dayLightUI.onClick.AddListener(() => {
            MaterialManager.Instance.SetSkyBox(!this.dayLight);
            this.dayLight = !this.dayLight
            this.dayLightUI.GetComponent<Image>().sprite = this.dayLight ? this.dayLightImages[0] : this.dayLightImages[1]
        })
    }

    private *CheckDayLight() {
        while (true) {
            yield null;
            if (!MaterialManager.Instance) return;
            this.dayLight = MaterialManager.Instance.GetCurrentSkyBox() === 1;
            this.dayLightUI.GetComponent<Image>().sprite = this.dayLight ? this.dayLightImages[0] : this.dayLightImages[1]
            break;
        }
    }

}