import { GameObject } from 'UnityEngine';
import { Button } from 'UnityEngine.UI'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { WonderCollection, WonderCollectionList } from '../../ZepetoScripts/SyncHelper/TypeSyncHelper';
import DataManager from '../Manager/DataManager';

export default class BadgeController extends ZepetoScriptBehaviour {

    @SerializeField() private badgeButton: Button;
    @SerializeField() private badgeUI: GameObject;
    @SerializeField() private badgeCloseButton: Button;

    @SerializeField() private wonderLandBadge: GameObject;
    @SerializeField() private wonderStageBadge: GameObject;
    @SerializeField() private wonderStudioBadge: GameObject;

    public RemoteStart() {    
        this.badgeButton.onClick.AddListener(() => {
            this.badgeUI.SetActive(!this.badgeUI.activeSelf);
        })

        this.badgeCloseButton.onClick.AddListener(() => {   
            this.badgeUI.SetActive(!this.badgeUI.activeSelf);
        })
    }

    public UpdateBadgeUI() {
        const wonderCollections = DataManager.Instance.PlayerDB.wonderCollection;
        
        for (const badge of wonderCollections) {
            console.log(`${badge.id} has ${badge.has}`);
            if (badge.id == WonderCollectionList.Wonder_Badge_Hall) {  
                this.wonderLandBadge.SetActive(badge.has); 
            } else if(badge.id == WonderCollectionList.Wonder_Badge_Stage) {
                this.wonderStageBadge.SetActive(badge.has);
            } else if(badge.id == WonderCollectionList.Wonder_Badge_Studio) {
                this.wonderStudioBadge.SetActive(badge.has);
            }
        }

        // if (badgeNum >= 3) {
        //     this.wonderHiddenItems.SetActive(true);    
        //     for (const item of badgeCollections) {
        //         if (item.id != WonderCollectionList.Hiddle_Collection) continue;
        //         item.has = true;
        //     }    
        //     return true;
        // }
        // return false;     
    }
}