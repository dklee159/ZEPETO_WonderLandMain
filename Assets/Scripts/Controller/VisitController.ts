import { GameObject } from 'UnityEngine';
import { Button, Text } from 'UnityEngine.UI'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import DataManager from '../Manager/DataManager';

export default class VisitController extends ZepetoScriptBehaviour {
    @SerializeField() private visitButton: Button;
    @SerializeField() private closeBtn: Button;
    @SerializeField() private eventPanel: GameObject;
    
    private visitCount: Text;

    private Start() {
        this.eventPanel.SetActive(false);
        this.visitCount = this.visitButton.transform.GetComponentInChildren<Text>();
        this.visitButton.onClick.AddListener(() => {
            this.eventPanel.SetActive(true);
        });
        this.closeBtn.onClick.AddListener(() => {
            this.eventPanel.SetActive(false);
        });
    }

    public RemoteStart() {
        this.visitCount.text = (DataManager.Instance.PlayerDB.totalVisit).toString();
    }
}