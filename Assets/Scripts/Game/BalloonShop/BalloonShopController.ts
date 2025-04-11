import { TextMeshProUGUI } from 'TMPro';
import { GameObject, HumanBodyBones, Mathf, Random } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import { RoomData } from 'ZEPETO.Multiplay';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Anim, EVENT_MESSAGE, WonderState, EquipList } from '../../../ZepetoScripts/SyncHelper/TypeSyncHelper';
import LocalizationController from '../../../ZepetoScripts/Localize/LocalizationController';
import EquipManager from '../../Manager/EquipManager';
import GameManager from '../../GameManager';

export default class BalloonShopController extends ZepetoScriptBehaviour {

    @SerializeField() private balloonShopUI: GameObject;
    @SerializeField() private closeButton: Button;
    @SerializeField() private nextButton: Button;
    @SerializeField() private contentText: TextMeshProUGUI;

    private _localizationController: LocalizationController;
    private textIndex: number = 0;

    @SerializeField() private detachButton: Button;
    
    private _equipBalloon: string;
    private equipBalloon : number = -1;

    private Start() {
        this.closeButton.onClick.AddListener(() => {
            this.balloonShopUI.SetActive(false);
            this.textIndex = 0;
            this.SetText();
            this.SetNextButton(this.textIndex);
        })

        this.nextButton.onClick.AddListener(() => {
            this.textIndex = Mathf.Clamp(this.textIndex + 1, 0, 1);
            this.SetText();
            this.SetNextButton(this.textIndex);
        })
        
        this.detachButton.onClick.AddListener(() => {
            this.UnequipBalloon();
        })

        EquipManager.Instance.onUnequipRightHand.AddListener(() => {
            this.detachButton.gameObject.SetActive(false);
        });
        
        EquipManager.Instance.onEquipBalloon.AddListener(() => {
            this.detachButton.gameObject.SetActive(true);
        });

        this._localizationController = this.contentText.gameObject.GetComponent<LocalizationController>();
    }

    private SetText() {
        let nextText = this._localizationController.textList[this.textIndex];
        this.contentText.text = nextText;
    }

    private SetNextButton(page: number) {
        if (page === 1) this.nextButton.gameObject.SetActive(false);
        else this.nextButton.gameObject.SetActive(true);
    }
    
    public OpenUI() {
        this.balloonShopUI.SetActive(true);
        // this.detachButton.gameObject.SetActive(true);
        this.GiveBalloon()
    }

    private GiveBalloon() {
        this.equipBalloon = EquipManager.Instance.EquipRandomBalloon();
        // const randomNumber: number = Mathf.Floor(Random.Range(0, EquipManager.Instance.balloons.length));
        // this._equipBalloon = EquipManager.Instance.balloons[randomNumber].name

        // const data = new RoomData();
        // data.Add(EVENT_MESSAGE.Name, this._equipBalloon);
        // data.Add(EVENT_MESSAGE.Attach, HumanBodyBones.RightHand);
        // data.Add(Anim.WonderState, WonderState.Hold_RightHand_Side);
        // GameManager.Instance.ReceiveEquipSignal(data, true);
    }

    private TakeOffBalloon() {
        if(this.equipBalloon !== -1) {
            EquipManager.Instance.UnequipItem(this.equipBalloon);
            this.equipBalloon = -1;
        }
        // const data = new RoomData();
        // data.Add(EVENT_MESSAGE.Name, this._equipBalloon);
        // data.Add(EVENT_MESSAGE.Attach, HumanBodyBones.RightHand);      
        // data.Add(Anim.WonderState, WonderState.NONE);
        // GameManager.Instance.ReceiveEquipSignal(data, false);

        // this._equipBalloon = "";
    }

    public UnequipBalloon() {
        this.detachButton.gameObject.SetActive(false);
        this.TakeOffBalloon();
    }
}