import { GameObject } from 'UnityEngine';
import { Button, Toggle } from 'UnityEngine.UI'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import DataManager from '../Manager/DataManager';
import { WonderCollectionList, EquipList } from '../../ZepetoScripts/SyncHelper/TypeSyncHelper';
import EquipManager from '../Manager/EquipManager';

export default class GiftController extends ZepetoScriptBehaviour {
    @SerializeField() private giftButton: Button;
    @SerializeField() private giftUI: GameObject;
    @SerializeField() private giftCloseButton: Button;
    @SerializeField() private wonderHiddenItems : GameObject;

    @Header("Hidden Items")
    @SerializeField() private mike_1 : Toggle;
    @SerializeField() private mike_2 : Toggle;
    @SerializeField() private head : Toggle;
    @SerializeField() private neck_1 : Toggle;
    @SerializeField() private neck_2 : Toggle;

    private hasCollection : boolean = false;

    private Start() {
        EquipManager.Instance.equipBalloon.AddListener(() => {
            if(this.mike_1.isOn) this.mike_1.isOn = false;
            if(this.mike_2.isOn) this.mike_2.isOn = false;
        });
    }

    public RemoteStart() {    
        this.giftButton.onClick.AddListener(() => {
            this.giftUI.SetActive(!this.giftUI.activeSelf);
        });

        this.giftCloseButton.onClick.AddListener(()=> {
            this.giftUI.SetActive(false);
        });

        this.mike_1.onValueChanged.AddListener(() => {
            if(!this.mike_1.isOn) EquipManager.Instance.UnequipItem(EquipList.AwardsMike_1);
            else EquipManager.Instance.EquipItem(EquipList.AwardsMike_1);
        });
        this.mike_2.onValueChanged.AddListener(() => {
            if(!this.mike_2.isOn) EquipManager.Instance.UnequipItem(EquipList.AwardsMike_2);
            else EquipManager.Instance.EquipItem(EquipList.AwardsMike_2);
        }); 
        this.head.onValueChanged.AddListener(() => {
            if(!this.head.isOn) EquipManager.Instance.UnequipItem(EquipList.AwardsHead);
            else EquipManager.Instance.EquipItem(EquipList.AwardsHead);
        }); 
        this.neck_1.onValueChanged.AddListener(() => {
            if(!this.neck_1.isOn) EquipManager.Instance.UnequipItem(EquipList.AwardsNeck_1);
            else EquipManager.Instance.EquipItem(EquipList.AwardsNeck_1);
        }); 
        this.neck_2.onValueChanged.AddListener(() => {
            if(!this.neck_2.isOn) EquipManager.Instance.UnequipItem(EquipList.AwardsNeck_2);
            else EquipManager.Instance.EquipItem(EquipList.AwardsNeck_2);
        }); 
    }

    public SetInteractable(canInteractable : boolean) {
        this.mike_1.interactable = canInteractable && this.hasCollection;
        this.mike_2.interactable = canInteractable && this.hasCollection;
        this.head.interactable = canInteractable && this.hasCollection;
        this.neck_1.interactable = canInteractable && this.hasCollection;
        this.neck_2.interactable = canInteractable && this.hasCollection;
    }

    public UpdateGiftUI() {
        const wonderCollections = DataManager.Instance.PlayerDB.wonderCollection;
        
        for(const wonderCollection of wonderCollections) {
            if(wonderCollection.id == WonderCollectionList.Hiddle_Collection) {
                this.hasCollection = wonderCollection.has;
                this.wonderHiddenItems.SetActive(wonderCollection.has);
                this.SetInteractable(wonderCollection.has);
                return wonderCollection.has;
            }
        }
    }
}