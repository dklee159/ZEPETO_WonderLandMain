import { TextMeshProUGUI } from 'TMPro';
import { Animation, GameObject, Transform, WaitForSeconds } from 'UnityEngine';
import { Text } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { TOAST_MESSAGE } from './UIController';

export default class ToastController extends ZepetoScriptBehaviour {
    
    /* Properties */
    @SerializeField() private toastErrorMessage: GameObject;
    @SerializeField() private toastSuccessMessage: GameObject;
    // @SerializeField() private mainCanvas: Transform;
    @SerializeField() private toastCanvas: Transform;
    @SerializeField() private textAnimation_Text: TextMeshProUGUI;
    @SerializeField() private textAnimation: Animation;
    @SerializeField() private textAnimation_OneSec_Text: TextMeshProUGUI;
    @SerializeField() private textAnimation_OneSec: Animation;
    private waitForSecond: WaitForSeconds;

    /* GameManager */
    public RemoteStart() {
        this.TextAnimationOFF();
    }

    /* GameManager */
    public Toast(text:string) {
        this.StartCoroutine(this.ShowToastMessage(text));
    }
    
    private * ShowToastMessage(text:string) {
        if(!this.waitForSecond) this.waitForSecond = new WaitForSeconds(1);
        yield this.waitForSecond;

        // Choice Target
        const isFailed = (text == TOAST_MESSAGE.feedFailed);
        const targetMessgae = isFailed ? this.toastErrorMessage : this.toastSuccessMessage;

        // Instantiate GameObject
        const toastMessage: GameObject = GameObject.Instantiate<GameObject>(targetMessgae);
        toastMessage.transform.SetParent(this.toastCanvas);

        // Set Target Text
        toastMessage.GetComponentInChildren<Text>().text = text;

        // Finish
        GameObject.Destroy(toastMessage, 1);
    }

    public TextAnimate(text:string) {
        this.textAnimation.gameObject.SetActive(true);
        this.textAnimation_Text.text = text;
        this.textAnimation.Play();
    }

    public TextAnimationOFF() {
        this.textAnimation.gameObject.SetActive(false);
    }

    public TextAnimate_OneSec(text: string) {
        console.log(text);        

        this.textAnimation_OneSec.Stop();
        this.textAnimation_OneSec.gameObject.SetActive(true);
        this.textAnimation_OneSec_Text.text = text;
        this.textAnimation_OneSec.Play();
    }

    public TextAnimationOFF_OneSec() {
        this.textAnimation_OneSec.gameObject.SetActive(false);
    }
}