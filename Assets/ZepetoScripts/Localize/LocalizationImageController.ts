import { Image } from 'UnityEngine.UI';
import { Sprite } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import TranslateManager from './TranslateManager';

export default class LocalizationImageController extends ZepetoScriptBehaviour {
    @SerializeField() sprites : Sprite[] = [];
    private isStarted : boolean = false;

    Start() {    
        this.onStart();
    }

    onStart() {
        if(this.isStarted) return;
        this.isStarted = true;

        this.GetComponent<Image>().sprite = this.sprites[TranslateManager.nowSystemLanguage - 1];
    }
}