import { TextMeshProUGUI } from 'TMPro';
import { GameObject, Sprite } from 'UnityEngine'
import { Button, Image } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import LocalizationController from '../../ZepetoScripts/Localize/LocalizationController';

export default class MiniMapController extends ZepetoScriptBehaviour {

    @SerializeField() private miniMapUI: GameObject;
    @SerializeField() private miniMapCloseBtn: Button;
    @SerializeField() private mapBtns: Button[] = [];
    @SerializeField() private descriptionUI: GameObject;
    @SerializeField() private descriptionTitle: TextMeshProUGUI
    @SerializeField() private description: TextMeshProUGUI;
    @SerializeField() private descriptionImages: Sprite[];    
    @SerializeField() private descriptionClose: Button; 
    @SerializeField() private descriptionOk: Button;
    @SerializeField() private placeImage: Image;
    
    Start() {    
        for (let i = 0; i < this.mapBtns.length; i++) {
            this.mapBtns[i].onClick.AddListener(() => {
                let index = i
                this.OpenDescription(this.mapBtns[index], index);
            });
        }

        this.miniMapCloseBtn.onClick.AddListener(() => {            
            if (this.descriptionUI.activeSelf) this.CloseDescription();
            this.miniMapUI.SetActive(false);
        })

        this.descriptionClose.onClick.AddListener(() => {
            this.CloseDescription();
        })

        this.descriptionOk.onClick.AddListener(() => {
            this.CloseDescription();
        })
    }

    public OpenUI() {
        this.miniMapUI.SetActive(true);
    }

    private OpenDescription(button: Button ,index: number) {                
        this.descriptionUI.SetActive(true);
        this.descriptionTitle.text = button.transform.GetChild(1).GetComponent<TextMeshProUGUI>().text;
        this.placeImage.sprite = this.descriptionImages[index];
        this.description.text = this.description.GetComponent<LocalizationController>().textList[index];        
    }

    private CloseDescription() {
        this.descriptionUI.SetActive(false);
        this.description.text = ""
        this.placeImage.sprite = null
        this.descriptionTitle.text = ""
    }

}